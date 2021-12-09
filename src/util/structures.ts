import { CommandInteraction } from 'discord.js';

export const slashCommandOptionString = (interaction: CommandInteraction) => {
    let [option] = interaction.options.data;

    const commandOptions: (string | number | boolean)[] = [];

    if (option) {
        if (option.value) {
            commandOptions.push(option.value);
        } else {
            if (option.type === 'SUB_COMMAND_GROUP') {
                commandOptions.push(option.name);
                [option] = option.options!;
            }

            if (option.type === 'SUB_COMMAND') {
                commandOptions.push(option.name);
            }

            if (Array.isArray(option.options)) {
                option.options.forEach(subOption => {
                    commandOptions.push(
                        `${subOption.name}: ${subOption.value}`,
                    );
                });
            }
        }
    }

    return commandOptions;
};
