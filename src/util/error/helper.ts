import { CommandInteraction, MessageEmbed } from 'discord.js';
import type { AbortError } from '../../@types/error';
import { BetterEmbed, cleanLength, cleanRound, formattedUnix, sendWebHook } from '../utility';
import { fatalWebhook, keyLimit, ownerID } from '../../../config.json';
import { HypixelRequestCall } from '../../hypixelAPI/HypixelRequestCall';
import { RateLimitError } from './RateLimitError';
import { HTTPError } from './HTTPError';
import { FetchError } from 'node-fetch';
import { ModuleDataResolver } from '../../hypixelAPI/ModuleDataResolver';

export const isAbortError = (error: any): error is AbortError => error?.name === 'AbortError';

export class ConstraintEmbed extends BetterEmbed {
  constructor({
    error,
    interaction,
  }: {
    error: Error,
    interaction: CommandInteraction,
  }) {
    super({ color: '#AA0000', interaction: interaction, footer: null });
    super.setTitle('User Failed Constraints')
      .addField('Constraint Type', error.message)
      .addField('User', `Tag: ${interaction.user.tag}\nID: ${interaction.user.id}`)
      .addField('Interaction', interaction.id)
      .addField('Source', `Channel Type: ${interaction.channel?.type}\nGuild Name: ${interaction.guild?.name}\nGuild ID: ${interaction.guild?.id}\nOwner ID: ${interaction.guild?.ownerId ?? 'None'}\nGuild Member Count: ${interaction.guild?.memberCount}`);
  }
}

export class CommandErrorEmbed extends BetterEmbed {
  constructor({
    error,
    interaction,
    incidentID,
  }: {
    error: Error,
    interaction: CommandInteraction,
    incidentID: string,
  }) {
    const stack = error.stack ?? (error.message || '\u200B');
    super({ color: '#AA0000', interaction: null, footer: [`Incident ${incidentID}`] });
    super.setTitle('Unexpected Error')
      .addField('User', `Tag: ${interaction.user.tag}\nID: ${interaction.user.id}`)
      .addField('Interaction', interaction.id)
      .addField('Source', `Command: ${interaction.commandName}\nChannel Type: ${interaction.channel?.type}\nGuild Name: ${interaction.guild?.name}\nGuild ID: ${interaction.guild?.id}\nOwner ID: ${interaction.guild?.ownerId ?? 'None'}\nGuild Member Count: ${interaction.guild?.memberCount}`)
      .addField('Extra', `Websocket Ping: ${interaction.client.ws.ping}\nCreated At: ${formattedUnix({ ms: interaction.createdTimestamp, date: true, utc: true })}`);
    if (stack.length >= 4096 === true) super.addField('Over Max Length', 'The stack is over 4096 characters long and was cut short');
  }
}

export class UserCommandErrorEmbed extends BetterEmbed {
  constructor({
    interaction,
    incidentID,
  }: {
    interaction: CommandInteraction,
    incidentID: string,
  }) {
    super({ color: '#AA0000', interaction: null, footer: [`Incident ${incidentID}`, interaction.user.displayAvatarURL({ dynamic: true })] });
    super
      .setTitle('Oops!')
      .setDescription(`An error occurred while executing the command ${interaction.commandName}! This error has been automatically forwarded for review. It should be resolved within a reasonable amount of time. Sorry.`);
    super.addField('Interaction ID', interaction.id);
  }
}

export class HTTPErrorEmbed extends CommandErrorEmbed {
  constructor({
    error,
    interaction,
    incidentID,
  }: {
    error: Error,
    interaction: CommandInteraction,
    incidentID: string,
  }) {
    super({ error, interaction, incidentID });
    super.setTitle('Unexpected HTTP Error');
  }
}

export class UserHTTPErrorEmbed extends BetterEmbed {
  constructor({
    error,
    interaction,
    incidentID,
  }: {
    error: HTTPError,
    interaction: CommandInteraction,
    incidentID: string,
  }) {
    super({ color: '#AA0000', interaction: null, footer: [`Incident ${incidentID}`, interaction.user.displayAvatarURL({ dynamic: true })] });
    super
      .setTitle('Oops!')
      .setDescription('An error has occurred while fetching data from Hypixel or its respective wrappers. This issue should resolve itself; check back later!')
      .addField('Issue', error.response.statusText || `HTTP Code ${error.response.status}`);
  }
}

