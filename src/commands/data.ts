import type { CommandExecute, CommandProperties } from '../@types/client';
import { ButtonInteraction, ColorResolvable, CommandInteraction, Message, MessageActionRow, MessageButton, MessageComponentInteraction } from 'discord.js';
import { SQLiteWrapper } from '../database';
import { RawUserAPIData, UserAPIData } from '../@types/database';
import { BetterEmbed } from '../util/utility';

export const properties: CommandProperties = {
  name: 'data',
  description: 'View and/or delete all data stored or used by this bot',
  usage: '/data',
  cooldown: 30_000,
  ephemeral: false, //Temporary, file preview fails with this on. MessageAttachment is also bugged, completely broken. Doesn't attach ID.
  noDM: false,
  ownerOnly: false,
  structure: {
    name: 'data',
    description: 'View and/or delete all data stored or used by this bot',
    options: [
      {
        name: 'delete',
        type: '1',
        description: 'Delete all of your data',
      },
      {
        name: 'view',
        description: 'Returns a file with all of your data',
        type: '1',
      },
    ],
  },
};

export const execute: CommandExecute = async (interaction: CommandInteraction, { userData: userData }): Promise<void> => {
  const locale = interaction.client.regionLocales.locale(userData.language).commands.data;
  if (interaction.options.getSubcommand() === 'delete') {
    const confirmEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
      .setTitle(locale.delete.confirm.title)
      .setDescription(locale.delete.confirm.description);

    const yesButton = new MessageButton()
      .setCustomId('true')
      .setLabel(locale.delete.yesButton)
      .setStyle('SUCCESS');

    const noButton = new MessageButton()
      .setCustomId('false')
      .setLabel(locale.delete.noButton)
      .setStyle('DANGER');

    const buttonRow = new MessageActionRow()
      .addComponents(yesButton, noButton);

    const confirmation = await interaction.editReply({ embeds: [confirmEmbed], components: [buttonRow] });
    await interaction.channel?.messages.fetch(confirmation.id);

    const componentFilter = (i: MessageComponentInteraction) =>
      interaction.user.id === i.user.id && i.message.id === confirmation.id; //temp changes

    const collector = (confirmation as Message)!.createMessageComponentCollector({
      filter: componentFilter,
      idle: 30_000,
      componentType: 'BUTTON',
      max: 1,
    });

    collector.on('collect', async (i: ButtonInteraction) => {
      yesButton.setDisabled();
      noButton.setDisabled();
      const disabledRow = new MessageActionRow()
        .setComponents(yesButton, noButton);

      if (i.customId === 'true') {
        await SQLiteWrapper.deleteUser({ discordID: userData.discordID, table: 'users' });
        await SQLiteWrapper.deleteUser({ discordID: userData.discordID, table: 'api' });
        const aborted = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
          .setTitle(locale.delete.deleted.title)
          .setDescription(locale.delete.deleted.description);
        await i.update({ embeds: [aborted], components: [disabledRow] });
      } else {
        const aborted = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
          .setTitle(locale.delete.aborted.title)
          .setDescription(locale.delete.aborted.description);
        await i.update({ embeds: [aborted], components: [disabledRow] });
      }
    });
  } else {
    const userAPIData = await SQLiteWrapper.getUser<RawUserAPIData, UserAPIData>({
      discordID: userData.discordID,
      table: 'api',
      columns: ['*'],
      allowUndefined: true,
    }) as UserAPIData;

    const allUserData = {
      userData: userData,
      userAPIData: userAPIData,
    };

    await interaction.editReply({ files: [{
      attachment: Buffer.from(JSON.stringify(allUserData, null, 2)),
      name: 'userData.json' }],
    });
  }
};