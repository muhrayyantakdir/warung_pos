import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Receipt,
  Package,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { api } from '../services/api';
import { formatRupiah, formatNumber, formatDate } from '../utils/format';

export default function DashboardPage({ setActivePage }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--brand-primary)', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Memuat ringkasan data warung dari database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={fetchStats} className="btn btn-sm btn-outline" style={{ marginLeft: 'auto' }}>
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const { today, inventory, chart = [], recent_transactions = [] } = stats || {};

  // Find max sales in the 7 days chart for bar scaling
  const maxSales = Math.max(...chart.map(c => c.total), 50000);

  return (
    <div className="page-container">
      {/* Top Banner & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
            Ringkasan Usaha Hari Ini
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Data bersumber langsung dari database transaksi lokal
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={fetchStats}
          disabled={loading}
          title="Segarkan data"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* 5 Key Metric Cards */}
      <div className="metrics-grid">
        {/* Total Penjualan Hari Ini */}
        <div className="metric-card">
          <div className="metric-info">
            <h3>Total Penjualan Hari Ini</h3>
            <div className="metric-value" style={{ color: 'var(--brand-primary)' }}>
              {formatRupiah(today?.total_sales || 0)}
            </div>
            <div className="metric-subtext">
              {today?.total_transactions || 0} transaksi berhasil
            </div>
          </div>
          <div className="metric-icon-box green">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Jumlah Transaksi Hari Ini */}
        <div className="metric-card">
          <div className="metric-info">
            <h3>Jumlah Transaksi</h3>
            <div className="metric-value">
              {formatNumber(today?.total_transactions || 0)}
            </div>
            <div className="metric-subtext">Struk belanja tercetak</div>
          </div>
          <div className="metric-icon-box blue">
            <Receipt size={22} />
          </div>
        </div>

        {/* Perkiraan Laba Hari Ini */}
        <div className="metric-card">
          <div className="metric-info">
            <h3>Perkiraan Keuntungan</h3>
            <div className="metric-value" style={{ color: 'var(--success-text)' }}>
              {formatRupiah(today?.total_profit || 0)}
            </div>
            <div className="metric-subtext">Laba kotor (Jual - Modal)</div>
          </div>
          <div className="metric-icon-box green">
            <DollarSign size={22} />
          </div>
        </div>

        {/* Jumlah Total Produk */}
        <div className="metric-card">
          <div className="metric-info">
            <h3>Total Jenis Produk</h3>
            <div className="metric-value">
              {formatNumber(inventory?.total_products || 0)}
            </div>
            <div className="metric-subtext">Item siap dijual</div>
          </div>
          <div className="metric-icon-box blue">
            <Package size={22} />
          </div>
        </div>

        {/* Stok Menipis Warning Card */}
        <div className="metric-card" style={inventory?.low_stock_count > 0 ? { borderColor: 'var(--warning-amber)', background: 'var(--warning-soft)' } : {}}>
          <div className="metric-info">
            <h3>Stok Perlu Ditambah</h3>
            <div className="metric-value" style={{ color: inventory?.low_stock_count > 0 ? 'var(--warning-text)' : 'inherit' }}>
              {inventory?.low_stock_count || 0} Produk
            </div>
            <div className="metric-subtext">
              {inventory?.low_stock_count > 0 ? 'Segera belanja ulang' : 'Semua stok aman'}
            </div>
          </div>
          <div className={`metric-icon-box ${inventory?.low_stock_count > 0 ? 'orange' : 'green'}`}>
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Main Dashboard Section: 7-Days Chart & Low Stock Items */}
      <div className="dashboard-grid">
        {/* Left Column: 7 Days Sales Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Grafik Penjualan 7 Hari Terakhir</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tren omzet harian warung</p>
            </div>
            <span className="badge badge-success">Live Database</span>
          </div>
          <div className="card-body">
            {chart.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                Belum ada data penjualan 7 hari terakhir.
              </p>
            ) : (
              <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '14px', paddingTop: '20px', paddingBottom: '10px' }}>
                {chart.map((item, idx) => {
                  const barHeight = Math.max(12, Math.round((item.total / maxSales) * 160));
                  const isToday = idx === chart.length - 1;

                  return (
                    <div
                      key={item.date}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        height: '100%',
                        justifyContent: 'flex-end'
                      }}
                    >
                      {/* Bar Value Tooltip / Label */}
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {item.total > 0 ? `${Math.round(item.total / 1000)}k` : '0'}
                      </span>

                      {/* Bar Column */}
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '42px',
                          height: `${barHeight}px`,
                          background: isToday
                            ? 'linear-gradient(180deg, var(--accent-orange), var(--accent-orange-hover))'
                            : 'linear-gradient(180deg, var(--brand-accent), var(--brand-primary))',
                          borderRadius: '6px 6px 2px 2px',
                          transition: 'height 0.3s ease',
                          cursor: 'pointer'
                        }}
                        title={`${item.day}, ${item.date}: ${formatRupiah(item.total)} (${item.count} transaksi)`}
                      />

                      {/* Date / Day Label */}
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: isToday ? '700' : '500', color: isToday ? 'var(--accent-orange)' : 'var(--text-secondary)' }}>
                          {item.day}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Alert Stok Menipis */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Peringatan Stok Menipis</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Segera lakukan kulakan</p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setActivePage('products')}
              style={{ padding: '4px 8px', fontSize: '11px' }}
            >
              Lihat Semua
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {(!inventory?.low_stock_items || inventory.low_stock_items.length === 0) ? (
              <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', background: 'var(--brand-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'var(--brand-primary)' }}>
                  <Package size={24} />
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: '600' }}>Stok Aman</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Semua produk berada di atas batas minimum.</p>
              </div>
            ) : (
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {inventory.low_stock_items.map((prod) => (
                  <div
                    key={prod.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{prod.name}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        SKU: {prod.sku} • Min: {prod.min_stock_alert} {prod.unit}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-danger">
                        Sisa: {prod.stock} {prod.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2>5 Transaksi Terakhir</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Aktivitas kasir terbaru</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => setActivePage('transactions')}
          >
            <span>Semua Riwayat</span>
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {recent_transactions.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Belum ada transaksi penjualan yang tercatat.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>No. Faktur</th>
                    <th>Waktu</th>
                    <th>Pelanggan</th>
                    <th>Jumlah Item</th>
                    <th>Total Belanja</th>
                    <th>Metode</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ fontWeight: '700', color: 'var(--brand-primary)' }}>
                        {tx.invoice_number}
                      </td>
                      <td>{formatDate(tx.created_at)}</td>
                      <td>{tx.customer_name || 'Pelanggan Umum'}</td>
                      <td>
                        <span className="badge badge-muted">
                          {tx.total_items} jenis barang
                        </span>
                      </td>
                      <td style={{ fontWeight: '700' }}>
                        {formatRupiah(tx.total_amount)}
                      </td>
                      <td>
                        <span className={`badge ${tx.payment_method === 'cash' ? 'badge-success' : 'badge-warning'}`}>
                          {tx.payment_method.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
