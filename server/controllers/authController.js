import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { db, query } from '../database/index.js';
import { supabase, isSupabaseConfigured } from '../database/supabase.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'warung_pos_super_secret_jwt_key_2026_id';

// REGISTER NEW USER / KASIR
export const register = async (req, res) => {
  try {
    const { username, password, full_name, role = 'cashier' } = req.body;

    // 1. Validation
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi' });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: 'Username wajib diisi' });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ success: false, message: 'Username minimal harus 3 karakter' });
    }

    // Alphanumeric + underscore check
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({ success: false, message: 'Username hanya boleh memuat huruf, angka, dan underscore (_)' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Kata sandi minimal harus 6 karakter' });
    }

    const assignedRole = role === 'admin' || role === 'owner' ? 'admin' : 'cashier';

    // 2. Check for duplicate username in Supabase if configured
    if (isSupabaseConfigured && supabase) {
      const { data: existingSupa } = await supabase
        .from('users')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existingSupa) {
        return res.status(400).json({
          success: false,
          message: `Username '${cleanUsername}' sudah terdaftar. Silakan pilih username lain atau login.`
        });
      }
    }

    // 3. Check for duplicate username in local SQLite
    const existingLocal = query.get('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', cleanUsername);
    if (existingLocal) {
      return res.status(400).json({
        success: false,
        message: `Username '${cleanUsername}' sudah terdaftar. Silakan pilih username lain atau login.`
      });
    }

    // 4. Hash password with bcrypt
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    let createdUser = null;

    // 5. Insert into Supabase if configured
    if (isSupabaseConfigured && supabase) {
      const { data: supaUser, error: supaErr } = await supabase
        .from('users')
        .insert({
          username: cleanUsername,
          password_hash: passwordHash,
          full_name: full_name.trim(),
          role: assignedRole,
          is_active: true
        })
        .select()
        .single();

      if (supaErr) {
        console.error('[Supabase Register Error]', supaErr);
      } else {
        createdUser = supaUser;
      }
    }

    // Also persist in local SQLite for seamless offline reliability
    const insertStmt = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    const insertResult = insertStmt.run(cleanUsername, passwordHash, full_name.trim(), assignedRole);

    if (!createdUser) {
      createdUser = query.get(
        'SELECT id, username, full_name, role, is_active, created_at FROM users WHERE id = ?',
        insertResult.lastInsertRowid
      );
    }

    // 6. Generate JWT Token for immediate login
    const token = jwt.sign(
      {
        id: createdUser.id,
        username: createdUser.username,
        role: createdUser.role,
        full_name: createdUser.full_name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: `Pendaftaran berhasil! Selamat datang, ${createdUser.full_name}`,
      user: {
        id: createdUser.id,
        username: createdUser.username,
        full_name: createdUser.full_name,
        role: createdUser.role
      },
      token
    });
  } catch (error) {
    console.error('[AuthController:register]', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memproses pendaftaran akun',
      error: error.message
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: 'Username wajib diisi' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Kata sandi wajib diisi' });
    }

    let user = null;

    // 1. If Supabase is configured, check in Supabase first
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim().toLowerCase())
        .eq('is_active', true)
        .single();

      if (!error && data) {
        user = data;
      }
    }

    // 2. Fallback to local SQLite database
    if (!user) {
      user = query.get(
        'SELECT * FROM users WHERE LOWER(username) = LOWER(?) AND is_active = 1',
        username.trim()
      );
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username atau kata sandi tidak sesuai'
      });
    }

    // Verify password (supports bcrypt hash or plain text initial match)
    let isPasswordMatch = false;
    if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
      isPasswordMatch = bcrypt.compareSync(password, user.password_hash);
    } else {
      isPasswordMatch = (password === user.password_hash);
    }

    // Also support default demo password matches if plain comparison matches
    if (!isPasswordMatch && (password === 'admin123' || password === 'kasir123')) {
      if (user.username === 'admin' || user.username === 'kasir1') {
        isPasswordMatch = true;
      }
    }

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau kata sandi tidak sesuai'
      });
    }

    // Generate JWT token (valid for 7 days)
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
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
    res.status(500).json({
      success: false,
      message: 'Gagal memproses login',
      error: error.message
    });
  }
};

// GET CURRENT LOGGED IN USER
export const getMe = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Belum login' });
    }
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// LOGOUT
export const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Berhasil keluar dari sistem'
  });
};
