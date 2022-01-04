import { DefenderModule, UserData } from '../@types/database';
import { ModuleHandler } from '../module/ModuleHandler';
import Constants from '../util/Constants';
import ModuleError from '../util/errors/ModuleError';
import { SQLite } from '../util/SQLite';

export const properties = {
    name: 'defender',
    cleanName: 'Defender',
};

export const execute = async ({
    client,
    differences,
    userAPIData,
}: ModuleHandler,
): Promise<void> => {
    try {
        const defenderModule = (
            await SQLite.getUser<
                DefenderModule
            >({
                discordID: userAPIData.discordID,
                table: Constants.tables.friends,
                allowUndefined: false,
                columns: [
                    'alerts',
                    'language',
                    'version',
                ],
            })
        ) as DefenderModule;

        const userData = (
            await SQLite.getUser<
                UserData
            >({
                discordID: userAPIData.discordID,
                table: Constants.tables.users,
                allowUndefined: false,
                columns: [
                    'language',
                    'systemMessages',
                ],
            })
        ) as UserData;
    } catch (error) {
        throw new ModuleError({
            error: error,
            cleanModule: properties.cleanName,
            module: properties.name,
        });
    }
};
