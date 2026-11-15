import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { formatRupiah, formatNumber } from '../utils/format';
import ProductModal from '../components/products/ProductModal';

export default function ProductsPage({ setActivePage }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [sortBy, setSortBy] = useState('name');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodRes, catRes] = await Promise.all([
        api.getProducts({
          search: searchQuery,
          category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
          low_stock: onlyLowStock ? 'true' : undefined
        }),
        api.getCategories()
      ]);

      if (prodRes.success) setProducts(prodRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      setError(err.message || 'Gagal memuat data produk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, onlyLowStock]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price_asc') {
      list.sort((a, b) => a.selling_price - b.selling_price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.selling_price - a.selling_price);
    } else if (sortBy === 'stock_asc') {
      list.sort((a, b) => a.stock - b.stock);
    }
    return list;
  }, [products, sortBy]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (formData) => {
    if (editingProduct) {
      const res = await api.updateProduct(editingProduct.id, formData);
      showNotification(`Produk "${formData.name}" berhasil diperbarui`);
    } else {
      const res = await api.createProduct(formData);
      showNotification(`Produk "${formData.name}" berhasil ditambahkan`);
    }
    await loadData();
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      setDeleting(true);
      await api.deleteProduct(deletingProduct.id);
      showNotification(`Produk "${deletingProduct.name}" berhasil dihapus`);
      setDeletingProduct(null);
      await loadData();
    } catch (err) {
      alert(`Gagal menghapus produk: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          <CheckCircle2 size={18} />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header & Primary Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
            Daftar Produk & Stok Barang
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Total {products.length} produk terdaftar dalam database
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setActivePage('categories')}
          >
            <span>Kelola Kategori</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAdd}
          >
            <Plus size={18} />
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="filter-bar">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon-inside" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Cari nama barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '13px' }}
          >
            <option value="all">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.product_count || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div style={{ minWidth: '160px' }}>
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '13px' }}
          >
            <option value="name">Nama (A-Z)</option>
            <option value="stock_asc">Stok Paling Sedikit</option>
            <option value="price_asc">Harga Jual Termurah</option>
            <option value="price_desc">Harga Jual Termahal</option>
          </select>
        </div>

        {/* Low Stock Toggle Button */}
        <button
          type="button"
          className={`btn btn-sm ${onlyLowStock ? 'btn-accent' : 'btn-outline'}`}
          onClick={() => setOnlyLowStock(!onlyLowStock)}
        >
          <AlertTriangle size={14} />
          <span>Hanya Stok Menipis</span>
        </button>

        {/* Refresh Button */}
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={loadData}
          disabled={loading}
          title="Segarkan data"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Products Table Card */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading && products.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
              <p>Memuat data produk...</p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <Package size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Tidak ada produk yang cocok</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {searchQuery ? `Hasil pencarian untuk "${searchQuery}" tidak ditemukan.` : 'Mulai tambahkan produk ke dalam warung Anda.'}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenAdd}
                style={{ marginTop: '16px' }}
              >
                <Plus size={16} />
                <span>Tambah Produk Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Nama Produk</th>
                    <th>Kategori</th>
                    <th style={{ textAlign: 'right' }}>Harga Modal</th>
                    <th style={{ textAlign: 'right' }}>Harga Jual</th>
                    <th style={{ textAlign: 'center' }}>Stok Saat Ini</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((p) => {
                    const isLow = p.stock <= p.min_stock_alert;
                    const isOut = p.stock <= 0;
                    const margin = p.selling_price - p.cost_price;

                    return (
                      <tr key={p.id}>
                        {/* Nama Produk */}
                        <td>
                          <span style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-main)' }}>
                            {p.name}
                          </span>
                        </td>

                        {/* Kategori */}
                        <td>
                          <span className="badge badge-muted">
                            {p.category_name || 'Umum'}
                          </span>
                        </td>

                        {/* Harga Modal */}
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {formatRupiah(p.cost_price)}
                        </td>

                        {/* Harga Jual */}
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: '700', color: 'var(--brand-primary)' }}>
                            {formatRupiah(p.selling_price)}
                          </span>
                          <div style={{ fontSize: '10.5px', color: 'var(--success-text)' }}>
                            +Rp {formatNumber(margin)}
                          </div>
                        </td>

                        {/* Stok */}
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: '800', fontSize: '14px', color: isOut ? 'var(--danger-red)' : isLow ? 'var(--warning-amber)' : 'inherit' }}>
                            {formatNumber(p.stock)}
                          </span>{' '}
                          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            {p.unit}
                          </span>
                        </td>

                        {/* Status Stok */}
                        <td style={{ textAlign: 'center' }}>
                          {isOut ? (
                            <span className="badge badge-danger">Habis</span>
                          ) : isLow ? (
                            <span className="badge badge-warning" title={`Batas min: ${p.min_stock_alert} ${p.unit}`}>
                              Menipis ({p.stock})
                            </span>
                          ) : (
                            <span className="badge badge-success">Aman</span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '6px' }}
                              onClick={() => handleOpenEdit(p)}
                              title="Ubah Produk"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              style={{ padding: '6px' }}
                              onClick={() => setDeletingProduct(p)}
                              title="Hapus Produk"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Product Add / Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger-text)' }}>Konfirmasi Hapus</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13.5px', color: 'var(--text-main)', marginBottom: '10px' }}>
                Apakah Anda yakin ingin menghapus produk <strong>"{deletingProduct.name}"</strong>?
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Kategori: {deletingProduct.category_name || 'Umum'} • Stok: {deletingProduct.stock} {deletingProduct.unit}
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeletingProduct(null)}
                disabled={deleting}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteProduct}
                disabled={deleting}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
