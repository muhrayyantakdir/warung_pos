import { db, query } from '../database/index.js';

export const getSettings = (req, res) => {
  try {
    const settings = query.get('SELECT * FROM store_settings WHERE id = 1');
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Pengaturan belum dikonfigurasi' });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('[SettingController:getSettings]', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan toko', error: error.message });
  }
};

export const updateSettings = (req, res) => {
  try {
    const {
      store_name,
      address,
      phone,
      receipt_header,
      receipt_footer,
      low_stock_threshold
    } = req.body;

    if (!store_name || !store_name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama warung/toko wajib diisi' });
    }

    db.prepare(`
      UPDATE store_settings SET
        store_name = ?,
        address = ?,
        phone = ?,
        receipt_header = ?,
        receipt_footer = ?,
        low_stock_threshold = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      store_name.trim(),
      address ? address.trim() : '',
      phone ? phone.trim() : '',
      receipt_header ? receipt_header.trim() : '',
      receipt_footer ? receipt_footer.trim() : '',
      low_stock_threshold !== undefined ? Math.floor(Number(low_stock_threshold)) : 5
    );

    const updated = query.get('SELECT * FROM store_settings WHERE id = 1');
    res.json({ success: true, message: 'Pengaturan berhasil disimpan', data: updated });
  } catch (error) {
    console.error('[SettingController:updateSettings]', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui pengaturan toko', error: error.message });
  }
};
