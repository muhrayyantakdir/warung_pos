import { db, query } from '../database/index.js';

// GET all products with optional search, category filter, and low_stock filter
export const getProducts = (req, res) => {
  try {
    const { search = '', category_id, low_stock, sort = 'name', order = 'ASC' } = req.query;

    let sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
    `;
    const params = [];

    if (search.trim()) {
      sql += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category_id && category_id !== 'all') {
      sql += ` AND p.category_id = ?`;
      params.push(Number(category_id));
    }

    if (low_stock === 'true') {
      sql += ` AND p.stock <= p.min_stock_alert`;
    }

    // Sort validation
    const allowedSorts = ['name', 'cost_price', 'selling_price', 'stock', 'created_at'];
    const sortField = allowedSorts.includes(sort) ? `p.${sort}` : 'p.name';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    sql += ` ORDER BY ${sortField} ${sortOrder}`;

    const products = query.all(sql, ...params);
    res.json({ success: true, data: products, count: products.length });
  } catch (error) {
    console.error('[ProductController:getProducts]', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data produk', error: error.message });
  }
};

// GET single product by ID
export const getProductById = (req, res) => {
  try {
    const { id } = req.params;
    const product = query.get(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.is_active = 1
    `, Number(id));

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('[ProductController:getProductById]', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail produk', error: error.message });
  }
};

