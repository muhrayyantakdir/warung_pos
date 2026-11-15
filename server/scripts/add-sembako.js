import { query, db } from '../database/supabase.js';

async function addSembakoProducts() {
  console.log('[Sembako Seed] Menambahkan produk sembako...');

  // 1. Ambil atau buat kategori Sembako
  let sembako = query.get("SELECT id FROM categories WHERE slug = 'sembako'");
  if (!sembako) {
    const res = db.prepare(
      "INSERT INTO categories (name, slug, description) VALUES ('Sembako', 'sembako', 'Beras, minyak, gula, telur dan kebutuhan pokok')"
    ).run();
    sembako = { id: res.lastInsertRowid };
  }

  // 2. Daftar produk sembako lengkap
  const newSembakoProducts = [
    { name: 'Beras Pandan Wangi 5kg', sku: 'BRS-002', barcode: '899123456011', cost: 70000, sell: 78000, stock: 20, unit: 'karung', min_stock: 5 },
    { name: 'Beras Setra Ramos Cap Topi Koki 5kg', sku: 'BRS-003', barcode: '899123456012', cost: 67000, sell: 74000, stock: 15, unit: 'karung', min_stock: 5 },
    { name: 'Minyak Goreng Filma Pouch 2L', sku: 'MYK-002', barcode: '899123456013', cost: 34000, sell: 38500, stock: 25, unit: 'pouch', min_stock: 6 },
    { name: 'Minyak Goreng SunCo 1L', sku: 'MYK-003', barcode: '899123456014', cost: 18000, sell: 20500, stock: 30, unit: 'pouch', min_stock: 8 },
    { name: 'Minyak Goreng Sania 2L', sku: 'MYK-004', barcode: '899123456015', cost: 33000, sell: 37000, stock: 20, unit: 'pouch', min_stock: 5 },
    { name: 'Gula Pasir Rose Brand 1kg', sku: 'GLA-002', barcode: '899123456016', cost: 15000, sell: 17500, stock: 35, unit: 'kg', min_stock: 10 },
    { name: 'Gula Merah Kelapa Super 500g', sku: 'GLA-003', barcode: '899123456017', cost: 11500, sell: 14000, stock: 25, unit: 'bks', min_stock: 5 },
    { name: 'Telur Ayam Kampung 1 Pack (10 butir)', sku: 'TLR-002', barcode: '899123456018', cost: 24000, sell: 28000, stock: 15, unit: 'pack', min_stock: 4 },
    { name: 'Tepung Terigu Cakra Kembar 1kg', sku: 'TPG-002', barcode: '899123456019', cost: 12000, sell: 14000, stock: 25, unit: 'bks', min_stock: 5 },
    { name: 'Tepung Beras Rose Brand 500g', sku: 'TPG-003', barcode: '899123456020', cost: 6800, sell: 8500, stock: 30, unit: 'bks', min_stock: 8 },
    { name: 'Tepung Tapioka Cap Orang Tani 500g', sku: 'TPG-004', barcode: '899123456021', cost: 7200, sell: 9000, stock: 20, unit: 'bks', min_stock: 5 },
    { name: 'Garam Beryodium Cap Kapal 250g', sku: 'GRM-001', barcode: '899123456022', cost: 2500, sell: 3500, stock: 50, unit: 'bks', min_stock: 15 },
    { name: 'Margarin Blue Band Serbaguna 200g', sku: 'MRG-001', barcode: '899123456023', cost: 9000, sell: 11000, stock: 40, unit: 'sachet', min_stock: 10 },
    { name: 'Susu Kental Manis Frisian Flag Cokelat 370g', sku: 'SKM-001', barcode: '899123456024', cost: 11200, sell: 13500, stock: 24, unit: 'kaleng', min_stock: 6 },
    { name: 'Susu Kental Manis Indomilk Putih 370g', sku: 'SKM-002', barcode: '899123456025', cost: 11000, sell: 13000, stock: 24, unit: 'kaleng', min_stock: 6 },
    { name: 'Santan Kelapa Kara 65ml', sku: 'STN-001', barcode: '899123456026', cost: 3000, sell: 3800, stock: 60, unit: 'pcs', min_stock: 15 },
    { name: 'Bawang Merah Brebes 500g', sku: 'BWG-001', barcode: '899123456027', cost: 18000, sell: 22000, stock: 15, unit: 'kantong', min_stock: 5 },
    { name: 'Bawang Putih Kating 500g', sku: 'BWG-002', barcode: '899123456028', cost: 20000, sell: 24000, stock: 15, unit: 'kantong', min_stock: 5 }
  ];

  const insertProd = db.prepare(`
    INSERT INTO products (category_id, name, sku, barcode, cost_price, selling_price, stock, unit, min_stock_alert, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const insertMovement = db.prepare(`
    INSERT INTO stock_movements (product_id, type, quantity, before_stock, after_stock, notes)
    VALUES (?, 'IN', ?, 0, ?, 'Stok awal produk sembako baru')
  `);

  let addedCount = 0;
  for (const item of newSembakoProducts) {
    const existing = query.get('SELECT id FROM products WHERE sku = ?', item.sku);
    if (!existing) {
      const res = insertProd.run(
        sembako.id,
        item.name,
        item.sku,
        item.barcode,
        item.cost,
        item.sell,
        item.stock,
        item.unit,
        item.min_stock
      );
      insertMovement.run(res.lastInsertRowid, item.stock, item.stock);
      addedCount++;
    }
  }

  const allCount = query.get('SELECT COUNT(*) as count FROM products WHERE is_active = 1').count;
  const sembakoCount = query.get('SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1', sembako.id).count;

  console.log(`✅ Berhasil menambahkan ${addedCount} produk sembako baru.`);
  console.log(`📦 Total produk kategori sembako sekarang: ${sembakoCount}`);
  console.log(`🏪 Total seluruh produk aktif di warung: ${allCount}`);
}

addSembakoProducts();
