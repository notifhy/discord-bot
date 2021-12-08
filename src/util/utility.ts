import type { WebHookConfig } from '../@types/client';
import { ColorResolvable, CommandInteraction, MessageEmbed, PermissionResolvable, Permissions, PermissionString, WebhookClient } from 'discord.js';
import Constants from './Constants';

export async function sendWebHook({
  content,
  embeds,
  webhook,
  suppressError = true,
}: {
  content?: string,
  embeds: MessageEmbed[],
  webhook: WebHookConfig,
  suppressError?: boolean,
}): Promise<void> {
  try {
    await new WebhookClient({ id: webhook.id, token: webhook.token }).send({ content: content, embeds: embeds });
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

type Footer = {
  name: string,
  imageURL?: string,
} | CommandInteraction;

export class BetterEmbed extends MessageEmbed {
  constructor({
    color, //Remove color as it doesn't really fit
    footer,
  }: {
    color: ColorResolvable,
    footer?: Footer,
  }) {
    super();
    super.setColor(color);
    super.setTimestamp();

    if (footer instanceof CommandInteraction) {
      const interaction = footer;
      const avatar = interaction.user.displayAvatarURL({ dynamic: true });
      super.setFooter(`/${interaction.commandName}`, avatar);
    } else if (footer !== undefined) {
      super.setFooter(footer.name, footer.imageURL);
    }
  }

  addFieldStart(name: string, value: string, inline?: boolean | undefined) {
    super.setFields({ name: name, value: value, inline: inline }, ...this.fields);
    return this;
  }
}

export function compare<Primary, Secondary extends Primary>(primary: Primary, secondary: Secondary) {
  const primaryDifferences = {} as Partial<Primary>;
  const secondaryDifferences = {} as Partial<Secondary>;
  for (const key in primary) {
    if (Object.prototype.hasOwnProperty.call(primary, key) === true) {
      if (primary[key] !== secondary[key]) {
        primaryDifferences[key] = primary[key];
        secondaryDifferences[key] = secondary[key];
      }
    }
  }

  return { primary: primaryDifferences, secondary: secondaryDifferences };
}

export function matchPermissions(required: PermissionResolvable, subject: Permissions): PermissionString[] {
  const missing = subject.missing(required);
  return missing;
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

export function cleanLength(ms: number | null, rejectZero?: boolean): string | null {
  if (
    ms === null ||
    isNaN(ms)
  ) return null;

  let newMS = Math.floor(ms / 1000) * 1000;

  if (
    rejectZero
      ? newMS <= 0
      : newMS < 0
  ) return null;

  const days = Math.floor(newMS / Constants.ms.day);
  newMS -= days * Constants.ms.day;
  const hours = Math.floor(newMS / Constants.ms.hour);
  newMS -= hours * Constants.ms.hour;
  const minutes = Math.floor(newMS / Constants.ms.minute);
  newMS -= minutes * Constants.ms.minute;
  const seconds = Math.floor(newMS / Constants.ms.second);
  return days > 0
    ? `${days}d ${hours}h ${minutes}m ${seconds}s`
    : hours > 0
    ? `${hours}h ${minutes}m ${seconds}s`
    : minutes > 0
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`;
}

export function cleanRound(number: number, decimals?: number) {
  const decimalsFactor = 10 ** (decimals ?? 2);
  return Math.round(number * decimalsFactor) / decimalsFactor;
}