import Database from 'better-sqlite3';
import { UserAPIData, UserData, ValidAPIUserUpdate, ValidUserUpdate } from './@types/database';
import { SQLiteError } from './util/error/SQLiteError';

// eslint-disable-next-line no-warning-comments
//TODO: Fix "any" after the rest is done

export class SQLiteWrapper {
  queryGet({
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

  queryGetAll({
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

  queryRun({
    query,
  }: {
    query: string,
  }): Promise<void> {
    /*
    'CREATE TABLE IF NOT EXISTS servers(tests TEXT NOT NULL)'
    'UPDATE table SET offline = ? WHERE id = ?'
    'INSERT INTO servers VALUES(?,?,?)'
    'DELETE FROM users WHERE id=(?)'
    */
    return new Promise<void>(resolve => {
      const db = new Database('../database.db');
      db.prepare(query).run();
      db.close();
      return resolve();
    });
  }

  async getUser({
    discordID,
    table,
  }: {
    discordID: string,
    table: string,
  }): Promise<UserData | UserAPIData | undefined> {
    const query = `SELECT * FROM ${table} WHERE discordID = '${discordID}'`;
    const userData = await this.queryGet({ query: query, allowUndefined: true }) as UserData | UserAPIData | undefined;
    return userData;
  }

  async getAllUsers({
    table,
  }: {
    table: string
  }): Promise<UserData[] | UserAPIData[]> {
    const query = `SELECT * FROM ${table}`;
    const userData = await this.queryGetAll({ query: query }) as UserData[] | UserAPIData[];
    return userData;
  }

  async updateUser({
    discordID,
    table,
    data,
  }: {
    discordID: string,
    table: string,
    data: ValidAPIUserUpdate | ValidUserUpdate,
  }): Promise<UserData | UserAPIData | undefined> {
    const setQuery: string[] = [];
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        setQuery.push(`${key} = '${data[key as keyof (ValidAPIUserUpdate | ValidUserUpdate)]}'`);
      }
    }
    await this.queryRun({ query: `UPDATE ${table} SET ${setQuery.join(', ')} WHERE discordID = '${discordID}'` });
    const returnQuery = `SELECT * FROM ${table} WHERE discordID = '${discordID}'`;
    const newUserData = await this.queryGet({ query: returnQuery, allowUndefined: true }) as UserData | UserAPIData | undefined;
    return newUserData;
  }

  async deleteUser({
    discordID,
    table,
  }: {
    discordID: string,
    table: string,
  }): Promise<void> {
    const query = `DELETE * FROM ${table} WHERE discordID = '${discordID}'`;
    await this.queryRun({ query: query });
  }
}