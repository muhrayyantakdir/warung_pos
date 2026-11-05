import React, { useState, useEffect } from 'react';
import { Menu, ShoppingCart, Clock, LogOut, User, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  dashboard: { title: 'Dashboard', desc: 'Ringkasan penjualan & stok' },
  pos: { title: 'Kasir (POS)', desc: 'Transaksi cepat & cetak nota' },
  products: { title: 'Produk', desc: 'Kelola harga & stok barang' },
  categories: { title: 'Kategori', desc: 'Pengelompokan barang' },
  transactions: { title: 'Riwayat', desc: 'Daftar nota belanja' },
  reports: { title: 'Laporan', desc: 'Analisis laba rugi & omzet' },
  settings: { title: 'Pengaturan', desc: 'Identitas warung & struk' }
};

export default function Header({
  activePage,
  setActivePage,
  onToggleSidebar
}) {
  const { user, logout } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(now);
      setCurrentDateTime(formatted);
    };

    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const pageInfo = PAGE_TITLES[activePage] || { title: 'Warung POS', desc: 'Sistem Kasir' };

  const handleLogout = () => {
    if (confirm('Keluar dari aplikasi kasir?')) {
      logout();
    }
  };

  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'K';

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Buka Menu"
        >
          <Menu size={22} />
        </button>

        <div className="header-title-text">
          <h1>{pageInfo.title}</h1>
          <p className="header-subtitle-desktop">{pageInfo.desc}</p>
        </div>
      </div>

      <div className="header-right">
        {/* Real-time Indonesian clock on desktop/tablet */}
        <div className="header-clock header-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <Clock size={14} />
          <span>{currentDateTime}</span>
        </div>

        {/* Database Status Indicator */}
        <div className="online-status-indicator" title="Terkoneksi Aktif">
          <span className="online-dot" />
          <span className="header-status-text">Online</span>
        </div>

        {/* Fast Cashier CTA on Desktop */}
        {activePage !== 'pos' && (
          <button
            type="button"
            className="btn btn-accent btn-sm header-hide-mobile"
            onClick={() => setActivePage('pos')}
          >
            <ShoppingCart size={15} />
            <span>Kasir</span>
          </button>
        )}

        {/* User Profile Pill & Quick Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid var(--border-color)' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--brand-primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '700'
            }}
            title={`${user?.full_name} (${user?.role})`}
          >
            {userInitial}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-outline btn-sm"
            style={{ padding: '6px 8px', color: 'var(--danger-red)' }}
            title="Keluar dari akun"
          >
            <LogOut size={15} />
            <span className="header-hide-mobile">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
