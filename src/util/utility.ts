import type { WebHookConfig } from '../@types/index';
import { ColorResolvable, CommandInteraction, MessageEmbed, WebhookClient } from 'discord.js';

export async function sendWebHook({
  content,
  embed,
  webhook,
  suppressError = true,
}: {
  content?: string,
  embed: MessageEmbed[],
  webhook: WebHookConfig,
  suppressError?: boolean,
}): Promise<void> {
  try {
    console.log('7');
    await new WebhookClient({ id: webhook.id, token: webhook.token }).send({ content: content, embeds: embed });
    console.log('6');
  } catch (err) {
    console.log('5', err);
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

export class BetterEmbed extends MessageEmbed {
  constructor({
    color,
    interaction,
    footer,
  }: {
    color: ColorResolvable,
    interaction: CommandInteraction | null,
    footer: string[] | null,
  }) {
    super();
    super.setColor(color);
    super.setTimestamp();

    if (interaction !== null) {
      const avatar = interaction.user.displayAvatarURL({ dynamic: true });
      super.setFooter(`/${interaction.commandName}`, avatar);
    } else if (footer !== null) {
      super.setFooter(footer[0], footer[1]);
    }
  }
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

export function cleanLength(ms: number | null): string | null {
  if (ms === null || ms < 0 || isNaN(ms)) return null;
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