import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Route } from '../../structures/Route';

export class EventRoute extends Route {
    public constructor(context: Route.Context, options: Route.Options) {
        super(context, {
            ...options,
            route: '/v1/event',
        });

        console.log(context.path, context.root);

        this.routes = this.routes.bind(this);
    }

    public override async routes(fastify: FastifyInstance) {
        fastify.get(
            this.route,
            {
                schema: {
                    headers: {
                        type: 'object',
                        properties: {
                            AUTHORIZATION: { type: 'string' },
                        },
                        required: ['AUTHORIZATION'],
                    },
                },
            },
            this.getMethod,
        );
    }

    protected override async getMethod(_request: FastifyRequest, reply: FastifyReply) {
        // throw new TypeError();
        // return { hello: 'world' };
        return reply.status(500).send({ ok: false });
    }
}
