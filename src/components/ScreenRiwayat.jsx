import React, { useState } from 'react';
import { ChevronLeft, Printer, Trash2, AlertTriangle, X, Check, ArrowDownCircle } from 'lucide-react';
import { formatRupiah } from '../utils/format';
import { playTap } from '../utils/sound';

export default function ScreenRiwayat({
  transactions,
  storeProfile,
  onNavigate,
  onOpenReceiptModal,
  onDeleteTransaction
}) {
  const [confirmDeleteTx, setConfirmDeleteTx] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const totalRevenue = transactions.reduce((acc, t) => acc + (t.totalAmount || 0), 0);

  const handleConfirmDelete = () => {
    if (!confirmDeleteTx) return;
    playTap();
    const txId = confirmDeleteTx.id;
    if (onDeleteTransaction) {
      onDeleteTransaction(txId);
    }
    setConfirmDeleteTx(null);
    setToastMessage(`Transaksi ${txId} berhasil dibatalkan & stok dikembalikan.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* App Bar */}
      <div className="app-bar">
        <div className="app-bar-left">
          <button 
            className="back-btn" 
            onClick={() => onNavigate(1)}
            aria-label="Kembali ke Beranda"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="app-bar-title">Riwayat Penjualan hari ini</div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'absolute',
            top: '56px',
            left: '16px',
            right: '16px',
            background: '#15803d',
            color: 'white',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '11.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
            zIndex: 40,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <Check size={16} strokeWidth={2.5} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sales History List */}
      <div className="sales-history-list">
        {transactions.map((tx) => (
          <div key={tx.id} className="history-receipt-card">
            {/* Header: Dana Masuk RP. XXX + Top Right Delete Icon */}
            <div className="history-card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="history-income-title">
                  Dana Masuk {formatRupiah(tx.totalAmount).toUpperCase()}
                </div>
                <button
                  className="btn-delete-icon"
                  onClick={() => {
                    playTap();
                    setConfirmDeleteTx(tx);
                  }}
                  title="Batalkan transaksi ini dan kembalikan stok"
                  aria-label="Batalkan transaksi"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="history-store-name">
                {tx.storeName || storeProfile.name || "TOKO Rayyan"}
              </div>
              <div className="history-store-address">
                {tx.storeAddress || storeProfile.address || "Jl. Mawar No. 4, Jakarta"}
              </div>
              <div className="history-date-stamp">
                {tx.date} • {tx.id}
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="history-items-breakdown">
              {tx.items && tx.items.map((item, idx) => (
                <div key={idx} className="history-item-line">
                  <span className="name-qty">
                    {item.name} x{item.qty}
                  </span>
                  <span className="subtotal">
                    {formatRupiah(item.subtotal || item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Line */}
            <div className="history-total-line">
              <span className="label">Total Belanja</span>
              <span className="amount">{formatRupiah(tx.totalAmount)}</span>
            </div>

            {/* Cash & Change Details if recorded */}
            {tx.cashReceived && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                <span>Bayar Tunai: {formatRupiah(tx.cashReceived)}</span>
                <span>Kembalian: {formatRupiah(tx.changeAmount || 0)}</span>
              </div>
            )}

            {/* Action Buttons: Cetak Ulang & Batalkan Transaksi */}
            <div className="history-actions-row">
              <button
                className="btn-history-receipt"
                onClick={() => {
                  playTap();
                  onOpenReceiptModal(tx);
                }}
              >
                <Printer size={13} />
                <span>Cetak Ulang Struk</span>
              </button>

              <button
                className="btn-history-delete"
                onClick={() => {
                  playTap();
                  setConfirmDeleteTx(tx);
                }}
                title="Batalkan transaksi dan kembalikan stok barang"
              >
                <Trash2 size={13} />
                <span>Hapus / Batal</span>
              </button>
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <div 
            className="empty-state-box"
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '40px 20px',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div className="icon" style={{ fontSize: '42px', marginBottom: '12px' }}>🧾</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              Belum ada riwayat transaksi hari ini
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Setiap transaksi baru yang diselesaikan di kasir akan otomatis tercatat dan muncul di sini secara real-time.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Transaction Cancellation */}
      {confirmDeleteTx && (
        <div className="modal-backdrop" onClick={() => setConfirmDeleteTx(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-header" style={{ borderBottomColor: '#fee2e2', background: '#fffafb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertTriangle size={18} />
                </div>
                <h3 style={{ fontSize: '15px', color: '#b91c1c' }}>Batalkan Transaksi?</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setConfirmDeleteTx(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 20px' }}>
              <p style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.4 }}>
                Apakah Anda yakin ingin membatalkan transaksi <strong>{confirmDeleteTx.id}</strong> sebesar <strong>{formatRupiah(confirmDeleteTx.totalAmount)}</strong>?
              </p>

              {/* Items stock return breakdown */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '0.02em' }}>
                  STOK YANG AKAN DIKEMBALIKAN:
                </div>
                {confirmDeleteTx.items && confirmDeleteTx.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#1e293b' }}>• {it.name}</span>
                    <span style={{ fontWeight: 700, color: '#15803d' }}>+{it.qty} pcs</span>
                  </div>
                ))}
              </div>

              {/* Notice */}
              <div style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '10px',
                padding: '9px 12px',
                fontSize: '11px',
                color: '#9a3412',
                lineHeight: 1.35
              }}>
                ℹ️ Transaksi akan dihapus dari riwayat, stok produk otomatis dipulihkan, dan total omset hari ini disesuaikan.
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteTx(null)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    padding: '10px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  style={{
                    background: '#dc2626',
                    border: 'none',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                  }}
                >
                  <Trash2 size={15} />
                  <span>Ya, Batalkan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
