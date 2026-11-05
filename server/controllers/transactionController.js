import { query } from '../database/index.js';

// GET all transactions with optional date filter and search
export const getTransactions = (req, res) => {
  try {
    const { search = '', start_date, end_date, limit = 50 } = req.query;

    let sql = `
      SELECT 
        t.*,
        u.full_name as cashier_name,
        COUNT(td.id) as item_count,
        COALESCE(SUM(td.quantity), 0) as total_quantity
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN transaction_details td ON td.transaction_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (search.trim()) {
      sql += ` AND (t.invoice_number LIKE ? OR t.customer_name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (start_date) {
      sql += ` AND date(t.created_at, 'localtime') >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      sql += ` AND date(t.created_at, 'localtime') <= ?`;
      params.push(end_date);
    }

    sql += ` GROUP BY t.id ORDER BY t.created_at DESC LIMIT ?`;
    params.push(Number(limit));

    const transactions = query.all(sql, ...params);
    res.json({ success: true, data: transactions, count: transactions.length });
  } catch (error) {
    console.error('[TransactionController:getTransactions]', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat transaksi', error: error.message });
  }
};

// GET single transaction detail with item list
export const getTransactionById = (req, res) => {
  try {
    const { id } = req.params;

    const transaction = query.get(`
      SELECT t.*, u.full_name as cashier_name
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ? OR t.invoice_number = ?
    `, id, id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }

    const items = query.all(`
      SELECT td.*, p.sku, p.unit
      FROM transaction_details td
      LEFT JOIN products p ON td.product_id = p.id
      WHERE td.transaction_id = ?
    `, transaction.id);

    res.json({
      success: true,
      data: {
        ...transaction,
        items
      }
    });
  } catch (error) {
    console.error('[TransactionController:getTransactionById]', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail transaksi', error: error.message });
  }
};
