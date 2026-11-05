import React, { useState, useMemo } from 'react';
import { ChevronLeft, Search, ArrowRight, X } from 'lucide-react';
import { formatRupiah } from '../utils/format';
import { playBeep, playTap, playError } from '../utils/sound';

export default function ScreenTransaksiBaru({
  products,
  cart,
  onUpdateCartQty,
  onNavigate,
  onProceedToPayment
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const categories = ["Semua", "Sembako", "Makanan", "Minuman", "Kebersihan"];

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = selectedCategory === "Semua" || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Compute total items and total price in cart
  const cartSummary = useMemo(() => {
    let totalItemsCount = 0;
    let totalPrice = 0;
    let distinctCount = 0;

    Object.entries(cart).forEach(([prodId, qty]) => {
      if (qty > 0) {
        const prod = products.find(p => p.id === Number(prodId));
        if (prod) {
          totalItemsCount += qty;
          distinctCount += 1;
          totalPrice += prod.price * qty;
        }
      }
    });

    return { totalItemsCount, distinctCount, totalPrice };
  }, [cart, products]);

  const handleIncrement = (product) => {
    const currentQty = cart[product.id] || 0;
    if (currentQty >= product.stock) {
      playError();
      alert(`Stok ${product.name} hanya tersisa ${product.stock} pcs!`);
      return;
    }
    playBeep();
    onUpdateCartQty(product.id, currentQty + 1);
  };

  const handleDecrement = (product) => {
    const currentQty = cart[product.id] || 0;
    if (currentQty > 0) {
      playTap();
      onUpdateCartQty(product.id, currentQty - 1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Top App Bar */}
      <div className="app-bar">
        <div className="app-bar-left">
          <button 
            className="back-btn" 
            onClick={() => onNavigate(1)}
            aria-label="Kembali ke Beranda"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="app-bar-title">Transaksi Baru</div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="search-bar-wrapper">
        <div className="search-input-pill">
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Cari produk: beras, kopi, sabun..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
            >
              <X size={14} color="#94a3b8" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="category-chips-row">
        {categories.map(cat => (
          <button
            key={cat}
            className={`cat-chip ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => {
              playTap();
              setSelectedCategory(cat);
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="product-trans-list">
        {filteredProducts.map(product => {
          const qtyInCart = cart[product.id] || 0;
          const isLowStock = product.stock <= 5 && product.stock > 0;
          const isOutOfStock = product.stock <= 0;

          return (
            <div 
              key={product.id} 
              className={`product-trans-card ${qtyInCart > 0 ? 'in-cart' : ''}`}
            >
              <div className="product-info-left">
                <div 
                  className="product-icon-box"
                  style={{ background: product.color || '#e8f5e9' }}
                >
                  {product.icon || "📦"}
                </div>
                <div className="product-details">
                  <div className="product-name">{product.name}</div>
                  <div className="product-price">{formatRupiah(product.price)}</div>
                  <div className="stock-hint">
                    {isOutOfStock ? (
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>Stok Habis</span>
                    ) : isLowStock ? (
                      <span style={{ color: '#ea580c', fontWeight: 600 }}>Sisa: {product.stock}</span>
                    ) : (
                      <span>Stok: {product.stock}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="qty-stepper">
                <button
                  className="btn-qty-minus"
                  onClick={() => handleDecrement(product)}
                  disabled={qtyInCart === 0}
                  aria-label="Kurangi kuantitas"
                >
                  -
                </button>
                <span className="qty-display-num">{qtyInCart}</span>
                <button
                  className="btn-qty-plus"
                  onClick={() => handleIncrement(product)}
                  disabled={isOutOfStock || qtyInCart >= product.stock}
                  aria-label="Tambah kuantitas"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="empty-state-box">
            <div className="icon">🔍</div>
            <p>Produk "{searchQuery}" tidak ditemukan</p>
          </div>
        )}
      </div>

      {/* Floating Bottom Checkout Bar */}
      <div className="floating-checkout-bar">
        <div className="checkout-bar-left">
          <div className="total-caption">
            Total Belanja ({cartSummary.distinctCount} Barang)
          </div>
          <div className="total-price-val">
            {formatRupiah(cartSummary.totalPrice)}
          </div>
        </div>

        <button
          className="btn-pay-green"
          onClick={() => {
            playTap();
            onProceedToPayment();
          }}
          disabled={cartSummary.totalPrice === 0}
        >
          <span>Bayar</span>
          <ArrowRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
