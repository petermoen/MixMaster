import Database from 'better-sqlite3';
import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const dataDir = join(projectRoot, 'data');
const dbPath = join(dataDir, 'mixmaster.db');

mkdirSync(dataDir, { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const migrationsDir = join(__dirname, 'migrations');
const migrationFiles = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

for (const file of migrationFiles) {
  const sql = readFileSync(join(migrationsDir, file), 'utf8');
  db.exec(sql);
}

console.log(`[server] SQLite ready at ${dbPath}`);
