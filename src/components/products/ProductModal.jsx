import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

export default function ProductModal({
  isOpen,
  onClose,
  onSave,
  product = null,
  categories = []
}) {
  const isEdit = Boolean(product && product.id);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    cost_price: '',
    selling_price: '',
    stock: '',
    unit: 'pcs',
    min_stock_alert: 5
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category_id: product.category_id ? String(product.category_id) : '',
        cost_price: product.cost_price !== undefined ? String(product.cost_price) : '',
        selling_price: product.selling_price !== undefined ? String(product.selling_price) : '',
        stock: product.stock !== undefined ? String(product.stock) : '0',
        unit: product.unit || 'pcs',
        min_stock_alert: product.min_stock_alert !== undefined ? String(product.min_stock_alert) : '5'
      });
    } else {
      setFormData({
        name: '',
        category_id: categories.length > 0 ? String(categories[0].id) : '',
        cost_price: '',
        selling_price: '',
        stock: '0',
        unit: 'pcs',
        min_stock_alert: 5
      });
    }
    setErrors({});
  }, [product, categories, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Nama produk wajib diisi';
    }

    const cost = Number(formData.cost_price);
    const sell = Number(formData.selling_price);

    if (formData.cost_price === '' || isNaN(cost) || cost < 0) {
      errs.cost_price = 'Harga modal harus berupa angka (min 0)';
    }
    if (formData.selling_price === '' || isNaN(sell) || sell < 0) {
      errs.selling_price = 'Harga jual harus berupa angka (min 0)';
    } else if (sell < cost) {
      errs.selling_price = 'Harga jual tidak boleh lebih kecil dari harga modal';
    }

    if (formData.stock === '' || isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
      errs.stock = 'Stok harus berupa bilangan positif (min 0)';
    }

    if (!formData.unit.trim()) {
      errs.unit = 'Satuan barang wajib diisi (misal: pcs, kg)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);

      // SKU otomatis dibuatkan di latar belakang tanpa membebani input pengguna
      const autoSku = (product && product.sku)
        ? product.sku
        : `PRD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

      await onSave({
        ...formData,
        sku: autoSku,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        cost_price: Number(formData.cost_price),
        selling_price: Number(formData.selling_price),
        stock: Math.floor(Number(formData.stock)),
        min_stock_alert: Math.floor(Number(formData.min_stock_alert)) || 5
      });
      onClose();
    } catch (err) {
      setErrors(prev => ({ ...prev, submit: err.message || 'Gagal menyimpan produk' }));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const costNum = Number(formData.cost_price) || 0;
  const sellNum = Number(formData.selling_price) || 0;
  const marginNum = sellNum - costNum;
  const marginPercent = costNum > 0 ? ((marginNum / costNum) * 100).toFixed(1) : 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3>{isEdit ? 'Ubah Data Produk' : 'Tambah Produk Baru'}</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {isEdit ? 'Perbarui informasi produk dan harga' : 'Masukkan nama, harga jual, dan stok barang'}
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body">
            {errors.submit && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span>{errors.submit}</span>
              </div>
            )}

            {/* Nama Produk */}
            <div className="form-group">
              <label className="form-label">Nama Produk *</label>
              <input
                type="text"
                name="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Contoh: Beras Pandan Wangi 5kg"
                value={formData.name}
                onChange={handleChange}
                autoFocus
              />
              {errors.name && <div className="form-error-text">{errors.name}</div>}
            </div>

            {/* Row: Kategori & Satuan */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select
                  name="category_id"
                  className="form-select"
                  value={formData.category_id}
                  onChange={handleChange}
                >
                  <option value="">-- Tanpa Kategori --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Satuan Barang *</label>
                <input
                  type="text"
                  name="unit"
                  className={`form-input ${errors.unit ? 'error' : ''}`}
                  placeholder="pcs, kg, bks, karung, botol"
                  value={formData.unit}
                  onChange={handleChange}
                />
                {errors.unit && <div className="form-error-text">{errors.unit}</div>}
              </div>
            </div>

            {/* Row: Harga Modal & Harga Jual */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Harga Modal / Beli (Rp) *</label>
                <input
                  type="number"
                  name="cost_price"
                  min="0"
                  step="100"
                  className={`form-input ${errors.cost_price ? 'error' : ''}`}
                  placeholder="Contoh: 65000"
                  value={formData.cost_price}
                  onChange={handleChange}
                />
                {errors.cost_price && <div className="form-error-text">{errors.cost_price}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Harga Jual Kasir (Rp) *</label>
                <input
                  type="number"
                  name="selling_price"
                  min="0"
                  step="100"
                  className={`form-input ${errors.selling_price ? 'error' : ''}`}
                  placeholder="Contoh: 72000"
                  value={formData.selling_price}
                  onChange={handleChange}
                />
                {errors.selling_price && <div className="form-error-text">{errors.selling_price}</div>}
              </div>
            </div>

            {/* Live Profit & Margin Indicator */}
            {costNum > 0 && sellNum > 0 && (
              <div
                style={{
                  background: marginNum >= 0 ? 'var(--brand-pale)' : 'var(--danger-soft)',
                  border: `1px solid ${marginNum >= 0 ? 'var(--brand-mint)' : 'var(--danger-red)'}`,
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12.5px'
                }}
              >
                <span>Perkiraan Keuntungan per Unit:</span>
                <span style={{ fontWeight: '700', color: marginNum >= 0 ? 'var(--brand-primary)' : 'var(--danger-text)' }}>
                  {formatRupiah(marginNum)} ({marginPercent}%)
                </span>
              </div>
            )}

            {/* Row: Stok & Peringatan Minimum */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Jumlah Stok Saat Ini *</label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  className={`form-input ${errors.stock ? 'error' : ''}`}
                  placeholder="0"
                  value={formData.stock}
                  onChange={handleChange}
                />
                {errors.stock && <div className="form-error-text">{errors.stock}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Batas Peringatan Stok Menipis</label>
                <input
                  type="number"
                  name="min_stock_alert"
                  min="0"
                  className="form-input"
                  placeholder="5"
                  value={formData.min_stock_alert}
                  onChange={handleChange}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Pemberitahuan bila sisa stok &le; angka ini
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              <span>{saving ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah Produk')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
