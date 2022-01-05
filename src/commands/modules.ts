import type {
    CommandExecute,
    CommandProperties,
} from '../@types/client';
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
    BetterEmbed,
    disableComponents,
} from '../util/utility';
import {
    ButtonInteraction,
    CommandInteraction,
    Message,
    MessageActionRow,
    MessageComponentInteraction,
    MessageSelectMenu,
    SelectMenuInteraction,
} from 'discord.js';
import { RegionLocales } from '../../locales/localesHandler';
import { SQLite } from '../util/SQLite';
import { ToggleButtons } from '../util/ToggleButtons';
import CommandErrorHandler from '../util/errors/handlers/CommandErrorHandler';
import Constants from '../util/Constants';
import { Log } from '../util/Log';

export const properties: CommandProperties = {
    name: 'modules',
    description: 'Add or remove modules for your Minecraft account',
    usage: '/modules [defender/friends/rewards]',
    cooldown: 15_000,
    ephemeral: true,
    noDM: false,
    ownerOnly: false,
    structure: {
        name: 'modules',
        description:
            'Add, remove, and configure modules for your Minecraft account',
        options: [
            {
                name: 'defender',
                type: '1',
                description: 'The replacement to HyGuard - get notified on logins, logouts, version changes, and more',
            },
            {
                name: 'friends',
                description: 'Know when your friends are online by sharing logins and logouts with each other',
                type: '1',
            },
            {
                name: 'rewards',
                description: 'Never miss a daily reward again - get notifications to claim your daily reward at your convenience',
                type: '1',
            },
        ],
    },
};

