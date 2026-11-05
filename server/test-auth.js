import { login, register, getMe, logout } from './controllers/authController.js';
import { verifyToken } from './middlewares/authMiddleware.js';
import { db } from './database/index.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failed++;
  }
}

function runAsync(fn, req) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      json(data) { resolve({ status: this.statusCode, data }); }
    };
    fn(req, res);
  });
}

function runMiddleware(middleware, req) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      json(data) { resolve({ status: this.statusCode, data }); }
    };
    middleware(req, res, () => {
      resolve({ nextCalled: true });
    });
  });
}

async function testAuthSuite() {
  console.log('====================================================');
  console.log('🔐 MEMULAI PENGUJIAN SISTEM AUTENTIKASI & PENDAFTARAN');
  console.log('====================================================\n');

  // Pre-test cleanup of test accounts
  db.prepare("DELETE FROM users WHERE username LIKE 'user_test_%'").run();

  // 1. Test Register New User
  const uniqueUser = `user_test_${Date.now()}`;
  const registerRes = await runAsync(register, {
    body: {
      full_name: 'Budi Kasir Baru',
      username: uniqueUser,
      password: 'password123',
      role: 'cashier'
    }
  });
  assert(
    registerRes.status === 201 && registerRes.data.token && registerRes.data.user.username === uniqueUser,
    'Pendaftaran akun baru (Register) berhasil dibuat & langsung menerima JWT token'
  );

  // 2. Test Login dengan Akun yang Baru Didaftarkan
  const loginNewUserRes = await runAsync(login, {
    body: { username: uniqueUser, password: 'password123' }
  });
  assert(
    loginNewUserRes.status === 200 && loginNewUserRes.data.user.full_name === 'Budi Kasir Baru',
    'Login menggunakan akun yang baru didaftarkan berhasil diverifikasi'
  );

  // 3. Test Register Duplicate Username (Harus ditolak 400)
  const duplicateRegRes = await runAsync(register, {
    body: {
      full_name: 'Orang Lain',
      username: uniqueUser,
      password: 'password123'
    }
  });
  assert(
    duplicateRegRes.status === 400 && duplicateRegRes.data.success === false,
    'Pencegahan pendaftaran username duplikat berhasil ditolak (status 400)'
  );

  // 4. Test Register Password Pendek (< 6 karakter)
  const shortPassRes = await runAsync(register, {
    body: {
      full_name: 'Test Pendek',
      username: `short_${Date.now()}`,
      password: '123'
    }
  });
  assert(
    shortPassRes.status === 400,
    'Validasi kata sandi minimal 6 karakter saat pendaftaran berhasil (status 400)'
  );

  // 5. Test Login Admin Default
  const adminRes = await runAsync(login, {
    body: { username: 'admin', password: 'admin123' }
  });
  assert(adminRes.status === 200 && adminRes.data.token && adminRes.data.user.role === 'admin', 'Login Admin (Pemilik) default berhasil');
  const adminToken = adminRes.data.token;

  // 6. Test Login Kasir Default
  const cashierRes = await runAsync(login, {
    body: { username: 'kasir1', password: 'kasir123' }
  });
  assert(cashierRes.status === 200 && cashierRes.data.user.role === 'cashier', 'Login Kasir 1 default berhasil');

  // 7. Test Login Password Salah
  const wrongPassRes = await runAsync(login, {
    body: { username: 'admin', password: 'password_salah_123' }
  });
  assert(wrongPassRes.status === 401 && !wrongPassRes.data.token, 'Pencegahan login kata sandi salah berhasil (status 401)');

  // 8. Test Auth Middleware Valid Token
  const midValid = await runMiddleware(verifyToken, {
    headers: { authorization: `Bearer ${adminToken}` }
  });
  assert(midValid.nextCalled === true, 'Middleware verifikasi token meloloskan request ber-token valid');

  // 9. Test Auth Middleware Tanpa Token
  const midNoToken = await runMiddleware(verifyToken, {
    headers: {}
  });
  assert(midNoToken.status === 401, 'Middleware verifikasi token memblokir request tanpa token (status 401)');

  // 10. Test Logout
  const logoutRes = await runAsync(logout, {});
  assert(logoutRes.status === 200, 'Fungsi logout berhasil dieksekusi');

  console.log('\n====================================================');
  console.log(`📊 HASIL PENGUJIAN AUTENTIKASI & DAFTAR: ${passed} LULUS, ${failed} GAGAL`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

testAuthSuite().catch(e => {
  console.error(e);
  process.exit(1);
});
