// lib/db.ts — Conexión singleton a SQLite con better-sqlite3
import Database from 'better-sqlite3';

declare global {
  // eslint-disable-next-line no-var
  var __sagaf_db: Database.Database | undefined;
}

function createConnection(): Database.Database {
  const dbPath = process.env.DB_PATH ?? './db/sagaf.db';
  const conn = new Database(dbPath);
  conn.pragma('journal_mode = WAL');
  conn.pragma('foreign_keys = ON');
  return conn;
}

export const db: Database.Database = global.__sagaf_db ?? createConnection();

if (process.env.NODE_ENV !== 'production') {
  global.__sagaf_db = db;
}

export default db;
