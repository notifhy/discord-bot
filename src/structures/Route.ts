import { Piece } from '@sapphire/framework';
import type {
    FastifyInstance,
    FastifySchema,
    RouteGenericInterface,
} from 'fastify';
import type { FastifyPluginOptions } from 'fastify/types/plugin';
import type { FastifyReply } from 'fastify/types/reply';
import type { FastifyRequest } from 'fastify/types/request';
import type {
    FastifyTypeProviderDefault,
    ResolveFastifyReplyReturnType,
} from 'fastify/types/type-provider';

type MethodReturnType = ResolveFastifyReplyReturnType<
FastifyTypeProviderDefault,
FastifySchema,
RouteGenericInterface
>;

export abstract class Route<O extends Route.Options = Route.Options> extends Piece<O> {
    public route: string;

    public constructor(context: Route.Context, options: O) {
        super(context, { ...options, name: options.route });

        this.route = options.route;
    }

    public abstract routes(fastify: FastifyInstance, options: FastifyPluginOptions): void;

    protected getMethod?(request: FastifyRequest, reply: FastifyReply): MethodReturnType;

    protected headMethod?(request: FastifyRequest, reply: FastifyReply): MethodReturnType;

    protected postMethod?(request: FastifyRequest, reply: FastifyReply): MethodReturnType;

    protected putMethod?(request: FastifyRequest, reply: FastifyReply): MethodReturnType;

    protected deleteMethod?(request: FastifyRequest, reply: FastifyReply): MethodReturnType;

    protected optionsMethod?(request: FastifyRequest, reply: FastifyReply): MethodReturnType;

    protected patchMethod?(request: FastifyRequest, reply: FastifyReply): MethodReturnType;
}

export interface RouteOptions extends Piece.Options {
    readonly route: string;
}

export namespace Route {
    export type Options = RouteOptions;
    export type Context = Piece.Context;
}
