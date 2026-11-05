import React from 'react';
import { X, Printer, Copy, Check } from 'lucide-react';
import { formatRupiah } from '../utils/format';
import { playTap } from '../utils/sound';

export default function ReceiptModal({ receiptData, onClose }) {
  const [copied, setCopied] = React.useState(false);

  if (!receiptData) return null;

  const handlePrint = () => {
    playTap();
    window.print();
  };

  const handleCopyText = () => {
    playTap();
    let text = `================================\n`;
    text += `       ${receiptData.storeName || "TOKO RAYYAN"}\n`;
    text += `    ${receiptData.storeAddress || "Jl. Mawar No. 4, Jakarta"}\n`;
    text += `================================\n`;
    text += `No. Nota : ${receiptData.id}\n`;
    text += `Tanggal  : ${receiptData.date}\n`;
    text += `Kasir    : ${receiptData.cashierName || "TB (Kasir)"}\n`;
    text += `--------------------------------\n`;
    receiptData.items?.forEach(item => {
      text += `${item.name}\n`;
      text += `  ${item.qty} x ${formatRupiah(item.price)} = ${formatRupiah(item.subtotal || item.price * item.qty)}\n`;
    });
    text += `--------------------------------\n`;
    text += `Total Belanja : ${formatRupiah(receiptData.totalAmount)}\n`;
    text += `Tunai         : ${formatRupiah(receiptData.cashReceived)}\n`;
    text += `Kembalian     : ${formatRupiah(receiptData.changeAmount)}\n`;
    text += `================================\n`;
    text += `  Terima Kasih Atas Kunjungan Anda! \n`;
    text += `================================\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header no-print">
          <h3>Struk Pembayaran Thermal</h3>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Printable Thermal Receipt Paper */}
          <div className="thermal-receipt-paper printable-receipt-area">
            <div className="thermal-paper-zigzag-top"></div>

            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px' }}>
                {receiptData.storeName || "TOKO RAYYAN"}
              </div>
              <div style={{ fontSize: '11px', color: '#4b5563' }}>
                {receiptData.storeAddress || "Jl. Mawar No. 4, Jakarta"}
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>
                Telp: 0812-3456-7890
              </div>
            </div>

            <hr />

            <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>No. TRX:</span>
                <span style={{ fontWeight: 'bold' }}>{receiptData.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Waktu:</span>
                <span>{receiptData.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Kasir:</span>
                <span>{receiptData.cashierName || "TB (Kasir)"}</span>
              </div>
            </div>

            <hr />

            {/* Items Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {receiptData.items && receiptData.items.map((item, idx) => (
                <div key={idx}>
                  <div style={{ fontWeight: '600' }}>{item.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#374151' }}>
                    <span>{item.qty} x {formatRupiah(item.price)}</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {formatRupiah(item.subtotal || item.price * item.qty)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <hr />

            {/* Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                <span>TOTAL:</span>
                <span>{formatRupiah(receiptData.totalAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>TUNAI:</span>
                <span>{formatRupiah(receiptData.cashReceived)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>KEMBALI:</span>
                <span>{formatRupiah(receiptData.changeAmount)}</span>
              </div>
            </div>

            <hr />

            {/* Barcode & Footer */}
            <div className="receipt-barcode">
              <div className="barcode-lines"></div>
              <span style={{ fontSize: '9px', letterSpacing: '2px' }}>*{receiptData.id}*</span>
            </div>

            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10.5px', color: '#6b7280' }}>
              Terima Kasih Atas Kunjungan Anda!
              <br />
              Barang yang sudah dibeli tidak dapat ditukar
            </div>

            <div className="thermal-paper-zigzag-bottom"></div>
          </div>

          {/* Action buttons inside modal */}
          <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            <button
              onClick={handlePrint}
              style={{
                flex: 1,
                background: 'var(--green-primary)',
                color: 'white',
                border: 'none',
                padding: '11px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Printer size={16} />
              <span>Cetak Sekarang</span>
            </button>

            <button
              onClick={handleCopyText}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#334155',
                padding: '11px 16px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
              <span>{copied ? "Disalin!" : "Salin Teks"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
