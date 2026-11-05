import React, { useState } from 'react';
import {
  Store,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regRole, setRegRole] = useState('cashier'); // 'admin' | 'cashier'
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Switch tabs
  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
  };

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Harap masukkan username dan kata sandi Anda.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || 'Username atau kata sandi tidak sesuai.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }
    if (!regUsername.trim()) {
      setError('Username wajib diisi.');
      return;
    }
    if (regUsername.trim().length < 3) {
      setError('Username minimal harus 3 karakter.');
      return;
    }
    if (!regPassword) {
      setError('Kata sandi wajib diisi.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Kata sandi minimal harus 6 karakter.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Konfirmasi kata sandi tidak sama dengan kata sandi.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register({
        full_name: regFullName.trim(),
        username: regUsername.trim(),
        role: regRole,
        password: regPassword
      });
      // User is automatically logged in via AuthContext!
    } catch (err) {
      setError(err.message || 'Gagal mendaftarkan akun. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill for testing
  const handleQuickLogin = (demoUser, demoPass) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setError('');
    setMode('login');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0e2a1e 0%, #1b4332 50%, #2d6a4f 100%)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Decorative Rings */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(82, 183, 136, 0.15) 0%, transparent 70%)',
          top: '-150px',
          right: '-100px',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, transparent 70%)',
          bottom: '-120px',
          left: '-80px',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          zIndex: 10
        }}
      >
        {/* Brand Banner */}
        <div
          style={{
            background: 'var(--brand-dark)',
            padding: '24px 20px',
            textAlign: 'center',
            color: 'white',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-orange-hover))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              boxShadow: '0 8px 16px rgba(249, 115, 22, 0.35)'
            }}
          >
            <Store size={26} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
            WARUNG POS
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--brand-mint)', marginTop: '4px', fontWeight: '500' }}>
            Sistem Kasir Ritel & Toko Kelontong Modern
          </p>
        </div>

        {/* Tab Navigation: Masuk vs Daftar */}
        <div
          style={{
            display: 'flex',
            background: 'var(--surface-muted)',
            padding: '4px',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <button
            type="button"
            onClick={() => handleSwitchMode('login')}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: mode === 'login' ? '#ffffff' : 'transparent',
              color: mode === 'login' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              boxShadow: mode === 'login' ? '0 2px 4px rgba(0, 0, 0, 0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <LogIn size={16} />
            <span>Masuk Akun</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('register')}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: mode === 'register' ? '#ffffff' : 'transparent',
              color: mode === 'register' ? 'var(--accent-orange)' : 'var(--text-secondary)',
              boxShadow: mode === 'register' ? '0 2px 4px rgba(0, 0, 0, 0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <UserPlus size={16} />
            <span>Daftar Baru</span>
          </button>
        </div>

        {/* Form Container */}
        <div style={{ padding: '24px 22px' }}>
          {/* Error Notification */}
          {error && (
            <div
              style={{
                background: 'var(--danger-soft)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: 'var(--danger-text)',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Notification */}
          {successMsg && (
            <div
              style={{
                background: 'var(--success-soft)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: 'var(--success-text)',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: FORM LOGIN */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '12px' }}>
                  Username / ID Kasir
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={17}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '38px', height: '42px' }}
                    placeholder="Masukkan username Anda"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontSize: '12px' }}>
                  Kata Sandi
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={17}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingLeft: '38px', paddingRight: '40px', height: '42px' }}
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  height: '44px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  borderRadius: '10px'
                }}
              >
                <LogIn size={17} />
                <span>{loading ? 'Memeriksa Kredensial...' : 'Masuk ke Sistem Kasir'}</span>
              </button>

              {/* Demo Fillers */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Sparkles size={12} style={{ color: 'var(--accent-orange)' }} />
                  <span>Pintasan Masuk Pengujian Cepat:</span>
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleQuickLogin('admin', 'admin123')}
                    style={{ fontSize: '11px', padding: '7px' }}
                  >
                    👑 Pemilik (Admin)
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleQuickLogin('kasir1', 'kasir123')}
                    style={{ fontSize: '11px', padding: '7px' }}
                  >
                    🛒 Kasir 1
                  </button>
                </div>
              </div>

              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '16px' }}>
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('register')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-orange)', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                >
                  Daftar di sini
                </button>
              </p>
            </form>
          ) : (
            /* TAB 2: FORM DAFTAR AKUN BARU */
            <form onSubmit={handleRegisterSubmit}>
              {/* Nama Lengkap */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '12px' }}>
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ height: '40px', fontSize: '13px' }}
                  placeholder="Contoh: Budi Santoso / Toko Berkah"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Username */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '12px' }}>
                  Username Login * (min. 3 huruf/angka)
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ height: '40px', fontSize: '13px' }}
                  placeholder="Contoh: budi_kasir"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                />
              </div>

              {/* Pilihan Peran */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '12px' }}>
                  Peran Akun
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setRegRole('cashier')}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: `1.5px solid ${regRole === 'cashier' ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                      background: regRole === 'cashier' ? 'var(--brand-pale)' : '#ffffff',
                      color: regRole === 'cashier' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontSize: '11.5px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    🛒 Petugas Kasir
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('admin')}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: `1.5px solid ${regRole === 'admin' ? 'var(--accent-orange)' : 'var(--border-color)'}`,
                      background: regRole === 'admin' ? 'var(--accent-orange-soft)' : '#ffffff',
                      color: regRole === 'admin' ? 'var(--accent-orange-hover)' : 'var(--text-secondary)',
                      fontSize: '11.5px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    👑 Pemilik (Admin)
                  </button>
                </div>
              </div>

              {/* Kata Sandi */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '12px' }}>
                  Kata Sandi * (min. 6 karakter)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingRight: '40px', height: '40px', fontSize: '13px' }}
                    placeholder="Minimal 6 karakter"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Kata Sandi */}
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontSize: '12px' }}>
                  Konfirmasi Kata Sandi *
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ height: '40px', fontSize: '13px' }}
                  placeholder="Ulangi kata sandi di atas"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-accent"
                disabled={loading}
                style={{
                  width: '100%',
                  height: '44px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  borderRadius: '10px'
                }}
              >
                <UserPlus size={17} />
                <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar & Langsung Masuk'}</span>
              </button>

              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '16px' }}>
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                >
                  Masuk di sini
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Security Footer */}
        <div
          style={{
            background: 'var(--surface-muted)',
            padding: '12px 20px',
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <ShieldCheck size={14} style={{ color: 'var(--success-emerald)' }} />
          <span>Sistem Kasir Terproteksi • Database Supabase & Offline SQLite</span>
        </div>
      </div>
    </div>
  );
}
