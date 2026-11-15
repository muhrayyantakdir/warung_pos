import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  AlertTriangle,
  Package
} from 'lucide-react';
import { api } from '../services/api';
import { formatRupiah, formatNumber } from '../utils/format';

export default function PosPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Cart state
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Pelanggan Umum');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');

  useEffect(() => {
    async function loadPosData() {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          api.getProducts(),
          api.getCategories()
        ]);
        if (prodRes.success) setProducts(prodRes.data);
        if (catRes.success) setCategories(catRes.data);
      } catch (err) {
        console.error('POS load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPosData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || String(p.category_id) === String(selectedCategory);
    const matchesSearch = !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    return matchesCat && matchesSearch;
  });

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert(`Stok "${product.name}" habis!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Stok maksimal untuk "${product.name}" adalah ${product.stock} ${product.unit}`);
          return prev;
        }
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.stock) {
            alert(`Stok maksimal adalah ${item.stock}`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Kosongkan semua barang dari keranjang belanja?')) {
      setCart([]);
      setCashReceived('');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  const totalAmount = subtotal;
  const cashNum = Number(cashReceived) || 0;
  const changeAmount = cashNum >= totalAmount ? cashNum - totalAmount : 0;

  return (
    <div className="page-container" style={{ maxWidth: '1600px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Product Catalog & Search */}
        <div>
          {/* Search & Category Filter */}
          <div className="filter-bar" style={{ marginBottom: '16px' }}>
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon-inside" />
              <input
                type="text"
                className="search-input-field"
                placeholder="Cari nama barang di kasir..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '160px', padding: '8px 12px' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Product Items Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredProducts.map(prod => {
              const isOutOfStock = prod.stock <= 0;
              const isLowStock = prod.stock <= prod.min_stock_alert;

              return (
                <div
                  key={prod.id}
                  onClick={() => !isOutOfStock && addToCart(prod)}
                  style={{
                    background: 'white',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    opacity: isOutOfStock ? 0.5 : 1,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { if (!isOutOfStock) e.currentTarget.style.borderColor = 'var(--brand-primary)'; }}
                  onMouseLeave={(e) => { if (!isOutOfStock) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>
                        {prod.category_name || 'Umum'}
                      </span>
                      <span className={`badge ${isOutOfStock ? 'badge-danger' : isLowStock ? 'badge-warning' : 'badge-muted'}`} style={{ fontSize: '10px' }}>
                        {prod.stock} {prod.unit}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', lineHeight: '1.3' }}>
                      {prod.name}
                    </h4>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontWeight: '800', color: 'var(--brand-primary)', fontSize: '14px' }}>
                      {formatRupiah(prod.selling_price)}
                    </span>
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isOutOfStock ? '#cbd5e1' : 'var(--brand-primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Cart & Fast Checkout */}
        <div className="card" style={{ position: 'sticky', top: '80px' }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={18} style={{ color: 'var(--brand-primary)' }} />
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Keranjang Kasir</h3>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={clearCart}
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                <Trash2 size={12} />
                <span>Kosongkan</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="card-body" style={{ padding: '16px 20px', maxHeight: '320px', overflowY: 'auto' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
                <ShoppingCart size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <p style={{ fontSize: '13px', fontWeight: '500' }}>Keranjang Belanja Masih Kosong</p>
                <p style={{ fontSize: '11.5px', marginTop: '4px' }}>Klik produk di sebelah kiri untuk memasukkan ke struk</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {cart.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px',
                      background: 'var(--surface-muted)',
                      borderRadius: '8px',
                      gap: '8px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {formatRupiah(item.selling_price)} / {item.unit}
                      </p>
                    </div>

                    {/* Qty Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '70px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                        {formatRupiah(item.selling_price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Calculations */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--surface-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Tagihan:</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--brand-primary)' }}>
                {formatRupiah(totalAmount)}
              </span>
            </div>

            {/* Quick Payment Input */}
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ fontSize: '11.5px' }}>Uang Diterima Pelanggan (Rp)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Contoh: 50000"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                disabled={cart.length === 0}
              />
            </div>

            {cashNum > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px', padding: '6px 10px', background: cashNum >= totalAmount ? 'var(--brand-pale)' : 'var(--danger-soft)', borderRadius: '6px' }}>
                <span>Uang Kembalian:</span>
                <span style={{ fontWeight: '700', color: cashNum >= totalAmount ? 'var(--brand-primary)' : 'var(--danger-text)' }}>
                  {cashNum >= totalAmount ? formatRupiah(changeAmount) : 'Uang Kurang'}
                </span>
              </div>
            )}

            <button
              type="button"
              className="btn btn-accent"
              style={{ width: '100%', padding: '12px' }}
              disabled={cart.length === 0 || (cashNum > 0 && cashNum < totalAmount)}
              onClick={() => alert('Fitur transaksi penuh dan simpan nota ke database akan diaktifkan secara komprehensif pada Tahap Kasir selanjutnya!')}
            >
              <Banknote size={18} />
              <span>Selesaikan Pembayaran & Cetak</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
