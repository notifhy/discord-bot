import {
    BaseUserData,
    Tables,
} from '../@types/database';
import Database from 'better-sqlite3';
import Constants from './Constants';

// eslint-disable-next-line no-warning-comments
//TODO: Fix "any" after the rest is done

type JSONize<Type> = {
    [Property in keyof Type]:
        Type[Property] extends Record<string, unknown>
            ? string
            : Type[Property] extends Array<unknown>
            ? string
            : Type[Property] extends boolean
            ? string
            : Property;
}

export class SQLite {
    static createTablesIfNotExists(): Promise<void> {
        return new Promise<void>(resolve => {
            const db = new Database(`${__dirname}/../../database.db`);
            const tables =
                Object.values(Constants.tables.create)
                .map(value => db.prepare(value));

            db.transaction(() => {
                for (const table of tables) {
                    table.run();
                }

                const config = db
                    .prepare('SELECT * FROM config')
                    .get();

                if (config === undefined) {
                    db.prepare('INSERT INTO config DEFAULT VALUES').run();
                }
            });

            db.close();
            resolve();
        });
    }

    static queryGet<Type>({
        query,
        allowUndefined = false,
    }: {
        query: string;
        allowUndefined?: boolean;
    }): Promise<Type> {
        /*
         *const string = '2';
         *const output = await queryGet(`SELECT tests FROM test WHERE tests = '${string}' `);
         *SELECT * FROM ${table}
         */

        return new Promise<Type>(resolve => {
            const db = new Database(`${__dirname}/../../database.db`);
            const rawData = db.prepare(query).get() as Record<string, unknown>;
            db.close();

            if (
                allowUndefined === false &&
                rawData === undefined
            ) {
                throw new RangeError(
                    `The query ${query} returned an undefined value`,
                );
            }

            const data = this.JSONize(rawData);

            resolve(data as Type);
        });
    }

    static queryGetAll<Type>(query: string): Promise<Type[]> {
        /*
         *const string = '2';
         *const output = await queryGetAll(`SELECT tests FROM test WHERE tests = '${string}' `);
         */

        return new Promise<Type[]>(resolve => {
            const db = new Database(`${__dirname}/../../database.db`);
            const rawData = db.prepare(query).all() as Record<string, unknown>[];
            db.close();

            const data = rawData.map(rawData1 =>
                this.JSONize(rawData1),
            );

            resolve(data as Type[]);
        });
    }

    static queryRun({
        query,
        data,
    }: {
        query: string;
        data?: (string | number | null)[];
    }): Promise<void> {
        /*
         *'CREATE TABLE IF NOT EXISTS servers(tests TEXT NOT NULL)'
         *'UPDATE table SET offline = ? WHERE id = ?'
         *'INSERT INTO servers VALUES(?,?,?)'
         *'DELETE FROM users WHERE id=(?)'
         */

        return new Promise<void>(resolve => {
            const db = new Database(`${__dirname}/../../database.db`);
            db.prepare(query).run(data);
            db.close();

            resolve();
        });
    }

    static async getUser<Type>({
        discordID,
        table,
        allowUndefined,
        columns,
    }: {
        discordID: string;
        table: Tables;
        allowUndefined: boolean;
        columns: string[];
    }): Promise<Type | undefined> {
        const query = `SELECT ${
            columns?.join(', ') ?? '*'
        } FROM ${table} WHERE discordID = '${discordID}'`;

        const data = await this.queryGet<Type>({
            query: query,
            allowUndefined: allowUndefined,
        });

        if (data === undefined) {
            return;
        }

        return data; //eslint-disable-line consistent-return
    }

    static async getAllUsers<Type>({
        table,
        columns,
    }: {
        table: Tables;
        columns: string[];
    }): Promise<Type[]> {
        const query = `SELECT ${columns?.join(', ') ?? '*'} FROM ${table}`;
        const userData = await this.queryGetAll<Type>(query);

        return userData as Type[];
    }

