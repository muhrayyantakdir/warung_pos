import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { supabase, isSupabaseConfigured, db, query } from '../database/supabase.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'warung_pos_super_secret_jwt_key_2026_id';

// ─── Helper: cek apakah Supabase benar-benar bisa diakses ─────────────────────
// Karena URL bisa dikonfigurasi tapi network bisa down, kita test per-request
let _supabaseAlive = null;        // null = belum diketahui, true/false = hasil test
let _supabaseLastCheck = 0;

async function isSupabaseAlive() {
  if (!isSupabaseConfigured || !supabase) return false;

  // Cache hasil selama 60 detik agar tidak test setiap request
  const now = Date.now();
  if (_supabaseAlive !== null && now - _supabaseLastCheck < 60_000) {
    return _supabaseAlive;
  }

  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    _supabaseAlive = !error;
    _supabaseLastCheck = now;
    if (!_supabaseAlive) {
      console.warn('[Auth] Supabase tidak dapat dijangkau, fallback ke SQLite:', error?.message);
    } else {
      console.log('[Auth] Supabase online ✓');
    }
    return _supabaseAlive;
  } catch {
    _supabaseAlive = false;
    _supabaseLastCheck = now;
    return false;
  }
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { username, password, full_name, role = 'cashier' } = req.body;

    // ── Validasi input ──────────────────────────────────────────────────────
    if (!full_name || !full_name.trim())
      return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi' });

    if (!username || !username.trim())
      return res.status(400).json({ success: false, message: 'Username wajib diisi' });

    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername.length < 3)
      return res.status(400).json({ success: false, message: 'Username minimal 3 karakter' });

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername))
      return res.status(400).json({ success: false, message: 'Username hanya boleh huruf, angka, dan underscore (_)' });

    if (!password || password.length < 6)
      return res.status(400).json({ success: false, message: 'Kata sandi minimal 6 karakter' });

    const assignedRole = (role === 'admin' || role === 'owner') ? 'admin' : 'cashier';
    const cleanFullName = full_name.trim();
    const passwordHash  = bcrypt.hashSync(password, 10);

    const useSupabase = await isSupabaseAlive();

    if (useSupabase) {
      // ── Supabase path ─────────────────────────────────────────────────────
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existing)
        return res.status(400).json({
          success: false,
          message: `Username '${cleanUsername}' sudah terdaftar. Silakan pilih username lain.`
        });

      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          username: cleanUsername,
          password_hash: passwordHash,
          full_name: cleanFullName,
          role: assignedRole,
          is_active: true
        })
        .select('id, username, full_name, role')
        .single();

      if (error) {
        console.error('[AuthController:register] Supabase insert error:', error);
        return res.status(500).json({
          success: false,
          message: 'Gagal menyimpan akun baru. ' + error.message
        });
      }

      const token = _signToken(newUser);
      return res.status(201).json({
        success: true,
        message: `Pendaftaran berhasil! Selamat datang, ${newUser.full_name}`,
        user: { id: newUser.id, username: newUser.username, full_name: newUser.full_name, role: newUser.role },
        token
      });

    } else {
      // ── SQLite fallback path ──────────────────────────────────────────────
      const existing = query.get(
        'SELECT id FROM users WHERE LOWER(username) = LOWER(?)',
        cleanUsername
      );

      if (existing)
        return res.status(400).json({
          success: false,
          message: `Username '${cleanUsername}' sudah terdaftar. Silakan pilih username lain.`
        });

      const stmt   = db.prepare(
        'INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, 1)'
      );
      const result = stmt.run(cleanUsername, passwordHash, cleanFullName, assignedRole);

      const newUser = query.get(
        'SELECT id, username, full_name, role FROM users WHERE id = ?',
        result.lastInsertRowid
      );

      const token = _signToken(newUser);
      return res.status(201).json({
        success: true,
        message: `Pendaftaran berhasil! Selamat datang, ${newUser.full_name}`,
        user: { id: newUser.id, username: newUser.username, full_name: newUser.full_name, role: newUser.role },
        token
      });
    }

  } catch (error) {
    console.error('[AuthController:register]', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses pendaftaran akun',
      error: error.message
    });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !username.trim())
      return res.status(400).json({ success: false, message: 'Username wajib diisi' });
    if (!password)
      return res.status(400).json({ success: false, message: 'Kata sandi wajib diisi' });

    const cleanUsername = username.trim().toLowerCase();
    const useSupabase   = await isSupabaseAlive();

    let user = null;

    if (useSupabase) {
      // ── Supabase path ─────────────────────────────────────────────────────
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', cleanUsername)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('[AuthController:login] Supabase error:', error);
        return res.status(500).json({ success: false, message: 'Gagal memproses login', error: error.message });
      }
      user = data;
    } else {
      // ── SQLite fallback ───────────────────────────────────────────────────
      user = query.get(
        'SELECT * FROM users WHERE LOWER(username) = LOWER(?) AND is_active = 1',
        cleanUsername
      );
    }

    if (!user)
      return res.status(401).json({ success: false, message: 'Username atau kata sandi tidak sesuai' });

    // ── Verifikasi password ───────────────────────────────────────────────────
    const hash = user.password_hash || '';
    let isMatch = false;

    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      isMatch = bcrypt.compareSync(password, hash);
    } else {
      // Plain text (akun seed awal sebelum di-hash)
      isMatch = (password === hash);
      // Jika cocok, upgrade ke bcrypt hash
      if (isMatch) {
        const newHash = bcrypt.hashSync(password, 10);
        try {
          if (useSupabase) {
            await supabase.from('users').update({ password_hash: newHash }).eq('id', user.id);
          } else {
            db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
          }
          console.log(`[Auth] Password di-upgrade ke bcrypt untuk user: ${user.username}`);
        } catch (upgradeErr) {
          // Non-fatal
          console.warn('[Auth] Gagal upgrade hash:', upgradeErr.message);
        }
      }
    }

    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Username atau kata sandi tidak sesuai' });

    const token = _signToken(user);

    return res.json({
      success: true,
      message: `Selamat datang, ${user.full_name}!`,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('[AuthController:login]', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses login', error: error.message });
  }
};

// ─── GET ME ───────────────────────────────────────────────────────────────────
export const getMe = (req, res) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: 'Belum login' });
  return res.json({ success: true, user: req.user });
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export const logout = (req, res) => {
  return res.json({ success: true, message: 'Berhasil keluar dari sistem' });
};

// ─── Internal helper ──────────────────────────────────────────────────────────
function _signToken(user) {
  return jwt.sign(
    {
      id:        user.id,
      username:  user.username,
      role:      user.role,
      full_name: user.full_name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
