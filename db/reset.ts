// db/reset.ts — Elimina y reconstruye la base de datos
import { existsSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';

const dbPath = process.env.DB_PATH ?? './db/sagaf.db';

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
  console.log(`[SAGAF] Eliminado ${dbPath}`);
}
if (existsSync(`${dbPath}-journal`)) unlinkSync(`${dbPath}-journal`);

execSync('npx tsx db/init.ts && npx tsx db/seed.ts', { stdio: 'inherit' });
