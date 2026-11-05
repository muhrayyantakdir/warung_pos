import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure database directory exists
const dbDir = path.resolve(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'warung_pos.db');
console.log(`[Database] Initializing SQLite connection at: ${dbPath}`);

export const db = new DatabaseSync(dbPath);

// Enable WAL Mode and foreign keys for durability and performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Run schema initialization
const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);
console.log('[Database] Schema successfully applied.');

// Helper wrapper for clean prepared statements
export const query = {
  all: (sql, ...params) => {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },
  get: (sql, ...params) => {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  },
  run: (sql, ...params) => {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },
  exec: (sql) => {
    return db.exec(sql);
  }
};

export default db;
