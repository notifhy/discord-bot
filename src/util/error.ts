import type { CommandInteraction, MessageEmbed } from 'discord.js';
import { commandEmbed, formattedNow, sendWebHook } from './utility';
import { errorWebhook } from '../../config.json';

export async function replyToError({
  error,
  interaction,
}: {
  error: Error,
  interaction: CommandInteraction,
}): Promise<void> {
  const userErrorEmbed = userErrorEmbedFactory({ error: error, interaction: interaction });
  const payLoad = { embeds: [userErrorEmbed], ephemeral: true };

  try {
    if (interaction.replied === true || interaction.deferred === true) await interaction.followUp(payLoad);
    else await interaction.reply(payLoad);
  } catch (err) {
    if (!(err instanceof Error)) return;
    console.error(`${formattedNow({ date: true })} | An error has occured and also failed to notify the user | ${err.stack ?? err.message}`);
    const failedNotify = ownerErrorEmbedFactory({ error: err, interaction: interaction });
    await sendWebHook({ embed: failedNotify, webHook: errorWebhook, suppressError: true });
  } finally {
    console.error(`${formattedNow({ date: true })} | An error has occured | ${error.stack ?? error.message}`);
    const errorReportWebhook = ownerErrorEmbedFactory({ error: error, interaction: interaction });
    await sendWebHook({ embed: errorReportWebhook, webHook: errorWebhook, suppressError: true });
  }
}

export function constraintEmbedFactory({
  interaction,
  error,
}: {
  interaction: CommandInteraction,
  error: Error,
}) {
  const constraintEmbed = commandEmbed({ color: '#AA0000', interaction: interaction })
    .setTitle('User Failed Constraints')
    .addField('Constraint Type', error.message)
    .addField('User', `Tag: ${interaction.user.tag}\nID: ${interaction.user.id}`)
    .addField('Interaction', interaction.id)
    .addField('Source', `Channel Type: ${interaction.channel?.type}\nGuild Name: ${interaction.guild?.name}\nGuild ID: ${interaction.guild?.id}\nOwner ID: ${interaction.guild?.ownerId ?? 'None'}\nGuild Member Count: ${interaction.guild?.memberCount}`);
  return constraintEmbed;
}

function ownerErrorEmbedFactory({
  error,
  interaction,
}: {
  error: Error,
  interaction: CommandInteraction,
}): MessageEmbed {
  const stack = error.stack ?? (error.message || '\u200B');
  const ownerErrorEmbed = commandEmbed({ color: '#AA0000', interaction: interaction })
    .setTitle(`Error`)
    .setDescription(stack.slice(0, 4096))
    .addField('User', `Tag: ${interaction.user.tag}\nID: ${interaction.user.id}`)
    .addField('Interaction', interaction.id)
    .addField('Source', `Channel Type: ${interaction.channel?.type}\nGuild Name: ${interaction.guild?.name}\nGuild ID: ${interaction.guild?.id}\nOwner ID: ${interaction.guild?.ownerId ?? 'None'}\nGuild Member Count: ${interaction.guild?.memberCount}`)
    .addField('Extra', `Ping: ${interaction.client.ws.ping}\nCreated At: ${formattedNow({ ms: interaction.createdTimestamp })}`);

  if (stack.length >= 4096 === true) ownerErrorEmbed.addField('Over Max Length', 'The stack is over 4096 characters long and was cut short');
  return ownerErrorEmbed;
}

function userErrorEmbedFactory({
  error,
  interaction,
}: {
  error: Error,
  interaction: CommandInteraction,
}): MessageEmbed {
  const messageOverLimit = error.message.length >= 4096;
  const userErrorEmbed = commandEmbed({ color: '#AA0000', interaction: interaction })
    .setTitle(`Oops!`)
    .setDescription(`An error occured while executing the ${interaction ? `command \`${interaction.commandName}\`` : `button`}! This error has been automatically forwarded for review. Sorry.`)
    .addField(`${error.name}:`, error.message.replace(/(\r\n|\n|\r)/gm, '').slice(0, 1024) || '\u200B');
  if (messageOverLimit) userErrorEmbed.addField('Over Max Length', 'The message of this error is over 1024 characters long and was cut short');
  userErrorEmbed.addField(`Interaction`, interaction.id);
  return userErrorEmbed;
}