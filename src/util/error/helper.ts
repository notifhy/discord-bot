/* eslint-disable max-classes-per-file */
import type { AbortError } from '../../@types/error';
import { BetterEmbed, formattedUnix, sendWebHook } from '../utility';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { fatalWebhook, ownerID } from '../../../config.json';
import Constants from '../../util/constants';

export const isAbortError = (error: unknown): error is AbortError => error instanceof Error && error?.name === 'AbortError';

export class UserCommandErrorEmbed extends BetterEmbed {
  constructor({
    interaction,
    incidentID,
  }: {
    interaction: CommandInteraction,
    incidentID: string,
  }) {
    super({
      color: Constants.color.error,
      footer: {
        name: `Incident ${incidentID}`,
        imageURL: interaction.user.displayAvatarURL({
          dynamic: true,
        }),
      },
    });

    super
      .setTitle('Oops!')
      .setDescription(`An error occurred while executing the command /${interaction.commandName}! This error has been automatically forwarded for review. It should be resolved soon. Sorry.`);
    super.addField('Interaction ID', interaction.id);
  }
}

export class ErrorStackEmbed extends BetterEmbed {
  constructor(error: unknown, incidentID: string) {
    super({
      color: Constants.color.error,
      footer: {
        name: `Incident ${incidentID}`,
      },
    });

    if (error instanceof Error && error.stack) {
      const nonStackLenth = `${error.name}: ${error.message}`.length;
      const stack = error.stack.slice(nonStackLenth, 1024 + nonStackLenth);
      super
        .addField(error.name, error.message.slice(0, 1024))
        .addField('Trace', stack);
      if ((nonStackLenth >= 4096) === true) super.addField('Over Max Length', 'The stack is over 4096 characters long and was cut short');
    } else {
      super.setDescription(JSON.stringify(error, Object.getOwnPropertyNames(error), 2).slice(0, 4096));
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
    if (!(err instanceof Error)) return; //fix
    console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred and also failed to notify the user | ${err.stack ?? err.message}`);
    const failedNotify = new CommandErrorEmbed({ //fix
      error: err, interaction:
      interaction,
      incidentID: incidentID,
    });

    const stackEmbed = new ErrorStackEmbed(err, incidentID);

    await sendWebHook({
      content: `<@${ownerID.join('><@')}>`,
      embeds: [failedNotify, stackEmbed],
      webhook: fatalWebhook,
      suppressError: true,
    });
  }
}