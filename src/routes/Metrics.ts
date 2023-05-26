import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { register } from 'prom-client';
import { Route } from '../structures/Route';

export class EventRoute extends Route {
    public constructor(context: Route.Context, options: Route.Options) {
        super(context, {
            ...options,
            name: 'metrics',
            route: '/metrics',
        });

        this.routes = this.routes.bind(this);
    }

    public override async routes(fastify: FastifyInstance) {
        fastify.get(
            this.route,
            {
                onRequest: fastify.basicAuth,
                schema: {
                    response: {
                        '2xx': {
                            type: 'object',
                            properties: {
                                message: { type: 'string' },
                            },
                        },
                    },
                },
            },
            (request, reply) => this.getMethod(request, reply),
        );
    }

    protected override async getMethod(_request: FastifyRequest, reply: FastifyReply) {
        return reply.send(await register.metrics());
    }
}