    static async newUser<Type extends Omit<BaseUserData, never>>({
        table,
        returnNew = false,
        data,
    }: {
        table: Tables;
        returnNew?: boolean;
        data: Type;
    }): Promise<void | Type> {
        const values = [];

        for (let i = 0; i < Object.values(data).length; i += 1) {
            values.push('?');
        }

        const dataArray = this.unJSONize(data);

        await this.queryRun({
            query: `INSERT INTO ${table} VALUES(${values})`,
            data: Object.values(dataArray),
        });

        if (returnNew === false) {
            return;
        }

        const returnQuery = `SELECT * FROM ${table} WHERE discordID = '${data.discordID}'`;

        const newUserData = await this.queryGet<Type>({
            query: returnQuery,
            allowUndefined: false,
        });

        return newUserData; //eslint-disable-line consistent-return
    }

    static async updateUser<Type extends Omit<BaseUserData, never>>({
        discordID,
        table,
        returnNew,
        data,
    }: {
        discordID: string;
        table: Tables;
        returnNew?: boolean;
        data: Partial<Type>;
    }): Promise<void | Type> {
        const setQuery: string[] = [];

        for (const key in data) {
            //@ts-expect-error Types not added yet
            if (Object.hasOwn(data, key)) {
                setQuery.push(`${key} = ?`);
            }
        }

        const dataArray = this.unJSONize(
            data as Record<
                string,
                Array<unknown> | boolean | null | number | string | undefined
            >,
        );

        await this.queryRun({
            query: `UPDATE ${table} SET ${setQuery.join(
                ', ',
            )} WHERE discordID = '${discordID}'`,
            data: Object.values(dataArray),
        });

        if (returnNew === false) {
            return;
        }

        const returnQuery = `SELECT * FROM ${table} WHERE discordID = '${discordID}'`;

        const newUserData = await this.queryGet<Type>({
            query: returnQuery,
            allowUndefined: false,
        });

        return newUserData; //eslint-disable-line consistent-return
    }

    static async deleteUser({
        discordID,
        table,
    }: {
        discordID: string;
        table: Tables;
    }): Promise<void> {
        const query = `DELETE FROM ${table} WHERE discordID = ?`;
        await this.queryRun({
            query: query,
            data: [discordID],
        });
    }

    /*
     * Taken from https://stackoverflow.com/a/52799327 under CC BY-SA 4.0
     * Takes an input and tests for a JSON structure (excluding primitives)
     */
    static JSONize(input: Record<string, unknown>) {
        for (const key in input) {
            if (typeof input[key] !== 'string') {
                continue;
            }

            try {
                const JSONized = JSON.parse(
                    String(input[key]),
                );

                const type = Object.prototype.toString.call(JSONized);

                if (this.isArray(type, input[key])) {
                    input[key] = JSONized as Array<unknown>;
                }

                if (this.isBoolean(type, input[key])) {
                    input[key] = JSONized as boolean;
                }
            } catch {} //eslint-disable-line no-empty
        }

        return input;
    }

    /*
     * Taken from https://stackoverflow.com/a/52799327 under CC BY-SA 4.0
     * Takes an input and tests for a JSON structure (excluding primitives)
     */
    static unJSONize(input: Record<string, Array<unknown> | boolean | null | number | string | undefined>): JSONize<typeof input> {
        for (const key in input) {
            //@ts-expect-error Types not added yet
            if (Object.hasOwn(input, key)) {
                try {
                    const type = Object.prototype.toString.call(input[key] as string);

                    if (
                        type === '[object Array]' ||
                        type === '[object Boolean]'
                    ) {
                        (input[key]) = JSON.stringify(
                            input[key],
                        );
                    }
                } catch {} //eslint-disable-line no-empty
            }
        }

        return input as JSONize<typeof input>;
    }

    private static isArray(typeParam: string, value: unknown): value is Array<unknown> {
        return typeParam === '[object Array]';
    }

    private static isBoolean(typeParam: string, value: unknown): value is boolean {
        return typeParam === '[object Boolean]';
    }
}
