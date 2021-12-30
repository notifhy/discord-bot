import { ModuleHandler } from '../module/ModuleHandler';
import ModuleError from '../util/errors/ModuleError';

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
        console.log(client.user?.tag, differences, userAPIData.discordID);
    } catch (error) {
        throw new ModuleError({
            error: error,
            cleanModule: properties.cleanName,
            module: properties.name,
        });
    }
};
