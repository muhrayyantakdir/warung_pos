import { supabase, isSupabaseAlive, db, query } from '../database/supabase.js';

// ─── GET ALL PRODUCTS ─────────────────────────────────────────────────────────
export const getProducts = async (req, res) => {
  try {
    const { search = '', category_id, low_stock, sort = 'name', order = 'ASC' } = req.query;

    if (await isSupabaseAlive()) {
      const allowedSorts = { name: 'name', cost_price: 'cost_price', selling_price: 'selling_price', stock: 'stock', created_at: 'created_at' };
      const sortField = allowedSorts[sort] || 'name';
      const ascending = order.toUpperCase() !== 'DESC';

      let queryBuilder = supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)
        .order(sortField, { ascending });

      if (search.trim()) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%,barcode.ilike.%${search.trim()}%`
        );
      }

      if (category_id && category_id !== 'all') {
        queryBuilder = queryBuilder.eq('category_id', Number(category_id));
      }

      const { data: products, error } = await queryBuilder;
      if (error) throw error;

      let result = (products || []).map(p => ({
        ...p,
        category_name: p.categories ? p.categories.name : null,
        categories: undefined
      }));

      if (low_stock === 'true') {
        result = result.filter(p => p.stock <= p.min_stock_alert);
      }

      return res.json({ success: true, data: result, count: result.length });
    }

    // ── FALLBACK SQLITE LOKAL ──────────────────────────────────────────────────
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

    const allowedSorts = ['name', 'cost_price', 'selling_price', 'stock', 'created_at'];
    const sortField = allowedSorts.includes(sort) ? `p.${sort}` : 'p.name';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    sql += ` ORDER BY ${sortField} ${sortOrder}`;

    const products = query.all(sql, ...params);
    return res.json({ success: true, data: products, count: products.length });
  } catch (error) {
    console.error('[ProductController:getProducts]', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data produk', error: error.message });
  }
};

// ─── GET PRODUCT BY ID ────────────────────────────────────────────────────────
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (await isSupabaseAlive()) {
      const { data: product, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!product) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
      }

      return res.json({
        success: true,
        data: { ...product, category_name: product.categories?.name || null, categories: undefined }
      });
    }

    // ── FALLBACK SQLITE ────────────────────────────────────────────────────────
    const product = query.get(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.is_active = 1
    `, Number(id));

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    return res.json({ success: true, data: product });
  } catch (error) {
    console.error('[ProductController:getProductById]', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail produk', error: error.message });
  }
};

