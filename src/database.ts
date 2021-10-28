import Database from 'better-sqlite3';

// eslint-disable-next-line no-warning-comments
//TODO: Fix "any" after the rest is done

/*
  const string = '2';
  const output = await queryGet(`SELECT tests FROM test WHERE tests = '${string}' `);
*/

export function queryGet(query: string): Promise<unknown> {
  return new Promise<unknown>(resolve => {
    const db = new Database('../database.db');
    //'SELECT count(1) FROM users

    try {
      const preparedQuery = db.prepare(query);
      const data: unknown = preparedQuery.get();
      db.close();
      if (data === undefined) throw SQLiteError('Row is undefined');
      return resolve(data);
    } catch (err) {
      if (!(err instanceof Error)) throw err;
      err.name = 'SQLiteError';
      throw err;
    }
  });
}

/*
  const string = '2';
  const output = await queryGetAll(`SELECT tests FROM test WHERE tests = '${string}' `);
*/

export function queryGetAll(query: string): Promise<unknown> {
  return new Promise<unknown>(resolve => {
    const db = new Database('../database.db');
    //SELECT * FROM ${table}

    try {
      const preparedQuery = db.prepare(query);
      const data: unknown = preparedQuery.all();
      db.close();
      return resolve(data);
    } catch (err) {
      if (!(err instanceof Error)) throw err;
      err.name = 'SQLiteError';
      throw err;
    }
  });
}

/*
  const tablename = 'barry';
  const columns = 'bay INTEGER, PLOY NOT NULL';
  await queryRun(`CREATE TABLE IF NOT EXISTS ${tablename}(${collumms})`);
*/

export function queryRun(query: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const db = new Database('../database.db');
    //'CREATE TABLE IF NOT EXISTS servers(tests TEXT NOT NULL)'
    //'UPDATE table SET offline = ? WHERE id = ?'
    //'INSERT INTO servers VALUES(?,?,?)'
    //'DELETE FROM users WHERE id=(?)'

    try {
      const preparedQuery = db.prepare(query);
      preparedQuery.run();
      db.close();
      return resolve();
    } catch (err) {
      if (!(err instanceof Error)) return reject(err);
      err.name = 'SQLiteError';
      return reject(err);
    }
  });
}

function SQLiteError(message?: string) {
  const constraint = new Error(message);
  constraint.name = 'SQLiteError';
  return constraint;
}