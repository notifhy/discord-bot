import { MessageEmbed, WebhookClient, CommandInteraction, ColorResolvable } from 'discord.js';
import { webHookID, webHookToken } from '../config.json';
import type { HTTPError } from './@types/index';
import * as fs from 'fs/promises';

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
  const baseErrorEmbed = commandEmbed('#AA0000', 'Error', `/${interaction.commandName}`)
    .setTitle(`Oops!`)
    .setDescription(`An error occured while executing the ${interaction ? `command \`${interaction.commandName}\`` : `button`}! This error has been automatically forwarded for review. Sorry.`)
    .addField(`${error.name}:`, error.message.replace(/(\r\n|\n|\r)/gm, '') || '\u200B')
    .addField(`Interaction`, interaction.id);

  const payLoad = { embeds: [baseErrorEmbed], ephemeral: true };

  try {
    if (interaction.isButton() && !interaction.replied && !interaction.deferred) await interaction.update(payLoad);
    else if (interaction.replied === true || interaction.deferred === true) await interaction.followUp(payLoad);
    else await interaction.reply(payLoad);
  } catch (err) {
    console.error(`${formattedNow({ date: true })} | An error has occured and also failed to notify the user | ${error?.stack ?? error.message}`);
  } finally {
    console.error(`${formattedNow({ date: true })} | An error has occured | ${error?.stack ?? error.message}`);
    await sendErrorWebHook({ error: error, interaction: interaction, suppressError: true });
  }
}

export async function sendErrorWebHook({
  error,
  interaction,
  suppressError = false,
}: {
  error: Error,
  interaction?: CommandInteraction,
  suppressError?: boolean
}): Promise<void> {
  const stack = error?.stack ?? (error.message || '\u200B');
  const stackOverLimit = stack.length >= 4096;
  const footer = interaction?.isCommand() ? `/${interaction.commandName}` : interaction?.type ?? 'Unknown Source';
  const webHookEmbed = commandEmbed('#AA0000', 'Error', footer)
    .setTitle(`Error`)
    .setDescription(stackOverLimit ? stack : stack.slice(0, 4095));

  if (stackOverLimit === true) webHookEmbed.addField('Over Max Length', 'The stack is over 4096 characters long');
  if (interaction) webHookEmbed.addField(`Interaction`, interaction.id);

  try {
    await new WebhookClient({ id: webHookID, token: webHookToken }).send({ embeds: [webHookEmbed] });
  } catch (err) {
    if (suppressError === true) return;
    throw err;
  }
}


export function formattedNow({
  ms = Date.now(),
  date = true,
}: {
  ms?: number | Date,
  date?: boolean,
}): string | null {
  const newDate = new Date(ms);
  if (!ms || ms < 0 || Object.prototype.toString.call(newDate) !== '[object Date]') return null;
  return `${newDate.toLocaleTimeString('en-IN', { hour12: true })}${date === true ? ` ${newDate.toLocaleDateString('en-IN', { hour12: true })}` : ''}`;
}

export function commandEmbed(
  color: ColorResolvable,
  subject: string,
  footer: string,
) {
  const embed = new MessageEmbed()
    .setColor(color)
    .setAuthor(subject)
    .setFooter(footer, 'https://i.imgur.com/MTClkTu.png')
    .setTimestamp();
  return embed;
}

export async function saveOwnerSettings(file: string, data: Object) {
  await fs.writeFile(`../${file}.json`, JSON.stringify(data));
}

export async function readOwnerSettings() {
  const data = await fs.readFile('./ownerSettings.json');
}

export const timeout = (ms: number) => new Promise(res => setTimeout(res, ms));

export const isInstanceOfError = (error: any): error is Error => true;