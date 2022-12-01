import { Events, Listener } from '@sapphire/framework';
import { Interaction, Message, MessageFlags } from 'discord.js';
import { CustomIdType } from '../enums/CustomIdType';
import { InteractionErrorHandler } from '../errors/InteractionErrorHandler';
import { i18n } from '../locales/i18n';
import { CustomId } from '../structures/CustomId';
import { Logger } from '../structures/Logger';

export class ComponentInteractionCreateListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.InteractionCreate,
        });
    }

    public async run(interaction: Interaction) {
        if (!interaction.isMessageComponent()) {
            return;
        }

        try {
            const flags = interaction.message instanceof Message
                ? interaction.message.flags
                : new MessageFlags(interaction.message.flags);

            // Is a sort of persistent listener
            if (
                flags.has(MessageFlags.FLAGS.EPHEMERAL) === false
                && (
                    interaction.message.type === 'DEFAULT'
                    || interaction.message.type === 0
                )
            ) {
                const customId = CustomId.parse(interaction.customId);

                this.container.logger.info(
                    this,
                    Logger.interactionLogContext(interaction),
                    `CustomId is ${interaction.customId}.`,
                );

                Object.defineProperty(interaction, 'i18n', {
                    value: new i18n(interaction.locale),
                });

                // Module activation
                if (customId.type === CustomIdType.Module && customId.module) {
                    const user = await this.container.database.users.findUniqueOrThrow({
                        include: {
                            modules: true,
                        },
                        where: {
                            id: interaction.user.id,
                        },
                    });

                    const modules = this.container.stores.get('modules');
                    const enabledModules = modules.filter((module) => user.modules[module.name]);
                    const module = enabledModules.get(customId.module);

                    if (module) {
                        await module?.interaction?.(user, interaction);
                    } else {
                        this.container.logger.info(
                            this,
                            Logger.interactionLogContext(interaction),
                            `Enabled modules: ${enabledModules.map((enabledModule) => enabledModule.name).join(', ')}.`,
                            `No enabled modules matching: ${customId.module}.`,
                        );
                    }
                }
            }
        } catch (error) {
            new InteractionErrorHandler(error, interaction).init();
        }
    }
}
