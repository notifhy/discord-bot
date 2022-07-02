import Database from 'better-sqlite3-multiple-ciphers';
import {
    BaseUserData,
    Table,
} from '../@types/database';
import { Constants } from './Constants';

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */

// Probably vulnerable.

let db = new Database(`${__dirname}/../../../database.db`);

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
};

type GetType<B> = {
    query: string,
    allowUndefined?: B,
};

type GetUserType<T, B> = {
    discordID: string,
    table: Table,
    allowUndefined?: B,
    columns: (keyof T)[] | ['*'],
};

type NewUserType<Type, B> = {
    table: Table,
    returnNew?: B,
    data: Partial<Type>,
};

type UpdateUserType<Type, B> = {
    discordID: string,
    table: Table,
    returnNew?: B,
    data: Partial<Type>,
};

export class SQLite {
    public static open() {
        db = new Database(`${__dirname}/../../../database.db`);
    }

    // Calling this even after the database is closed doesn't break anything
    public static close() {
        db.close();
    }

    public static rekey() {
        db.pragma(`rekey='${process.env.DATABASE_KEY}'`);
    }

    public static key() {
        db.pragma(`key='${process.env.DATABASE_KEY}'`);
    }

    public static removeKey() {
        db.pragma('rekey=\'\'');
    }

    public static createTransaction(transaction: () => void) {
        const execute = db.transaction(() => {
            transaction();
        });

        execute();
    }

    public static createTablesIfNotExists(): void {
        this.createTransaction(() => {
            Object.values(Constants.tables.create)
                .map((value) => db.prepare(value))
                .forEach((table) => table.run());

            const config = db
                .prepare('SELECT * FROM config')
                .get();

            if (typeof config === 'undefined') {
                db.prepare('INSERT INTO config DEFAULT VALUES').run();
            }
        });
    }

    public static queryGet<Type>(config: GetType<false>): Type;
    public static queryGet<Type>(config: GetType<true>): Type | undefined;
    public static queryGet<Type>(config: GetType<boolean>): Type | undefined;
    public static queryGet<Type>(config: {
        query: string,
        allowUndefined?: boolean,
    }): Type | undefined {
        /*
         * const string = '2';
         * const output = queryGet(`SELECT tests FROM test WHERE tests = '${string}' `);
         */

        const rawData = db
            .prepare(config.query)
            .get() as Record<string, unknown>;

        if (
            (
                config.allowUndefined === false
                || typeof config.allowUndefined === 'undefined'
            )
            && typeof rawData === 'undefined'
        ) {
            throw new RangeError(
                `The query ${config.query} returned an undefined value`,
            );
        }

        return this.jsonize(rawData) as Type | undefined;
    }

    public static queryGetAll<Type>(query: string): Type[] {
        /*
         * const string = '2';
         * const output = queryGetAll(`SELECT tests FROM test WHERE tests = '${string}' `);
         */

        const rawData = db
            .prepare(query)
            .all() as Record<string, unknown>[];

        return rawData.map((rawData1) => this.jsonize(rawData1)) as Type[];
    }

    public static queryRun({
        query,
        data,
    }: {
        query: string,
        data?: (string | number | null)[],
    }): void {
        /*
         * 'CREATE TABLE IF NOT EXISTS servers(tests TEXT NOT NULL)'
         * 'UPDATE table SET offline = ? WHERE id = ?'
         * 'INSERT INTO servers VALUES(?,?,?)'
         * 'DELETE FROM users WHERE id=(?)'
         */

        db.prepare(query).run(data);
    }

    public static getUser<Type>(config:
    GetUserType<Type, false>): Type;
    public static getUser<Type>(config:
    GetUserType<Type, true>): Type | undefined;
    public static getUser<Type>(config:
    GetUserType<Type, boolean>): Type | undefined;
    public static getUser<Type>(config: {
        discordID: string,
        table: Table,
        allowUndefined?: boolean,
        columns: (keyof Type)[] | ['*'];
    }): Type | undefined {
        const query = `SELECT ${config.columns.join(', ')
        } FROM ${config.table} WHERE discordID = '${config.discordID}'`;

        return this.queryGet<Type>({
            query: query,
            allowUndefined: config.allowUndefined ?? false,
        });
    }

    public static getAllUsers<Type>({
        table,
        columns,
    }: {
        table: Table,
        columns: (keyof Type)[] | ['*'],
    }): Type[] {
        const query = `SELECT ${columns.join(', ')} FROM ${table}`;
        return this.queryGetAll<Type>(query) as Type[];
    }