// ─── CREATE PRODUCT ───────────────────────────────────────────────────────────
export const createProduct = async (req, res) => {
  try {
    const {
      name, sku, barcode = '',
      category_id, cost_price, selling_price,
      stock = 0, unit = 'pcs',
      min_stock_alert = 5, image_url = null
    } = req.body;

    // Validasi
    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: 'Nama produk wajib diisi' });

    if (cost_price === undefined || isNaN(cost_price) || Number(cost_price) < 0)
      return res.status(400).json({ success: false, message: 'Harga modal harus berupa angka valid (>= 0)' });
    if (selling_price === undefined || isNaN(selling_price) || Number(selling_price) < 0)
      return res.status(400).json({ success: false, message: 'Harga jual harus berupa angka valid (>= 0)' });
    if (Number(selling_price) < Number(cost_price))
      return res.status(400).json({ success: false, message: 'Harga jual tidak boleh lebih kecil dari harga modal' });
    if (stock === undefined || isNaN(stock) || Number(stock) < 0)
      return res.status(400).json({ success: false, message: 'Jumlah stok harus berupa bilangan valid (>= 0)' });

    // Jika SKU tidak diisi dari form (disederhanakan), buat otomatis secara unik
    const cleanSku = (sku && sku.trim())
      ? sku.trim().toUpperCase()
      : `PRD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
    const cleanName = name.trim();
    const initialStock = Math.floor(Number(stock));

    if (await isSupabaseAlive()) {
      const { data: existingSku } = await supabase
        .from('products')
        .select('id')
        .eq('sku', cleanSku)
        .maybeSingle();

      if (existingSku) {
        return res.status(400).json({ success: false, message: `SKU '${sku}' sudah digunakan oleh produk lain` });
      }

      let validCategoryId = null;
      if (category_id) {
        const { data: cat } = await supabase.from('categories').select('id').eq('id', Number(category_id)).maybeSingle();
        if (cat) validCategoryId = cat.id;
      }

      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          name: cleanName,
          sku: cleanSku,
          barcode: barcode ? barcode.trim() : null,
          category_id: validCategoryId,
          cost_price: Number(cost_price),
          selling_price: Number(selling_price),
          stock: initialStock,
          unit: unit.trim() || 'pcs',
          min_stock_alert: Math.floor(Number(min_stock_alert)) || 5,
          image_url: image_url || null,
          is_active: true
        })
        .select('*, categories(name)')
        .single();

      if (error) throw error;

      if (initialStock > 0) {
        await supabase.from('stock_movements').insert({
          product_id: newProduct.id,
          type: 'IN',
          quantity: initialStock,
          before_stock: 0,
          after_stock: initialStock,
          notes: 'Stok awal produk baru'
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Produk berhasil ditambahkan',
        data: { ...newProduct, category_name: newProduct.categories?.name || null, categories: undefined }
      });
    }

    // ── FALLBACK SQLITE ────────────────────────────────────────────────────────
    const existingSku = query.get('SELECT id FROM products WHERE sku = ?', cleanSku);
    if (existingSku) {
      return res.status(400).json({ success: false, message: `SKU '${sku}' sudah digunakan oleh produk lain` });
    }

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
      cleanName,
      cleanSku,
      barcode ? barcode.trim() : null,
      validCategoryId,
      Number(cost_price),
      Number(selling_price),
      initialStock,
      unit.trim() || 'pcs',
      Math.floor(Number(min_stock_alert)) || 5,
      image_url || null
    );

    const newProductId = result.lastInsertRowid;

    if (initialStock > 0) {
      db.prepare(`
        INSERT INTO stock_movements (product_id, type, quantity, before_stock, after_stock, notes)
        VALUES (?, 'IN', ?, 0, ?, 'Stok awal produk baru')
      `).run(newProductId, initialStock, initialStock);
    }

    const createdProduct = query.get(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, newProductId);

    return res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan',
      data: createdProduct
    });
  } catch (error) {
    console.error('[ProductController:createProduct]', error);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan produk', error: error.message });
  }
};

// ─── UPDATE PRODUCT ───────────────────────────────────────────────────────────
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, sku, barcode, category_id,
      cost_price, selling_price, stock,
      unit, min_stock_alert, image_url
    } = req.body;

    if (await isSupabaseAlive()) {
      const { data: existing } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
      }

      if (name !== undefined && !name.trim())
        return res.status(400).json({ success: false, message: 'Nama produk tidak boleh kosong' });

      const targetSku = (sku && sku.trim()) ? sku.trim().toUpperCase() : existing.sku;

      if (targetSku !== existing.sku) {
        const { data: duplicateSku } = await supabase
          .from('products')
          .select('id')
          .eq('sku', targetSku)
          .neq('id', id)
          .maybeSingle();
        if (duplicateSku) {
          return res.status(400).json({ success: false, message: `SKU '${targetSku}' sudah digunakan oleh produk lain` });
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
        if (!category_id) {
          validCategoryId = null;
        } else {
          const { data: cat } = await supabase.from('categories').select('id').eq('id', Number(category_id)).maybeSingle();
          validCategoryId = cat ? cat.id : null;
        }
      }

      const updates = {
        name: name !== undefined ? name.trim() : existing.name,
        sku: targetSku,
        barcode: barcode !== undefined ? (barcode ? barcode.trim() : null) : existing.barcode,
        category_id: validCategoryId,
        cost_price: newCost,
        selling_price: newSell,
        stock: newStock,
        unit: unit !== undefined ? (unit.trim() || 'pcs') : existing.unit,
        min_stock_alert: min_stock_alert !== undefined ? Math.floor(Number(min_stock_alert)) : existing.min_stock_alert,
        image_url: image_url !== undefined ? image_url : existing.image_url,
        updated_at: new Date().toISOString()
      };

      const { data: updated, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select('*, categories(name)')
        .single();

      if (error) throw error;

      if (stockDiff !== 0) {
        await supabase.from('stock_movements').insert({
          product_id: Number(id),
          type: 'ADJUSTMENT',
          quantity: Math.abs(stockDiff),
          before_stock: existing.stock,
          after_stock: newStock,
          notes: 'Penyesuaian stok manual pada edit produk'
        });
      }

      return res.json({
        success: true,
        message: 'Produk berhasil diperbarui',
        data: { ...updated, category_name: updated.categories?.name || null, categories: undefined }
      });
    }

    // ── FALLBACK SQLITE ────────────────────────────────────────────────────────
    const existing = query.get('SELECT * FROM products WHERE id = ? AND is_active = 1', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    if (name !== undefined && !name.trim())
      return res.status(400).json({ success: false, message: 'Nama produk tidak boleh kosong' });

    const targetSku = (sku && sku.trim()) ? sku.trim().toUpperCase() : existing.sku;

    if (targetSku !== existing.sku) {
      const duplicateSku = query.get('SELECT id FROM products WHERE sku = ? AND id != ?', targetSku, Number(id));
      if (duplicateSku) {
        return res.status(400).json({ success: false, message: `SKU '${targetSku}' sudah digunakan oleh produk lain` });
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
      targetSku,
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

    return res.json({ success: true, message: 'Produk berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('[ProductController:updateProduct]', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui produk', error: error.message });
  }
};

// ─── DELETE PRODUCT ───────────────────────────────────────────────────────────
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (await isSupabaseAlive()) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
      }

      const { data: txDetail } = await supabase
        .from('transaction_details')
        .select('id')
        .eq('product_id', id)
        .limit(1)
        .maybeSingle();

      if (txDetail) {
        await supabase
          .from('products')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', id);
        return res.json({ success: true, message: 'Produk telah dinonaktifkan (disimpan dalam arsip transaksi)' });
      }

      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

      return res.json({ success: true, message: 'Produk berhasil dihapus permanen' });
    }

    // ── FALLBACK SQLITE ────────────────────────────────────────────────────────
    const existing = query.get('SELECT * FROM products WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    const txDetail = query.get('SELECT id FROM transaction_details WHERE product_id = ? LIMIT 1', Number(id));
    if (txDetail) {
      db.prepare('UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(Number(id));
      return res.json({ success: true, message: 'Produk telah dinonaktifkan (disimpan dalam arsip transaksi)' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(Number(id));
    return res.json({ success: true, message: 'Produk berhasil dihapus permanen' });
  } catch (error) {
    console.error('[ProductController:deleteProduct]', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus produk', error: error.message });
  }
};
