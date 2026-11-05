import { db, query } from './database/index.js';
import { getDashboardStats } from './controllers/dashboardController.js';
import { getProducts, createProduct, updateProduct, deleteProduct } from './controllers/productController.js';
import { getCategories, createCategory, updateCategory, deleteCategory } from './controllers/categoryController.js';
import { getSettings, updateSettings } from './controllers/settingController.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    failedTests++;
  }
}

function runAsync(fn, req) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      json(data) { resolve({ status: this.statusCode, data }); }
    };
    fn(req, res);
  });
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 MEMULAI AUTOMATED TEST SUITE: WARUNG POS');
  console.log('====================================================\n');

  // Pre-test cleanup
  db.prepare("DELETE FROM categories WHERE name LIKE 'Kategori Uji Coba%'").run();
  db.prepare("DELETE FROM products WHERE sku LIKE '%TEST%' OR sku = 'KOP-GD-001'").run();

  // 1. Test Database WAL Mode & Foreign Keys
  const journalMode = query.get('PRAGMA journal_mode;').journal_mode;
  assert(journalMode.toLowerCase() === 'wal', `Database WAL mode aktif (mode: ${journalMode})`);

  const fk = query.get('PRAGMA foreign_keys;').foreign_keys;
  assert(fk === 1, 'Foreign keys enforcement aktif (ACID)');

  // 2. Test Store Settings
  const settingsRes = await runAsync(getSettings, {});
  assert(settingsRes.status === 200 && settingsRes.data.data.store_name, 'Pengaturan toko dapat diambil');

  const updateSettingRes = await runAsync(updateSettings, {
    body: {
      store_name: 'WARUNG POS REZEKI (TEST)',
      address: 'Jl. Merdeka No. 10',
      phone: '081299998888',
      receipt_header: 'Selamat Datang',
      receipt_footer: 'Terima Kasih Banyak',
      low_stock_threshold: 6
    }
  });
  assert(updateSettingRes.status === 200 && updateSettingRes.data.data.store_name === 'WARUNG POS REZEKI (TEST)', 'Pengaturan toko berhasil diperbarui');

  // Restore name
  await runAsync(updateSettings, {
    body: {
      store_name: 'WARUNG POS REZEKI',
      address: 'Jl. Sukajadi No. 45, Bandung',
      phone: '0812-3456-7890',
      receipt_header: 'Terima kasih atas kunjungan Anda',
      receipt_footer: 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan',
      low_stock_threshold: 5
    }
  });

  // 3. Test Categories
  const catListRes = await runAsync(getCategories, {});
  assert(catListRes.status === 200 && catListRes.data.data.length >= 6, `Kategori terdaftar: ${catListRes.data.data.length} kategori`);

  const uniqueCatName = `Kategori Uji Coba ${Date.now()}`;
  const addCatRes = await runAsync(createCategory, {
    body: { name: uniqueCatName, description: 'Testing category' }
  });
  assert(addCatRes.status === 201 && addCatRes.data.data.name === uniqueCatName, 'Tambah kategori baru berhasil');
  const testCatId = addCatRes.data.data.id;

  // Clean up any test product with SKU 'KOP-GD-001' from previous runs
  db.prepare("DELETE FROM products WHERE sku = 'KOP-GD-001'").run();

  // 4. Test Product Validation (Selling < Cost Price should fail with 400)
  const invalidProdRes = await runAsync(createProduct, {
    body: {
      name: 'Produk Salah Harga',
      sku: 'ERR-001',
      cost_price: 10000,
      selling_price: 8000, // Error: jual < modal
      stock: 5,
      unit: 'pcs'
    }
  });
  assert(invalidProdRes.status === 400, 'Validasi pencegahan harga jual lebih kecil dari modal berhasil (400)');

  // 5. Test Product Creation
  const newProdRes = await runAsync(createProduct, {
    body: {
      name: 'Kopi Good Day Cappuccino 25g',
      sku: 'KOP-GD-001',
      barcode: '899988776655',
      category_id: testCatId,
      cost_price: 1800,
      selling_price: 2500,
      stock: 30,
      unit: 'sachet',
      min_stock_alert: 5
    }
  });
  assert(newProdRes.status === 201 && newProdRes.data.data.sku === 'KOP-GD-001', 'Tambah produk baru lengkap berhasil (status 201)');
  const createdProdId = newProdRes.data.data.id;

  // 6. Test Stock Movement Recording for initial stock
  const movement = query.get('SELECT * FROM stock_movements WHERE product_id = ? ORDER BY id DESC LIMIT 1', createdProdId);
  assert(movement && movement.type === 'IN' && movement.after_stock === 30, 'Riwayat stock_movements tercatat otomatis saat produk dibuat');

  // 7. Test Product Search
  const searchRes = await runAsync(getProducts, { query: { search: 'Good Day' } });
  assert(searchRes.status === 200 && searchRes.data.data.some(p => p.sku === 'KOP-GD-001'), 'Pencarian produk real-time bekerja akurat');

  // 8. Test Product Update
  const updateProdRes = await runAsync(updateProduct, {
    params: { id: createdProdId },
    body: {
      name: 'Kopi Good Day Cappuccino (Rasa Cokelat)',
      cost_price: 1900,
      selling_price: 2500,
      stock: 25 // Adjust stock from 30 to 25
    }
  });
  assert(updateProdRes.status === 200 && updateProdRes.data.data.stock === 25, 'Update produk dan perubahan stok berhasil');

  // Verify stock movement adjustment recorded
  const adjustMovement = query.get("SELECT * FROM stock_movements WHERE product_id = ? AND type = 'ADJUSTMENT' LIMIT 1", createdProdId);
  assert(adjustMovement && adjustMovement.before_stock === 30 && adjustMovement.after_stock === 25, 'Audit trail stock_movements mencatat penyesuaian stok');

  // 9. Test Product Deletion
  const deleteProdRes = await runAsync(deleteProduct, { params: { id: createdProdId } });
  assert(deleteProdRes.status === 200, 'Hapus produk berhasil');

  // Clean up test category
  await runAsync(deleteCategory, { params: { id: testCatId } });

  // 10. Test Dashboard Stats
  const dashRes = await runAsync(getDashboardStats, {});
  assert(dashRes.status === 200 && dashRes.data.data.today && dashRes.data.data.chart.length === 7, 'Dashboard stats menghitung omzet hari ini dan grafik 7 hari dari DB');

  console.log('\n====================================================');
  console.log(`📊 HASIL PENGUJIAN: ${passedTests} LULUS, ${failedTests} GAGAL`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
