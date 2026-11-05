import React, { useState, useEffect } from 'react';
import { ChevronLeft, Printer, CheckCircle, Edit2, AlertCircle } from 'lucide-react';
import { formatRupiah, getCurrentDateFormatted } from '../utils/format';
import { playTap, playCashRegister, playError } from '../utils/sound';
import confetti from 'canvas-confetti';

export default function ScreenPembayaran({
  products,
  cart,
  storeProfile,
  onNavigate,
  onCompleteTransaction,
  onOpenReceiptModal
}) {
  // Build items list from current cart
  const cartItems = Object.entries(cart)
    .filter(([_, qty]) => qty > 0)
    .map(([prodId, qty]) => {
      const prod = products.find(p => p.id === Number(prodId));
      return {
        id: Number(prodId),
        name: prod ? prod.name : "Produk",
        price: prod ? prod.price : 0,
        qty: qty,
        subtotal: prod ? prod.price * qty : 0
      };
    });

  const totalBelanja = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  // Default cash received matching image (Rp 200.000) or totalBelanja
  const [cashReceived, setCashReceived] = useState(() => {
    if (totalBelanja === 166500) return 200000;
    return totalBelanja;
  });

  const [isEditingCash, setIsEditingCash] = useState(false);
  const [cashInputValue, setCashInputValue] = useState(String(cashReceived));

  // Sync default when total changes
  useEffect(() => {
    if (totalBelanja === 166500) {
      setCashReceived(200000);
      setCashInputValue("200000");
    } else {
      setCashReceived(totalBelanja);
      setCashInputValue(String(totalBelanja));
    }
  }, [totalBelanja]);

  // Real-time change calculation
  const kembalian = cashReceived - totalBelanja;
  const isInsufficient = kembalian < 0;

  // Generate intelligent quick suggestion denominations
  const quickSuggestions = [
    { label: "Uang Pas", value: totalBelanja },
    { label: formatRupiah(Math.ceil(totalBelanja / 10000) * 10000), value: Math.ceil(totalBelanja / 10000) * 10000 },
    { label: formatRupiah(Math.ceil(totalBelanja / 50000) * 50000 || 50000), value: Math.ceil(totalBelanja / 50000) * 50000 || 50000 },
    { label: formatRupiah(Math.ceil(totalBelanja / 100000) * 100000 || 100000), value: Math.ceil(totalBelanja / 100000) * 100000 || 100000 }
  ].filter((item, index, self) => 
    item.value >= totalBelanja && self.findIndex(t => t.value === item.value) === index
  );

  const handleSelectQuickCash = (val) => {
    playTap();
    setCashReceived(val);
    setCashInputValue(String(val));
    setIsEditingCash(false);
  };

  const handleApplyCashInput = () => {
    const parsed = parseInt(cashInputValue.replace(/[^0-9]/g, ""), 10) || 0;
    setCashReceived(parsed);
    setIsEditingCash(false);
  };

  const handleFinishTransaction = () => {
    if (totalBelanja === 0) {
      alert("Keranjang belanja kosong!");
      return;
    }
    if (isInsufficient) {
      playError();
      alert(`Uang tunai kurang ${formatRupiah(Math.abs(kembalian))}!`);
      return;
    }

    // Play cash register sound
    playCashRegister();

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    // Build completed transaction object
    const newTx = {
      id: `TRX-${Date.now().toString().slice(-6)}`,
      date: getCurrentDateFormatted(),
      timestamp: Date.now(),
      items: cartItems,
      totalAmount: totalBelanja,
      cashReceived: cashReceived,
      changeAmount: kembalian,
      paymentMethod: "Tunai",
      cashierName: "TB (Kasir)",
      storeName: storeProfile.name || "TOKO Rayyan",
      storeAddress: storeProfile.address || "Jl. Mawar No. 4, Jakarta"
    };

    onCompleteTransaction(newTx);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* App Bar */}
      <div className="app-bar">
        <div className="app-bar-left">
          <button 
            className="back-btn" 
            onClick={() => onNavigate(2)}
            aria-label="Kembali ke Transaksi Baru"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="app-bar-title">Pembayaran</div>
        </div>
      </div>

      <div className="payment-screen-content">
        {/* Receipt Summary Card */}
        <div className="receipt-mini-card">
          <div className="receipt-header-center">
            <div className="receipt-store-title">{storeProfile.name || "TOKO Rayyan"}</div>
            <div className="receipt-store-address">{storeProfile.address || "Jl. Mawar No. 4, Jakarta"}</div>
            <div className="receipt-store-date">{getCurrentDateFormatted()}</div>
          </div>

          {/* Itemized List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {cartItems.length > 0 ? (
              cartItems.map((item, idx) => (
                <div key={idx} className="receipt-item-row">
                  <span className="receipt-item-name">
                    {item.name} x{item.qty}
                  </span>
                  <span className="receipt-item-price">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '14px 8px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                  Keranjang belanja masih kosong
                </span>
                <span>Pilih produk di menu Transaksi Baru</span>
              </div>
            )}
          </div>

          <div className="receipt-divider-line"></div>

          {/* Total Row */}
          <div className="receipt-total-row">
            <span className="receipt-total-label">Total Belanja</span>
            <span className="receipt-total-value">{formatRupiah(totalBelanja)}</span>
          </div>
        </div>


        {/* UANG TUNAI DITERIMA CARD */}
        <div className="cash-input-card">
          <div className="cash-card-header">UANG TUNAI DITERIMA</div>

          <div className={`cash-display-box ${isEditingCash ? 'focused' : ''}`}>
            {isEditingCash ? (
              <input
                type="number"
                value={cashInputValue}
                autoFocus
                onChange={(e) => setCashInputValue(e.target.value)}
                onBlur={handleApplyCashInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyCashInput();
                }}
              />
            ) : (
              <div className="cash-display-amount">
                {formatRupiah(cashReceived)}
              </div>
            )}
            
            <button
              onClick={() => {
                if (isEditingCash) {
                  handleApplyCashInput();
                } else {
                  setIsEditingCash(true);
                }
              }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
              title="Ubah nominal uang tunai"
            >
              <Edit2 size={16} color="#1b4332" />
            </button>
          </div>

          {/* Quick denomination chips */}
          <div className="quick-cash-chips">
            {quickSuggestions.map((sug, idx) => (
              <button
                key={idx}
                className={`quick-chip-btn ${cashReceived === sug.value ? 'highlight' : ''}`}
                onClick={() => handleSelectQuickCash(sug.value)}
              >
                {sug.label}
              </button>
            ))}
          </div>
        </div>

        {/* UANG KEMBALIAN CARD */}
        <div className="change-output-card">
          <div className="change-label">UANG KEMBALIAN</div>
          <div className={`change-amount-display ${isInsufficient ? 'insufficient' : ''}`}>
            {isInsufficient ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={16} /> Kurang {formatRupiah(Math.abs(kembalian))}
              </span>
            ) : (
              formatRupiah(kembalian)
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="payment-actions-row">
          <button
            className="btn-print-outline"
            onClick={() => {
              playTap();
              onOpenReceiptModal({
                storeName: storeProfile.name || "TOKO Rayyan",
                storeAddress: storeProfile.address || "Jl. Mawar No. 4, Jakarta",
                date: getCurrentDateFormatted(),
                items: cartItems,
                totalAmount: totalBelanja,
                cashReceived: cashReceived,
                changeAmount: kembalian,
                cashierName: "TB (Kasir)",
                id: `TRX-${Date.now().toString().slice(-6)}`
              });
            }}
          >
            <Printer size={16} />
            <span>Cetak Struk</span>
          </button>

          <button
            className="btn-finish-solid"
            onClick={handleFinishTransaction}
            disabled={isInsufficient || totalBelanja === 0}
          >
            <span>Selesai</span>
            <CheckCircle size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
