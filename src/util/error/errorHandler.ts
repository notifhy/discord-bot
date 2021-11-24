import { BetterEmbed, formattedUnix, sendWebHook } from '../utility';
import { CommandErrorEmbed, ConstraintEmbed, ErrorStackEmbed, HTTPErrorEmbed, HypixelAPIEmbed, isAbortError, replyToError, UserCommandErrorEmbed, UserHTTPErrorEmbed } from './helper';
import { fatalWebhook, hypixelAPIWebhook, nonFatalWebhook, ownerID } from '../../../config.json';
import { Interaction, MessageEmbed } from 'discord.js';
import { ModuleDataResolver } from '../../hypixelAPI/ModuleDataResolver';
import Constants from '../../util/constants';
import ConstraintError from './ConstraintError';
import HTTPError from './HTTPError';
import RateLimitError from './RateLimitError';
import ModuleError from './ModuleError';

export default async ({
  error,
  interaction,
  moduleDataResolver,
}: {
  error: Error | unknown,
  interaction?: Interaction,
  moduleDataResolver?: ModuleDataResolver
}): Promise<void> => {
  const incidentID = Math.random().toString(36).substring(2, 10).toUpperCase();
  const userPayload: MessageEmbed[] = [];
  const incidentPayload: MessageEmbed[] = [];

  let shouldPing: boolean = true;

  if (interaction?.isCommand()) {
    if (error instanceof ConstraintError) {
      console.log(`${formattedUnix({ date: true, utc: true })} | ${interaction.user.tag} failed the constraint ${error.message} in interaction ${interaction.id} | Priority: Low`);
      incidentPayload.push(new ConstraintEmbed({ error: error, interaction: interaction }));
      shouldPing = false;
    } else if (error instanceof HTTPError) {
      console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | Priority: Medium |`, error);
      userPayload.push(new UserHTTPErrorEmbed({
        error: error,
        interaction: interaction,
        incidentID: incidentID,
      }));

      incidentPayload.push(...[
        new HTTPErrorEmbed({
          error: error,
          interaction: interaction,
          incidentID: incidentID,
        }),
        new ErrorStackEmbed({
          error: error,
          incidentID: incidentID,
        }),
      ]);
    } else if (error instanceof Error) {
      console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | Priority: High |`, error);
      userPayload.push(new UserCommandErrorEmbed({
        interaction: interaction,
        incidentID: incidentID,
      }));

      incidentPayload.push(...[
        new CommandErrorEmbed({
          error: error,
          interaction: interaction,
          incidentID: incidentID }),
        new ErrorStackEmbed({
          error: error,
          incidentID: incidentID,
        }),
      ]);
    }

    if (userPayload.length > 0) {
      await replyToError({
        embeds: userPayload,
        interaction: interaction,
        incidentID: incidentID,
      });
    }
  } else if (moduleDataResolver) {
    if (isAbortError(error)) {
      console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | Priority: Low |`, error);
      moduleDataResolver.abort.reportAbortError(moduleDataResolver);
    } else if (error instanceof RateLimitError) {
      console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | Priority: Medium |`, error);
      moduleDataResolver.rateLimit.reportRateLimitError(moduleDataResolver, error?.json?.global);
    } else {
      console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | Priority: High |`, error);
      moduleDataResolver.unusual.reportUnusualError(moduleDataResolver);
      incidentPayload.push(new ErrorStackEmbed({
        error: error,
        incidentID: incidentID,
      }));
    }

    incidentPayload.unshift(new HypixelAPIEmbed({
      moduleDataResolver: moduleDataResolver,
      error: error,
      incidentID: incidentID,
    }));

    shouldPing = isAbortError(error) === false ||
      moduleDataResolver.instance.resumeAfter > Date.now();
  } else if (error instanceof ModuleError) {
    incidentPayload.push(new ErrorStackEmbed({
      error: error,
      incidentID: incidentID,
    }));
  } else {
    console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | Priority: High |`, error);
    const knownInfo = new BetterEmbed({
      color: Constants.color.error,
      footer: {
        name: `Incident ${incidentID}`,
      },
    }).setDescription(JSON.stringify(error));

    incidentPayload.push(...[
      knownInfo,
      new ErrorStackEmbed({
        error: error,
        incidentID: incidentID,
      }),
    ]);
  }

  await sendWebHook({
    content: shouldPing === true ? `<@${ownerID.join('><@')}>` : undefined,
    embeds: incidentPayload,
    webhook: error instanceof ConstraintError ?
      nonFatalWebhook :
      moduleDataResolver ?
      hypixelAPIWebhook :
      fatalWebhook,
    suppressError: true,
  });
};