export class HypixelAPIEmbed extends BetterEmbed {
  constructor({
    moduleDataResolver,
    error,
    incidentID,
  }: {
    moduleDataResolver: ModuleDataResolver,
    error: unknown,
    incidentID: string,
  }) {
    const { instanceUses, resumeAfter, keyPercentage } = moduleDataResolver.instance;
    const timeout = cleanLength(resumeAfter - Date.now());

    super({ color: '#AA0000', interaction: null, footer: [`Incident ${incidentID}`] });

    if (timeout !== null) super.setDescription('A timeout has been automatically applied.');

    if (isAbortError(error)) {
      super
        .setTitle('Degraded Performance')
        .addField('Resuming In', timeout ?? 'Not applicable');
    } else if (error instanceof RateLimitError) {
      super
        .setTitle('Degraded Performance')
        .setDescription('The usable percentage of the key has been dropped by 5%. A timeout has also been applied.')
        .addField('Resuming In', timeout ?? 'Not applicable')
        .addField('Listed Cause', error.message || 'Unknown')
        .addField('Request', `Status: ${error.status}\nStatus Text: ${error.statusText}\nPath: ${error.url}`)
        .addField('Global Rate Limit', moduleDataResolver.rateLimit.isGlobal === true ? 'Yes' : 'No');
    } else if (error instanceof HTTPError) {
      super
        .setTitle('Degraded Performance')
        .addField('Resuming In', timeout ?? 'Not applicable')
        .addField('Listed Cause', error.message || 'Unknown')
        .addField('Request', `Status: ${error.status}\nStatus Text: ${error.statusText}\nPath: ${error.url}`);
    } else if (error instanceof FetchError) {
      super
        .setTitle('Degraded Performance')
        .addField('Resuming In', timeout ?? 'Not applicable')
        .addField('Listed Cause', error.message || 'Unknown');
    } else if (error instanceof Error) {
      super
        .setTitle('Unexpected Incident')
        .addField('Resuming In', timeout ?? 'Not applicable')
        .addField('Listed Cause', error.message || 'Unknown');
    } else {
      super
        .setTitle('Unexpected Incident')
        .setDescription(JSON.stringify(error, null, 2));
    }

    super
      .addField('Last Minute Statistics', `Abort Errors: ${moduleDataResolver.abort.abortsLastMinute}
        Rate Limit Hits: ${moduleDataResolver.rateLimit.rateLimitErrorsLastMinute}
        Other Errors: ${moduleDataResolver.unusual.unusualErrorsLastMinute}`)
      .addField('Next Timeout Lengths', `May not be accurate
        Abort Errors: ${cleanLength(moduleDataResolver.abort.timeoutLength)}
        Rate Limit Errors: ${cleanLength(moduleDataResolver.rateLimit.timeoutLength)}
        Other Errors: ${cleanLength(moduleDataResolver.unusual.timeoutLength)}`)
      .addField('API Key', `Dedicated Queries: ${cleanRound(keyPercentage * keyLimit)} or ${cleanRound(keyPercentage * 100)}%
        Instance Queries: ${instanceUses}`);
  }
}

export class ErrorStackEmbed extends BetterEmbed {
  constructor({
    error,
    incidentID,
  }: {
    error: unknown,
    incidentID: string,
  }) {
    super({ color: '#AA0000', interaction: null, footer: [`Incident ${incidentID}`] });
    if (error instanceof Error && error.stack) {
      const nonStackLenth = `${error.name}: ${error.message}`.length;
      const stack = error.stack.slice(nonStackLenth, 1024 + nonStackLenth);
      super
        .addField(error.name, error.message)
        .addField('Trace', stack);
      if (nonStackLenth >= 4096 === true) super.addField('Over Max Length', 'The stack is over 4096 characters long and was cut short');
    } else {
      super.setDescription(JSON.stringify(error, null, 2).slice(0, 4096));
    }
  }
}

export async function replyToError({
  embeds,
  interaction,
  incidentID,
}: {
  embeds: MessageEmbed[],
  interaction: CommandInteraction,
  incidentID: string,
}): Promise<void> {
  const payLoad = { embeds: embeds, ephemeral: true };

  try {
    if (interaction.replied === true || interaction.deferred === true) await interaction.followUp(payLoad);
    else await interaction.reply(payLoad);
  } catch (err) {
    if (!(err instanceof Error)) return;
    console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred and also failed to notify the user | ${err.stack ?? err.message}`);
    const failedNotify = new CommandErrorEmbed({ error: err, interaction: interaction, incidentID: incidentID });
    const stackEmbed = new ErrorStackEmbed({ error: err, incidentID: incidentID });
    await sendWebHook({
      content: `<@${ownerID.join('><@')}>`,
      embeds: [failedNotify, stackEmbed],
      webhook: fatalWebhook,
      suppressError: true,
    });
  }
}