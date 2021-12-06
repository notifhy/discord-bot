/* eslint-disable max-classes-per-file */
import { BetterEmbed, cleanLength, cleanRound, formattedUnix, sendWebHook } from '../utility';
import { ErrorStackEmbed, replyToError } from './helper';
import { fatalWebhook, hypixelAPIWebhook, keyLimit, nonFatalWebhook, ownerID } from '../../../config.json';
import { CommandInteraction, Interaction } from 'discord.js';
import { HypixelModuleManager } from '../../hypixelAPI/HypixelModuleManager';
import Constants from '../Constants';
import ConstraintError from './ConstraintError';
import HTTPError from './HTTPError';
import RateLimitError from './RateLimitError';
import ModuleError from './ModuleError';
import { slashCommandOptionString } from '../structures';
import { UserAPIData } from '../../@types/database';

export default class ErrorHandler {
  error: Error | unknown;
  interaction?: Interaction;
  hypixelModuleManager?: HypixelModuleManager;
  moduleUser?: UserAPIData;
  incidentID: string;

  constructor({
    error,
    interaction,
    hypixelModuleManager,
    moduleUser,
  }: {
    error: Error | unknown,
    interaction?: Interaction,
    hypixelModuleManager?: HypixelModuleManager,
    moduleUser?: UserAPIData,
  }) {
    this.error = error;
    this.interaction = interaction;
    this.hypixelModuleManager = hypixelModuleManager;
    this.moduleUser = moduleUser;
    this.incidentID = Math.random().toString(36).substring(2, 10).toUpperCase();

    this.log();
  }

  private baseGuildEmbed() {
    const { client, channel, commandName, createdTimestamp, guild, id, user } = this.interaction as CommandInteraction;
    const command = [`/${commandName}`, ...slashCommandOptionString(this.interaction as CommandInteraction)].join(' ');

    return this.errorEmbed()
      .addFields([
        { name: 'User', value: `Tag: ${user.tag}\nID: ${user.id}` },
        { name: 'Interaction', value: `${id}\nCommand: ${command}\nCreated At: <t:${Math.round(createdTimestamp / 1000)}:R` },
        { name: 'Guild', value: `Guild ID: ${guild?.id}\nGuild Name: ${guild?.name}\nOwner ID: ${guild?.ownerId ?? 'None'}\nGuild Member Count: ${guild?.memberCount}` },
        { name: 'Channel', value: `Channel Name: ${channel?.id}\nChannel Type: ${channel?.type}` },
        { name: 'Other', value: `Websocket Ping: ${client.ws.ping}>` },
      ]);
  }

  private errorEmbed() {
    return new BetterEmbed({
      color: Constants.color.error,
      footer: {
        name: this.incidentID,
      },
    });
  }

  private getPriority() { //Lower is higher priority
    if (
      this.error instanceof HTTPError &&
      this.error.baseName === 'AbortError'
    ) return 4;
    if (this.error instanceof ConstraintError) return 3;
    if (this.error instanceof ModuleError) return 2;
    return 1;
  }

  private log() {
    const time = formattedUnix({ date: true, utc: true });
    const base = `${time} | Incident ${this.incidentID} | Priority: ${this.getPriority()} | `;
    if (this.interaction?.isCommand()) {
      if (this.error instanceof ConstraintError) {
        console.error(base, `${this.interaction.user.tag} failed the constraint ${this.error.message}`);
      } else {
        console.error(base, this.error);
      }
    } else if (
      this.error instanceof HTTPError &&
      this.error.baseName === 'AbortError'
    ) {
      console.error(base, this.error.message);
    } else {
      console.error(base, this.error);
    }
  }

