import Database from 'better-sqlite3';
import { BaseUserData, RawUserAPIData, RawUserData, UserAPIData, UserAPIDataUpdate, UserData, UserDataUpdate } from './@types/database';
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

  static async getUser<RawData, CleanData>({
    discordID,
    table,
    allowUndefined,
    autoJSON = true,
    columns,
  }: {
    discordID: string,
    table: string,
    allowUndefined: boolean,
    autoJSON?: boolean,
    columns: string[],
  }): Promise<RawData | CleanData | undefined> {
    const query = `SELECT ${columns?.join(', ') ?? '*'} FROM ${table} WHERE discordID = '${discordID}'`;
    const data = await this.queryGet({ query: query, allowUndefined: allowUndefined }) as RawData | undefined;
    if (data === undefined) return undefined;
    return autoJSON === true ? this.databaseToJSON({ input: data }) as CleanData : data as unknown as RawData;
  }

  static async getAllUsers<RawData, CleanData>({
    table,
    columns,
    autoJSON = true,
  }: {
    table: string
    columns: string[]
    autoJSON?: boolean,
  }): Promise<RawData[] | CleanData[]> {
    const query = `SELECT ${columns?.join(', ') ?? '*'} FROM ${table}`;
    const userData = await this.queryGetAll({ query: query }) as RawData[];
    if (autoJSON === true) userData.map(data => this.databaseToJSON({ input: data }));
    return userData as unknown as CleanData[];
  }

  static async newUser<Input extends BaseUserData, RawData = void, CleanData = void>({
    table,
    autoJSON = true,
    returnNew = false,
    data,
  }: {
    table: string,
    autoJSON?: boolean,
    returnNew?: boolean,
    data: Input,
  }): Promise<void | RawData | CleanData> {
    const values = [];
    for (let i = 0; i < Object.values(data).length; i += 1) values.push('?');
    const dataArray = Object.values(data).map(value => value !== null && typeof value === 'object' ? JSON.stringify(value) : value);
    await this.queryRun({ query: `INSERT INTO ${table} VALUES(${values})`, data: dataArray });
    if (returnNew === false) return;
    const returnQuery = `SELECT * FROM ${table} WHERE discordID = '${data.discordID}'`;
    const newUserData = await this.queryGet({ query: returnQuery, allowUndefined: false }) as RawData;
    console.log(`${formattedUnix({ date: true, utc: true })} | ${data.discordID} added to ${table}`);
    return autoJSON === true ? this.databaseToJSON({ input: newUserData }) as CleanData : newUserData as RawData; //eslint-disable-line consistent-return
  }

  static async updateUser<Input, RawData = void, CleanData = void>({
    discordID,
    table,
    autoJSON,
    returnNew,
    data,
  }: {
    discordID: string,
    table: string,
    autoJSON?: boolean,
    returnNew?: boolean,
    data: Input,
  }): Promise<void | RawData | CleanData | undefined> {
    const setQuery: string[] = [];
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        setQuery.push(`${key} = ?`);
      }
    }
    const dataArray = Object.values(data).map(value => value !== null && typeof value === 'object' ? JSON.stringify(value) : value);
    await this.queryRun({ query: `UPDATE ${table} SET ${setQuery.join(', ')} WHERE discordID = '${discordID}'`, data: dataArray });
    if (returnNew === false) return;
    const returnQuery = `SELECT * FROM ${table} WHERE discordID = '${discordID}'`;
    const newUserData = await this.queryGet({ query: returnQuery, allowUndefined: false }) as RawData;
    return autoJSON === true ? this.databaseToJSON({ input: newUserData }) as CleanData : newUserData as RawData; //eslint-disable-line consistent-return
  }

  static async deleteUser({
    discordID,
    table,
  }: {
    discordID: string,
    table: string,
  }): Promise<void> {
    const query = `DELETE FROM ${table} WHERE discordID = ?`;
    await this.queryRun({ query: query, data: [discordID] });
    //console.log(`${formattedUnix({ date: true, utc: true })} | ${discordID} data deleted from ${table}`);
  }

  //Note that this only checks one level deep
  static databaseToJSON<rawInput, output>({
    input,
  }: {
    input: rawInput,
  }): output {
    for (const key in input) {
      (input[key as keyof rawInput] as unknown) = this.tryJSON<rawInput, output>(input[key as keyof rawInput]);
    }
    return input as unknown as output;
  }

  //Taken from https://stackoverflow.com/a/52799327 under CC BY-SA 4.0
  //Takes an input and tests for a JSON structure (excluding primitives)
  static tryJSON<Input, Output>(input: Input[keyof Input]): typeof input | Output[keyof Output] {
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