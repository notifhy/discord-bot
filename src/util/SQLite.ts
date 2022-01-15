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
            : Type[Property] extends Record<string, unknown>
            ? string
            : Property;
}

type GetType<B> = {
    query: string;
    allowUndefined?: B;
}

type GetUserType<T, B> = {
    discordID: string;
    table: Tables;
    allowUndefined?: B;
    columns: (keyof T | '*')[];
}

type NewUserType<Type, B> = {
    table: Tables;
    returnNew?: B;
    data: Partial<Type>;
}

type UpdateUserType<Type, B> = {
    discordID: string;
    table: Tables;
    returnNew?: B;
    data: Partial<Type>;
}

/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable consistent-return */

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

    static queryGet<Type>(config: GetType<false>): Promise<Type>
    static queryGet<Type>(config: GetType<true>): Promise<Type | void>
    static queryGet<Type>(config: GetType<boolean>): Promise<Type | void>
    static queryGet<Type>(config: {
        query: string;
        allowUndefined?: boolean;
    }): Promise<Type | void> {
        /*
         *const string = '2';
         *const output = await queryGet(`SELECT tests FROM test WHERE tests = '${string}' `);
         *SELECT * FROM ${table}
         */

        return new Promise(resolve => {
            const db = new Database(`${__dirname}/../../database.db`);
            const rawData = db.prepare(config.query).get() as Record<string, unknown>;
            db.close();

            if (
                (
                    config.allowUndefined === false ||
                    config.allowUndefined === undefined
                ) &&
                rawData === undefined
            ) {
                throw new RangeError(
                    `The query ${config.query} returned an undefined value`,
                );
            }

            const data = this.JSONize(rawData);

            resolve(data as Type | undefined);
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

    static async getUser<Type>(config: GetUserType<Type, false>): Promise<Type>
    static async getUser<Type>(config: GetUserType<Type, true>): Promise<Type | void>
    static async getUser<Type>(config: GetUserType<Type, boolean>): Promise<Type | void>
    static async getUser<Type>(config: {
        discordID: string;
        table: Tables;
        allowUndefined?: boolean;
        columns: (keyof Type | '*')[];
    }): Promise<Type | void> {
        const query = `SELECT ${
            config.columns?.join(', ') ?? '*'
        } FROM ${config.table} WHERE discordID = '${config.discordID}'`;

        const data = await this.queryGet<Type>({
            query: query,
            allowUndefined: config.allowUndefined ?? false,
        });

        return data;
    }

    static async getAllUsers<Type>({
        table,
        columns,
    }: {
        table: Tables;
        columns: (keyof Type | '*')[];
    }): Promise<Type[]> {
        const query = `SELECT ${columns?.join(', ') ?? '*'} FROM ${table}`;
        const userData = await this.queryGetAll<Type>(query);

        return userData as Type[];
    }

    static async newUser<Type extends Omit<BaseUserData, never>>(config: NewUserType<Type, false>): Promise<void>;
    static async newUser<Type extends Omit<BaseUserData, never>>(config: NewUserType<Type, true>): Promise<Type>;
    static async newUser<Type extends Omit<BaseUserData, never>>(config: NewUserType<Type, boolean>): Promise<Type | void>;
    static async newUser<Type extends Omit<BaseUserData, never>>(config: {
        table: Tables;
        returnNew?: boolean;
        data: Partial<Type>;
    }): Promise<Type | void> {
        const values: string[] = [];
        const keys = Object.keys(config.data);

        keys.forEach(() => {
            values.push('?');
        });

        const dataArray = this.unJSONize(
            config.data as Record<
                string,
                Array<unknown> | boolean | null | number | string | undefined
            >,
        );

        await this.queryRun({
            query: `INSERT INTO ${config.table} (${keys.join(', ')}) VALUES(${values.join(', ')})`,
            data: Object.values(dataArray),
        });

        if (
            config.returnNew === false ||
            config.returnNew === undefined
        ) {
            return;
        }

        const returnQuery = `SELECT * FROM ${config.table} WHERE discordID = '${config.data.discordID}'`;

        const newUserData = await this.queryGet<Type>({
            query: returnQuery,
            allowUndefined: false,
        });

        return newUserData;
    }

    static async updateUser<Type extends Omit<BaseUserData, never>>(config: UpdateUserType<Type, false>): Promise<void>
    static async updateUser<Type extends Omit<BaseUserData, never>>(config: UpdateUserType<Type, true>): Promise<Type>
    static async updateUser<Type extends Omit<BaseUserData, never>>(config: UpdateUserType<Type, boolean>): Promise<Type | void>
    static async updateUser<Type extends Omit<BaseUserData, never>>(config: {
        discordID: string;
        table: Tables;
        returnNew?: boolean;
        data: Partial<Type>;
    }): Promise<Type | void> {
        const setQuery: string[] = [];

        for (const key in config.data) {
            //@ts-expect-error Types not added yet
            if (Object.hasOwn(config.data, key)) {
                setQuery.push(`${key} = ?`);
            }
        }

        const dataArray = this.unJSONize(
            config.data as Record<
                string,
                Array<unknown> | boolean | null | number | string | undefined
            >,
        );

        await this.queryRun({
            query: `UPDATE ${config.table} SET ${setQuery.join(
                ', ',
            )} WHERE discordID = '${config.discordID}'`,
            data: Object.values(dataArray),
        });

        if (
            config.returnNew === false ||
            config.returnNew === undefined
        ) {
            return;
        }

        const returnQuery = `SELECT * FROM ${config.table} WHERE discordID = '${config.discordID}'`;

        const newUserData = await this.queryGet<Type>({
            query: returnQuery,
            allowUndefined: false,
        });

        return newUserData;
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

                if (this.isObject(type, input[key])) {
                    input[key] = JSONized as Record<string, unknown>;
                }
            } catch {} //eslint-disable-line no-empty
        }

        return input;
    }

    /*
     * Taken from https://stackoverflow.com/a/52799327 under CC BY-SA 4.0
     * Takes an input and tests for a JSON structure (excluding primitives)
     */
    static unJSONize(
        input: Record<
            string,
            Array<unknown> | boolean | null | number | Record<string, unknown> | string | undefined>,
        ): JSONize<typeof input> {
        for (const key in input) {
            //@ts-expect-error Types not added yet
            if (Object.hasOwn(input, key)) {
                try {
                    const type = Object.prototype.toString.call(input[key] as string);

                    if (
                        type === '[object Array]' ||
                        type === '[object Boolean]' ||
                        type === '[object Object]'
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

    private static isObject(typeParam: string, value: unknown): value is Record<string, unknown> {
        return typeParam === '[object Object]';
    }
}