// CREATE new product
export const createProduct = (req, res) => {
  try {
    const {
      name,
      sku,
      barcode = '',
      category_id,
      cost_price,
      selling_price,
      stock = 0,
      unit = 'pcs',
      min_stock_alert = 5,
      image_url = null
    } = req.body;

    // Validasi input
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama produk wajib diisi' });
    }
    if (!sku || !sku.trim()) {
      return res.status(400).json({ success: false, message: 'SKU/Kode produk wajib diisi' });
    }
    if (cost_price === undefined || isNaN(cost_price) || Number(cost_price) < 0) {
      return res.status(400).json({ success: false, message: 'Harga modal harus berupa angka valid (>= 0)' });
    }
    if (selling_price === undefined || isNaN(selling_price) || Number(selling_price) < 0) {
      return res.status(400).json({ success: false, message: 'Harga jual harus berupa angka valid (>= 0)' });
    }
    if (Number(selling_price) < Number(cost_price)) {
      return res.status(400).json({ success: false, message: 'Harga jual tidak boleh lebih kecil dari harga modal' });
    }
    if (stock === undefined || isNaN(stock) || Number(stock) < 0) {
      return res.status(400).json({ success: false, message: 'Jumlah stok harus berupa bilangan valid (>= 0)' });
    }

    // Cek duplikasi SKU
    const existingSku = query.get('SELECT id FROM products WHERE sku = ?', sku.trim());
    if (existingSku) {
      return res.status(400).json({ success: false, message: `SKU '${sku}' sudah digunakan oleh produk lain` });
    }

    // Pastikan category_id valid jika ada
    let validCategoryId = null;
    if (category_id) {
      const cat = query.get('SELECT id FROM categories WHERE id = ?', Number(category_id));
      if (cat) validCategoryId = cat.id;
    }

    const insertStmt = db.prepare(`
      INSERT INTO products (
        name, sku, barcode, category_id, cost_price, selling_price, stock, unit, min_stock_alert, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      name.trim(),
      sku.trim().toUpperCase(),
      barcode ? barcode.trim() : null,
      validCategoryId,
      Number(cost_price),
      Number(selling_price),
      Math.floor(Number(stock)),
      unit.trim() || 'pcs',
      Math.floor(Number(min_stock_alert)) || 5,
      image_url || null
    );

    const newProductId = result.lastInsertRowid;

    // Record initial stock movement
    if (Number(stock) > 0) {
      db.prepare(`
        INSERT INTO stock_movements (product_id, type, quantity, before_stock, after_stock, notes)
        VALUES (?, 'IN', ?, 0, ?, 'Stok awal produk baru')
      `).run(newProductId, Math.floor(Number(stock)), Math.floor(Number(stock)));
    }

    const createdProduct = query.get(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, newProductId);

    res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan',
      data: createdProduct
    });
  } catch (error) {
    console.error('[ProductController:createProduct]', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan produk', error: error.message });
  }
};

// UPDATE existing product
export const updateProduct = (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      barcode,
      category_id,
      cost_price,
      selling_price,
      stock,
      unit,
      min_stock_alert,
      image_url
    } = req.body;

    const existing = query.get('SELECT * FROM products WHERE id = ? AND is_active = 1', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    // Validasi
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama produk tidak boleh kosong' });
    }
    if (sku !== undefined && !sku.trim()) {
      return res.status(400).json({ success: false, message: 'SKU tidak boleh kosong' });
    }
    if (sku && sku.trim().toUpperCase() !== existing.sku) {
      const duplicateSku = query.get('SELECT id FROM products WHERE sku = ? AND id != ?', sku.trim().toUpperCase(), Number(id));
      if (duplicateSku) {
        return res.status(400).json({ success: false, message: `SKU '${sku}' sudah digunakan oleh produk lain` });
      }
    }

    const newCost = cost_price !== undefined ? Number(cost_price) : existing.cost_price;
    const newSell = selling_price !== undefined ? Number(selling_price) : existing.selling_price;
    if (newSell < newCost) {
      return res.status(400).json({ success: false, message: 'Harga jual tidak boleh lebih kecil dari harga modal' });
    }

    const newStock = stock !== undefined ? Math.floor(Number(stock)) : existing.stock;
    const stockDiff = newStock - existing.stock;

    let validCategoryId = existing.category_id;
    if (category_id !== undefined) {
      if (category_id === '' || category_id === null) {
        validCategoryId = null;
      } else {
        const cat = query.get('SELECT id FROM categories WHERE id = ?', Number(category_id));
        validCategoryId = cat ? cat.id : null;
      }
    }

    db.prepare(`
      UPDATE products SET
        name = ?,
        sku = ?,
        barcode = ?,
        category_id = ?,
        cost_price = ?,
        selling_price = ?,
        stock = ?,
        unit = ?,
        min_stock_alert = ?,
        image_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name !== undefined ? name.trim() : existing.name,
      sku !== undefined ? sku.trim().toUpperCase() : existing.sku,
      barcode !== undefined ? (barcode ? barcode.trim() : null) : existing.barcode,
      validCategoryId,
      newCost,
      newSell,
      newStock,
      unit !== undefined ? (unit.trim() || 'pcs') : existing.unit,
      min_stock_alert !== undefined ? Math.floor(Number(min_stock_alert)) : existing.min_stock_alert,
      image_url !== undefined ? image_url : existing.image_url,
      Number(id)
    );

    // Record stock movement if stock was directly adjusted
    if (stockDiff !== 0) {
      db.prepare(`
        INSERT INTO stock_movements (product_id, type, quantity, before_stock, after_stock, notes)
        VALUES (?, 'ADJUSTMENT', ?, ?, ?, 'Penyesuaian stok manual pada edit produk')
      `).run(Number(id), Math.abs(stockDiff), existing.stock, newStock);
    }

    const updated = query.get(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, Number(id));

    res.json({ success: true, message: 'Produk berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('[ProductController:updateProduct]', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui produk', error: error.message });
  }
};

// DELETE product (or soft delete)
export const deleteProduct = (req, res) => {
  try {
    const { id } = req.params;
    const existing = query.get('SELECT * FROM products WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    // Check if product has historical transactions
    const txDetail = query.get('SELECT id FROM transaction_details WHERE product_id = ? LIMIT 1', Number(id));

    if (txDetail) {
      // Soft-delete to preserve transaction history
      db.prepare('UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(Number(id));
      return res.json({ success: true, message: 'Produk telah dinonaktifkan (disimpan dalam arsip transaksi)' });
    }

    // Hard delete if no transactions
    db.prepare('DELETE FROM products WHERE id = ?').run(Number(id));
    res.json({ success: true, message: 'Produk berhasil dihapus permanen' });
  } catch (error) {
    console.error('[ProductController:deleteProduct]', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus produk', error: error.message });
  }
};
