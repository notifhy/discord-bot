import { BaseUserData, RawConfig, Tables } from './@types/database';
import { formattedUnix } from './util/utility';
import Database from 'better-sqlite3';

// eslint-disable-next-line no-warning-comments
//TODO: Fix "any" after the rest is done

export class SQLiteWrapper {
  static createTablesIfNotExists(): Promise<void> {
    return new Promise<void>(resolve => {
      const db = new Database(`${__dirname}/../database.db`);
      const tables = [
        'CREATE TABLE IF NOT EXISTS "api" ("discordID" TEXT NOT NULL UNIQUE, "uuid" TEXT NOT NULL UNIQUE, "modules" TEXT NOT NULL, "lastUpdated" INTEGER NOT NULL, "firstLogin" INTEGER, "lastLogin" INTEGER, "lastLogout" INTEGER, "version" TEXT, "language" TEXT NOT NULL, "gameType" TEXT, "lastClaimedReward" INTEGER, "rewardScore" INTEGER, "rewardHighScore" INTEGER, "totalDailyRewards" INTEGER, "totalRewards" INTEGER, "history" TEXT NOT NULL)',
        'CREATE TABLE IF NOT EXISTS "config" ("blockedGuilds" TEXT NOT NULL, "blockedUsers" TEXT NOT NULL, "devMode" TEXT NOT NULL, "enabled" TEXT NOT NULL, "uses" INTEGER NOT NULL)',
        'CREATE TABLE IF NOT EXISTS "friends" ("discordID" TEXT NOT NULL UNIQUE, "channel" TEXT, "suppressNext" TEXT NOT NULL)',
        'CREATE TABLE IF NOT EXISTS "rewards" ("discordID" TEXT NOT NULL UNIQUE, "alertTime" INTEGER, "lastNotified" INTEGER, "milestones" TEXT, "notificationInterval" INTEGER)',
        'CREATE TABLE IF NOT EXISTS "users" ("discordID" TEXT NOT NULL UNIQUE, "language" TEXT)',
      ].map(value => db.prepare(value));

      const config = db.prepare('SELECT * FROM config WHERE rowid = 1').get() as RawConfig | undefined;

      db.transaction(() => {
        for (const table of tables) table.run();
        if (config === undefined) {
          db.prepare('INSERT INTO config DEFAULT VALUES').run();
        }
      });

      db.close();
      resolve();
    });
  }

  static queryGet<RawOutput, CleanOutput>({
    query,
    allowUndefined = false,
  }: {
    query: string,
    allowUndefined?: boolean,
  }): Promise<CleanOutput> {
    /*
     *const string = '2';
     *const output = await queryGet(`SELECT tests FROM test WHERE tests = '${string}' `);
     *SELECT * FROM ${table}
    */

    return new Promise<CleanOutput>(resolve => {
      const db = new Database(`${__dirname}/../database.db`);
      const rawData: RawOutput = db.prepare(query).get() as RawOutput;
      db.close();
      if (allowUndefined === false && rawData === undefined) {
        throw new RangeError(`The query ${query} returned an undefined value`);
      }

      const data = this.JSONize<RawOutput, CleanOutput>({
        input: rawData,
      });

      resolve(data as CleanOutput);
    });
  }

