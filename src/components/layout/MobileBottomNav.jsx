import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Menu
} from 'lucide-react';

export default function MobileBottomNav({
  activePage,
  setActivePage,
  onOpenMenu,
  lowStockCount = 0
}) {
  const navItems = [
    { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
    { id: 'pos', label: 'Kasir', icon: ShoppingCart, highlight: true },
    {
      id: 'products',
      label: 'Produk',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : null
    },
    { id: 'transactions', label: 'Riwayat', icon: Receipt },
    { id: 'more', label: 'Lainnya', icon: Menu, isAction: true }
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePage === item.id;

        if (item.isAction) {
          return (
            <button
              key={item.id}
              type="button"
              className="mobile-nav-btn"
              onClick={onOpenMenu}
            >
              <div className="mobile-nav-icon-wrap">
                <Icon size={20} />
              </div>
              <span>{item.label}</span>
            </button>
          );
        }

        if (item.highlight) {
          return (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav-btn highlight ${isActive ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <div className="mobile-nav-fab">
                <Icon size={22} />
              </div>
              <span>{item.label}</span>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <div className="mobile-nav-icon-wrap">
              <Icon size={20} />
              {item.badge && (
                <span className="mobile-nav-badge">{item.badge}</span>
              )}
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
