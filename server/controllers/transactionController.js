import { supabase, isSupabaseAlive, db, query } from '../database/supabase.js';

// ─── GET ALL TRANSACTIONS ─────────────────────────────────────────────────────
export const getTransactions = async (req, res) => {
  try {
    const { search = '', start_date, end_date, limit = 50 } = req.query;

    if (await isSupabaseAlive()) {
      let queryBuilder = supabase
        .from('transactions')
        .select('*, users(full_name), transaction_details(id, quantity)')
        .order('created_at', { ascending: false })
        .limit(Number(limit));

      if (search.trim()) {
        queryBuilder = queryBuilder.or(
          `invoice_number.ilike.%${search.trim()}%,customer_name.ilike.%${search.trim()}%`
        );
      }

      if (start_date) {
        queryBuilder = queryBuilder.gte('created_at', `${start_date}T00:00:00.000Z`);
      }

      if (end_date) {
        queryBuilder = queryBuilder.lte('created_at', `${end_date}T23:59:59.999Z`);
      }

      const { data: transactions, error } = await queryBuilder;
      if (error) throw error;

      const result = (transactions || []).map(t => ({
        id: t.id,
        invoice_number: t.invoice_number,
        customer_name: t.customer_name,
        subtotal: t.subtotal,
        discount: t.discount,
        total_amount: t.total_amount,
        paid_amount: t.paid_amount,
        change_amount: t.change_amount,
        payment_method: t.payment_method,
        notes: t.notes,
        created_at: t.created_at,
        cashier_name: t.users?.full_name || 'Kasir',
        item_count: Array.isArray(t.transaction_details) ? t.transaction_details.length : 0,
        total_quantity: Array.isArray(t.transaction_details)
          ? t.transaction_details.reduce((sum, d) => sum + (d.quantity || 0), 0)
          : 0
      }));

      return res.json({ success: true, data: result, count: result.length });
    }

    // ── FALLBACK SQLITE ────────────────────────────────────────────────────────
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
    return res.json({ success: true, data: transactions, count: transactions.length });
  } catch (error) {
    console.error('[TransactionController:getTransactions]', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil riwayat transaksi', error: error.message });
  }
};

// ─── GET TRANSACTION BY ID ────────────────────────────────────────────────────
export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (await isSupabaseAlive()) {
      let { data: transaction } = await supabase
        .from('transactions')
        .select('*, users(full_name)')
        .eq('id', id)
        .maybeSingle();

      if (!transaction) {
        const result = await supabase
          .from('transactions')
          .select('*, users(full_name)')
          .eq('invoice_number', id)
          .maybeSingle();
        transaction = result.data;
      }

      if (!transaction)
        return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });

      const { data: items, error: itemErr } = await supabase
        .from('transaction_details')
        .select('*, products(sku, unit)')
        .eq('transaction_id', transaction.id);

      if (itemErr) throw itemErr;

      const flatItems = (items || []).map(item => ({
        ...item,
        sku: item.products?.sku || null,
        unit: item.products?.unit || null,
        products: undefined
      }));

      return res.json({
        success: true,
        data: {
          ...transaction,
          cashier_name: transaction.users?.full_name || 'Kasir',
          users: undefined,
          items: flatItems
        }
      });
    }

    // ── FALLBACK SQLITE ────────────────────────────────────────────────────────
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

    return res.json({
      success: true,
      data: {
        ...transaction,
        items
      }
    });
  } catch (error) {
    console.error('[TransactionController:getTransactionById]', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail transaksi', error: error.message });
  }
};

