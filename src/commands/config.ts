import type { CommandExecute, CommandProperties, Config } from '../@types/client';
import { BetterEmbed } from '../util/utility';
import { CommandInteraction, WebhookEditMessageOptions } from 'discord.js';
import { RawConfig } from '../@types/database';
import { SQLiteWrapper } from '../database';

export const properties: CommandProperties = {
  name: 'config',
  description: 'Configure the bot',
  usage: '/config [block/userlimit/devmode/api]',
  cooldown: 0,
  ephemeral: true,
  noDM: false,
  ownerOnly: true,
  structure: {
    name: 'config',
    description: 'Toggles dynamic settings',
    options: [
      {
        name: 'api',
        type: '1',
        description: 'Toggle API commands and functions',
      },
      {
        name: 'blockguild',
        description: 'Blacklists the bot from joining specific guilds',
        type: '1',
        options: [{
          name: 'guild',
          type: '3',
          description: 'The guild\'s ID',
          required: true,
        }],
      },
      {
        name: 'blockuser',
        description: 'Blacklists users from using this bot',
        type: '1',
        options: [{
          name: 'user',
          type: '3',
          description: 'The user\'s ID',
          required: true,
        }],
      },
      {
        name: 'devmode',
        type: '1',
        description: 'Toggle Developer Mode',
      },
    ],
  },
};

export const execute: CommandExecute = async (interaction: CommandInteraction): Promise<void> => {
  const responseEmbed = new BetterEmbed({ color: '#7289DA', footer: interaction });
  const rawConfig = await SQLiteWrapper.queryGet<RawConfig>({
    query: 'SELECT blockedGuilds, blockedUsers, devMode, enabled FROM config WHERE rowid = 1',
  });

  const config = SQLiteWrapper.JSONize<RawConfig, Config>({
    input: rawConfig,
  });

  const payload: WebhookEditMessageOptions = {};

  switch (interaction.options.getSubcommand()) {
    case 'api': {
      config.enabled = !config.enabled;
      interaction.client.config.enabled = Boolean(config.enabled);

      const apiEmbed = new BetterEmbed({
        color: '#7289DA',
        footer: interaction,
      })
        .setTitle(`API State Updated!`)
        .setDescription(`API commands and functions are now ${config.enabled === true ? 'on' : 'off'}!`);

      payload.embeds = [apiEmbed];
      break;
    }
    case 'blockguild': {
      const guildID = interaction.options.getString('guild') as string;
      const blockedGuildIndex = config.blockedGuilds.indexOf(guildID);

      if (blockedGuildIndex === -1) {
        config.blockedGuilds.push(guildID);

        const guild = await interaction.client.guilds.fetch(guildID);
        await guild.leave();

        const guildEmbed = new BetterEmbed({
          color: '#7289DA',
          footer: interaction,
        })
          .setTitle(`Guild Added`)
          .setDescription(`${guildID} was added to the blacklist!`);

        payload.embeds = [guildEmbed];

        payload.files = [{
          attachment: Buffer.from(JSON.stringify(guild, null, 2)),
          name: 'guild.json',
        }];
      } else {
        config.blockedGuilds.splice(blockedGuildIndex, 1);

        const guildEmbed = new BetterEmbed({
          color: '#7289DA',
          footer: interaction,
        })
          .setTitle(`Guild Removed`)
          .setDescription(`${guildID} was removed from the blacklist!`);

        payload.embeds = [guildEmbed];
      }

      interaction.client.config.blockedGuilds = config.blockedGuilds;
      break;
    }
    case 'blockuser': {
      const user = interaction.options.getString('user') as string;
      const blockedUserIndex = config.blockedUsers.indexOf(user);

      if (blockedUserIndex === -1) {
        config.blockedUsers.push(user);

        const userEmbed = new BetterEmbed({
          color: '#7289DA',
          footer: interaction,
        })
          .setTitle(`User Added`)
          .setDescription(`${user} was added to the blacklist!`);

        payload.embeds = [userEmbed];
      } else {
        config.blockedUsers.splice(blockedUserIndex, 1);

        const userEmbed = new BetterEmbed({
          color: '#7289DA',
          footer: interaction,
        })
          .setTitle(`User Removed`)
          .setDescription(`${user} was removed from the blacklist!`);

        payload.embeds = [userEmbed];
      }

      interaction.client.config.blockedUsers = config.blockedUsers;
      break;
    }
    case 'devmode': {
      config.devMode = !config.devMode;
      interaction.client.config.devMode = !config.devMode;

      const devmodeEmbed = new BetterEmbed({
        color: '#7289DA',
        footer: interaction,
      })
        .setTitle(`Developer Mode Updated`)
        .setDescription(`Developer Mode is now ${Boolean(config.devMode) === true ? 'on' : 'off'}!`);

      payload.embeds = [devmodeEmbed];
      break;
    }
  }

  const newRawConfig = SQLiteWrapper.unJSONize<Config, RawConfig>({
    input: config,
  });

  await SQLiteWrapper.queryRun({
    query: 'UPDATE config set blockedGuilds = ?, blockedUsers = ?, devMode = ?, enabled = ? WHERE rowid = 1',
    data: Object.values(newRawConfig),
  });

  await interaction.editReply(payload);
};