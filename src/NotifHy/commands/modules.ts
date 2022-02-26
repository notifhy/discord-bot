import type { ClientCommand } from '../@types/client';
import type {
    DefenderModule,
    FriendsModule,
    RewardsModule,
    UserAPIData,
} from '../@types/database';
import type {
    Locale,
    ModulesCommand,
} from '../@types/locales';
import {
    combiner,
    Structures as baseStructures,
} from '../utility/Structures';
import { CommandErrorHandler } from '../errors/CommandErrorHandler';
import { BetterEmbed } from '../../utility/utility';
import {
    ButtonInteraction,
    Message,
    MessageActionRow,
    MessageComponentInteraction,
    MessageSelectMenu,
    SelectMenuInteraction,
} from 'discord.js';
import { Constants } from '../utility/Constants';
import { disableComponents } from '../utility/utility';
import { GlobalConstants } from '../../utility/Constants';
import { Log } from '../../utility/Log';
import { RegionLocales } from '../locales/RegionLocales';
import { SQLite } from '../utility/SQLite';
import { ToggleButtons } from '../utility/ToggleButtons';

export const properties: ClientCommand['properties'] = {
    name: 'modules',
    description: 'Add or remove modules for your Minecraft account.',
    cooldown: 5_000,
    ephemeral: true,
    noDM: false,
    ownerOnly: false,
    requireRegistration: true,
    structure: {
        name: 'modules',
        description:
            'Add, remove, and configure modules for your Minecraft account',
        options: [
            {
                name: 'defender',
                type: 1,
                description: 'The replacement to HyGuard - get notified on logins, logouts, version changes, and more',
            },
            {
                name: 'friends',
                description: 'Know when your friends are online by sharing logins and logouts with each other',
                type: 1,
            },
            {
                name: 'rewards',
                description: 'Never miss a daily reward again - get notifications to claim your daily reward at your convenience',
                type: 1,
            },
        ],
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const subCommand = interaction.options.getSubcommand(true);
    const text = RegionLocales.locale(locale).commands.modules[
        subCommand as keyof Locale['commands']['modules']
    ];

    const structures =
        baseStructures[subCommand as keyof typeof baseStructures];

    const replace = RegionLocales.replace;

    const mainEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(text.title)
        .setDescription(text.description);

    const mainMenu = (data?: {
        default?: string;
        disabled?: boolean;
    }) => {
        const menu = new MessageSelectMenu()
            .setCustomId('main')
            .setPlaceholder(text.menuPlaceholder)
            .setDisabled(data?.disabled ?? false);

        const menuData = text.menu;
        for (const item in menuData) {
            //@ts-expect-error hasOwn typing not implemented yet
            if (Object.hasOwn(menuData, item)) {
                const itemData = {
                    ...menuData[item as keyof typeof menuData],
                    ...structures[item as keyof typeof structures],
                };

                menu.addOptions([
                    {
                        label: itemData.label,
                        value: itemData.value,
                        description: itemData.description,
                        default: data?.default === itemData.value,
                        emoji: itemData.emoji,
                    },
                ]);
            }
        }
        return new MessageActionRow().addComponents(menu);
    };

    const getUserAPIData = () => (
        SQLite.getUser<UserAPIData>({
            discordID: interaction.user.id,
            table: Constants.tables.api,
            columns: ['discordID', 'modules'],
            allowUndefined: false,
        })
    );

    const getDefenderData = () => (
       SQLite.getUser<DefenderModule>({
            discordID: interaction.user.id,
            table: Constants.tables.defender,
            allowUndefined: false,
            columns: [
                'discordID',
                'alerts',
                'channel',
                'gameTypes',
                'languages',
                'versions',
            ],
        })
    );

    const getFriendsData = () => (
        SQLite.getUser<FriendsModule>({
            discordID: interaction.user.id,
            table: Constants.tables.friends,
            allowUndefined: false,
            columns: [
                'discordID',
                'channel',
            ],
        })
    );

    const getRewardsData = () => (
        SQLite.getUser<RewardsModule>({
            discordID: interaction.user.id,
            table: Constants.tables.rewards,
            allowUndefined: false,
            columns: [
                'alertTime',
                'claimNotification',
                'milestones',
                'notificationInterval',
            ],
        })
    );

    const reply = await interaction.editReply({
        embeds: [mainEmbed],
        components: [mainMenu()],
    });

    await interaction.client.channels.fetch(interaction.channelId);

    const filter = (i: MessageComponentInteraction) =>
        interaction.user.id === i.user.id && i.message.id === reply.id;

    const collector = interaction.channel!.createMessageComponentCollector({
        filter: filter,
        idle: GlobalConstants.ms.minute * 5,
        time: GlobalConstants.ms.minute * 30,
    });

    let selected: string;

    collector.on(
        'collect',
        async (i: SelectMenuInteraction | ButtonInteraction) => {
            try {
                await i.deferUpdate();

                if (
                    i.customId === 'main' &&
                    i.isSelectMenu()
                ) {
                    Log.interaction(interaction, `Menu update value: ${i.values[0]}`);
                    await menuUpdate(i);
                } else {
                    Log.interaction(interaction, `Data update customID: ${i.customId}`);
                    await dataUpdate(i);
                }
            } catch (error) {
                await CommandErrorHandler.init(error, interaction, locale);
            }
        },
    );

    collector.on('end', async () => {
        try {
            const message = (await interaction.fetchReply()) as Message;
            const disabledComponents = disableComponents(message.components);

            await interaction.editReply({
                components: disabledComponents,
            });
        } catch (error) {
            await CommandErrorHandler.init(error, interaction, locale);
        }
    });

    async function menuUpdate(selectMenuInteraction: SelectMenuInteraction) {
        selected = selectMenuInteraction.values[0];

        mainEmbed.setField(
            text.menu[selected as keyof typeof text['menu']].label,
            text.menu[selected as keyof typeof text['menu']]
                .longDescription,
        );

        const components = [
            mainMenu({
                default: selected,
            }),
        ];

        switch (selected) {
            case 'toggle': {
                const { modules } = getUserAPIData();

                const moduleData =
                    subCommand === 'defender'
                        ? getDefenderData()
                        : subCommand === 'friends'
                        ? getFriendsData()
                        : subCommand === 'rewards'
                        ? getRewardsData()
                        : null!; //:)

                const exceptions = {
                    defender: ['channel'] as string[],
                    friends: [] as string[],
                    rewards: [] as string[],
                };

                const missingRequirements = Object.entries(moduleData)
                    .filter(([key, value]) =>
                        value === null &&
                        exceptions[subCommand as keyof typeof exceptions]
                            .includes(key) === false)
                    .map(
                        ([name]) =>
                            text.menu[name as keyof typeof text.menu].label,
                    );

                if (missingRequirements.length > 0) {
                    mainEmbed.addFields({
                        name: text.missingConfigField.name,
                        value: replace(text.missingConfigField.value, {
                            missingRequirements: missingRequirements.join(', '),
                        }),
                    });
                }

                const component = new ToggleButtons({
                    allDisabled: missingRequirements.length > 0,
                    enabled: modules.includes(subCommand),
                    buttonLocale: {
                        ...(
                            text as
                            ModulesCommand['defender'] |
                            ModulesCommand['friends'] |
                            ModulesCommand['rewards']
                        ).menu.toggle.button,
                        ...(
                            structures as
                            typeof baseStructures['defender'] |
                            typeof baseStructures['friends'] |
                            typeof baseStructures['rewards']
                        ).toggle.button,
                    },
                });

                components.push(component);
                break;
            }
            case 'alerts': {
                const { alerts } = getDefenderData();

                const menu = combiner(
                    (text as ModulesCommand['defender']).menu.alerts,
                    (structures as typeof baseStructures['defender']).alerts,
                ).select;

                for (const value of menu.options!) {
                    value.default = alerts[value.value as keyof typeof alerts];
                }

                const component = new MessageSelectMenu(menu);

                const row = new MessageActionRow().addComponents(component);

                components.push(row);
                break;
            }
            case 'channel': {
                const menu = combiner(
                    (text as ModulesCommand['friends']).menu.channel,
                    (structures as typeof baseStructures['friends']).channel,
                ).select;

                const component = new MessageSelectMenu(menu);
                const row = new MessageActionRow().addComponents(component);

                components.push(row);
                break;
            }
            case 'gameTypes': {
                const { gameTypes } = getDefenderData();

                const menu = combiner(
                    (text as ModulesCommand['defender']).menu.gameTypes,
                    (structures as typeof baseStructures['defender']).gameTypes,
                ).select;

                for (const value of menu.options!) {
                    value.default = gameTypes.includes(value.value);
                }

                const component = new MessageSelectMenu(menu);

                const row = new MessageActionRow().addComponents(component);

                components.push(row);
                break;
            }
            case 'languages': {
                const { languages } = getDefenderData();

                const menu = combiner(
                    (text as ModulesCommand['defender']).menu.languages,
                    (structures as typeof baseStructures['defender']).languages,
                ).select;

                for (const value of menu.options!) {
                    value.default = languages.includes(value.value);
                }

                const component = new MessageSelectMenu(menu);

                const row = new MessageActionRow().addComponents(component);

                components.push(row);
                break;
            }
            case 'versions': {
                const { versions } = getDefenderData();

                const menu = combiner(
                    (text as ModulesCommand['defender']).menu.versions,
                    (structures as typeof baseStructures['defender']).versions,
                ).select;

                for (const value of menu.options!) {
                    value.default = versions.includes(value.value);
                }

                const component = new MessageSelectMenu(menu);

                const row = new MessageActionRow().addComponents(component);

                components.push(row);
                break;
            }
            case 'alertTime': {
                const { alertTime } = getRewardsData();

                const menu = combiner(
                    (text as ModulesCommand['rewards']).menu.alertTime,
                    (structures as typeof baseStructures['rewards']).alertTime,
                ).select;

                const component = new MessageSelectMenu(menu);

                for (const value of component.options!) {
                    value.default =
                        Number(value.value) === alertTime;
                }

                const row = new MessageActionRow().addComponents(component);

                components.push(row);
                break;
            }
            case 'claimNotification': {
                const { claimNotification } = getRewardsData();

                const component = new ToggleButtons({
                    allDisabled: false,
                    enabled: claimNotification,
                    buttonLocale: {
                        ...(text as ModulesCommand['rewards']).menu.claimNotification.button,
                        ...(structures as typeof baseStructures['rewards']).claimNotification.button,
                    },
                });

                components.push(component);
                break;
            }
            case 'milestones': {
                const { milestones } = getRewardsData();

                const component = new ToggleButtons({
                    allDisabled: false,
                    enabled: milestones,
                    buttonLocale: {
                        ...(text as ModulesCommand['rewards']).menu.claimNotification.button,
                        ...(structures as typeof baseStructures['rewards']).milestones.button,
                    },
                });

                components.push(component);
                break;
            }
            case 'notificationInterval': {
                const { notificationInterval } = getRewardsData();

                const menu = combiner(
                    (text as ModulesCommand['rewards']).menu.notificationInterval,
                    (structures as typeof baseStructures['rewards']).notificationInterval,
                ).select;

                const component = new MessageSelectMenu(menu);

                for (const value of component.options!) {
                    value.default =
                        Number(value.value) === notificationInterval;
                }

                const row = new MessageActionRow().addComponents(component);

                components.push(row);
                break;
            }
            //No default
        }

        await selectMenuInteraction.editReply({
            embeds: [mainEmbed],
            components: components,
        });
    }

    async function dataUpdate(
        messageComponentInteraction: SelectMenuInteraction | ButtonInteraction,
    ) {
        const components = [
            mainMenu({
                default: selected,
            }),
        ];

        switch (messageComponentInteraction.customId) {
            case 'toggle1':
            case 'toggle0': {
                const userAPIData = await getUserAPIData();
                if (userAPIData.modules.includes(subCommand)) {
                    userAPIData.modules.splice(
                        userAPIData.modules.indexOf(subCommand),
                        1,
                    );
                } else {
                    userAPIData.modules.push(subCommand);
                }

                const component = new ToggleButtons({
                    allDisabled: false,
                    enabled: userAPIData.modules.includes(subCommand),
                    buttonLocale: {
                        ...(
                            text as
                            ModulesCommand['defender'] |
                            ModulesCommand['friends'] |
                            ModulesCommand['rewards']
                        ).menu.toggle.button,
                        ...(
                            structures as
                            typeof baseStructures['defender'] |
                            typeof baseStructures['friends'] |
                            typeof baseStructures['rewards']
                        ).toggle.button,
                    },
                });

                components.push(component);

                SQLite.updateUser<UserAPIData>({
                    discordID: userAPIData.discordID,
                    table: Constants.tables.api,
                    data: { modules: userAPIData.modules },
                });

                break;
            }
            case 'alerts': {
                const selectedValues = (
                    messageComponentInteraction as SelectMenuInteraction
                ).values;

                const alerts = { ...Constants.defaults.defenderAlerts };

                for (const value of selectedValues) {
                    alerts[value as keyof typeof alerts] = true;
                }

                const updatedMenu = combiner(
                    (text as ModulesCommand['defender']).menu.alerts,
                    (structures as typeof baseStructures['defender']).alerts,
                ).select;

                for (const option of updatedMenu.options!) {
                    option.default = alerts[
                        option.value as keyof typeof alerts
                    ] === true;
                }

                const component = new MessageSelectMenu(updatedMenu);

                components.push(
                    new MessageActionRow()
                        .addComponents(component),
                );

                SQLite.updateUser<DefenderModule>({
                    discordID: interaction.user.id,
                    table: Constants.tables.defender,
                    data: { alerts: alerts },
                });
                break;
            }
            case 'gameTypes': {
                const selectedValues = (
                    messageComponentInteraction as SelectMenuInteraction
                ).values;

                const updatedMenu = combiner(
                    (text as ModulesCommand['defender']).menu.gameTypes,
                    (structures as typeof baseStructures['defender']).gameTypes,
                ).select;

                for (const value of updatedMenu.options!) {
                    value.default = selectedValues.includes(value.value);
                }

                const component = new MessageSelectMenu(updatedMenu);

                components.push(
                    new MessageActionRow()
                        .addComponents(component),
                );

                SQLite.updateUser<DefenderModule>({
                    discordID: interaction.user.id,
                    table: Constants.tables.defender,
                    data: { gameTypes: selectedValues },
                });
                break;
            }
            case 'languages': {
                const selectedValues = (
                    messageComponentInteraction as SelectMenuInteraction
                ).values;

                const updatedMenu = combiner(
                    (text as ModulesCommand['defender']).menu.languages,
                    (structures as typeof baseStructures['defender']).languages,
                ).select;

                for (const value of updatedMenu.options!) {
                    value.default = selectedValues.includes(value.value);
                }

                const component = new MessageSelectMenu(updatedMenu);

                components.push(
                    new MessageActionRow()
                        .addComponents(component),
                );

                SQLite.updateUser<DefenderModule>({
                    discordID: interaction.user.id,
                    table: Constants.tables.defender,
                    data: { languages: selectedValues },
                });
                break;
            }
            case 'versions': {
                const selectedValues = (
                    messageComponentInteraction as SelectMenuInteraction
                ).values;

                const updatedMenu = combiner(
                    (text as ModulesCommand['defender']).menu.versions,
                    (structures as typeof baseStructures['defender']).versions,
                ).select;

                for (const value of updatedMenu.options!) {
                    value.default = selectedValues.includes(value.value);
                }

                const component = new MessageSelectMenu(updatedMenu);

                components.push(
                    new MessageActionRow()
                        .addComponents(component),
                );

                SQLite.updateUser<DefenderModule>({
                    discordID: interaction.user.id,
                    table: Constants.tables.defender,
                    data: { versions: selectedValues },
                });
                break;
            }
            case 'alertTime': {
                const time = (
                    messageComponentInteraction as SelectMenuInteraction
                ).values[0];

                const updatedMenu = combiner(
                    (text as ModulesCommand['rewards']).menu.alertTime,
                    (structures as typeof baseStructures['rewards']).alertTime,
                ).select;

                for (const value of updatedMenu.options!) {
                    value.default = value.value === time;
                }

                const component = new MessageSelectMenu(updatedMenu);

                components.push(
                    new MessageActionRow()
                        .addComponents(component),
                );

                SQLite.updateUser<RewardsModule>({
                    discordID: interaction.user.id,
                    table: Constants.tables.rewards,
                    data: { alertTime: Number(time) },
                });
                break;
            }
            case 'claimNotification1':
            case 'claimNotification0': {
                const userRewardData = getRewardsData();

                const flipped = userRewardData.claimNotification === false;

                const component = new ToggleButtons({
                    allDisabled: false,
                    enabled: flipped,
                    buttonLocale: {
                        ...(text as ModulesCommand['rewards']).menu.claimNotification.button,
                        ...(structures as typeof baseStructures['rewards']).claimNotification.button,
                    },
                });

                components.push(component);

                SQLite.updateUser<RewardsModule>({
                    discordID: interaction.user.id,
                    table: Constants.tables.rewards,
                    data: { claimNotification: flipped },
                });
                break;
            }
            case 'milestones1':
            case 'milestones0': {
                const userRewardData = getRewardsData();

                const flipped = userRewardData.milestones === false;

                const component = new ToggleButtons({
                    allDisabled: false,
                    enabled: flipped,
                    buttonLocale: {
                        ...(text as ModulesCommand['rewards']).menu.claimNotification.button,
                        ...(structures as typeof baseStructures['rewards']).milestones.button,
                    },
                });

                components.push(component);

                SQLite.updateUser<RewardsModule>({
                    discordID: interaction.user.id,
                    table: Constants.tables.rewards,
                    data: { milestones: flipped },
                });
                break;
            }
            case 'notificationInterval': {
                const time = (
                    messageComponentInteraction as SelectMenuInteraction
                ).values[0];

                const updatedMenu = combiner(
                    (text as ModulesCommand['rewards']).menu.notificationInterval,
                    (structures as typeof baseStructures['rewards']).notificationInterval,
                ).select;

                for (const value of updatedMenu.options!) {
                    value.default = value.value === time;
                }

                const component = new MessageSelectMenu(updatedMenu);

                components.push(
                    new MessageActionRow().addComponents(component),
                );

                SQLite.updateUser<RewardsModule>({
                    discordID: interaction.user.id,
                    table: Constants.tables.rewards,
                    data: { notificationInterval: Number(time) },
                });
                break;
            }
            //No default
        }

        await messageComponentInteraction.editReply({
            components: components,
        });
    }
};