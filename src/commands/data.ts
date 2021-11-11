import type { CommandExecute, CommandProperties } from '../@types/client';
import { ColorResolvable, CommandInteraction, Message } from 'discord.js';
import { SQLiteWrapper } from '../database';
import { UserAPIData } from '../@types/database';

export const properties: CommandProperties = {
  name: 'data',
  description: 'View and/or delete all data stored or used by this bot',
  usage: '/data',
  cooldown: 60000,
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
  const locales = interaction.client.regionLocales;
  if (interaction.options.getSubcommand() === 'delete') {

  } else {
    const userAPIData = await SQLiteWrapper.getUser({
      discordID: userData.discordID,
      table: 'api',
      columns: ['*'],
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