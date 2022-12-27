import type { users as User } from '@prisma/client';
import { type Collection, DiscordAPIError } from 'discord.js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ModuleErrorHandler } from '../../errors/ModuleErrorHandler';
import { Logger } from '../../structures/Logger';
import type { Module, ModuleOptions } from '../../structures/Module';
import { Route } from '../../structures/Route';

/* eslint-disable no-await-in-loop */

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
                onRequest: fastify.basicAuth,
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

    protected override async postMethod(request: FastifyRequest<{
        Body: IBodyPost;
    }>, reply: FastifyReply) {
        const moduleStore = this.container.stores.get('modules');
        const modulesWithEvent = moduleStore.filter((module) => module.event);

        // check if module enabled
        const modules = await this.container.database.modules.findUniqueOrThrow({
            where: {
                id: request.user!.id,
            },
        });

        const activeModules = modulesWithEvent.filter((module) => modules[module.name]);

        if (activeModules.size === 0) {
            this.container.logger.debug(
                this,
                Logger.moduleContext(request.user!),
                'User has no enabled modules.',
            );
        } else {
            this.executeModules(request.user!, activeModules);
        }

        return reply.code(204).send();
    }

    public async executeModules(user: User, modules: Collection<string, Module<ModuleOptions>>) {
        // eslint-disable-next-line no-restricted-syntax
        for (const module of modules.values()) {
            try {
                this.container.logger.debug(
                    this,
                    Logger.moduleContext(user),
                    `Running ${module.name} event.`,
                );

                await module.event!(user);
            } catch (error) {
                await new ModuleErrorHandler(error, module, user).init();
                if (!(error instanceof DiscordAPIError)) {
                    return;
                }
            }
        }

        this.container.logger.debug(
            this,
            Logger.moduleContext(user),
            `Ran ${modules.size} modules.`,
        );
    }
}