  async userNotify() {
    const embeds = [];

    if (this.interaction?.isCommand()) {
      const embed = this.errorEmbed();
      const { commandName, id } = this.interaction;
      if (this.error instanceof ConstraintError) return;

      embed
        .setTitle('Oops')
        .setDescription(`An error occurred while executing the command /${commandName}! This error has been automatically forwarded for review. It should be resolved soon. Sorry.`)
        .addField('Interaction ID', id);
      embeds.push(embed);

      if (embeds.length > 0) {
        await replyToError({
          embeds: embeds,
          interaction: this.interaction,
          incidentID: this.incidentID,
        });
      }
    }
  }

  async systemNotify() {
    const embeds = [];

    if (this.interaction?.isCommand()) {
      const embed = this.baseGuildEmbed();
      if (this.error instanceof ConstraintError) {
        embed
          .setTitle('User Failed Constraint')
          .setDescription(`Constraint: ${this.error.message}`);

        embeds.push(embed);
      } else {
        embed.setTitle('Unexpected Error');
        embeds.push(embed, new ErrorStackEmbed(this.error, this.incidentID));
      }
    } else if (this.hypixelModuleManager) {
      const { instanceUses, resumeAfter, keyPercentage } = this.hypixelModuleManager.instance;
      const timeout = cleanLength(resumeAfter - Date.now(), true);
      const embed = this.errorEmbed()
        .setTitle('Degraded Performance')
        .addFields([
          { name: 'Type', value: this.error instanceof Error ? this.error.name : 'Unknown' },
          { name: 'Listed Cause', value: this.error instanceof Error ? this.error.message : 'Unknown' },
          { name: 'Global Rate Limit', value: this.hypixelModuleManager.errors.rateLimit.isGlobal === true ? 'Yes' : 'No' },
          { name: 'Last Minute Statistics', value: `Abort Errors: ${this.hypixelModuleManager.errors.abort.lastMinute} 
          Rate Limit Hits: ${this.hypixelModuleManager.errors.rateLimit.lastMinute}
          Other Errors: ${this.hypixelModuleManager.errors.error.lastMinute}` },
          { name: 'Next Timeouts', value: `May not be accurate
          Abort Errors: ${cleanLength(this.hypixelModuleManager.errors.abort.timeout)}
          Rate Limit Errors: ${cleanLength(this.hypixelModuleManager.errors.rateLimit.timeout)}
          Other Errors: ${cleanLength(this.hypixelModuleManager.errors.error.timeout)}` },
          { name: 'API Key', value: `Dedicated Queries: ${cleanRound(keyPercentage * keyLimit)} or ${cleanRound(keyPercentage * 100)}%
          Instance Queries: ${instanceUses}` },
        ]);

      if (this.error instanceof RateLimitError) {
        embed.setDescription('A timeout has been applied. Dedicated queries have been dropped by 5%.');
      } else if (timeout !== null) {
        embed.setDescription('A timeout has been applied.');
      }

      if (this.error instanceof HTTPError) {
        embed.addField('Request', `Status: ${this.error.status}
          Status Text: ${this.error.statusText}
          Path: ${this.error.url}`,
        );
      }

      embeds.push(embed);
      if (
        (this.error instanceof RateLimitError) === false &&
        (this.error instanceof HTTPError) === false
      ) {
        embeds.push(new ErrorStackEmbed(this.error, this.incidentID));
      }
    } else if (this.error instanceof ModuleError) {
      const embed = this.errorEmbed()
        .setTitle('Module Error')
        .addFields([
          { name: 'Module', value: this.error.module },
          { name: 'User', value: this.error.user.discordID },
        ]);

      embeds.push(embed);
    } else {
      embeds.push(new ErrorStackEmbed(this.error, this.incidentID));
    }

    await sendWebHook({
      content: this.getPriority() <= 2
        ? `<@${ownerID.join('><@')}>`
        : undefined,
      embeds: embeds,
      webhook: this.error instanceof ConstraintError
        ? nonFatalWebhook
        : this.hypixelModuleManager
        ? hypixelAPIWebhook
        : fatalWebhook,
      suppressError: true,
    });
  }
}