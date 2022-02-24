import {
    BaseUserData,
    Table,
} from '../@types/database';
import { Constants } from './Constants';
import { databaseKey } from '../../../config.json';
import Database from 'better-sqlite3-multiple-ciphers';

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */

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
}

type GetType<B> = {
    query: string,
    allowUndefined?: B,
}

type GetUserType<T, B> = {
    discordID: string,
    table: Table,
    allowUndefined?: B,
    columns: (keyof T | '*')[],
}

type NewUserType<Type, B> = {
    table: Table,
    returnNew?: B,
    data: Partial<Type>,
}

type UpdateUserType<Type, B> = {
    discordID: string,
    table: Table,
    returnNew?: B,
    data: Partial<Type>,
}

export class SQLite {
    static open() {
        db = new Database(`${__dirname}/../../../database.db`);
    }

    //Calling this even after the database is closed doesn't break anything
    static close() {
        db.close();
    }

    static rekey() {
        db.pragma(`rekey='${databaseKey}'`);
    }

    static key() {
        db.pragma(`key='${databaseKey}'`);
    }

    static removeKey() {
        db.pragma(`rekey=''`);
    }

    static createTransaction(transaction: () => void) {
        const execute = db.transaction(() => {
            transaction();
        });

        execute();
    }

    static createTablesIfNotExists(): void {
        this.createTransaction(() => {
            Object.values(Constants.tables.create)
                .map(value => db.prepare(value))
                .forEach(table => table.run());

            const config = db
                .prepare('SELECT * FROM config')
                .get();

            if (typeof config === 'undefined') {
                db.prepare('INSERT INTO config DEFAULT VALUES').run();
            }
        });
    }

    static queryGet<Type>(config: GetType<false>): Type
    static queryGet<Type>(config: GetType<true>): Type | undefined
    static queryGet<Type>(config: GetType<boolean>): Type | undefined
    static queryGet<Type>(config: {
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
                config.allowUndefined === false ||
                typeof config.allowUndefined === 'undefined'
            ) &&
            typeof rawData === 'undefined'
        ) {
            throw new RangeError(
                `The query ${config.query} returned an undefined value`,
            );
        }

        return this.JSONize(rawData) as Type | undefined;
    }

    static queryGetAll<Type>(query: string): Type[] {
        /*
         * const string = '2';
         * const output = queryGetAll(`SELECT tests FROM test WHERE tests = '${string}' `);
         */

        const rawData = db
            .prepare(query)
            .all() as Record<string, unknown>[];

        return rawData.map(rawData1 =>
            this.JSONize(rawData1),
        ) as Type[];
    }

    static queryRun({
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

    static getUser<Type>(config:
        GetUserType<Type, false>): Type
    static getUser<Type>(config:
        GetUserType<Type, true>): Type | undefined
    static getUser<Type>(config:
        GetUserType<Type, boolean>): Type | undefined
    static getUser<Type>(config: {
        discordID: string,
        table: Table,
        allowUndefined?: boolean,
        columns: (keyof Type | '*')[];
    }): Type | undefined {
        const query = `SELECT ${config.columns.join(', ')
        } FROM ${config.table} WHERE discordID = '${config.discordID}'`;

        return this.queryGet<Type>({
            query: query,
            allowUndefined: config.allowUndefined ?? false,
        });
    }

    static getAllUsers<Type>({
        table,
        columns,
    }: {
        table: Table,
        columns: (keyof Type | '*')[],
    }): Type[] {
        const query = `SELECT ${columns.join(', ')} FROM ${table}`;
        return this.queryGetAll<Type>(query) as Type[];
    }

    static newUser<Type extends Omit<BaseUserData, never>>(config:
        NewUserType<Type, false>): undefined;
    static newUser<Type extends Omit<BaseUserData, never>>(config:
        NewUserType<Type, true>): Type;
    static newUser<Type extends Omit<BaseUserData, never>>(config:
        NewUserType<Type, boolean>): Type | undefined;
    static newUser<Type extends Omit<BaseUserData, never>>(config: {
        table: Table,
        returnNew?: boolean,
        data: Partial<Type>,
    }): Type | undefined {
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

        this.queryRun({
            query: `INSERT INTO ${config.table} (${keys.join(
                ', ',
            )}) VALUES(${values.join(', ')})`,
            data: Object.values(dataArray),
        });

        if (
            config.returnNew === false ||
            typeof config.returnNew === 'undefined'
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
        UpdateUserType<Type, false>): undefined
    static updateUser<Type extends Omit<BaseUserData, never>>(config:
        UpdateUserType<Type, true>): Type
    static updateUser<Type extends Omit<BaseUserData, never>>(config:
        UpdateUserType<Type, boolean>): Type | undefined
    static updateUser<Type extends Omit<BaseUserData, never>>(config: {
        discordID: string,
        table: Table,
        returnNew?: boolean,
        data: Partial<Type>,
    }): Type | undefined {
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

        this.queryRun({
            query: `UPDATE ${config.table} SET ${setQuery.join(
                ', ',
            )} WHERE discordID = '${config.discordID}'`,
            data: Object.values(dataArray),
        });

        if (
            config.returnNew === false ||
            typeof config.returnNew === 'undefined'
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
        table,
    }: {
        discordID: string,
        table: Table,
    }): void {
        this.queryRun({
            query: `DELETE FROM ${table} WHERE discordID = ?`,
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
            } catch { } //eslint-disable-line no-empty
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
            Array<unknown>
            | boolean
            | null
            | number
            | Record<string, unknown>
            | string
            | undefined>,
    ): JSONize<typeof input> {
        for (const key in input) {
            //@ts-expect-error Types not added yet
            if (Object.hasOwn(input, key)) {
                try {
                    const type =
                        Object.prototype.toString.call(input[key] as string);

                    if (
                        type === '[object Array]' ||
                        type === '[object Boolean]' ||
                        type === '[object Object]'
                    ) {
                        (input[key]) = JSON.stringify(
                            input[key],
                        );
                    }
                } catch { } //eslint-disable-line no-empty
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