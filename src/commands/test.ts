import { queryGet, queryGetAll, queryRun } from '../database';
import { CommandInteraction } from 'discord.js';
import { commandEmbed } from '../util/utility';

export const name = 'test';
export const description = 'Does stuff';
export const usage = '/test';
export const cooldown = null;
export const noDM = false;
export const ownerOnly = true;

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

export const structure = {
  name: 'test',
  description: 'does stuff',
};