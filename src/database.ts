import Database from 'better-sqlite3';
import { RawUserAPIData, RawUserData, UserAPIData, UserAPIDataUpdate, UserData, UserDataUpdate } from './@types/database';
import { SQLiteError } from './util/error/SQLiteError';
import { formattedUnix } from './util/utility';

// eslint-disable-next-line no-warning-comments
//TODO: Fix "any" after the rest is done

export class SQLiteWrapper {
  static queryGet({
    query,
    allowUndefined = false,
  }: {
    query: string,
    allowUndefined?: boolean,
  }): Promise<unknown> {
    /*
    const string = '2';
    const output = await queryGet(`SELECT tests FROM test WHERE tests = '${string}' `);
    SELECT * FROM ${table}
    */
    return new Promise<unknown>(resolve => {
      const db = new Database('../database.db');
      const data: unknown = db.prepare(query).get();
      db.close();
      if (allowUndefined === false && data === undefined) {
        throw new SQLiteError(`The query ${query} returned an undefined value`);
      }
      return resolve(data);
    });
  }

  static queryGetAll({
    query,
  }: {
    query: string,
  }): Promise<unknown> {
    /*
    const string = '2';
    const output = await queryGetAll(`SELECT tests FROM test WHERE tests = '${string}' `);
    */
    return new Promise<unknown>(resolve => {
      const db = new Database('../database.db');
      const data: unknown = db.prepare(query).all();
      db.close();
      return resolve(data);
    });
  }

  static queryRun({
    query,
    data,
  }: {
    query: string,
    data?: (string | number | null)[]
  }): Promise<void> {
    /*
    'CREATE TABLE IF NOT EXISTS servers(tests TEXT NOT NULL)'
    'UPDATE table SET offline = ? WHERE id = ?'
    'INSERT INTO servers VALUES(?,?,?)'
    'DELETE FROM users WHERE id=(?)'
    */
    return new Promise<void>(resolve => {
      const db = new Database('../database.db');
      db.prepare(query).run(data);
      db.close();
      return resolve();
    });
  }

  static async getUser({
    discordID,
    table,
    columns,
  }: {
    discordID: string,
    table: string,
    columns: string[]
  }): Promise<UserData | UserAPIData | undefined> {
    const query = `SELECT ${columns?.join(', ') ?? '*'} FROM ${table} WHERE discordID = '${discordID}'`;
    const data = await this.queryGet({ query: query, allowUndefined: false }) as RawUserData | RawUserAPIData;
    return this.databaseToJSON({ input: data });
  }

  static async getAllUsers({
    table,
    columns,
  }: {
    table: string
    columns: string[]
  }): Promise<UserData[] | UserAPIData[]> {
    const query = `SELECT ${columns?.join(', ') ?? '*'} FROM ${table}`;
    const userData = await this.queryGetAll({ query: query }) as UserData[] | UserAPIData[];
    return userData;
  }

  static async newUser({
    table,
    data,
  }: {
    table: string,
    data: UserAPIData | UserData,
  }): Promise<UserAPIData | UserData> {
    const values = [];
    for (let i = 0; i < Object.values(data).length; i += 1) values.push('?');
    const dataArray = Object.values(data) as (string | number | null)[];
    dataArray.forEach((value, index, array) => {
      if (value !== null && typeof value === 'object') array[index] = JSON.stringify(value);
    });
    await this.queryRun({ query: `INSERT INTO ${table} VALUES(${values})`, data: dataArray });
    const returnQuery = `SELECT * FROM ${table} WHERE discordID = '${data.discordID}'`;
    const newUserData = await this.queryGet({ query: returnQuery, allowUndefined: true }) as UserData | UserAPIData;
    console.log(`${formattedUnix({ date: true, utc: true })} | ${data.discordID} added to ${table}`);
    return newUserData;
  }

  static async updateUser({
    discordID,
    table,
    data,
  }: {
    discordID: string,
    table: string,
    data: UserAPIDataUpdate | UserDataUpdate,
  }): Promise<UserData | UserAPIData | undefined> {
    const setQuery: string[] = [];
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        setQuery.push(`${key} = ?`);
      }
    }
    const dataArray = Object.values(data) as (string | number | null)[];
    dataArray.forEach((value, index, array) => {
      if (value !== null && typeof value === 'object') array[index] = JSON.stringify(value);
    });
    await this.queryRun({ query: `UPDATE ${table} SET ${setQuery.join(', ')} WHERE discordID = '${discordID}'`, data: dataArray });
    const returnQuery = `SELECT * FROM ${table} WHERE discordID = '${discordID}'`;
    const newUserData = await this.queryGet({ query: returnQuery, allowUndefined: true }) as UserData | UserAPIData | undefined;
    return newUserData;
  }

  static async deleteUser({
    discordID,
    table,
  }: {
    discordID: string,
    table: string,
  }): Promise<void> {
    const query = `DELETE * FROM ${table} WHERE discordID = ?`;
    await this.queryRun({ query: query, data: [discordID] });
    console.log(`${formattedUnix({ date: true, utc: true })} | ${discordID} data deleted from ${table}`);
  }

  //Note that this only checks one level deep
  static databaseToJSON({
    input,
  }: {
    input: RawUserData | RawUserAPIData,
  }): UserData | UserAPIData {
    for (const key in input) {
      (input[key as keyof typeof input] as unknown) = this.tryJSON<typeof input, UserData | UserAPIData>(input[key as keyof typeof input]);
    }
    return input as unknown as UserData | UserAPIData;
  }

  //Taken from https://stackoverflow.com/a/52799327 under CC BY-SA 4.0
  //Takes an input and tests for a JSON structure (excluding primitives)
  static tryJSON<Input, Output>(input: string | number | null): typeof input | Output[keyof Output] {
    if (typeof input !== 'string') return input;
    try {
        const JSONized = JSON.parse(input) as Input[keyof Input];
        const type = Object.prototype.toString.call(JSONized);
        return type === '[object Object]' ||
          type === '[object Array]' ?
          JSONized as unknown as Output[keyof Output] :
          input as unknown as Output[keyof Output];
    } catch (err) {
        return input;
    }
  }
}