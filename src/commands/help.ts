import type { CommandProperties, SlashCommand } from '../@types/index';
import { CommandInteraction } from 'discord.js';
import { commandEmbed } from '../util/utility';

export const properties: CommandProperties = {
  name: 'help',
  description: 'Displays helpful information and available commands',
  usage: '/help [commands/information] <command>',
  cooldown: 5000,
  noDM: false,
  ownerOnly: false,
  structure: {
    name: 'help',
    description: 'Displays helpful information and available commands',
    options: [
      {
        name: 'commands',
        type: '1',
        description: 'Displays information about commands',
        options: [{
          name: 'command',
          type: '3',
          description: 'A command to get info about. This parameter is completely optional',
          required: false,
        }],
      },
      {
        name: 'information',
        description: 'Returns information about this bot ',
        type: '1',
      },
    ],
  },
};

export const execute = async (interaction: CommandInteraction): Promise<void> => {
  if (interaction.options.getSubcommand() === 'information') information(interaction);
  else if (interaction.options.getString('command')) await specificCommand(interaction);
	else await commands(interaction);
};

async function information(interaction: CommandInteraction) {
  const informationEmbed = commandEmbed({ color: '#7289DA', interaction: interaction })
    .setTitle('Information')
    .setDescription(`The HyGuard project was created to be an early warning system to alert users to prevent other nefarious individuals from hijacking your Minecraft account. It works by sending you your status on Hypixel on an interval, and alerting you on any unusual activity.`)
		.addField(`**Data Collection**`, `/setup requires your Minecraft username to verify your account. This is necessary to the above function. It must be linked on Hypixel to ensure you are the owner of that account. Information gathered by this bot to do the above function are your Discord username/ID, Minecraft username, timezone, language, and login/logout times for Hypixel to cross-reference. This data is stored locally in a SQLite database.\n\nAdditionally, the bot also collects the guild ID whenever a command is sent from a new guild. This data is for the /server command.`)
		.addField(`**Bug Reports and Suggestions**`, `Please report any bugs, exploits, or any suggestions to Attituding#6517. Join the [Hypixel Discord](https://discord.com/invite/hypixel) before you DM me so that you won't get blocked by Clyde. You can also [make a reply to the Hypixel forum post](https://hypixel.net/threads/discord-bot-hyguard-a-bot-that-monitors-your-account-24-7.4368395/) on this bot.`)
		.addField(`**GitHub**`, `This project has a [Github page](<https://github.com/Attituding/HyGuard>), where the code is available under the MIT license. There is also extra documentation there incase you need it.`);

  await interaction.editReply({ embeds: [informationEmbed] });
}

async function specificCommand(interaction: CommandInteraction) {
  const commandArg: string = interaction.options.getString('command') as string;
  const command: SlashCommand | undefined = interaction.client.commands.get(commandArg);
  const commandSearchEmbed = commandEmbed({ color: '#7289DA', interaction: interaction });

  if (command === undefined) {
    commandSearchEmbed
      .setColor('#ff5555')
      .setTitle(`Invalid Command!`)
      .setDescription(`/${commandArg} isn't a valid command!`);
    await interaction.editReply({ embeds: [commandSearchEmbed] });
    return;
  }

  commandSearchEmbed.setTitle(`/${command.properties.name}`);
  if (command.properties.description) commandSearchEmbed.setDescription(`${command.properties.description}`);
  if (command.properties.cooldown) commandSearchEmbed.addField('Command Cooldown', `${command.properties.cooldown / 1000} second(s)`);
  if (command.properties.noDM === true) commandSearchEmbed.addField('Direct Messages', 'This command cannot be used in the DM channel');
  if (command.properties.ownerOnly === true) commandSearchEmbed.addField('Bot Owner', 'Being an owner is required to execute this command');

  await interaction.editReply({ embeds: [commandSearchEmbed] });
}

async function commands(interaction: CommandInteraction) {
  const commandsCollection = interaction.client.commands.filter(command => command.properties.ownerOnly === false);
  const allCommandsEmbed = commandEmbed({ color: '#7289DA', interaction: interaction })
    .setTitle('Commands')
    .setDescription('Arguments in brackets are required. Arguments in arrows are sometimes required based on the previous argument. You can use the command /help [command] [a command] to see more about a specific command.');

  for (const command of commandsCollection.values()) {
    allCommandsEmbed.addField(`**${command.properties.usage}**`, command.properties.description);
  }

  await interaction.editReply({ embeds: [allCommandsEmbed] });
}