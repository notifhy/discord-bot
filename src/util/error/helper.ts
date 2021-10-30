import type { CommandInteraction } from 'discord.js';
import type { AbortError } from '../../@types/error';
import { BetterEmbed, cleanLength, formattedUnix, sendWebHook } from '../utility';
import { errorWebhook, ownerID } from '../../../config.json';
import { RequestCreate } from '../../hypixelAPI/RequestCreate';
import { RateLimitError } from './RateLimitError';
import { HTTPError } from './HTTPError';
import { FetchError } from 'node-fetch';

export const isAbortError = (error: any): error is AbortError => error?.name === 'AbortError';

export class CommandError extends BetterEmbed {
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
    super({ color: '#AA0000', footer: [`Incident ${incidentID}`, interaction.user.displayAvatarURL({ dynamic: true })] });
    super.setTitle(`Error`)
      .setDescription(stack.slice(0, 4096))
      .addField('User', `Tag: ${interaction.user.tag}\nID: ${interaction.user.id}`)
      .addField('Interaction', interaction.id)
      .addField('Source', `Channel Type: ${interaction.channel?.type}\nGuild Name: ${interaction.guild?.name}\nGuild ID: ${interaction.guild?.id}\nOwner ID: ${interaction.guild?.ownerId ?? 'None'}\nGuild Member Count: ${interaction.guild?.memberCount}`)
      .addField('Extra', `Websocket Ping: ${interaction.client.ws.ping}\nCreated At: ${formattedUnix({ ms: interaction.createdTimestamp, date: true, utc: true })}`);
    if (stack.length >= 4096 === true) super.addField('Over Max Length', 'The stack is over 4096 characters long and was cut short');
  }
}

export class UserCommandError extends BetterEmbed {
  constructor({
    error,
    interaction,
    incidentID,
  }: {
    error: Error,
    interaction: CommandInteraction,
    incidentID: string,
  }) {
    const messageOverLimit = error.message.length >= 4096;
    super({ color: '#AA0000', footer: [`Incident ${incidentID}`, interaction.user.displayAvatarURL({ dynamic: true })] });
    super
      .setTitle(`Oops!`)
      .setDescription(`An error occurred while executing the ${interaction ? `command \`${interaction.commandName}\`` : `button`}! This error has been automatically forwarded for review. Sorry.`)
      .addField(`${error.name}:`, error.message.slice(0, 1024) || '\u200B');
    if (messageOverLimit) super.addField('Over Max Length', 'The message of this error is over 1024 characters long and was cut short');
    super.addField(`Interaction`, interaction.id);
  }
}

export class HypixelAPIEmbed extends BetterEmbed {
  constructor({
    RequestInstance,
    error,
    incidentID,
    automatic,
  }: {
    RequestInstance: RequestCreate,
    error: unknown,
    incidentID: string,
    automatic: boolean,
  }) {
    super({ color: '#AA0000', footer: [`Incident ${incidentID}`, 'https://i.imgur.com/MTClkTu.png'] });
    super.setTitle('Degraded Performance')
      .setAuthor(error instanceof Error ? error.name : 'Unknown Incident')
      .addField('Type', automatic === true ? 'Automatic' : 'Manual');

    const { resumeAfter } = RequestInstance.instance.getInstance();

    if (isAbortError(error)) {
      super.addField('Resuming In', cleanLength(resumeAfter - Date.now()) ?? 'Not applicable'); //Discord timestamp?
    } else if (error instanceof RateLimitError) {
      super
        .setDescription('The usable percentage of the key has been dropped by 5%. ')
        .addField('Resuming In', cleanLength(resumeAfter - Date.now()) ?? 'Not applicable')
        .addField('Listed Cause', error.message ?? 'Unknown')
        .addField('Request', `Status: ${error.status}\nPath: ${error.path}\nUUID: ${error.uuid}`)
        .addField('Global Rate Limit', RequestInstance.rateLimit.isGlobal === true ? 'Yes' : 'No');
    } else if (error instanceof HTTPError) {
      super
        .addField('Resuming In', cleanLength(resumeAfter - Date.now()) ?? 'Not applicable')
        .addField('Listed Cause', error.message ?? 'Unknown')
        .addField('Request', `Status: ${error.status}\nPath: ${error.path}\nUUID: ${error.uuid}`);
    } else if (error instanceof FetchError) {
      super
        .addField('Resuming In', cleanLength(resumeAfter - Date.now()) ?? 'Not applicable')
        .addField('Listed Cause', error.message ?? 'Unknown');
    } else if (error instanceof Error) {
      super
        .addField('Resuming In', cleanLength(resumeAfter - Date.now()) ?? 'Not applicable')
        .addField('Listed Cause', error.message ?? 'Unknown');
    } else super.setDescription(JSON.stringify(error));
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
  const userErrorEmbed = new UserCommandError({ error, interaction, incidentID });
  const payLoad = { embeds: [userErrorEmbed], ephemeral: true };

  try {
    console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred | ${error.stack ?? error.message}`);
    if (interaction.replied === true || interaction.deferred === true) await interaction.followUp(payLoad);
    else await interaction.reply(payLoad);
  } catch (err) {
    if (!(err instanceof Error)) return;
    console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred and also failed to notify the user | ${err.stack ?? err.message}`);
    const failedNotify = new CommandError({ error: err, interaction: interaction, incidentID: incidentID });
    await sendWebHook({ content: `<@${ownerID[0]}>`, embed: failedNotify, webHook: errorWebhook, suppressError: true });
  }
}