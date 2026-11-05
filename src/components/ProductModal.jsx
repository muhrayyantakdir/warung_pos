import React, { useState, useEffect } from 'react';
import { X, Trash2, Check } from 'lucide-react';
import { playTap } from '../utils/sound';

const EMOJI_OPTIONS = ["🌾", "🌻", "🍜", "🧂", "☕", "🍵", "🥚", "🍋", "🥤", "🧼", "🍞", "🧀", "📦"];

export default function ProductModal({
  product, // null if adding new, or existing product object if editing
  isOpen,
  onClose,
  onSave,
  onDelete
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Sembako");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [icon, setIcon] = useState("🌾");

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setCategory(product.category || "Sembako");
      setPrice(String(product.price || ""));
      setStock(String(product.stock || ""));
      setIcon(product.icon || "🌾");
    } else {
      setName("");
      setCategory("Sembako");
      setPrice("");
      setStock("");
      setIcon("🌾");
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Nama produk wajib diisi!");
      return;
    }
    const numPrice = parseInt(price.replace(/[^0-9]/g, ""), 10) || 0;
    const numStock = parseInt(stock.replace(/[^0-9]/g, ""), 10) || 0;

    if (numPrice <= 0) {
      alert("Harga jual harus lebih dari Rp 0!");
      return;
    }

    const payload = {
      ...(product || {}),
      name: name.trim(),
      category,
      price: numPrice,
      stock: numStock,
      icon,
      color: product?.color || "#f8fafc"
    };

    onSave(payload);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{product ? "Edit Produk Toko" : "Tambah Produk Baru"}</h3>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Product Name */}
          <div className="form-group">
            <label className="form-label">Nama Produk *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Beras Rojo Lele 5kg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Sembako">Sembako</option>
              <option value="Makanan">Makanan</option>
              <option value="Minuman">Minuman</option>
              <option value="Kebersihan">Kebersihan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Price & Stock Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Harga Jual (Rp) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="75000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stok Jumlah (Pcs) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="12"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Icon Selector */}
          <div className="form-group">
            <label className="form-label">Ikon / Emoji Produk</label>
            <div className="emoji-picker-row">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  className={`emoji-choice-btn ${icon === emoji ? 'selected' : ''}`}
                  onClick={() => {
                    playTap();
                    setIcon(emoji);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Submit & Delete actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {product && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Yakin ingin menghapus ${product.name}?`)) {
                    onDelete(product.id);
                  }
                }}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Hapus Produk"
              >
                <Trash2 size={16} />
              </button>
            )}

            <button
              type="submit"
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: 'var(--shadow-orange)'
              }}
            >
              <Check size={16} strokeWidth={2.5} />
              <span>{product ? "Simpan Perubahan" : "Tambah ke Daftar Produk"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
