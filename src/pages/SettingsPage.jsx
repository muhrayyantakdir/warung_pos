import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Phone,
  MapPin,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    store_name: '',
    address: '',
    phone: '',
    receipt_header: '',
    receipt_footer: '',
    low_stock_threshold: 5
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSettings();
      if (res.success) {
        setFormData({
          store_name: res.data.store_name || '',
          address: res.data.address || '',
          phone: res.data.phone || '',
          receipt_header: res.data.receipt_header || '',
          receipt_footer: res.data.receipt_footer || '',
          low_stock_threshold: res.data.low_stock_threshold || 5
        });
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat pengaturan toko');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.store_name.trim()) {
      setError('Nama warung/toko tidak boleh kosong');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await api.updateSettings(formData);
      if (res.success) {
        setNotification('Pengaturan toko dan format struk berhasil disimpan');
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '60px' }}>
        <RefreshCw className="animate-spin" size={28} style={{ margin: '0 auto 12px' }} />
        <p>Memuat pengaturan toko...</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      {notification && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
          Pengaturan Warung & Struk Pembayaran
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Atur identitas warung yang akan dicetak pada struk belanja pelanggan
        </p>
      </div>

      <form onSubmit={handleSave}>
        {/* Card: Profil Warung */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Store size={18} style={{ color: 'var(--brand-primary)' }} />
              <h2>Identitas Warung</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Nama Warung / Toko *</label>
              <input
                type="text"
                name="store_name"
                className="form-input"
                placeholder="Contoh: WARUNG POS REZEKI"
                value={formData.store_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Alamat Lengkap</label>
              <textarea
                name="address"
                className="form-textarea"
                rows="2"
                placeholder="Alamat toko yang akan tercetak di struk..."
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                name="phone"
                className="form-input"
                placeholder="Contoh: 0812-3456-7890"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Card: Konfigurasi Struk */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: 'var(--brand-primary)' }} />
              <h2>Format Struk Belanja</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Pesan Sambutan (Header Struk)</label>
              <input
                type="text"
                name="receipt_header"
                className="form-input"
                placeholder="Contoh: Selamat Berbelanja di Warung Kami"
                value={formData.receipt_header}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pesan Penutup (Footer Struk)</label>
              <input
                type="text"
                name="receipt_footer"
                className="form-input"
                placeholder="Contoh: Barang yang sudah dibeli tidak dapat ditukar"
                value={formData.receipt_footer}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Batas Default Peringatan Stok Menipis</label>
              <input
                type="number"
                name="low_stock_threshold"
                min="1"
                className="form-input"
                value={formData.low_stock_threshold}
                onChange={handleChange}
              />
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Nilai standar batas minimum jika produk tidak diisi khusus
              </span>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            <Save size={16} />
            <span>{saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
