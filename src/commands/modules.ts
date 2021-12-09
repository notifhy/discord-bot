import type { CommandExecute, CommandProperties } from '../@types/client';
import type {
    FriendsModule,
    RawUserAPIData,
    UserAPIData,
} from '../@types/database';
import { BetterEmbed } from '../util/utility';
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
import { SQLiteWrapper } from '../database';
import { ToggleButtons } from '../util/ToggleButtons';
import Constants from '../util/Constants';

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
                description: 'placeholder',
            },
            {
                name: 'friends',
                description: 'placeholder',
                type: '1',
            },
            {
                name: 'rewards',
                description: 'placeholder',
                type: '1',
            },
        ],
    },
};

export const execute: CommandExecute = async (
    interaction: CommandInteraction,
    { userData },
): Promise<void> => {
    const subCommand = interaction.options.getSubcommand();
    const locale = RegionLocales.locale(userData.language).commands.modules
        .friend;
    const mainEmbed = new BetterEmbed({
        color: Constants.color.normal,
        footer: interaction,
    })
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
            if (Object.prototype.hasOwnProperty.call(menuData, item)) {
                const itemData = menuData[item as keyof typeof menuData];
                menu.addOptions([
                    {
                        label: itemData.label,
                        value: itemData.value,
                        description: itemData.description,
                        default: Boolean(defaultV === itemData.value),
                    },
                ]);
            }
        }
        return new MessageActionRow().addComponents(menu);
    };

    const reply = await interaction.editReply({
        embeds: [mainEmbed],
        components: [mainMenu({})],
    });

    await interaction.client.channels.fetch(interaction.channelId);

    const customIDs = ['main', 'enable', 'disable', 'channel'];
    const filter = (i: MessageComponentInteraction) =>
        interaction.user.id === i.user.id &&
        i.message.id === reply.id &&
        customIDs.includes(i.customId);

    const collector = interaction.channel!.createMessageComponentCollector({
        filter: filter,
        idle: 150_000,
    });

    let selected: string;
    let component: MessageActionRow;

    collector.on(
        'collect',
        async (i: SelectMenuInteraction | ButtonInteraction) => {
            const userAPIData = (await SQLiteWrapper.getUser<
                UserAPIData,
                RawUserAPIData
            >({
                discordID: userData.discordID,
                table: Constants.tables.api,
                columns: ['discordID', 'modules'],
                allowUndefined: false,
            })) as UserAPIData;

            const userFriendData = (await SQLiteWrapper.getUser<
                FriendsModule,
                FriendsModule
            >({
                discordID: userData.discordID,
                table: Constants.tables.friends,
                columns: ['discordID', 'channel'],
                allowUndefined: false,
            })) as FriendsModule;

            if (i.isSelectMenu()) {
                [selected] = i.values;

                switch (selected) {
                    case 'toggle': {
                        component = new ToggleButtons({
                            allDisabled: !userFriendData.channel,
                            enabled: userAPIData.modules.includes(subCommand),
                            enabledLabel: locale.menu.toggle.enableButton,
                            disabledLabel: locale.menu.toggle.disableButton,
                        });
                        break;
                    }
                    case 'channel': {
                        const channelMenu = new MessageSelectMenu({
                            customId: 'channel',
                            placeholder: 'Currently Unavailable',
                            disabled: true,
                            options: [
                                {
                                    label: 'Unavailable',
                                    value: 'unavailable',
                                    description: 'description',
                                },
                            ],
                        });

                        component = new MessageActionRow().setComponents(
                            channelMenu,
                        );
                        break;
                    }
                    //no default
                }

                const mainMenuUpdateEmbed = new BetterEmbed({
                    color: Constants.color.normal,
                    footer: interaction,
                })
                    .setTitle(locale.title)
                    .setDescription(locale.description) //Add explanation for unable to toggle
                    .addField(
                        locale.menu[selected as keyof typeof locale['menu']]
                            .label,
                        locale.menu[selected as keyof typeof locale['menu']]
                            .longDescription,
                    );

                await i.update({
                    embeds: [mainMenuUpdateEmbed],
                    components: [
                        mainMenu({
                            defaultV: selected,
                        }),
                        component!,
                    ],
                });
            } else {
                switch (i.customId) {
                    case 'enable':
                    case 'disable': {
                        if (userAPIData.modules.includes(subCommand)) {
                            userAPIData.modules.splice(
                                userAPIData.modules.indexOf(subCommand),
                                1,
                            );
                        } else {
                            userAPIData.modules.push(subCommand);
                        }

                        component = new ToggleButtons({
                            enabled: userAPIData.modules.includes(subCommand),
                            enabledLabel: locale.menu.toggle.enableButton,
                            disabledLabel: locale.menu.toggle.disableButton,
                        });

                        await SQLiteWrapper.updateUser<
                            Partial<UserAPIData>,
                            Partial<UserAPIData>
                        >({
                            discordID: userAPIData.discordID,
                            table: Constants.tables.api,
                            data: { modules: userAPIData.modules },
                        });

                        await i.update({
                            components: [
                                mainMenu({
                                    defaultV: selected,
                                }),
                                component!,
                            ],
                        });
                        break;
                    }

                    //no default
                }
            }
        },
    );

    collector.on('end', async () => {
        const fetchedReply = (await interaction.fetchReply()) as Message;
        fetchedReply.components.forEach(value0 => {
            value0.components.forEach((_value1, index1, array1) => {
                array1[index1].disabled = true;
            });
        });

        await interaction.editReply({
            components: fetchedReply.components,
        });
    });
};
