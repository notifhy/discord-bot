import { container } from '@sapphire/framework';
import fastifyClient from 'fastify';
import { STATUS_CODES } from 'http';
import { FastifyErrorHandler } from '../errors/FastifyErrorHandler';

export class Fastify {
    public static async init() {
        const fastify = fastifyClient({
            caseSensitive: false,
        });

        await fastify.register(import('@fastify/rate-limit'), {
            max: 5,
            timeWindow: '1 minute',
        });

        await fastify.register(import('@fastify/basic-auth'), {
            authenticate: true,
            validate: (username, password, _req, _reply, done) => {
                if (username === 'test' && password === 'frick') {
                    done();
                } else {
                    done(new Error('Invalid username or password'));
                }
            },
        });

        fastify.addHook('onRequest', fastify.rateLimit());

        fastify.setNotFoundHandler({
            preValidation: fastify.basicAuth,
        }, (request, reply) => {
            reply.code(404).send({
                error: STATUS_CODES[404],
                message: `Route ${request.method}:${request.url} not found`,
            });
        });

        fastify.setErrorHandler((error, request, reply) => {
            const statusCode = typeof error.statusCode === 'undefined' || (error.statusCode < 400)
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

        await fastify.listen({ port: 3000 });
    }
}
