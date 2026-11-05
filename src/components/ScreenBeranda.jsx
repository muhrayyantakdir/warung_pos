import React from 'react';
import { ShoppingCart, Package, Clock, ChevronRight, ShoppingBag, ArrowRight, AlertTriangle } from 'lucide-react';
import { formatRupiah } from '../utils/format';
import { playClick, playTap } from '../utils/sound';

export default function ScreenBeranda({
  storeProfile,
  transactions,
  products,
  onNavigate
}) {
  // Calculate today's real-time summary statistics
  const totalSales = transactions.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
  const totalCount = transactions.length;
  const avgSales = totalCount > 0 ? totalSales / totalCount : 0;

  // Check low stock products (stock <= 5)
  const lowStockProducts = products.filter(p => p.stock <= 5);

  const handleNav = (screenIndex) => {
    playTap();
    if (onNavigate) onNavigate(screenIndex);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Green Header Section */}
      <div className="home-green-header">
        <div className="home-profile-row">
          <div className="home-avatar">
            {storeProfile.initials || "TB"}
          </div>
          <div className="home-greeting-text">
            <div className="subtitle">Selamat Datang di</div>
            <div className="title">
              {storeProfile.name || "Toko Rayyan"} 🏪
            </div>
          </div>
        </div>
      </div>

      {/* Main Body with Overlapping Cards */}
      <div className="home-body-content">
        {/* Ringkasan Hari Ini Card */}
        <div className="summary-card">
          <div className="summary-header-row">
            <span className="summary-label">RINGKASAN HARI INI</span>
            <span className="badge-active">
              <span className="dot"></span>
              AKTIF
            </span>
          </div>

          <div className="summary-total-label">Total Penjualan</div>
          <div className="summary-total-amount">{formatRupiah(totalSales)}</div>

          <div className="summary-sub-stat-box">
            <ShoppingBag size={14} color="#f97316" strokeWidth={2.5} />
            <span>
              {totalCount === 0 ? (
                <span>
                  <strong>0 Transaksi</strong> • Belum ada penjualan hari ini
                </span>
              ) : (
                <span>
                  <strong>{totalCount} Transaksi</strong> • Rata-rata: {formatRupiah(avgSales)}
                </span>
              )}
            </span>
          </div>
        </div>


        {/* Low Stock Quick Alert if any */}
        {lowStockProducts.length > 0 && (
          <div 
            onClick={() => handleNav(4)}
            style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '11.5px',
              color: '#c2410c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={15} color="#ea580c" />
              <span>
                <strong>{lowStockProducts.length} Produk</strong> stok menipis (e.g. {lowStockProducts[0].name})
              </span>
            </div>
            <ChevronRight size={14} />
          </div>
        )}

        {/* Section Title */}
        <div className="section-title">Menu Utama Pembukuan</div>

        {/* 3 Main Action Cards */}
        <div className="menu-list">
          {/* Menu 1: Transaksi Baru (Orange Gradient Card) */}
          <button 
            className="menu-card-orange"
            onClick={() => handleNav(2)}
            aria-label="Buka Transaksi Baru"
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div className="icon-box">
                <ShoppingCart size={22} strokeWidth={2.3} />
              </div>
              <div className="menu-card-content">
                <div className="card-title">Transaksi Baru</div>
                <div className="card-desc">Catat penjualan &amp; hitung kembalian</div>
              </div>
            </div>
            <ArrowRight size={20} color="#ffffff" strokeWidth={2.5} />
          </button>

          {/* Menu 2: Kelola Stok Produk (White Card with Green Icon) */}
          <div 
            className="menu-card-white"
            onClick={() => handleNav(4)}
            role="button"
            tabIndex={0}
          >
            <div className="icon-box-green">
              <Package size={22} strokeWidth={2.3} />
            </div>
            <div className="menu-card-content">
              <div className="card-title" style={{ color: 'var(--text-main)' }}>
                Kelola Stok Produk
              </div>
              <div className="card-desc" style={{ color: 'var(--text-secondary)' }}>
                Daftar harga, edit stok &amp; barang baru
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </div>

          {/* Menu 3: Riwayat Penjualan (White Card with Orange Icon) */}
          <div 
            className="menu-card-white"
            onClick={() => handleNav(5)}
            role="button"
            tabIndex={0}
          >
            <div className="icon-box-orange">
              <Clock size={22} strokeWidth={2.3} />
            </div>
            <div className="menu-card-content">
              <div className="card-title" style={{ color: 'var(--text-main)' }}>
                Riwayat Penjualan
              </div>
              <div className="card-desc" style={{ color: 'var(--text-secondary)' }}>
                Lihat semua nota transaksi hari ini
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </div>
        </div>
      </div>
    </div>
  );
}
