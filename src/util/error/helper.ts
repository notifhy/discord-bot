import { CommandInteraction, StickerPack } from 'discord.js';
import type { AbortError } from '../../@types/error';
import { BetterEmbed, cleanLength, formattedUnix, sendWebHook } from '../utility';
import { errorWebhook, keyLimit, ownerID } from '../../../config.json';
import { RequestCreate } from '../../hypixelAPI/RequestCreate';
import { RateLimitError } from './RateLimitError';
import { HTTPError } from './HTTPError';
import { FetchError } from 'node-fetch';

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
      .addField('Source', `Channel Type: ${interaction.channel?.type}\nGuild Name: ${interaction.guild?.name}\nGuild ID: ${interaction.guild?.id}\nOwner ID: ${interaction.guild?.ownerId ?? 'None'}\nGuild Member Count: ${interaction.guild?.memberCount}`)
      .addField('Extra', `Websocket Ping: ${interaction.client.ws.ping}\nCreated At: ${formattedUnix({ ms: interaction.createdTimestamp, date: true, utc: true })}`);
    if (stack.length >= 4096 === true) super.addField('Over Max Length', 'The stack is over 4096 characters long and was cut short');
  }
}

export class UserCommandErrorEmbed extends BetterEmbed {
  constructor({
    error,
    interaction,
    incidentID,
  }: {
    error: Error,
    interaction: CommandInteraction,
    incidentID: string,
  }) {
    const locales = interaction.client.regionLocales;
    const messageOverLimit = error.message.length >= 4096;
    super({ color: '#AA0000', interaction: null, footer: [`Incident ${incidentID}`, interaction.user.displayAvatarURL({ dynamic: true })] });
    super
      .setTitle('Oops!')
      .setDescription(locales.localizer('general.errors.description', undefined, {
        commandName: interaction.commandName,
      }))
      .addField(locales.localizer('general.errors.field1.name', undefined, {
        errorName: error.name,
      }),
      locales.localizer('general.errors.field1.value', undefined, {
        errorMessage: error.message.slice(0, 1024) || '\u200B',
      }));
    if (messageOverLimit) {
      super.addField(locales.localizer('general.errors.field2.name', undefined),
      locales.localizer('general.errors.field2.value', undefined));
    }
    super.addField(locales.localizer('general.errors.field3.name', undefined),
    locales.localizer('general.errors.field3.value', undefined, {
      interactionID: interaction.id,
    }));
  }
}

export class HypixelAPIEmbed extends BetterEmbed {
  constructor({
    requestCreate,
    error,
    incidentID,
  }: {
    requestCreate: RequestCreate,
    error: unknown,
    incidentID: string,
  }) {
    const { instanceUses, resumeAfter, keyPercentage } = requestCreate.instance;
    const timeout = cleanLength(resumeAfter - Date.now());

    super({ color: '#AA0000', interaction: null, footer: [`Incident ${incidentID}`] });

    if (timeout !== null) super.setDescription('A timeout has been automatically applied.');

    if (isAbortError(error)) {
      super
        .addField('Resuming In', timeout ?? 'Not applicable');
    } else if (error instanceof RateLimitError) {
      super
        .setTitle('Degraded Performance')
        .setDescription('The usable percentage of the key has been dropped by 5%. A timeout has also been applied.')
        .addField('Resuming In', timeout ?? 'Not applicable')
        .addField('Listed Cause', error.message ?? 'Unknown')
        .addField('Request', `Status: ${error.status}\nPath: ${error.url}`)
        .addField('Global Rate Limit', requestCreate.rateLimit.isGlobal === true ? 'Yes' : 'No');
    } else if (error instanceof HTTPError) {
      super
        .setTitle('Degraded Performance')
        .addField('Resuming In', timeout ?? 'Not applicable')
        .addField('Listed Cause', error.message ?? 'Unknown')
        .addField('Request', `Status: ${error.status}\nPath: ${error.url}`);
    } else if (error instanceof FetchError) {
      super
        .setTitle('Degraded Performance')
        .addField('Resuming In', timeout ?? 'Not applicable')
        .addField('Listed Cause', error.message ?? 'Unknown');
    } else if (error instanceof Error) {
      super
        .setTitle('Unexpected Incident')
        .addField('Resuming In', timeout ?? 'Not applicable')
        .addField('Listed Cause', error.message ?? 'Unknown');
    } else {
      super
        .setTitle('Unexpected Incident')
        .setDescription(JSON.stringify(error, null, 2));
    }

    super
      .addField('Last Minute Statistics', `Abort Errors: ${requestCreate.abort.abortsLastMinute}
        Rate Limit Hits: ${requestCreate.rateLimit.rateLimitErrorsLastMinute}
        Other Errors: ${requestCreate.unusual.unusualErrorsLastMinute}`)
      .addField('Next Timeout Lengths', `May not be accurate
        Abort Errors: ${cleanLength(requestCreate.abort.timeoutLength)}
        Rate Limit Errors: ${cleanLength(requestCreate.rateLimit.timeoutLength)}
        Other Errors: ${cleanLength(requestCreate.unusual.timeoutLength)}`)
      .addField('API Key', `Dedicated Queries: ${keyPercentage * keyLimit} or ${keyPercentage * 100}%
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
  error,
  interaction,
  incidentID,
}: {
  error: Error,
  interaction: CommandInteraction,
  incidentID: string,
}): Promise<void> {
  const userErrorEmbed = new UserCommandErrorEmbed({ error, interaction, incidentID });
  const payLoad = { embeds: [userErrorEmbed], ephemeral: true };

  try {
    console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred | ${error.stack ?? error.message}`);
    if (interaction.replied === true || interaction.deferred === true) await interaction.followUp(payLoad);
    else await interaction.reply(payLoad);
  } catch (err) {
    if (!(err instanceof Error)) return;
    console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred and also failed to notify the user | ${err.stack ?? err.message}`);
    const failedNotify = new CommandErrorEmbed({ error: err, interaction: interaction, incidentID: incidentID });
    const stackEmbed = new ErrorStackEmbed({ error: error, incidentID: incidentID });
    await sendWebHook({ content: `<@${ownerID[0]}>`, embed: [failedNotify, stackEmbed], webHook: errorWebhook, suppressError: true });
  }
}