// Database Layer - Supabase (primary) + SQLite (fallback)
// Jika Supabase URL valid & bisa dijangkau, gunakan Supabase.
// Jika tidak, otomatis fallback ke SQLite lokal.

import { createClient } from '@supabase/supabase-js';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── SUPABASE SETUP ───────────────────────────────────────────────────────────
const supabaseUrl  = process.env.SUPABASE_URL  || '';
const supabaseKey  = process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })
  : null;

if (isSupabaseConfigured) {
  console.log(`[Database] Mode: Supabase Cloud → ${supabaseUrl}`);
} else {
  console.log('[Database] Mode: SQLite Lokal (Supabase belum dikonfigurasi)');
}

// ─── SQLITE SETUP (selalu tersedia sebagai fallback) ─────────────────────────
const dbDir  = path.resolve(__dirname, '../../database');
const dbPath = path.join(dbDir, 'warung_pos.db');

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Terapkan schema SQLite
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  db.exec(fs.readFileSync(schemaPath, 'utf8'));
}

// Helper wrappers SQLite
export const query = {
  all: (sql, ...params) => db.prepare(sql).all(...params),
  get: (sql, ...params) => db.prepare(sql).get(...params),
  run: (sql, ...params) => db.prepare(sql).run(...params),
};

export default { supabase, isSupabaseConfigured, db, query };
