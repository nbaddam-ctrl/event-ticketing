import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const databasePath = process.env.DATABASE_URL ?? './data/event-ticketing.db';

function openDatabase(): Database.Database {
  if (databasePath === ':memory:') {
    return new Database(':memory:');
  }
  const resolvedPath = path.resolve(databasePath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  return new Database(resolvedPath);
}

export const db = openDatabase();
db.pragma('foreign_keys = ON');

export function withTransaction<T>(work: () => T): T {
  const transaction = db.transaction(work);
  return transaction();
}
