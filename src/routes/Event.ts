import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Route } from '../structures/Route';

export class EventRoute extends Route {
    public constructor(context: Route.Context, options: Route.Options) {
        super(context, {
            ...options,
            route: '/event',
        });

        this.routes = this.routes.bind(this);
    }

    public override async routes(fastify: FastifyInstance) {
        fastify.get(this.route, this.getMethod);
    }

    protected override async getMethod(_request: FastifyRequest, _reply: FastifyReply) {
        return { hello: 'world' };
    }
}
