import { DiscordAPIError } from 'discord.js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { EventPayload } from '../../@types/EventPayload';
import { ModuleErrorHandler } from '../../errors/ModuleErrorHandler';
import { Logger } from '../../structures/Logger';
import { Route } from '../../structures/Route';

/* eslint-disable no-await-in-loop */

type IBodyPost = EventPayload;

export class EventRoute extends Route {
    public constructor(context: Route.Context, options: Route.Options) {
        super(context, {
            ...options,
            route: '/v1/event',
        });

        this.routes = this.routes.bind(this);
    }

    public override async routes(fastify: FastifyInstance) {
        fastify.post(
            this.route,
            {
                onRequest: fastify.basicAuth,
                schema: {
                    body: {
                        type: 'object',
                        properties: {
                            version: { type: 'number' },
                            event: {
                                type: 'object',
                                properties: { data: { type: 'object' } },
                            },
                        },
                        required: ['version', 'event'],
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
            (request, reply) =>
                this.postMethod(
                    request as FastifyRequest<{
                        Body: IBodyPost;
                    }>,
                    reply,
                ),
        );
    }

    protected override async postMethod(
        request: FastifyRequest<{
            Body: IBodyPost;
        }>,
        reply: FastifyReply,
    ) {
        if ('host' in request.body.event.data && request.body.event.data.host !== 'mc.hypixel.net') {
            this.container.logger.debug(
                this,
                Logger.moduleContext(request.user!),
                `Host is not Hypixel: ${request.body.event.data.host}`,
            );
            
            return reply.code(204).send();
        } 

        const user = request.user!;
        const moduleStore = this.container.stores.get('modules');
        const modulesWithEvent = moduleStore.filter((module) => module.event);

        const modules = await this.container.database.modules.findUniqueOrThrow({
            where: {
                id: user.id,
            },
        });

        const activeModules = modulesWithEvent.filter((module) => modules[module.name]);

        if (activeModules.size === 0) {
            this.container.logger.debug(
                this,
                Logger.moduleContext(user),
                'User has no enabled modules for <Module>.event.',
            );
        } else {
            // eslint-disable-next-line no-restricted-syntax
            for (const module of activeModules.values()) {
                try {
                    if (module.allowedEvents.includes(request.body.event.type) === false) {
                        this.container.logger.debug(
                            this,
                            Logger.moduleContext(user),
                            `Module ${module.name} does not support module ${module.name}.`,
                        );
                        continue;
                    }

                    await module.event!(user, request.body);

                    this.container.logger.debug(
                        this,
                        Logger.moduleContext(user),
                        `Ran ${module.name}.`,
                    );
                } catch (error) {
                    await new ModuleErrorHandler(error, module, user).init();
                    if (!(error instanceof DiscordAPIError)) {
                        break;
                    }
                }
            }
        }

        return reply.code(204).send();
    }
}
