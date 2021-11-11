import { Interaction, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { fatalWebhook, nonFatalWebhook, ownerID } from '../../../config.json';
import { ModuleDataResolver } from '../../hypixelAPI/ModuleDataResolver';
import { BetterEmbed, formattedUnix, sendWebHook } from '../utility';
import { ConstraintError } from './ConstraintError';
import { CommandErrorEmbed, ConstraintEmbed, ErrorStackEmbed, HTTPErrorEmbed, HypixelAPIEmbed, isAbortError, replyToError, UserCommandErrorEmbed, UserHTTPErrorEmbed } from './helper';
import { HTTPError } from './HTTPError';
import { RateLimitError } from './RateLimitError';

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
  const incidentPayload: MessageEmbed[] = [new ErrorStackEmbed({ error: error, incidentID: incidentID })];

  let shouldPing: boolean = true;

  if (interaction?.isCommand()) {
    if (error instanceof ConstraintError) {
      console.log(`${formattedUnix({ date: true, utc: true })} | ${interaction.user.tag} failed the constraint ${error.message} in interaction ${interaction.id} | Priority: Low |`);
      incidentPayload.unshift(new ConstraintEmbed({ error: error, interaction: interaction }));
      shouldPing = false;
    } else if (error instanceof HTTPError) {
      console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | Priority: Medium |`, error);
      userPayload.unshift(new UserHTTPErrorEmbed({ error: error, interaction: interaction, incidentID: incidentID }));
      incidentPayload.unshift(new CommandErrorEmbed({ error: error, interaction: interaction, incidentID: incidentID }));
    } else if (error instanceof Error) {
      console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | Priority: High |`, error);
      userPayload.unshift(new UserCommandErrorEmbed({ interaction: interaction, incidentID: incidentID }));
      incidentPayload.unshift(new CommandErrorEmbed({ error: error, interaction: interaction, incidentID: incidentID }));
    }

    if (userPayload.length > 0) {
      await replyToError({
        embeds: userPayload,
        interaction: interaction,
        incidentID: incidentID,
      });
    }
  } else if (moduleDataResolver) {
    console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | Priority: Medium |`, error);
    if (isAbortError(error)) moduleDataResolver.abort.reportAbortError(moduleDataResolver);
    else if (error instanceof RateLimitError) moduleDataResolver.rateLimit.reportRateLimitError(moduleDataResolver, error?.json?.global);
    else moduleDataResolver.unusual.reportUnusualError(moduleDataResolver);

    incidentPayload.unshift(new HypixelAPIEmbed({
      moduleDataResolver: moduleDataResolver,
      error: error,
      incidentID: incidentID,
    }));

    const isAbortTimeout: boolean = moduleDataResolver.abort.timeoutLength < moduleDataResolver.abort.baseTimeout;
    shouldPing = isAbortError(error) === false || isAbortTimeout;
  } else {
    console.error(`${formattedUnix({ date: true, utc: true })} | An error has occurred on incident ${incidentID} | Priority: High |`, error);
    const knownInfo = new BetterEmbed({ color: '#AA0000', interaction: null, footer: [`Incident ${incidentID}`] })
      .setDescription(JSON.stringify(error));
    incidentPayload.unshift(knownInfo);
  }

  await sendWebHook({
    content: shouldPing === true ? `<@${ownerID.join('><@')}>` : undefined,
    embeds: incidentPayload,
    webhook: error instanceof ConstraintError ? nonFatalWebhook : fatalWebhook,
    suppressError: true,
  });
};