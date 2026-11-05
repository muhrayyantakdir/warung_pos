import React, { useState } from 'react';
import { ChevronLeft, Filter, Plus, Edit, PlusCircle, MinusCircle, Trash2 } from 'lucide-react';
import { formatRupiah } from '../utils/format';
import { playTap, playBeep } from '../utils/sound';

export default function ScreenKelolaStok({
  products,
  onNavigate,
  onOpenAddModal,
  onOpenEditModal,
  onAdjustStock,
  onDeleteProduct
}) {
  const [filterMode, setFilterMode] = useState("all"); // all, low_stock, sorted

  let displayedProducts = [...products];
  if (filterMode === "low_stock") {
    displayedProducts = displayedProducts.filter(p => p.stock <= 5);
  } else if (filterMode === "sorted_stock_asc") {
    displayedProducts.sort((a, b) => a.stock - b.stock);
  }

  const toggleFilter = () => {
    playTap();
    if (filterMode === "all") setFilterMode("low_stock");
    else if (filterMode === "low_stock") setFilterMode("sorted_stock_asc");
    else setFilterMode("all");
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
          <div className="app-bar-title">Kelola Stok Produk</div>
        </div>
      </div>

      {/* Subheader: DAFTAR PRODUK TOKO (X) and Filter Icon */}
      <div className="stock-screen-header">
        <div className="stock-count-title">
          DAFTAR PRODUK TOKO ({products.length})
          {filterMode === "low_stock" && " • FILTER: STOK MENIPIS"}
          {filterMode === "sorted_stock_asc" && " • URUT: STOK TERENDAH"}
        </div>
        <button 
          className="stock-filter-btn"
          onClick={toggleFilter}
          title={`Filter: ${filterMode}. Klik untuk ganti.`}
        >
          <Filter size={16} color={filterMode !== "all" ? "#f97316" : "#475569"} />
        </button>
      </div>

      {/* Product List */}
      <div className="stock-products-list">
        {displayedProducts.map(product => {
          const isLowStock = product.stock <= 5 && product.stock > 0;
          const isOutOfStock = product.stock <= 0;

          return (
            <div key={product.id} className="stock-item-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div 
                  className="product-icon-box"
                  style={{ background: product.color || '#e8f5e9' }}
                >
                  {product.icon || "📦"}
                </div>
                <div className="product-details" style={{ flex: 1 }}>
                  <div className="product-name">{product.name}</div>
                  <div className="product-price">
                    Harga jual <span style={{ fontWeight: 700 }}>{formatRupiah(product.price)}</span>
                  </div>
                  {product.sku && (
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      SKU: {product.sku}
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Badge & Quick Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isOutOfStock ? (
                  <span className="stock-badge-danger">Habis: 0</span>
                ) : isLowStock ? (
                  <span className="stock-badge-warning">Sisa: {product.stock}</span>
                ) : (
                  <span className="stock-badge-safe">Stok: {product.stock}</span>
                )}

                {/* Quick Stock Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button
                    onClick={() => {
                      playBeep();
                      onAdjustStock(product.id, 1);
                    }}
                    title="Tambah 1 Stok"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <PlusCircle size={15} color="#1b4332" />
                  </button>
                  <button
                    onClick={() => {
                      playTap();
                      onAdjustStock(product.id, -1);
                    }}
                    disabled={product.stock <= 0}
                    title="Kurangi 1 Stok"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, opacity: product.stock <= 0 ? 0.3 : 1 }}
                  >
                    <MinusCircle size={15} color="#ea580c" />
                  </button>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => {
                    playTap();
                    onOpenEditModal(product);
                  }}
                  title="Edit Produk"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px' }}
                >
                  <Edit size={14} color="#64748b" />
                </button>
              </div>
            </div>
          );
        })}

        {displayedProducts.length === 0 && (
          <div className="empty-state-box">
            <p>Tidak ada produk pada filter ini</p>
          </div>
        )}
      </div>

      {/* Floating Orange Add Product Button */}
      <div className="floating-add-btn-wrap">
        <button
          className="btn-add-product-orange"
          onClick={() => {
            playTap();
            onOpenAddModal();
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Tambah Produk</span>
        </button>
      </div>
    </div>
  );
}
