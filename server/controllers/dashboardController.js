import { supabase, isSupabaseAlive, query } from '../database/supabase.js';

export const getDashboardStats = async (req, res) => {
  try {
    if (await isSupabaseAlive()) {
      const todayStr = new Date().toISOString().split('T')[0];

      const { data: todayTx, error: txErr } = await supabase
        .from('transactions')
        .select('total_amount')
        .gte('created_at', `${todayStr}T00:00:00.000Z`)
        .lt('created_at', `${todayStr}T23:59:59.999Z`);

      if (txErr) throw txErr;

      const total_sales = (todayTx || []).reduce((sum, t) => sum + Number(t.total_amount), 0);
      const total_transactions = (todayTx || []).length;

      const { data: todayTxIds } = await supabase
        .from('transactions')
        .select('id')
        .gte('created_at', `${todayStr}T00:00:00.000Z`)
        .lt('created_at', `${todayStr}T23:59:59.999Z`);

      let total_profit = 0;
      if (todayTxIds && todayTxIds.length > 0) {
        const ids = todayTxIds.map(t => t.id);
        const { data: profitRows } = await supabase
          .from('transaction_details')
          .select('profit')
          .in('transaction_id', ids);
        if (profitRows) {
          total_profit = profitRows.reduce((sum, r) => sum + Number(r.profit), 0);
        }
      }

      const { count: total_products } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      const { data: allProducts } = await supabase
        .from('products')
        .select('id, name, sku, stock, min_stock_alert, unit, selling_price, categories(name)')
        .eq('is_active', true);

      const lowStockItems = (allProducts || [])
        .filter(p => p.stock <= p.min_stock_alert)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10)
        .map(p => ({ ...p, category_name: p.categories?.name || null, categories: undefined }));

      const weeklyChartData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });

        const { data: dayTx } = await supabase
          .from('transactions')
          .select('total_amount')
          .gte('created_at', `${dateStr}T00:00:00.000Z`)
          .lt('created_at', `${dateStr}T23:59:59.999Z`);

        const dayTotal = (dayTx || []).reduce((sum, t) => sum + Number(t.total_amount), 0);

        weeklyChartData.push({
          date: dateStr,
          day: dayName,
          total: dayTotal,
          count: (dayTx || []).length
        });
      }

      const { data: recentRaw } = await supabase
        .from('transactions')
        .select('*, users(full_name), transaction_details(id)')
        .order('created_at', { ascending: false })
        .limit(5);

      const recentTransactions = (recentRaw || []).map(t => ({
        id: t.id,
        invoice_number: t.invoice_number,
        customer_name: t.customer_name,
        total_amount: t.total_amount,
        paid_amount: t.paid_amount,
        change_amount: t.change_amount,
        payment_method: t.payment_method,
        created_at: t.created_at,
        cashier_name: t.users?.full_name || 'Kasir',
        total_items: Array.isArray(t.transaction_details) ? t.transaction_details.length : 0
      }));

      const { data: allTimeTx } = await supabase
        .from('transactions')
        .select('total_amount');

      const all_time_sales = (allTimeTx || []).reduce((sum, t) => sum + Number(t.total_amount), 0);
      const all_time_transactions = (allTimeTx || []).length;

      return res.json({
        success: true,
        data: {
          today: { total_sales, total_transactions, total_profit },
          inventory: {
            total_products: total_products || 0,
            low_stock_count: lowStockItems.length,
            low_stock_items: lowStockItems
          },
          chart: weeklyChartData,
          recent_transactions: recentTransactions,
          all_time: { total_sales: all_time_sales, total_transactions: all_time_transactions }
        }
      });
    }

    // ── FALLBACK SQLITE LOKAL ──────────────────────────────────────────────────
    const todaySalesRow = query.get(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(id) as total_transactions
      FROM transactions
      WHERE date(created_at, 'localtime') = date('now', 'localtime')
    `);

    const todayProfitRow = query.get(`
      SELECT COALESCE(SUM(td.profit), 0) as total_profit
      FROM transaction_details td
      JOIN transactions t ON td.transaction_id = t.id
      WHERE date(t.created_at, 'localtime') = date('now', 'localtime')
    `);

    const totalProductsRow = query.get(`
      SELECT COUNT(id) as count FROM products WHERE is_active = 1
    `);

    const lowStockCountRow = query.get(`
      SELECT COUNT(id) as count 
      FROM products 
      WHERE is_active = 1 AND stock <= min_stock_alert
    `);

    const lowStockProducts = query.all(`
      SELECT p.id, p.name, p.sku, p.stock, p.min_stock_alert, p.unit, p.selling_price, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1 AND p.stock <= p.min_stock_alert
      ORDER BY p.stock ASC, p.name ASC
      LIMIT 10
    `);

    const weeklyChartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
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

    const allTimeStats = query.get(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as all_time_sales,
        COUNT(id) as all_time_transactions
      FROM transactions
    `);

    return res.json({
      success: true,
      data: {
        today: {
          total_sales: Number(todaySalesRow?.total_sales || 0),
          total_transactions: Number(todaySalesRow?.total_transactions || 0),
          total_profit: Number(todayProfitRow?.total_profit || 0)
        },
        inventory: {
          total_products: Number(totalProductsRow?.count || 0),
          low_stock_count: Number(lowStockCountRow?.count || 0),
          low_stock_items: lowStockProducts
        },
        chart: weeklyChartData,
        recent_transactions: recentTransactions,
        all_time: {
          total_sales: Number(allTimeStats?.all_time_sales || 0),
          total_transactions: Number(allTimeStats?.all_time_transactions || 0)
        }
      }
    });
  } catch (error) {
    console.error('[DashboardController:getDashboardStats]', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data dashboard', error: error.message });
  }
};
