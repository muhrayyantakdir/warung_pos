import { db, query } from '../database/index.js';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// GET all categories with product counts
export const getCategories = (req, res) => {
  try {
    const categories = query.all(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('[CategoryController:getCategories]', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kategori', error: error.message });
  }
};

// CREATE category
export const createCategory = (req, res) => {
  try {
    const { name, description = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
    }

    const trimmedName = name.trim();
    const slug = slugify(trimmedName);

    // Cek duplikasi
    const existing = query.get('SELECT id FROM categories WHERE name = ? OR slug = ?', trimmedName, slug);
    if (existing) {
      return res.status(400).json({ success: false, message: `Kategori '${trimmedName}' sudah ada` });
    }

    const stmt = db.prepare('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)');
    const result = stmt.run(trimmedName, slug, description ? description.trim() : null);

    const created = query.get('SELECT * FROM categories WHERE id = ?', result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Kategori berhasil ditambahkan', data: created });
  } catch (error) {
    console.error('[CategoryController:createCategory]', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan kategori', error: error.message });
  }
};

// UPDATE category
export const updateCategory = (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existing = query.get('SELECT * FROM categories WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
    }

    const trimmedName = name.trim();
    const slug = slugify(trimmedName);

    // Cek duplikasi selain id yang sedang diedit
    const duplicate = query.get('SELECT id FROM categories WHERE (name = ? OR slug = ?) AND id != ?', trimmedName, slug, Number(id));
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Kategori '${trimmedName}' sudah ada` });
    }

    db.prepare('UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?')
      .run(trimmedName, slug, description !== undefined ? (description ? description.trim() : null) : existing.description, Number(id));

    const updated = query.get('SELECT * FROM categories WHERE id = ?', Number(id));
    res.json({ success: true, message: 'Kategori berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('[CategoryController:updateCategory]', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui kategori', error: error.message });
  }
};

// DELETE category
export const deleteCategory = (req, res) => {
  try {
    const { id } = req.params;
    const existing = query.get('SELECT * FROM categories WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    // Set product category_id to NULL before deleting
    db.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?').run(Number(id));
    db.prepare('DELETE FROM categories WHERE id = ?').run(Number(id));

    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('[CategoryController:deleteCategory]', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus kategori', error: error.message });
  }
};
