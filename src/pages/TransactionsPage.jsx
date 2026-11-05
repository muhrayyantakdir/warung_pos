import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  Eye,
  Printer,
  RefreshCw,
  X,
  CreditCard,
  Banknote
} from 'lucide-react';
import { api } from '../services/api';
import { formatRupiah, formatNumber, formatDate } from '../utils/format';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Detail Modal
  const [selectedTx, setSelectedTx] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getTransactions({
        search,
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });
      if (res.success) setTransactions(res.data);
    } catch (err) {
      setError(err.message || 'Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const viewTransactionDetail = async (txId) => {
    try {
      setLoadingDetail(true);
      const res = await api.getTransactionById(txId);
      if (res.success) {
        setSelectedTx(res.data);
      }
    } catch (err) {
      alert(`Gagal mengambil rincian transaksi: ${err.message}`);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
            Riwayat Nota & Transaksi
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Daftar lengkap seluruh transaksi yang tercatat di database warung
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={loadTransactions}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon-inside" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Cari no. faktur / nama pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dari:</span>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sampai:</span>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {(startDate || endDate) && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => { setStartDate(''); setEndDate(''); }}
          >
            Reset Tanggal
          </button>
        )}
      </div>

      {/* Transactions Table Card */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading && transactions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
              <p>Memuat riwayat transaksi...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <Receipt size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Tidak ada transaksi yang ditemukan</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Transaksi penjualan yang selesai di kasir akan otomatis muncul di sini.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>No. Faktur</th>
                    <th>Waktu & Tanggal</th>
                    <th>Pelanggan</th>
                    <th>Total Item</th>
                    <th style={{ textAlign: 'right' }}>Total Tagihan</th>
                    <th style={{ textAlign: 'center' }}>Metode</th>
                    <th style={{ textAlign: 'center', width: '90px' }}>Rincian</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ fontWeight: '700', color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>
                        {tx.invoice_number}
                      </td>
                      <td>{formatDate(tx.created_at)}</td>
                      <td>{tx.customer_name || 'Pelanggan Umum'}</td>
                      <td>
                        <span className="badge badge-muted">
                          {tx.item_count || 1} jenis barang
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }}>
                        {formatRupiah(tx.total_amount)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${tx.payment_method === 'cash' ? 'badge-success' : 'badge-warning'}`}>
                          {tx.payment_method.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          onClick={() => viewTransactionDetail(tx.id)}
                        >
                          <Eye size={13} />
                          <span>Lihat</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail & Receipt Modal */}
      {selectedTx && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Rincian Faktur: {selectedTx.invoice_number}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedTx(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ background: '#f8fafc' }}>
              {/* Thermal paper simulator */}
              <div
                style={{
                  background: 'white',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '20px',
                  fontFamily: 'monospace',
                  fontSize: '12.5px',
                  lineHeight: '1.5'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 'bold' }}>WARUNG POS</h4>
                  <p style={{ fontSize: '11px', color: '#64748b' }}>Sistem Kasir Ritel</p>
                  <p style={{ fontSize: '11px', color: '#64748b' }}>{formatDate(selectedTx.created_at)}</p>
                </div>

                <div style={{ borderTop: '1px dashed #94a3b8', margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569' }}>
                  <span>No: {selectedTx.invoice_number}</span>
                  <span>Kasir: {selectedTx.cashier_name || 'Admin'}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#475569' }}>
                  Pelanggan: {selectedTx.customer_name || 'Pelanggan Umum'}
                </div>

                <div style={{ borderTop: '1px dashed #94a3b8', margin: '8px 0' }} />

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(selectedTx.items || []).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div>{item.product_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {item.quantity} x {formatRupiah(item.selling_price)}
                        </div>
                      </div>
                      <div style={{ fontWeight: 'bold' }}>
                        {formatRupiah(item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px dashed #94a3b8', margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                  <span>TOTAL:</span>
                  <span>{formatRupiah(selectedTx.total_amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                  <span>Bayar ({selectedTx.payment_method.toUpperCase()}):</span>
                  <span>{formatRupiah(selectedTx.paid_amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>Kembalian:</span>
                  <span>{formatRupiah(selectedTx.change_amount)}</span>
                </div>

                <div style={{ borderTop: '1px dashed #94a3b8', margin: '14px 0 8px' }} />

                <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
                  Terima kasih atas kunjungan Anda!
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setSelectedTx(null)}>
                Tutup
              </button>
              <button type="button" className="btn btn-primary" onClick={handlePrint}>
                <Printer size={16} />
                <span>Cetak Nota</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
