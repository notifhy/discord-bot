import { MessageEmbed, WebhookClient, CommandInteraction, ColorResolvable, BaseCommandInteraction, Interaction } from 'discord.js';
import { webHookID, webHookToken } from '../config.json';
import type { HTTPError } from './@types/index';

export const isInstanceOfError = (error: any): error is Error => true;

//Handles HTTP requests and deals with errors
export function createHTTPRequest(url: string, { ...fetchOptions }, timesAborted = 0): Object {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 250).unref();
  return fetch(url, {
    signal: controller.signal,
    ...fetchOptions,
  })
  .then(async response => {
    if (!response.ok) {
      const newError = new Error(`HTTP status ${response.status}`) as HTTPError,
      responseJson = await response.json().catch(err => {
        console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} | ${err.stack}`);
      }) as Object;
      newError.name = 'HTTPError';
      newError.status = response.status;
      newError.json = responseJson ?? null;
      throw newError;
    }
    return response.json() as Object;
  })
  .catch(err => {
    if (err.name === 'AbortError' && timesAborted < (fetchOptions.maxAborts ?? 1)) return createHTTPRequest(url, { ...fetchOptions }, timesAborted + 1);
    //Aborting throws a read-only error
    const newError = new Error(err.message) as HTTPError;
      newError.name = err.name;
      newError.method = fetchOptions?.method ?? 'GET';
      newError.headers = JSON.stringify(fetchOptions?.headers ?? {});
      newError.url = url ?? null;
      newError.status = err.status ?? null;
      newError.json = err.json ?? null;
    throw newError;
  });
}

export async function replyToError({
  error,
  interaction,
}: {
  error: Error,
  interaction: CommandInteraction,
}): Promise<void> {
  const messageOverLimit = error.message.length >= 4096;
  const baseErrorEmbed = commandEmbed({ color: '#AA0000', interaction: interaction })
    .setTitle(`Oops!`)
    .setDescription(`An error occured while executing the ${interaction ? `command \`${interaction.commandName}\`` : `button`}! This error has been automatically forwarded for review. Sorry.`)
    .addField(`${error.name}:`, error.message.replace(/(\r\n|\n|\r)/gm, '').slice(0, 1024) || '\u200B');
  if (messageOverLimit) baseErrorEmbed.addField('Over Max Length', 'The message of this error is over 1024 characters long and was cut short');
  baseErrorEmbed.addField(`Interaction`, interaction.id);

  const payLoad = { embeds: [baseErrorEmbed], ephemeral: true };

  try {
    if (interaction.replied === true || interaction.deferred === true) await interaction.followUp(payLoad);
    else await interaction.reply(payLoad);
  } catch (err) {
    if (!isInstanceOfError(err)) return;
    console.error(`${formattedNow({ date: true })} | An error has occured and also failed to notify the user | ${err.stack ?? err.message}`);
    await sendErrorWebHook({ error: err, interaction: interaction, suppressError: true });
  } finally {
    console.error(`${formattedNow({ date: true })} | An error has occured | ${error.stack ?? error.message}`);
    await sendErrorWebHook({ error: error, interaction: interaction, suppressError: true });
  }
}

export async function sendErrorWebHook({
  error,
  interaction,
  suppressError = false,
}: {
  error: Error,
  interaction: CommandInteraction,
  suppressError?: boolean
}): Promise<void> {
  const stack = error.stack ?? (error.message || '\u200B');
  const stackOverLimit = stack.length >= 4096;
  const webHookEmbed = commandEmbed({ color: '#AA0000', interaction: interaction })
    .setAuthor(`Requested by ${interaction.user.tag}`)
    .setTitle(`Error`)
    .setDescription(stack.slice(0, 4096))
    .addField('Source', `Channel Type: ${interaction.channel?.type}\nGuild Name: ${interaction.guild?.name}\nGuild ID: ${interaction.guild?.id}\nGuild Member Count: ${interaction.guild?.memberCount}`)
    .addField('Extra', `Ping: ${interaction.client.ws.ping}\nCreated At: ${formattedNow({ ms: interaction.createdTimestamp })}`);

  if (stackOverLimit === true) webHookEmbed.addField('Over Max Length', 'The stack is over 4096 characters long and was cut short');
  if (interaction) webHookEmbed.addField(`Interaction`, interaction.id);

  try {
    await new WebhookClient({ id: webHookID, token: webHookToken }).send({ embeds: [webHookEmbed] });
  } catch (err) {
    if (!isInstanceOfError(err)) return;
    console.error(`${formattedNow({ date: true })} | An error has occured while sending an WebHook for an error | ${error.stack ?? error.message}`);
    if (suppressError === true) return;
    throw err;
  }
}


export function formattedNow({
  ms = Date.now(),
  date = false,
}: {
  ms?: number | Date,
  date?: boolean,
}): string | null {
  const newDate = new Date(ms);
  if (!ms || ms < 0 || Object.prototype.toString.call(newDate) !== '[object Date]') return null;
  return `${newDate.toLocaleTimeString('en-IN', { hour12: true })}${date === true ? `, ${cleanDate(ms)}` : ''}`;
}

export function commandEmbed({
  color,
  interaction,
}: {
  color: ColorResolvable,
  interaction: CommandInteraction,
}): MessageEmbed {
  const embed = new MessageEmbed()
    .setColor(color)
    .setFooter(`/${interaction.commandName}`, interaction.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();
  return embed;
}

export function cleanDate(ms: number | Date): string | null {
  const newDate = new Date(ms);
  if (!ms || ms < 0 || Object.prototype.toString.call(newDate) !== '[object Date]') return null;
  const day = newDate.getDate(),
  month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(newDate),
  year = newDate.getFullYear();
  return `${month} ${day}, ${year}`;
}

export function timeAgo(ms: number): number | null {
  if (ms < 0 || ms === null || isNaN(ms)) return null;
  return Date.now() - ms;
}

export function cleanLength(ms: number): string | null {
  if (ms < 0 || ms === null || isNaN(ms)) return null;
  let seconds = Math.round(ms / 1000);
  const days = Math.floor(seconds / (24 * 60 * 60));
  seconds -= days * 24 * 60 * 60;
  const hours = Math.floor(seconds / (60 * 60));
  seconds -= hours * 60 * 60;
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  return days > 0
    ? `${days}d ${hours}h ${minutes}m ${seconds}s`
    : hours > 0
    ? `${hours}h ${minutes}m ${seconds}s`
    : minutes > 0
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`;
}

export const timeout = (ms: number) => new Promise(res => setTimeout(res, ms));