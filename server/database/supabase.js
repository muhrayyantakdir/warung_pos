import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

if (isSupabaseConfigured) {
  console.log(`[Supabase] Terhubung ke Cloud Supabase: ${supabaseUrl}`);
} else {
  console.log('[Database Mode] Supabase URL belum diatur. Menggunakan database lokal berkinerja tinggi (SQLite WAL).');
}

export default supabase;
