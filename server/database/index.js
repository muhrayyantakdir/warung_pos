// index.js — Re-export dari supabase.js agar file lama yang import dari sini tetap berfungsi
// File ini dipertahankan untuk kompatibilitas mundur (seed.js, controller lama, dsb.)
export { supabase, isSupabaseConfigured, db, query } from './supabase.js';
export { db as default } from './supabase.js';