  static queryGetAll<RawOutput, CleanOutput>({
    query,
  }: {
    query: string,
  }): Promise<CleanOutput[]> {
    /*
     *const string = '2';
     *const output = await queryGetAll(`SELECT tests FROM test WHERE tests = '${string}' `);
     */
    return new Promise<CleanOutput[]>(resolve => {
      const db = new Database(`${__dirname}/../database.db`);
      const rawData: RawOutput[] = db.prepare(query).all() as RawOutput[];
      db.close();

      const data = rawData.map(rawData1 =>
        this.JSONize<RawOutput, CleanOutput>({
          input: rawData1,
        }),
      );

      resolve(data);
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
     *'CREATE TABLE IF NOT EXISTS servers(tests TEXT NOT NULL)'
     *'UPDATE table SET offline = ? WHERE id = ?'
     *'INSERT INTO servers VALUES(?,?,?)'
     *'DELETE FROM users WHERE id=(?)'
     */
    return new Promise<void>(resolve => {
      const db = new Database(`${__dirname}/../database.db`);
      db.prepare(query).run(data);
      db.close();
      resolve();
    });
  }

  static async getUser<RawData, CleanData>({
    discordID,
    table,
    allowUndefined,
    columns,
  }: {
    discordID: string,
    table: Tables,
    allowUndefined: boolean,
    columns: string[],
  }): Promise<RawData | CleanData | undefined> {
    const query = `SELECT ${columns?.join(', ') ?? '*'} FROM ${table} WHERE discordID = '${discordID}'`;
    const data = await this.queryGet<RawData, CleanData>({
      query: query,
      allowUndefined: allowUndefined,
    });

    if (data === undefined) {
      return undefined;
    }

    return data;
  }

  static async getAllUsers<RawData, CleanData>({
    table,
    columns,
  }: {
    table: Tables
    columns: string[]
  }): Promise<CleanData[]> {
    const query = `SELECT ${columns?.join(', ') ?? '*'} FROM ${table}`;
    const userData = await this.queryGetAll<RawData, CleanData>({
      query: query,
    });

    return userData as CleanData[];
  }

  static async newUser<Input extends BaseUserData, RawData, CleanData = void>({
    table,
    returnNew = false,
    data,
  }: {
    table: Tables,
    returnNew?: boolean,
    data: Input,
  }): Promise<void | RawData | CleanData> {
    const values = [];
    for (let i = 0; i < Object.values(data).length; i += 1) values.push('?');
    const dataArray = this.unJSONize<Input, RawData>({
      input: data,
    });

    await this.queryRun({
      query: `INSERT INTO ${table} VALUES(${values})`,
      data: Object.values(dataArray),
    });

    if (returnNew === false) {
      return;
    }

    const returnQuery = `SELECT * FROM ${table} WHERE discordID = '${data.discordID}'`;
    const newUserData = await this.queryGet<RawData, CleanData>({
      query: returnQuery,
      allowUndefined: false,
    });

    console.log(`${formattedUnix({ date: true, utc: true })} | ${data.discordID} added to ${table}`);
    return newUserData; //eslint-disable-line consistent-return
  }

  static async updateUser<Input, RawData, CleanData = void>({
    discordID,
    table,
    returnNew,
    data,
  }: {
    discordID: string,
    table: Tables,
    returnNew?: boolean,
    data: Input,
  }): Promise<void | RawData | CleanData | undefined> {
    const setQuery: string[] = [];
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        setQuery.push(`${key} = ?`);
      }
    }

    const dataArray = this.unJSONize<Input, RawData>({
      input: data,
    });

    await this.queryRun({
      query: `UPDATE ${table} SET ${setQuery.join(', ')} WHERE discordID = '${discordID}'`,
      data: Object.values(dataArray),
    });

    if (returnNew === false) {
      return;
    }

    const returnQuery = `SELECT * FROM ${table} WHERE discordID = '${discordID}'`;
    const newUserData = await this.queryGet<RawData, CleanData>({
      query: returnQuery,
      allowUndefined: false,
    });

    return newUserData; //eslint-disable-line consistent-return
  }

  static async deleteUser({
    discordID,
    table,
  }: {
    discordID: string,
    table: Tables,
  }): Promise<void> {
    const query = `DELETE FROM ${table} WHERE discordID = ?`;
    await this.queryRun({
      query: query,
      data: [discordID],
    });
    //console.log(`${formattedUnix({ date: true, utc: true })} | ${discordID} data deleted from ${table}`);
  }

  /*
   * Taken from https://stackoverflow.com/a/52799327 under CC BY-SA 4.0
   * Takes an input and tests for a JSON structure (excluding primitives)
   */
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

        if (
          type === '[object Object]' ||
          type === '[object Array]' ||
          type === '[object Boolean]'
        ) {
          (input[key as keyof RawInput] as unknown) = JSONized;
        }
      } catch {} //eslint-disable-line no-empty
    }

    return input as unknown as Output;
  }

  /*
   * Taken from https://stackoverflow.com/a/52799327 under CC BY-SA 4.0
   * Takes an input and tests for a JSON structure (excluding primitives)
   */
  static unJSONize<Input, RawOutput>({
    input,
  }: {
    input: Input,
  }): RawOutput {
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        try {
          const type = Object.prototype.toString.call(input[key]);

          if (
            type === '[object Object]' ||
            type === '[object Array]' ||
            type === '[object Boolean]'
          ) {
            (input[key as keyof Input] as unknown) = JSON.stringify(input[key]);
          }
        } catch {} //eslint-disable-line no-empty
      }
    }

    return input as unknown as RawOutput;
  }
}