// db/init.ts — Inicializa la base SQLite ejecutando schema.sql
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dbPath = process.env.DB_PATH ?? './db/sagaf.db';
const schemaPath = resolve(process.cwd(), 'db/schema.sql');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = readFileSync(schemaPath, 'utf8');
db.exec(schema);

console.log(`[SAGAF] Base de datos inicializada en ${dbPath}`);
db.close();
