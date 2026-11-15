import { supabase, isSupabaseAlive, db, query } from '../database/supabase.js';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

// ─── GET ALL CATEGORIES ───────────────────────────────────────────────────────
export const getCategories = async (req, res) => {
  try {
    if (await isSupabaseAlive()) {
      const { data: categories, error } = await supabase
        .from('categories')
        .select(`
          *,
          products!left(id)
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      const result = (categories || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        created_at: cat.created_at,
        product_count: Array.isArray(cat.products) ? cat.products.length : 0
      }));

      return res.json({ success: true, data: result });
    }

    // ── FALLBACK SQLITE ────────────────────────────────────────────────────────
    const categories = query.all(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    return res.json({ success: true, data: categories });
  } catch (error) {
    console.error('[CategoryController:getCategories]', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data kategori', error: error.message });
  }
};

// ─── CREATE CATEGORY ──────────────────────────────────────────────────────────
export const createCategory = async (req, res) => {
  try {
    const { name, description = '' } = req.body;

    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });

    const trimmedName = name.trim();
    const slug = slugify(trimmedName);

    if (await isSupabaseAlive()) {
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .or(`name.eq.${trimmedName},slug.eq.${slug}`)
        .maybeSingle();

      if (existing)
        return res.status(400).json({ success: false, message: `Kategori '${trimmedName}' sudah ada` });

      const { data: created, error } = await supabase
        .from('categories')
        .insert({ name: trimmedName, slug, description: description.trim() || null })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ success: true, message: 'Kategori berhasil ditambahkan', data: { ...created, product_count: 0 } });
    }

    // ── FALLBACK SQLITE ────────────────────────────────────────────────────────
    const existing = query.get('SELECT id FROM categories WHERE name = ? OR slug = ?', trimmedName, slug);
    if (existing) {
      return res.status(400).json({ success: false, message: `Kategori '${trimmedName}' sudah ada` });
    }

    const stmt = db.prepare('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)');
    const result = stmt.run(trimmedName, slug, description ? description.trim() : null);

    const created = query.get('SELECT * FROM categories WHERE id = ?', result.lastInsertRowid);
    return res.status(201).json({ success: true, message: 'Kategori berhasil ditambahkan', data: { ...created, product_count: 0 } });
  } catch (error) {
    console.error('[CategoryController:createCategory]', error);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan kategori', error: error.message });
  }
};

// ─── UPDATE CATEGORY ──────────────────────────────────────────────────────────
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });

    const trimmedName = name.trim();
    const slug = slugify(trimmedName);

    if (await isSupabaseAlive()) {
      const { data: existing } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!existing)
        return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });

      const { data: duplicate } = await supabase
        .from('categories')
        .select('id')
        .or(`name.eq.${trimmedName},slug.eq.${slug}`)
        .neq('id', id)
        .maybeSingle();

      if (duplicate)
        return res.status(400).json({ success: false, message: `Kategori '${trimmedName}' sudah ada` });

      const { data: updated, error } = await supabase
        .from('categories')
        .update({
          name: trimmedName,
          slug,
          description: description !== undefined ? (description ? description.trim() : null) : existing.description
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.json({ success: true, message: 'Kategori berhasil diperbarui', data: updated });
    }

    // ── FALLBACK SQLITE ────────────────────────────────────────────────────────
    const existing = query.get('SELECT * FROM categories WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    const duplicate = query.get('SELECT id FROM categories WHERE (name = ? OR slug = ?) AND id != ?', trimmedName, slug, Number(id));
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Kategori '${trimmedName}' sudah ada` });
    }

    db.prepare('UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?')
      .run(trimmedName, slug, description !== undefined ? (description ? description.trim() : null) : existing.description, Number(id));

    const updated = query.get('SELECT * FROM categories WHERE id = ?', Number(id));
    return res.json({ success: true, message: 'Kategori berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('[CategoryController:updateCategory]', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui kategori', error: error.message });
  }
};

// ─── DELETE CATEGORY ──────────────────────────────────────────────────────────
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (await isSupabaseAlive()) {
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (!existing)
        return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });

      await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', id);

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.json({ success: true, message: 'Kategori berhasil dihapus' });
    }

    // ── FALLBACK SQLITE ────────────────────────────────────────────────────────
    const existing = query.get('SELECT * FROM categories WHERE id = ?', Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    db.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?').run(Number(id));
    db.prepare('DELETE FROM categories WHERE id = ?').run(Number(id));

    return res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('[CategoryController:deleteCategory]', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus kategori', error: error.message });
  }
};