// ─── CREATE TRANSACTION (Checkout Kasir) ─────────────────────────────────────
export const createTransaction = async (req, res) => {
  try {
    const {
      items,
      paid_amount,
      payment_method = 'cash',
      customer_name = 'Pelanggan Umum',
      discount = 0,
      notes = ''
    } = req.body;

    const userId = req.user?.id || null;

    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success: false, message: 'Keranjang belanja kosong' });

    if (paid_amount === undefined || isNaN(paid_amount) || Number(paid_amount) < 0)
      return res.status(400).json({ success: false, message: 'Jumlah uang yang diterima tidak valid' });

    const now = new Date();
    const dateTag = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeTag = now.getTime().toString().slice(-5);
    const invoiceNumber = `TRX-${dateTag}-${timeTag}`;

    if (await isSupabaseAlive()) {
      let subtotal = 0;
      const enrichedItems = [];

      for (const item of items) {
        if (!item.product_id || !item.quantity || Number(item.quantity) <= 0)
          return res.status(400).json({ success: false, message: 'Data item transaksi tidak valid' });

        const { data: product } = await supabase
          .from('products')
          .select('id, name, sku, cost_price, selling_price, stock, unit, is_active')
          .eq('id', item.product_id)
          .maybeSingle();

        if (!product || !product.is_active)
          return res.status(400).json({ success: false, message: `Produk ID ${item.product_id} tidak ditemukan` });

        if (product.stock < Number(item.quantity))
          return res.status(400).json({
            success: false,
            message: `Stok ${product.name} tidak mencukupi. Stok tersedia: ${product.stock}`
          });

        const lineTotal = product.selling_price * Number(item.quantity);
        const lineProfit = (product.selling_price - product.cost_price) * Number(item.quantity);
        subtotal += lineTotal;

        enrichedItems.push({
          product_id: product.id,
          product_name: product.name,
          cost_price: product.cost_price,
          selling_price: product.selling_price,
          quantity: Number(item.quantity),
          subtotal: lineTotal,
          profit: lineProfit,
          _before_stock: product.stock,
          _after_stock: product.stock - Number(item.quantity)
        });
      }

      const totalAmount = subtotal - Number(discount);
      const changeAmount = Number(paid_amount) - totalAmount;

      if (changeAmount < 0)
        return res.status(400).json({ success: false, message: 'Uang yang diterima kurang dari total pembayaran' });

      const { data: transaction, error: txErr } = await supabase
        .from('transactions')
        .insert({
          invoice_number: invoiceNumber,
          user_id: userId,
          customer_name: customer_name || 'Pelanggan Umum',
          subtotal,
          discount: Number(discount),
          total_amount: totalAmount,
          paid_amount: Number(paid_amount),
          change_amount: changeAmount,
          payment_method,
          notes
        })
        .select()
        .single();

      if (txErr) throw txErr;

      const detailRows = enrichedItems.map(item => ({
        transaction_id: transaction.id,
        product_id: item.product_id,
        product_name: item.product_name,
        cost_price: item.cost_price,
        selling_price: item.selling_price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        profit: item.profit
      }));

      const { error: detailErr } = await supabase.from('transaction_details').insert(detailRows);
      if (detailErr) throw detailErr;

      for (const item of enrichedItems) {
        await supabase
          .from('products')
          .update({ stock: item._after_stock, updated_at: new Date().toISOString() })
          .eq('id', item.product_id);

        await supabase.from('stock_movements').insert({
          product_id: item.product_id,
          type: 'SALE',
          quantity: item.quantity,
          before_stock: item._before_stock,
          after_stock: item._after_stock,
          reference_id: invoiceNumber,
          notes: `Penjualan - ${invoiceNumber}`
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Transaksi berhasil disimpan',
        data: { ...transaction, items: detailRows }
      });
    }

    // ── FALLBACK SQLITE LOKAL ──────────────────────────────────────────────────
    let subtotal = 0;
    const enrichedItems = [];

    for (const item of items) {
      if (!item.product_id || !item.quantity || Number(item.quantity) <= 0) {
        return res.status(400).json({ success: false, message: 'Data item transaksi tidak valid' });
      }

      const product = query.get('SELECT * FROM products WHERE id = ? AND is_active = 1', Number(item.product_id));
      if (!product) {
        return res.status(400).json({ success: false, message: `Produk ID ${item.product_id} tidak ditemukan` });
      }

      if (product.stock < Number(item.quantity)) {
        return res.status(400).json({
          success: false,
          message: `Stok ${product.name} tidak mencukupi. Stok tersedia: ${product.stock}`
        });
      }

      const lineTotal = product.selling_price * Number(item.quantity);
      const lineProfit = (product.selling_price - product.cost_price) * Number(item.quantity);
      subtotal += lineTotal;

      enrichedItems.push({
        product_id: product.id,
        product_name: product.name,
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        quantity: Number(item.quantity),
        subtotal: lineTotal,
        profit: lineProfit,
        _before_stock: product.stock,
        _after_stock: product.stock - Number(item.quantity)
      });
    }

    const totalAmount = subtotal - Number(discount);
    const changeAmount = Number(paid_amount) - totalAmount;

    if (changeAmount < 0) {
      return res.status(400).json({ success: false, message: 'Uang yang diterima kurang dari total pembayaran' });
    }

    const txRes = db.prepare(`
      INSERT INTO transactions (
        invoice_number, user_id, customer_name, subtotal, discount,
        total_amount, paid_amount, change_amount, payment_method, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoiceNumber,
      userId,
      customer_name || 'Pelanggan Umum',
      subtotal,
      Number(discount),
      totalAmount,
      Number(paid_amount),
      changeAmount,
      payment_method,
      notes
    );

    const transactionId = txRes.lastInsertRowid;

    const detailStmt = db.prepare(`
      INSERT INTO transaction_details (
        transaction_id, product_id, product_name, cost_price, selling_price, quantity, subtotal, profit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStockStmt = db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const movementStmt = db.prepare(`
      INSERT INTO stock_movements (product_id, type, quantity, before_stock, after_stock, reference_id, notes)
      VALUES (?, 'SALE', ?, ?, ?, ?, ?)
    `);

    for (const item of enrichedItems) {
      detailStmt.run(
        transactionId,
        item.product_id,
        item.product_name,
        item.cost_price,
        item.selling_price,
        item.quantity,
        item.subtotal,
        item.profit
      );

      updateStockStmt.run(item._after_stock, item.product_id);
      movementStmt.run(
        item.product_id,
        item.quantity,
        item._before_stock,
        item._after_stock,
        invoiceNumber,
        `Penjualan - ${invoiceNumber}`
      );
    }

    const createdTx = query.get('SELECT * FROM transactions WHERE id = ?', transactionId);

    return res.status(201).json({
      success: true,
      message: 'Transaksi berhasil disimpan',
      data: {
        ...createdTx,
        items: enrichedItems
      }
    });
  } catch (error) {
    console.error('[TransactionController:createTransaction]', error);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan transaksi', error: error.message });
  }
};
