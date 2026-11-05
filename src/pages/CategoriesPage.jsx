import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  Edit2,
  Trash2,
  Package,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete
  const [deletingCat, setDeletingCat] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCategories();
      if (res.success) setCategories(res.data);
    } catch (err) {
      setError(err.message || 'Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description || '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama kategori wajib diisi');
      return;
    }

    try {
      setSaving(true);
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, formData);
        showNotification(`Kategori "${formData.name}" berhasil diperbarui`);
      } else {
        await api.createCategory(formData);
        showNotification(`Kategori "${formData.name}" berhasil dibuat`);
      }
      setIsModalOpen(false);
      await loadCategories();
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan kategori');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCat) return;
    try {
      setDeleting(true);
      await api.deleteCategory(deletingCat.id);
      showNotification(`Kategori "${deletingCat.name}" berhasil dihapus`);
      setDeletingCat(null);
      await loadCategories();
    } catch (err) {
      alert(`Gagal menghapus kategori: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      {notification && (
        <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          <CheckCircle2 size={18} />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
            Kelola Kategori Produk
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Kelompokkan barang dagangan agar kasir mudah menemukan produk
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleOpenAdd}
        >
          <FolderPlus size={18} />
          <span>Tambah Kategori Baru</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {categories.map((cat) => (
          <div key={cat.id} className="card">
            <div className="card-header" style={{ padding: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
                  {cat.name}
                </h3>
                <span className="badge badge-muted" style={{ marginTop: '4px' }}>
                  {cat.product_count || 0} Produk
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ padding: '5px' }}
                  onClick={() => handleOpenEdit(cat)}
                  title="Ubah Kategori"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ padding: '5px' }}
                  onClick={() => setDeletingCat(cat)}
                  title="Hapus Kategori"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="card-body" style={{ padding: '16px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              {cat.description || 'Tidak ada deskripsi.'}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>{editingCategory ? 'Ubah Kategori' : 'Tambah Kategori Baru'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-danger">
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Nama Kategori *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Minuman Dingin"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Deskripsi (Opsional)</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Keterangan singkat kelompok barang..."
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={16} />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Kategori'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCat && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger-text)' }}>Hapus Kategori</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13.5px' }}>
                Hapus kategori <strong>"{deletingCat.name}"</strong>?
              </p>
              {deletingCat.product_count > 0 && (
                <p style={{ fontSize: '12px', color: 'var(--warning-text)', marginTop: '8px' }}>
                  Perhatian: Kategori ini memiliki {deletingCat.product_count} produk. Produk tidak akan terhapus, tetapi kategorinya akan diubah menjadi kosong.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setDeletingCat(null)} disabled={deleting}>
                Batal
              </button>
              <button type="submit" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
