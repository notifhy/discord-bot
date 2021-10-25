import type { CommandProperties } from '../@types/index';
import { queryGet, queryGetAll, queryRun } from '../database';
import { CommandInteraction } from 'discord.js';
import { commandEmbed } from '../util/utility';

export const properties: CommandProperties = {
  name: 'test',
  description: 'Does stuff',
  usage: '/test',
  cooldown: 0,
  noDM: false,
  ownerOnly: true,
  structure: {
    name: 'test',
    description: 'does stuff',
  },
};

export const execute = async (interaction: CommandInteraction) => {
  try {
    const string = '2';
    const tablename = 'barry';
    const collumms = 'bay INTEGER, PLOY NOT NULL';
    const two = await queryRun(`CREATE TABLE IF NOT EXISTS ${tablename}(${collumms})`);
    console.log(two);
    await interaction.editReply({ content: `placeholder` });
  } catch (err) {
    console.log(err);
  }
};