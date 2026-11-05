import { db, query } from './index.js';

export function seedInitialData() {
  console.log('[Seed] Checking initial data...');

  // 1. Seed Store Settings
  const settingsCount = query.get('SELECT COUNT(*) as count FROM store_settings').count;
  if (settingsCount === 0) {
    query.run(`
      INSERT INTO store_settings (id, store_name, address, phone, receipt_header, receipt_footer, low_stock_threshold)
      VALUES (1, 'WARUNG POS REZEKI', 'Jl. Sukajadi No. 45, Bandung', '0812-3456-7890', 'Terima kasih atas kunjungan Anda', 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan', 5)
    `);
    console.log('[Seed] Store settings seeded.');
  }

  // 2. Seed Default Admin User
  const usersCount = query.get('SELECT COUNT(*) as count FROM users').count;
  if (usersCount === 0) {
    query.run(`
      INSERT INTO users (username, password_hash, full_name, role)
      VALUES ('admin', 'admin123', 'Pemilik Warung', 'admin'),
             ('kasir1', 'kasir123', 'Kasir Utama', 'cashier')
    `);
    console.log('[Seed] Default users seeded.');
  }

  // 3. Seed Default Categories
  const categoriesCount = query.get('SELECT COUNT(*) as count FROM categories').count;
  if (categoriesCount === 0) {
    const categories = [
      { name: 'Sembako', slug: 'sembako', description: 'Beras, minyak, gula, telur dan kebutuhan pokok' },
      { name: 'Makanan & Snack', slug: 'makanan-snack', description: 'Mie instan, biskuit, kerupuk, roti' },
      { name: 'Minuman', slug: 'minuman', description: 'Air mineral, kopi sachet, teh, minuman dingin' },
      { name: 'Bumbu Dapur', slug: 'bumbu-dapur', description: 'Kecap, saus, garam, penyedap rasa' },
      { name: 'Kebutuhan Rumah', slug: 'kebutuhan-rumah', description: 'Sabun cuci, pasta gigi, sampo, tisu' },
      { name: 'Rokok & Tembakau', slug: 'rokok-tembakau', description: 'Rokok kretek dan filter' }
    ];

    const insertCat = db.prepare('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)');
    for (const cat of categories) {
      insertCat.run(cat.name, cat.slug, cat.description);
    }
    console.log(`[Seed] ${categories.length} categories seeded.`);
  }

  // 4. Seed Products if empty
  const productsCount = query.get('SELECT COUNT(*) as count FROM products').count;
  if (productsCount === 0) {
    // Map category names to IDs
    const catRows = query.all('SELECT id, slug FROM categories');
    const catMap = {};
    for (const row of catRows) {
      catMap[row.slug] = row.id;
    }

    const sampleProducts = [
      // Sembako
      { name: 'Beras Ramos Super 5kg', sku: 'BRS-001', barcode: '899123456001', cat: 'sembako', cost: 65000, sell: 72000, stock: 15, unit: 'karung', min_stock: 5 },
      { name: 'Minyak Goreng Bimoli 1L', sku: 'MYK-001', barcode: '899123456002', cat: 'sembako', cost: 17500, sell: 20000, stock: 24, unit: 'pouch', min_stock: 6 },
      { name: 'Gula Pasir Gulaku 1kg', sku: 'GLA-001', barcode: '899123456003', cat: 'sembako', cost: 15500, sell: 18000, stock: 20, unit: 'kg', min_stock: 5 },
      { name: 'Telur Ayam Negeri 1kg', sku: 'TLR-001', barcode: '899123456004', cat: 'sembako', cost: 26000, sell: 30000, stock: 12, unit: 'kg', min_stock: 4 },
      { name: 'Tepung Segitiga Biru 1kg', sku: 'TPG-001', barcode: '899123456005', cat: 'sembako', cost: 11000, sell: 13000, stock: 18, unit: 'bks', min_stock: 5 },

      // Makanan & Snack
      { name: 'Indomie Goreng Spesial', sku: 'MIE-001', barcode: '899886620022', cat: 'makanan-snack', cost: 3000, sell: 3500, stock: 85, unit: 'bks', min_stock: 15 },
      { name: 'Indomie Ayam Bawang', sku: 'MIE-002', barcode: '899886620023', cat: 'makanan-snack', cost: 2900, sell: 3500, stock: 60, unit: 'bks', min_stock: 15 },
      { name: 'Roma Kelapa Biskuit 300g', sku: 'BSK-001', barcode: '899100110011', cat: 'makanan-snack', cost: 9500, sell: 12000, stock: 8, unit: 'bks', min_stock: 4 },
      { name: 'Chiki Balls Keju 55g', sku: 'SNK-001', barcode: '899100110012', cat: 'makanan-snack', cost: 4200, sell: 5500, stock: 3, unit: 'bks', min_stock: 5 }, // Low stock sample

      // Minuman
      { name: 'Le Minerale 600ml', sku: 'MNM-001', barcode: '899600160010', cat: 'minuman', cost: 2800, sell: 4000, stock: 48, unit: 'botol', min_stock: 12 },
      { name: 'Teh Pucuk Harum 350ml', sku: 'MNM-002', barcode: '899600160011', cat: 'minuman', cost: 3200, sell: 4500, stock: 36, unit: 'botol', min_stock: 10 },
      { name: 'Kopi Kapal Api Spesial Mix (Renceng)', sku: 'KOP-001', barcode: '899600160012', cat: 'minuman', cost: 13500, sell: 16000, stock: 14, unit: 'renceng', min_stock: 5 },
      { name: 'Ultra Milk Cokelat 250ml', sku: 'MNM-003', barcode: '899600160013', cat: 'minuman', cost: 5800, sell: 7500, stock: 2, unit: 'kotak', min_stock: 5 }, // Low stock sample

      // Bumbu Dapur
      { name: 'Kecap Bango Manis Refill 520ml', sku: 'BMB-001', barcode: '899999900101', cat: 'bumbu-dapur', cost: 21000, sell: 24500, stock: 10, unit: 'pouch', min_stock: 3 },
      { name: 'Royco Rasa Ayam 100g', sku: 'BMB-002', barcode: '899999900102', cat: 'bumbu-dapur', cost: 4500, sell: 6000, stock: 25, unit: 'bks', min_stock: 5 },
      { name: 'Saori Saus Tiram 133ml', sku: 'BMB-003', barcode: '899999900103', cat: 'bumbu-dapur', cost: 9800, sell: 12500, stock: 7, unit: 'botol', min_stock: 3 },

      // Kebutuhan Rumah
      { name: 'Sunlight Jeruk Nipis 650ml', sku: 'SBN-001', barcode: '899777700201', cat: 'kebutuhan-rumah', cost: 13000, sell: 15500, stock: 15, unit: 'pouch', min_stock: 4 },
      { name: 'Rinso Anti Noda Bubuk 770g', sku: 'SBN-002', barcode: '899777700202', cat: 'kebutuhan-rumah', cost: 18500, sell: 22000, stock: 9, unit: 'bks', min_stock: 4 },
      { name: 'Pepsodent Pencegah Gigi Berlubang 190g', sku: 'ODL-001', barcode: '899777700203', cat: 'kebutuhan-rumah', cost: 12000, sell: 14500, stock: 11, unit: 'kotak', min_stock: 4 }
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (category_id, name, sku, barcode, cost_price, selling_price, stock, unit, min_stock_alert)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMovement = db.prepare(`
      INSERT INTO stock_movements (product_id, type, quantity, before_stock, after_stock, notes)
      VALUES (?, 'IN', ?, 0, ?, 'Stok Awal')
    `);

    for (const prod of sampleProducts) {
      const catId = catMap[prod.cat] || null;
      const res = insertProd.run(
        catId,
        prod.name,
        prod.sku,
        prod.barcode,
        prod.cost,
        prod.sell,
        prod.stock,
        prod.unit,
        prod.min_stock
      );

      // Record initial stock movement
      insertMovement.run(res.lastInsertRowid, prod.stock, prod.stock);
    }
    console.log(`[Seed] ${sampleProducts.length} initial products and stock movements seeded.`);
  }

  // 5. Seed some realistic recent transactions so dashboard has genuine history
  const txCount = query.get('SELECT COUNT(*) as count FROM transactions').count;
  if (txCount === 0) {
    const prods = query.all('SELECT id, name, cost_price, selling_price FROM products LIMIT 5');
    if (prods.length >= 3) {
      const now = new Date();
      // Generate 2 sample transactions for today and 1 for yesterday
      const createTx = (inv, dateStr, items, paidAmount) => {
        let subtotal = 0;
        let totalProfit = 0;
        for (const item of items) {
          subtotal += item.price * item.qty;
          totalProfit += (item.price - item.cost) * item.qty;
        }
        const change = paidAmount - subtotal;

        const txRes = query.run(`
          INSERT INTO transactions (invoice_number, customer_name, subtotal, discount, total_amount, paid_amount, change_amount, payment_method, notes, created_at)
          VALUES (?, 'Pelanggan Warung', ?, 0, ?, ?, ?, 'cash', 'Penjualan Kasir', ?)
        `, inv, subtotal, subtotal, paidAmount, change, dateStr);

        const txId = txRes.lastInsertRowid;
        for (const item of items) {
          query.run(`
            INSERT INTO transaction_details (transaction_id, product_id, product_name, cost_price, selling_price, quantity, subtotal, profit)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, txId, item.id, item.name, item.cost, item.price, item.qty, item.price * item.qty, (item.price - item.cost) * item.qty);
        }
      };

      const todayStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const yesterday = new Date(Date.now() - 86400000).toISOString().replace('T', ' ').substring(0, 19);

      createTx('TRX-20261105-0001', todayStr, [
        { id: prods[0].id, name: prods[0].name, cost: prods[0].cost_price, price: prods[0].selling_price, qty: 2 },
        { id: prods[1].id, name: prods[1].name, cost: prods[1].cost_price, price: prods[1].selling_price, qty: 1 }
      ], 100000);

      createTx('TRX-20261105-0002', todayStr, [
        { id: prods[2].id, name: prods[2].name, cost: prods[2].cost_price, price: prods[2].selling_price, qty: 3 }
      ], 20000);

      createTx('TRX-20261104-0001', yesterday, [
        { id: prods[0].id, name: prods[0].name, cost: prods[0].cost_price, price: prods[0].selling_price, qty: 1 },
        { id: prods[2].id, name: prods[2].name, cost: prods[2].cost_price, price: prods[2].selling_price, qty: 2 }
      ], 50000);

      console.log('[Seed] Sample real transactions seeded for dashboard initial metrics.');
    }
  }

  console.log('[Seed] Database initialization and seeding completed successfully.');
}
