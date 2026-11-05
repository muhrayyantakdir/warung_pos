import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Receipt,
  Download,
  Calendar,
  RefreshCw,
  PieChart
} from 'lucide-react';
import { api } from '../services/api';
import { formatRupiah, formatNumber } from '../utils/format';

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res.success) setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const { today, all_time, chart = [] } = stats || {};

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
            Laporan Kinerja & Penjualan
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Analisis omzet, perkiraan laba kotor, dan riwayat pertumbuhan warung
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={loadReport}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Segarkan Laporan</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <h3>Omzet Hari Ini</h3>
            <div className="metric-value" style={{ color: 'var(--brand-primary)' }}>
              {formatRupiah(today?.total_sales || 0)}
            </div>
            <div className="metric-subtext">{today?.total_transactions || 0} struk transaksi</div>
          </div>
          <div className="metric-icon-box green">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Estimasi Laba Bersih</h3>
            <div className="metric-value" style={{ color: 'var(--success-text)' }}>
              {formatRupiah(today?.total_profit || 0)}
            </div>
            <div className="metric-subtext">Berdasarkan margin harga modal</div>
          </div>
          <div className="metric-icon-box green">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Total Omzet Keseluruhan</h3>
            <div className="metric-value">
              {formatRupiah(all_time?.total_sales || 0)}
            </div>
            <div className="metric-subtext">Akumulasi seluruh transaksi di DB</div>
          </div>
          <div className="metric-icon-box blue">
            <Receipt size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Rata-rata Belanja</h3>
            <div className="metric-value">
              {formatRupiah(today?.total_transactions > 0 ? (today.total_sales / today.total_transactions) : 0)}
            </div>
            <div className="metric-subtext">Nilai per pelanggan</div>
          </div>
          <div className="metric-icon-box orange">
            <BarChart3 size={22} />
          </div>
        </div>
      </div>

      {/* Report Summary Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h2>Rincian Penjualan 7 Hari Terakhir</h2>
          <span className="badge badge-success">Terverifikasi Database</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Hari</th>
                  <th>Jumlah Transaksi</th>
                  <th style={{ textAlign: 'right' }}>Total Omzet Penjualan</th>
                </tr>
              </thead>
              <tbody>
                {chart.map((row) => (
                  <tr key={row.date}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{row.date}</td>
                    <td style={{ fontWeight: '600' }}>{row.day}</td>
                    <td>{row.count} transaksi</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: row.total > 0 ? 'var(--brand-primary)' : 'inherit' }}>
                      {formatRupiah(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
