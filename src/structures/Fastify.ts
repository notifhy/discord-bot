import type { users as User } from '@prisma/client';
import { container } from '@sapphire/framework';
import fastifyClient from 'fastify';
import { STATUS_CODES } from 'node:http';
import process from 'node:process';
import { Counter, Gauge } from 'prom-client';
import { Time } from '../enums/Time';
import { FastifyErrorHandler } from '../errors/FastifyErrorHandler';
import { generateHash } from '../utility/utility';
import { Base } from './Base';

export class Fastify extends Base {
    public static async init() {
        const requestCountCounter = new Counter({
            name: 'http_requests_total',
            help: 'Total number of requests',
            labelNames: ['method', 'route'] as const,
        });

        const requestDurationHistogram = new Gauge({
            name: 'http_requests_duration_seconds',
            help: 'Duration of each request',
            labelNames: ['method', 'route'] as const,
        });

        const fastify = fastifyClient({
            caseSensitive: false,
        });

        await fastify.register(import('@fastify/rate-limit'), {
            allowList: (request) => request.url === '/metrics',
            max: 25,
            timeWindow: Time.Hour,
        });

        await fastify.register(import('@fastify/basic-auth'), {
            authenticate: true,
            // @ts-ignore return paths
            // eslint-disable-next-line consistent-return
            validate: async (username, password, request) => {
                const user = await this.container.database.users.findUnique({
                    include: {
                        authentication: true,
                    },
                    where: {
                        uuid: username,
                    },
                });

                if (
                    user === null
                    || generateHash(password, user.authentication.salt) !== user.authentication.hash
                ) {
                    return new Error('Invalid username or password');
                }

                request.user = user;
            },
        });

        fastify.addHook('onRequest', (request, reply, done) => {
            requestCountCounter.labels({ method: request.method, route: request.url }).inc();
            request.user = null;
            reply.start = Date.now();
            done();
        });

        fastify.addHook('onRequest', fastify.rateLimit());

        fastify.addHook('onSend', (request, reply, payload, done) => {
            reply.headers({
                'Content-Security-Policy': "default-src 'none'",
                'Strict-Transport-Security': 'max-age=31536000',
                'X-Frame-Options': 'DENY',
            });

            if (typeof request.headers.origin !== 'undefined') {
                reply.header('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');
            }

            requestDurationHistogram
                .labels({ method: request.method, route: request.url })
                .set((Date.now() - reply.start) / 1000);

            done(null, payload);
        });

        fastify.setNotFoundHandler(
            {
                preValidation: fastify.basicAuth,
            },
            (request, reply) => {
                reply.code(404).send({
                    error: STATUS_CODES[404],
                    message: `Route ${request.method}:${request.url} not found`,
                });
            },
        );

        fastify.setErrorHandler((error, request, reply) => {
            const statusCode = typeof error.statusCode === 'undefined' || error.statusCode < 400
                ? 500
                : error.statusCode;

            if (statusCode >= 500) {
                new FastifyErrorHandler(error).init();
            } else {
                container.logger.warn(
                    this,
                    `Status ${statusCode} on route ${request.method}:${request.url} by ${request.ip}`,
                );
            }

            reply.code(statusCode).send({
                error: STATUS_CODES[statusCode],
                message: error.message,
            });
        });

        container.stores.get('routes').forEach((route) => {
            fastify.register(route.routes);
        });

        await fastify.listen({ port: Number(process.env.FASTIFY_PORT!), host: '0.0.0.0' });
    }
}

declare module 'fastify' {
    export interface FastifyReply {
        start: number;
    }

    export interface FastifyRequest {
        user: User | null;
    }
}
