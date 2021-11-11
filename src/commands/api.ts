import type { CommandExecute, CommandProperties } from '../@types/client';
import { CommandInteraction } from 'discord.js';
import { BetterEmbed, cleanLength, cleanRound } from '../util/utility';
import { keyLimit } from '../../config.json';
import { ModuleDataResolver } from '../hypixelAPI/ModuleDataResolver';

export const properties: CommandProperties = {
  name: 'api',
  description: 'Configure the bot',
  usage: '/api [instance/toggle] <stats/>',
  cooldown: 0,
  ephemeral: true,
  noDM: false,
  ownerOnly: true,
  structure: {
    name: 'api',
    description: 'Toggles dynamic settings',
    options: [
      {
        name: 'stats',
        type: '1',
        description: 'Returns some stats about the API Request Handler',
      },
      {
        name: 'set',
        type: '1',
        description: 'Set data for the API Request Handler',
        options: [
          {
            name: 'category',
            type: '3',
            description: 'The category to execute on',
            required: true,
            choices: [
              {
                name: 'abort',
                value: 'abort',
              },
              {
                name: 'rateLimit',
                value: 'rateLimit',
              },
              {
                name: 'unusual',
                value: 'unusual',
              },
              {
                name: 'instance',
                value: 'instance',
              },
            ],
          },
          {
            name: 'type',
            type: '3',
            description: 'The type to execute on',
            required: true,
            choices: [
              {
                name: 'abortThreshold (instance)',
                value: 'abortThreshold',
              },
              {
                name: 'baseTimeout (abort, rateLimit, unusual)',
                value: 'baseTimeout',
              },
              {
                name: 'isGlobal (rateLimit)',
                value: 'isGlobal',
              },
              {
                name: 'keyPercentage (instance)',
                value: 'keyPercentage',
              },
              {
                name: 'resumeAfter (instance)',
                value: 'resumeAfter',
              },
              {
                name: 'timeoutLength (abort, rateLimit, unusual)',
                value: 'timeoutLength',
              },
            ],
          },
          {
            name: 'value',
            type: '10',
            description: 'An integer for the baseTimeout and a number for keyPercentage',
            required: false,
          },
        ],
      },
      {
        name: 'call',
        type: '1',
        description: 'Call a function from the API Request Handler',
        options: [
          {
            name: 'category',
            type: '3',
            description: 'The category to execute on',
            required: true,
            choices: [
              {
                name: 'abort',
                value: 'abort',
              },
              {
                name: 'rateLimit',
                value: 'rateLimit',
              },
              {
                name: 'unusual',
                value: 'unusual',
              },
              {
                name: 'instance',
                value: 'instance',
              },
            ],
          },
          {
            name: 'type',
            type: '3',
            description: 'The type to execute on',
            required: true,
            choices: [
              {
                name: 'addAbort (abort)',
                value: 'addAbort',
              },
              {
                name: 'addRateLimit (rateLimit)',
                value: 'addRateLimit',
              },
              {
                name: 'addUnusualError (unusual)',
                value: 'addUnusualError',
              },
              {
                name: 'reportAbortError (abort)',
                value: 'reportAbortError',
              },
              {
                name: 'reportRateLimitError (rateLimit)',
                value: 'reportRateLimitError',
              },
              {
                name: 'reportUnusualError (unusual)',
                value: 'reportUnusualError',
              },
            ],
          },
          {
            name: 'value',
            type: '5',
            description: 'A value used for isGlobal in reportRateLimitError',
            required: false,
          },
        ],
      },
    ],
  },
};

//JSON database moment.
export const execute: CommandExecute = async (interaction: CommandInteraction): Promise<void> => {
  switch (interaction.options.getSubcommand()) {
    case 'stats': await stats(interaction);
    break;
    case 'set': await set(interaction, interaction.options.getString('category')!, interaction.options.getString('type')!, interaction.options.getNumber('value'));
    break;
    case 'call': await call(interaction, interaction.options.getString('category')!, interaction.options.getString('type')!, interaction.options.getBoolean('value'));
    break;
  }
};

async function stats(interaction: CommandInteraction) {
  const requestCreate = interaction.client.hypixelAPI;
  const { instanceUses, resumeAfter, keyPercentage } = requestCreate.instance;
  const statsEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .addField('Enabled', interaction.client.config.enabled === true ? 'Yes' : 'No')
    .addField('Resuming In', cleanLength(resumeAfter - Date.now()) ?? 'Not applicable')
    .addField('Global Rate Limit', requestCreate.rateLimit.isGlobal === true ? 'Yes' : 'No')
    .addField('Last Minute Statistics', `Aborts: ${requestCreate.abort.abortsLastMinute}
      Rate Limit Hits: ${requestCreate.rateLimit.rateLimitErrorsLastMinute}
      Other Errors: ${requestCreate.unusual.unusualErrorsLastMinute}`)
    .addField('Next Timeout Lengths', `May not be accurate
      Abort Errors: ${cleanLength(requestCreate.abort.timeoutLength)}
      Rate Limit Errors: ${cleanLength(requestCreate.rateLimit.timeoutLength)}
      Other Errors: ${cleanLength(requestCreate.unusual.timeoutLength)}`)
    .addField('API Key', `Dedicated Queries: ${cleanRound(keyPercentage * keyLimit, 1)} or ${cleanRound(keyPercentage * 100, 1)}%
      Instance Queries: ${instanceUses}`);
  await interaction.editReply({ embeds: [statsEmbed] });
}

async function set(interaction: CommandInteraction, category: string, type: string, value: number | null) {
  if (type === 'keyPercentage' && value !== null && value > 1) throw new Error('Too high, must be below 1');
  interaction.client.hypixelAPI[category as keyof ModuleDataResolver][type] = type === 'isGlobal' ? Boolean(value) : value;
  const setEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .setTitle('Updated Value!')
    .setDescription(`<RequestCreate>.${category}.${type} is now ${value}.`);
  await interaction.editReply({ embeds: [setEmbed] });
}

async function call(interaction: CommandInteraction, category: string, type: string, value: boolean | null) {
  const requestCreate = interaction.client.hypixelAPI;
  if (type === 'addAbort' || type === 'addTimeToTimeout' || type === 'addUnusualError') {
    requestCreate[category][type]();
  } else {
    requestCreate[category][type](requestCreate, value ?? false); //value is used for reportAbortError's global field
  }
  const callEmbed = new BetterEmbed({ color: '#7289DA', interaction: interaction, footer: null })
    .setTitle('Executed!')
    .setDescription(`Executed <RequestCreate>.${category}.${type}`);
  await stats(interaction);
  await interaction.followUp({ embeds: [callEmbed], ephemeral: true });
}