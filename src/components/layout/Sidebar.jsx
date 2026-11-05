import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderKanban,
  Receipt,
  BarChart3,
  Settings,
  Store,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({
  activePage,
  setActivePage,
  lowStockCount = 0,
  isOpen = false,
  setIsOpen = () => {}
}) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Kasir (POS)', icon: ShoppingCart },
    {
      id: 'products',
      label: 'Manajemen Produk',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount}` : null,
      badgeType: 'warning'
    },
    { id: 'categories', label: 'Kategori', icon: FolderKanban },
    { id: 'transactions', label: 'Riwayat Transaksi', icon: Receipt },
    { id: 'reports', label: 'Laporan Penjualan', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan Toko', icon: Settings }
  ];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setIsOpen(false);
  };

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem kasir?')) {
      logout();
    }
  };

  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'K';
  const roleLabel = user?.role === 'admin' ? 'Pemilik (Admin)' : 'Kasir';

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="sidebar-logo-badge">
              <Store size={22} />
            </div>
            <div className="sidebar-brand-text">
              <h2>WARUNG POS</h2>
              <p>Sistem Kasir Ritel</p>
            </div>
          </div>
          {isOpen && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mobile-close-btn"
              style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">Menu Utama</div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge-pill ${item.badgeType || ''}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Logout Footer */}
        <div className="sidebar-footer" style={{ flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="user-avatar-circle">
              {userInitial}
            </div>
            <div className="user-info-text">
              <p className="name">{user?.full_name || 'Petugas Kasir'}</p>
              <p className="role">{roleLabel}</p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm"
            onClick={handleLogout}
            style={{
              width: '100%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              justifyContent: 'center',
              padding: '8px'
            }}
          >
            <LogOut size={14} />
            <span>Keluar / Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
