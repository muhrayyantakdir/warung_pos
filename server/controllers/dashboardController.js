import { query } from '../database/index.js';

export const getDashboardStats = (req, res) => {
  try {
    // 1. Total omzet hari ini
    const todaySalesRow = query.get(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(id) as total_transactions
      FROM transactions
      WHERE date(created_at, 'localtime') = date('now', 'localtime')
    `);

    // 2. Perkiraan profit hari ini
    const todayProfitRow = query.get(`
      SELECT COALESCE(SUM(td.profit), 0) as total_profit
      FROM transaction_details td
      JOIN transactions t ON td.transaction_id = t.id
      WHERE date(t.created_at, 'localtime') = date('now', 'localtime')
    `);

    // 3. Jumlah total produk aktif
    const totalProductsRow = query.get(`
      SELECT COUNT(id) as count FROM products WHERE is_active = 1
    `);

    // 4. Jumlah produk stok menipis
    const lowStockCountRow = query.get(`
      SELECT COUNT(id) as count 
      FROM products 
      WHERE is_active = 1 AND stock <= min_stock_alert
    `);

    // 5. Daftar produk stok menipis (max 10 item)
    const lowStockProducts = query.all(`
      SELECT p.id, p.name, p.sku, p.stock, p.min_stock_alert, p.unit, p.selling_price, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1 AND p.stock <= p.min_stock_alert
      ORDER BY p.stock ASC, p.name ASC
      LIMIT 10
    `);

    // 6. Grafik penjualan 7 hari terakhir
    // Menghasilkan daftar tanggal 7 hari terakhir
    const weeklyChartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });

      const dayStats = query.get(`
        SELECT 
          COALESCE(SUM(total_amount), 0) as total,
          COUNT(id) as count
        FROM transactions
        WHERE date(created_at, 'localtime') = ?
      `, dateStr);

      weeklyChartData.push({
        date: dateStr,
        day: dayName,
        total: dayStats ? Number(dayStats.total) : 0,
        count: dayStats ? Number(dayStats.count) : 0
      });
    }

    // 7. Daftar transaksi terbaru (5 terakhir)
    const recentTransactions = query.all(`
      SELECT 
        t.id, 
        t.invoice_number, 
        t.customer_name, 
        t.total_amount, 
        t.paid_amount, 
        t.change_amount, 
        t.payment_method, 
        t.created_at,
        COUNT(td.id) as total_items
      FROM transactions t
      LEFT JOIN transaction_details td ON td.transaction_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT 5
    `);

    // 8. Ringkasan Keseluruhan (All-time metrics)
    const allTimeStats = query.get(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as all_time_sales,
        COUNT(id) as all_time_transactions
      FROM transactions
    `);

    res.json({
      success: true,
      data: {
        today: {
          total_sales: Number(todaySalesRow.total_sales || 0),
          total_transactions: Number(todaySalesRow.total_transactions || 0),
          total_profit: Number(todayProfitRow.total_profit || 0)
        },
        inventory: {
          total_products: Number(totalProductsRow.count || 0),
          low_stock_count: Number(lowStockCountRow.count || 0),
          low_stock_items: lowStockProducts
        },
        chart: weeklyChartData,
        recent_transactions: recentTransactions,
        all_time: {
          total_sales: Number(allTimeStats.all_time_sales || 0),
          total_transactions: Number(allTimeStats.all_time_transactions || 0)
        }
      }
    });
  } catch (error) {
    console.error('[DashboardController:getDashboardStats]', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data dashboard', error: error.message });
  }
};
