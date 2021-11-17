import { BaseUserData } from './@types/database';
import { formattedUnix } from './util/utility';
import { SQLiteError } from './util/error/SQLiteError';
import Database from 'better-sqlite3';

// eslint-disable-next-line no-warning-comments
//TODO: Fix "any" after the rest is done

type Table =
   | 'users'
   | 'api'
   | 'friends'
   | 'rewards'

export class SQLiteWrapper {
  static queryGet<Output>({
    query,
    allowUndefined = false,
  }: {
    query: string,
    allowUndefined?: boolean,
  }): Promise<Output> {
    /*
    const string = '2';
    const output = await queryGet(`SELECT tests FROM test WHERE tests = '${string}' `);
    SELECT * FROM ${table}
    */
    return new Promise<Output>(resolve => {
      const db = new Database('../database.db');
      const data: Output = db.prepare(query).get() as Output;
      db.close();
      if (allowUndefined === false && data === undefined) {
        throw new SQLiteError(`The query ${query} returned an undefined value`);
      }
      return resolve(data as Output);
    });
  }

  static queryGetAll<Output>({
    query,
  }: {
    query: string,
  }): Promise<Output[]> {
    /*
    const string = '2';
    const output = await queryGetAll(`SELECT tests FROM test WHERE tests = '${string}' `);
    */
    return new Promise<Output[]>(resolve => {
      const db = new Database('../database.db');
      const data: Output[] = db.prepare(query).all() as Output[];
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
    columns,
  }: {
    discordID: string,
    table: Table,
    allowUndefined: boolean,
    columns: string[],
  }): Promise<RawData | CleanData | undefined> {
    const query = `SELECT ${columns?.join(', ') ?? '*'} FROM ${table} WHERE discordID = '${discordID}'`;
    const data = await this.queryGet<RawData | undefined>({ query: query, allowUndefined: allowUndefined });
    if (data === undefined) return undefined;

    return this.JSONize<RawData, CleanData>({ input: data });
  }

  static async getAllUsers<RawData, CleanData>({
    table,
    columns,
  }: {
    table: Table
    columns: string[]
  }): Promise<CleanData[]> {
    const query = `SELECT ${columns?.join(', ') ?? '*'} FROM ${table}`;
    const userData = await this.queryGetAll<RawData | undefined>({ query: query });
    userData.map(data => this.JSONize<RawData | undefined, CleanData>({ input: data }));
    return userData as unknown as CleanData[];
  }

  static async newUser<Input extends BaseUserData, RawData, CleanData = void>({
    table,
    returnNew = false,
    data,
  }: {
    table: Table,
    returnNew?: boolean,
    data: Input,
  }): Promise<void | RawData | CleanData> {
    const values = [];
    for (let i = 0; i < Object.values(data).length; i += 1) values.push('?');
    const dataArray = this.unJSONize<Input, RawData>({ input: data });
    await this.queryRun({ query: `INSERT INTO ${table} VALUES(${values})`, data: Object.values(dataArray) });
    if (returnNew === false) return;

    const returnQuery = `SELECT * FROM ${table} WHERE discordID = '${data.discordID}'`;
    const newUserData = await this.queryGet<RawData>({ query: returnQuery, allowUndefined: false });
    console.log(`${formattedUnix({ date: true, utc: true })} | ${data.discordID} added to ${table}`);
    return this.JSONize<RawData, CleanData>({ input: newUserData }); //eslint-disable-line consistent-return
  }

  static async updateUser<Input, RawData, CleanData = void>({
    discordID,
    table,
    returnNew,
    data,
  }: {
    discordID: string,
    table: Table,
    returnNew?: boolean,
    data: Input,
  }): Promise<void | RawData | CleanData | undefined> {
    const setQuery: string[] = [];
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        setQuery.push(`${key} = ?`);
      }
    }

    const dataArray = this.unJSONize<Input, RawData>({ input: data });
    await this.queryRun({ query: `UPDATE ${table} SET ${setQuery.join(', ')} WHERE discordID = '${discordID}'`, data: Object.values(dataArray) });
    if (returnNew === false) return;

    const returnQuery = `SELECT * FROM ${table} WHERE discordID = '${discordID}'`;
    const newUserData = await this.queryGet<RawData>({ query: returnQuery, allowUndefined: false });
    return this.JSONize<RawData, CleanData>({ input: newUserData }); //eslint-disable-line consistent-return
  }

  static async deleteUser({
    discordID,
    table,
  }: {
    discordID: string,
    table: Table,
  }): Promise<void> {
    const query = `DELETE FROM ${table} WHERE discordID = ?`;
    await this.queryRun({ query: query, data: [discordID] });
    //console.log(`${formattedUnix({ date: true, utc: true })} | ${discordID} data deleted from ${table}`);
  }

  //Taken from https://stackoverflow.com/a/52799327 under CC BY-SA 4.0
  //Takes an input and tests for a JSON structure (excluding primitives)
  static JSONize<RawInput, Output>({
    input,
  }: {
    input: RawInput,
  }): Output {
    for (const key in input) {
      if (typeof input[key] !== 'string') continue;
      try {
        const JSONized = JSON.parse(String(input[key])) as Output[keyof Output];
        const type = Object.prototype.toString.call(JSONized);
        if (type === '[object Object]' ||
          type === '[object Array]' ||
          type === '[object Boolean]') {
          (input[key as keyof RawInput] as unknown) = JSONized;
        }
      } catch {}
    }

    return input as unknown as Output;
  }

  //Taken from https://stackoverflow.com/a/52799327 under CC BY-SA 4.0
  //Takes an input and tests for a JSON structure (excluding primitives)
  static unJSONize<Input, RawOutput>({
    input,
  }: {
    input: Input,
  }): RawOutput {
    for (const key in input) {
      try {
        const type = Object.prototype.toString.call(input[key]);
      if (type === '[object Object]' ||
        type === '[object Array]' ||
        type === '[object Boolean]') {
          (input[key as keyof Input] as unknown) = JSON.stringify(input[key]);
        }
      } catch {}
    }

    return input as unknown as RawOutput;
  }
}