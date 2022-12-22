import { container } from '@sapphire/framework';
import fastifyClient from 'fastify';
import { FastifyErrorHandler } from '../errors/FastifyErrorHandler';

export class Fastify {
    public static async init() {
        const fastify = fastifyClient();

        await fastify.register(import('@fastify/rate-limit'), {
            max: 5,
            timeWindow: '1 minute',
        });

        fastify.setErrorHandler((error, request, reply) => {
            if (reply.statusCode >= 500) {
                new FastifyErrorHandler(error).init();
            } else if (reply.statusCode >= 400) {
                container.logger.warn(
                    this,
                    `Status ${reply.statusCode} on route ${request.routerPath} by ${request.ip}`,
                );
            }

            reply.send(error);
        });

        container.stores.get('routes').forEach((route) => {
            fastify.register(route.routes);
        });

        await fastify.listen({ port: 3000 });
    }
}
