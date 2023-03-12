import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework';
import { RateLimitManager } from '@sapphire/ratelimits';
import type { ButtonInteraction } from 'discord.js';
import { CustomIdType } from '../enums/CustomIdType';
import { Time } from '../enums/Time';
import { i18n } from '../locales/i18n';
import type { RewardsModule } from '../modules/Rewards';
import { CustomId } from '../structures/CustomId';
import { Logger } from '../structures/Logger';

export class RewardsModuleButtonHandler extends InteractionHandler {
    // A consolidated rate limit manager for all modules would be better
    private rateLimitManager = new RateLimitManager(
        Time.Hour,
        5,
    );

    public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
        super(ctx, {
            ...options,
            interactionHandlerType: InteractionHandlerTypes.Button,
        });
    }

    public override parse(interaction: ButtonInteraction) {
        const ratelimit = this.rateLimitManager.acquire(interaction.user.id);

        if (ratelimit.limited) {
            // TODO: consider an error message
            return this.none();
        }

        ratelimit.consume();

        const customId = CustomId.parse(interaction.customId);

        if (customId.type !== CustomIdType.Module || customId.module !== 'rewards') {
            return this.none();
        }

        return this.some(customId);
    }

    public async run(
        interaction: ButtonInteraction,
        customId: InteractionHandler.ParseResult<this>,
    ) {
        this.container.logger.info(
            this,
            Logger.interactionLogContext(interaction),
            `CustomId is ${interaction.customId}.`,
        );

        Object.defineProperty(interaction, 'i18n', {
            value: new i18n(interaction.locale),
        });

        const user = await this.container.database.users.findUniqueOrThrow({
            include: {
                modules: true,
            },
            where: {
                id: interaction.user.id,
            },
        });

        const modules = this.container.stores.get('modules');
        const rewards = modules.find((module) => (module.name as string) === customId.module) as
            | RewardsModule
            | undefined;

        if (!rewards) {
            this.container.logger.warn(
                this,
                Logger.interactionLogContext(interaction),
                `Module ${customId.type} not found in store.`,
            );

            return;
        }

        await rewards.interaction(user, interaction);

        this.container.logger.warn(
            this,
            Logger.interactionLogContext(interaction),
            'Ran interaction.',
        );
    }
}
