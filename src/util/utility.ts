import type { HTTPError, WebHookConfig } from '../@types/index';
import { ColorResolvable, CommandInteraction, MessageEmbed, WebhookClient } from 'discord.js';

//Handles HTTP requests and deals with errors
export function createHTTPRequest(url: string, { ...fetchOptions }, timesAborted = 0): Object { //Not ready, please fix before use
  const controller = new AbortController();
  const abortTimeout = setTimeout(() => controller.abort(), 1000).unref();
  return fetch(url, {
    signal: controller.signal,
    ...fetchOptions,
  })
  .then(async response => {
    clearTimeout(abortTimeout);
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

export async function sendWebHook({
  embed,
  webHook,
  suppressError = true,
}: {
  embed: MessageEmbed,
  webHook: WebHookConfig,
  suppressError?: boolean,
}): Promise<void> {
  try {
    await new WebhookClient({ id: webHook.id, token: webHook.token }).send({ embeds: [embed] });
  } catch (err) {
    if (!(err instanceof Error)) return;
    console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred while sending an WebHook | ${err.stack ?? err.message}`);
    if (suppressError === true) return;
    throw err;
  }
}

export function formattedUnix({
  ms = Date.now(),
  date = false,
  utc = true,
}: {
  ms?: number | Date,
  date: boolean,
  utc: boolean,
}): string | null {
  const newDate = new Date(ms);
  if (!ms || ms < 0 || Object.prototype.toString.call(newDate) !== '[object Date]') return null;
  return `${utc === true ? `UTC${createOffset()} ` : ''}${newDate.toLocaleTimeString('en-IN', { hour12: true })}${date === true ? `, ${cleanDate(ms)}` : ''}`;
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
    .setFooter(`/${interaction.commandName} • ${Date.now() - interaction.createdTimestamp}ms`, interaction.user.displayAvatarURL({ dynamic: true }))
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

export function createOffset(date = new Date()): string {
  function pad(value: number) {
    return value < 10 ? `0${value}` : value;
  }

  const sign = date.getTimezoneOffset() > 0 ? '-' : '+',
  offset = Math.abs(date.getTimezoneOffset()),
  hours = pad(Math.floor(offset / 60)),
  minutes = pad(offset % 60);
  return `${sign + hours}:${minutes}`;
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