    public static newUser<Type extends Omit<BaseUserData, never>>(config:
    NewUserType<Type, false>): undefined;
    public static newUser<Type extends Omit<BaseUserData, never>>(config:
    NewUserType<Type, true>): Type;
    public static newUser<Type extends Omit<BaseUserData, never>>(config:
    NewUserType<Type, boolean>): Type | undefined;
    public static newUser<Type extends Omit<BaseUserData, never>>(config: {
        table: Table,
        returnNew?: boolean,
        data: Partial<Type>,
    }): Type | undefined {
        const values: string[] = [];
        const keys = Object.keys(config.data);

        keys.forEach(() => {
            values.push('?');
        });

        const dataArray = this.unjsonize(
            config.data as Record<
            string,
            Array<unknown> | boolean | null | number | string | undefined
            >,
        );

        this.queryRun({
            query: `INSERT INTO ${config.table} (${keys.join(
                ', ',
            )}) VALUES(${values.join(', ')})`,
            data: Object.values(dataArray),
        });

        if (
            config.returnNew === false
            || typeof config.returnNew === 'undefined'
        ) {
            return;
        }

        const returnQuery = `SELECT * FROM ${config.table} 
        WHERE discordID = '${config.data.discordID}'`;

        return this.queryGet<Type>({
            query: returnQuery,
            allowUndefined: false,
        });
    }

    static updateUser<Type extends Omit<BaseUserData, never>>(config:
    UpdateUserType<Type, false>): undefined;
    static updateUser<Type extends Omit<BaseUserData, never>>(config:
    UpdateUserType<Type, true>): Type;
    static updateUser<Type extends Omit<BaseUserData, never>>(config:
    UpdateUserType<Type, boolean>): Type | undefined;
    static updateUser<Type extends Omit<BaseUserData, never>>(config: {
        discordID: string,
        table: Table,
        returnNew?: boolean,
        data: Partial<Type>,
    }): Type | undefined {
        const setQuery: string[] = [];

        // eslint-disable-next-line no-restricted-syntax
        for (const key in config.data) {
            if (Object.hasOwn(config.data, key)) {
                setQuery.push(`${key} = ?`);
            }
        }

        const dataArray = this.unjsonize(
            config.data as Record<
            string,
            Array<unknown> | boolean | null | number | string | undefined
            >,
        );

        this.queryRun({
            query: `UPDATE ${config.table} SET ${setQuery.join(
                ', ',
            )} WHERE discordID = '${config.discordID}'`,
            data: Object.values(dataArray),
        });

        if (
            config.returnNew === false
            || typeof config.returnNew === 'undefined'
        ) {
            return;
        }

        const returnQuery = `SELECT * FROM ${config.table} 
        WHERE discordID = '${config.discordID}'`;

        return this.queryGet<Type>({
            query: returnQuery,
            allowUndefined: false,
        });
    }

    static deleteUser({
        discordID,
        allowUndefined,
        table,
    }: {
        discordID: string,
        allowUndefined: boolean,
        table: Table,
    }): void {
        if (allowUndefined === true) {
            const user = this.getUser({
                discordID: discordID,
                table: table,
                allowUndefined: true,
                columns: ['discordID'],
            });

            if (user) {
                this.queryRun({
                    query: `DELETE FROM ${table} WHERE discordID = ?`,
                    data: [discordID],
                });
            }

            return;
        }

        this.queryRun({
            query: `DELETE FROM ${table} WHERE discordID = ?`,
            data: [discordID],
        });
    }

    /*
     * Taken from https://stackoverflow.com/a/52799327 under CC BY-SA 4.0
     * Takes an input and tests for a JSON structure (excluding primitives)
     *
     * Also, if a string is valid JSON, it is probably possible for the whole bot to crash.
     */
    static jsonize(input: Record<string, unknown>) {
        // eslint-disable-next-line no-restricted-syntax
        for (const key in input) {
            if (typeof input[key] !== 'string') {
                // eslint-disable-next-line no-continue
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
            } catch { } // eslint-disable-line no-empty
        }

        return input;
    }

    /*
     * Taken from https://stackoverflow.com/a/52799327 under CC BY-SA 4.0
     * Takes an input and tests for a JSON structure (excluding primitives)
     */
    static unjsonize(
        input: Record<
        string,
        Array<unknown>
        | boolean
        | null
        | number
        | Record<string, unknown>
        | string
        | undefined>,
    ): JSONize<typeof input> {
        // eslint-disable-next-line no-restricted-syntax
        for (const key in input) {
            if (Object.hasOwn(input, key)) {
                try {
                    const type = Object.prototype.toString.call(input[key] as string);

                    if (
                        type === '[object Array]'
                        || type === '[object Boolean]'
                        || type === '[object Object]'
                    ) {
                        (input[key]) = JSON.stringify(
                            input[key],
                        );
                    }
                } catch { } // eslint-disable-line no-empty
            }
        }

        return input as JSONize<typeof input>;
    }

    private static isArray(
        typeParam: string,
        value: unknown,
    ): value is Array<unknown> {
        return typeParam === '[object Array]';
    }

    private static isBoolean(
        typeParam: string,
        value: unknown,
    ): value is boolean {
        return typeParam === '[object Boolean]';
    }

    private static isObject(
        typeParam: string,
        value: unknown,
    ): value is Record<string, unknown> {
        return typeParam === '[object Object]';
    }
}