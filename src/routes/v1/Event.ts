import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Route } from '../../structures/Route';

interface IBodyPost {
    domain: string;
    joined?: boolean;
}

export class EventRoute extends Route {
    public constructor(context: Route.Context, options: Route.Options) {
        super(context, {
            ...options,
            name: 'event',
            route: '/v1/event',
        });

        this.routes = this.routes.bind(this);
    }

    public override async routes(fastify: FastifyInstance) {
        fastify.get(this.route, this.getMethod);
        fastify.post(
            this.route,
            {
                preHandler: fastify.basicAuth,
                schema: {
                    body: {
                        type: 'object',
                        properties: {
                            domain: { type: 'string' },
                            joined: { type: 'boolean' },
                        },
                        required: ['domain'],
                    },
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
            (request, reply) => this.postMethod(request as FastifyRequest<{
                Body: IBodyPost;
            }>, reply),
        );
    }

    protected override async getMethod(_request: FastifyRequest, _reply: FastifyReply) {
        throw new TypeError('bazinga');
    }

    protected override async postMethod(_request: FastifyRequest<{
        Body: IBodyPost;
    }>, reply: FastifyReply) {
        return reply.send({ message: 'hi' });
    }
}