export const execute: CommandExecute = async (
    interaction: CommandInteraction,
    { userData },
): Promise<void> => {
    const subCommand = interaction.options.getSubcommand(true);
    const locale = RegionLocales.locale(userData.language).commands.modules[
        subCommand as keyof Locale['commands']['modules']
    ];
    const replace = RegionLocales.replace;

    const mainEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(locale.title)
        .setDescription(locale.description);

    const mainMenu = ({
        defaultV,
        disabled,
    }: {
        defaultV?: string;
        disabled?: boolean;
    }) => {
        const menu = new MessageSelectMenu()
            .setCustomId('main')
            .setPlaceholder(locale.menuPlaceholder)
            .setDisabled(disabled ?? false);

        const menuData = locale.menu;
        for (const item in menuData) {
            //@ts-expect-error hasOwn typing not implemented yet
            if (Object.hasOwn(menuData, item)) {
                const itemData = menuData[item as keyof typeof menuData];
                menu.addOptions([
                    {
                        label: itemData.label,
                        value: itemData.value,
                        description: itemData.description,
                        default: Boolean(defaultV === itemData.value),
                        emoji: itemData.emoji,
                    },
                ]);
            }
        }
        return new MessageActionRow().addComponents(menu);
    };

    const getUserAPIData = async () => (
        await SQLite.getUser<UserAPIData>({
            discordID: userData.discordID,
            table: Constants.tables.api,
            columns: ['discordID', 'modules'],
            allowUndefined: false,
        })
    ) as UserAPIData;

    const getDefenderData = async () => (
        await SQLite.getUser<DefenderModule>({
            discordID: userData.discordID,
            table: Constants.tables.defender,
            columns: [
                'discordID',
                'alerts',
                'channel',
                'versions',
                'languages',
            ],
            allowUndefined: false,
        })
    ) as DefenderModule;

    const getFriendsData = async () => (
        await SQLite.getUser<FriendsModule>({
            discordID: userData.discordID,
            table: Constants.tables.friends,
            columns: ['discordID', 'channel'],
            allowUndefined: false,
        })
    ) as FriendsModule;

    const getRewardsData = async () => (
        await SQLite.getUser<RewardsModule>({
            discordID: userData.discordID,
            table: Constants.tables.rewards,
            allowUndefined: false,
            columns: [
                'alertTime',
                'claimNotification',
                'milestones',
                'notificationInterval',
            ],
        })
    ) as RewardsModule;

    const reply = await interaction.editReply({
        embeds: [mainEmbed],
        components: [mainMenu({})],
    });

    await interaction.client.channels.fetch(interaction.channelId);

    const filter = (i: MessageComponentInteraction) =>
        interaction.user.id === i.user.id && i.message.id === reply.id;

    const collector = interaction.channel!.createMessageComponentCollector({
        filter: filter,
        idle: Constants.ms.minute * 5,
        time: Constants.ms.minute * 30,
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
                    await menuUpdate(i);
                } else {
                    await dataUpdate(i);
                }
            } catch (error) {
                const handler = new CommandErrorHandler(error, interaction, userData.language);
                await handler.systemNotify();
                await handler.userNotify();
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
            const handler = new CommandErrorHandler(error, interaction, userData.language);
            await handler.systemNotify();
            await handler.userNotify();
        }
    });

    async function menuUpdate(selectMenuInteraction: SelectMenuInteraction) {
        selected = selectMenuInteraction.values[0];

        mainEmbed.setField(
            locale.menu[selected as keyof typeof locale['menu']].label,
            locale.menu[selected as keyof typeof locale['menu']]
                .longDescription,
        );

        const components = [
            mainMenu({
                defaultV: selected,
            }),
        ];

        switch (selected) {
            case 'toggle': {
                const userAPIData = await getUserAPIData();

                const moduleData =
                    subCommand === 'defender'
                        ? await getDefenderData()
                        : subCommand === 'friends'
                        ? await getFriendsData()
                        : subCommand === 'rewards'
                        ? await getRewardsData()
                        : null!; //:)

                const exceptions = {
                    defender: ['channel'] as string[],
                    friends: [] as string[],
                    rewards: [] as string[],
                };

                const missingRequirements = Object.entries(moduleData)
                    .filter(([key, value]) =>
                        value === null &&
                        exceptions[subCommand as keyof typeof exceptions].includes(key) === false)
                    .map(
                        ([name]) =>
                            locale.menu[name as keyof typeof locale.menu].label,
                    );

                if (missingRequirements.length > 0) {
                    mainEmbed.addField(
                        locale.missingConfigField.name,
                        replace(locale.missingConfigField.value, {
                            missingRequirements: missingRequirements.join(', '),
                        }),
                    );
                }

                const component = new ToggleButtons({
                    allDisabled: missingRequirements.length > 0,
                    enabled: userAPIData.modules.includes(subCommand),
                    buttonLocale: (
                        locale.menu as ModulesCommand['friends']['menu'] | ModulesCommand['rewards']['menu']
                    ).toggle.button,
                });

                components.push(component);
                break;
            }
            case 'alerts': {
                const alerts = (await getDefenderData()).alerts;

                const menu =
                    (locale.menu as ModulesCommand['defender']['menu']).alerts.select;

                for (const value of menu.options!) {
                    value.default = alerts[value.value as keyof typeof alerts];
                }

                const component = new MessageSelectMenu(menu);

                const row = new MessageActionRow().addComponents(component);

                components.push(row);
                break;
            }
            case 'versions': {
                const versions = (await getDefenderData()).versions;

                const menu =
                    (locale.menu as ModulesCommand['defender']['menu']).versions.select;

                for (const value of menu.options!) {
                    value.default = versions.includes(value.value);
                }

                const component = new MessageSelectMenu(menu);

                const row = new MessageActionRow().addComponents(component);

                components.push(row);
                break;
            }
            case 'languages': {
                const versions = (await getDefenderData()).languages;

                const menu =
                    (locale.menu as ModulesCommand['defender']['menu']).languages.select;

                for (const value of menu.options!) {
                    value.default = versions.includes(value.value);
                }

                const component = new MessageSelectMenu(menu);

                const row = new MessageActionRow().addComponents(component);

                components.push(row);
                break;
            }
            case 'channel': {
                const component = new MessageSelectMenu(
                    (
                        locale.menu as ModulesCommand['friends']['menu']
                    ).channel.select,
                );
                const row = new MessageActionRow().addComponents(component);

                components.push(row);
                break;
            }
            case 'alertTime': {
                const userRewardData = await getRewardsData();
                const component = new MessageSelectMenu(
                    (locale.menu as ModulesCommand['rewards']['menu']
                    ).alertTime.select,
                );

                for (const value of component.options!) {
                    value.default = Number(value.value) === userRewardData.alertTime;
                }

                const row = new MessageActionRow().addComponents(component);

                components.push(row);
                break;
            }
            case 'claimNotification': {
                const userRewardData = await getRewardsData();

                const component = new ToggleButtons({
                    allDisabled: false,
                    enabled: userRewardData.claimNotification,
                    buttonLocale: (
                        locale.menu as ModulesCommand['rewards']['menu']
                    ).claimNotification.button,
                });

                components.push(component);
                break;
            }
            case 'notificationInterval': {
                const userRewardData = await getRewardsData();
                const component = new MessageSelectMenu(
                    (locale.menu as ModulesCommand['rewards']['menu']
                    ).notificationInterval.select,
                );

                for (const value of component.options!) {
                    value.default = Number(value.value) === userRewardData.notificationInterval;
                }

                const row = new MessageActionRow().addComponents(component);

                components.push(row);
                break;
            }
            case 'milestones': {
                const userRewardData = await getRewardsData();

                const component = new ToggleButtons({
                    allDisabled: false,
                    enabled: userRewardData.milestones,
                    buttonLocale: (
                        locale.menu as ModulesCommand['rewards']['menu']
                    ).milestones.button,
                });

                components.push(component);
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
                defaultV: selected,
            }),
        ];

        Log.command(interaction, `Update customID: ${messageComponentInteraction.customId}`);

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
                    buttonLocale: (
                        locale.menu as ModulesCommand['friends']['menu']
                    ).toggle.button,
                });

                components.push(component);

                await SQLite.updateUser<UserAPIData>({
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

                const base = {
                    login: false,
                    logout: false,
                    version: false,
                    language: false,
                };

                for (const value of selectedValues) {
                    base[value as keyof typeof base] = true;
                }

                //@ts-expect-error typings not available
                const updatedMenu = structuredClone(
                    (locale.menu as ModulesCommand['defender']['menu']
                    ).alerts.select,
                ) as ModulesCommand['defender']['menu']['alerts']['select'];

                for (const option of updatedMenu.options!) {
                    option.default = base[option.value as keyof typeof base] === true;
                }

                const component = new MessageSelectMenu(updatedMenu);

                components.push(
                    new MessageActionRow()
                        .addComponents(component),
                );

                await SQLite.updateUser<DefenderModule>({
                    discordID: userData.discordID,
                    table: Constants.tables.defender,
                    data: { alerts: base },
                });
                break;
            }
            case 'versions': {
                const selectedValues = (
                    messageComponentInteraction as SelectMenuInteraction
                ).values;

                //@ts-expect-error typings not available
                const updatedMenu = structuredClone(
                    (locale.menu as ModulesCommand['defender']['menu']
                    ).versions.select,
                ) as ModulesCommand['defender']['menu']['versions']['select'];

                for (const value of updatedMenu.options!) {
                    value.default = selectedValues.includes(value.value);
                }

                const component = new MessageSelectMenu(updatedMenu);

                components.push(
                    new MessageActionRow()
                        .addComponents(component),
                );

                await SQLite.updateUser<DefenderModule>({
                    discordID: userData.discordID,
                    table: Constants.tables.defender,
                    data: { versions: selectedValues },
                });
                break;
            }
            case 'languages': {
                const selectedValues = (
                    messageComponentInteraction as SelectMenuInteraction
                ).values;

                //@ts-expect-error typings not available
                const updatedMenu = structuredClone(
                    (locale.menu as ModulesCommand['defender']['menu']
                    ).languages.select,
                ) as ModulesCommand['defender']['menu']['languages']['select'];

                for (const value of updatedMenu.options!) {
                    value.default = selectedValues.includes(value.value);
                }

                const component = new MessageSelectMenu(updatedMenu);

                components.push(
                    new MessageActionRow()
                        .addComponents(component),
                );

                await SQLite.updateUser<DefenderModule>({
                    discordID: userData.discordID,
                    table: Constants.tables.defender,
                    data: { languages: selectedValues },
                });
                break;
            }
            case 'alertTime': {
                const time = (
                    messageComponentInteraction as SelectMenuInteraction
                ).values[0];

                //@ts-expect-error typings not available
                const updatedMenu = structuredClone(
                    (locale.menu as ModulesCommand['rewards']['menu']
                    ).alertTime.select,
                ) as ModulesCommand['rewards']['menu']['alertTime']['select'];

                for (const value of updatedMenu.options!) {
                    value.default = value.value === time;
                }

                const component = new MessageSelectMenu(updatedMenu);

                components.push(
                    new MessageActionRow()
                        .addComponents(component),
                );

                await SQLite.updateUser<RewardsModule>({
                    discordID: userData.discordID,
                    table: Constants.tables.rewards,
                    data: { alertTime: Number(time) },
                });
                break;
            }
            case 'claimNotification1':
            case 'claimNotification0': {
                const userRewardData = await getRewardsData();

                const flipped = userRewardData.claimNotification === false;

                const component = new ToggleButtons({
                    allDisabled: false,
                    enabled: flipped,
                    buttonLocale: (
                        locale.menu as ModulesCommand['rewards']['menu']
                    ).claimNotification.button,
                });

                components.push(component);

                await SQLite.updateUser<RewardsModule>({
                    discordID: userData.discordID,
                    table: Constants.tables.rewards,
                    data: { claimNotification: flipped },
                });
                break;
            }
            case 'notificationInterval': {
                const time = (
                    messageComponentInteraction as SelectMenuInteraction
                ).values[0];

                //@ts-expect-error structuredClone not typed yet
                const updatedMenu = structuredClone(
                    (locale.menu as ModulesCommand['rewards']['menu']).notificationInterval
                        .select,
                ) as ModulesCommand['rewards']['menu']['notificationInterval']['select'];

                for (const value of updatedMenu.options!) {
                    value.default = value.value === time;
                }

                const component = new MessageSelectMenu(updatedMenu);

                components.push(
                    new MessageActionRow().addComponents(component),
                );

                await SQLite.updateUser<RewardsModule>({
                    discordID: userData.discordID,
                    table: Constants.tables.rewards,
                    data: { notificationInterval: Number(time) },
                });
                break;
            }
            case 'milestones1':
            case 'milestones0': {
                const userRewardData = await getRewardsData();

                const flipped = userRewardData.milestones === false;

                const component = new ToggleButtons({
                    allDisabled: false,
                    enabled: flipped,
                    buttonLocale: (
                        locale.menu as ModulesCommand['rewards']['menu']
                    ).milestones.button,
                });

                components.push(component);

                await SQLite.updateUser<
                    RewardsModule
                >({
                    discordID: userData.discordID,
                    table: Constants.tables.rewards,
                    data: { milestones: flipped },
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
