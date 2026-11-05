# 🏪 WARUNG POS — Sistem Kasir & Ritel Modern

Aplikasi kasir berbasis web (**Point of Sale / POS**) yang dirancang khusus untuk warung kecil, toko kelontong, dan usaha ritel di Indonesia. Dibuat dengan arsitektur modern, performa cepat, antarmuka responsif (desktop & mobile smartphone), serta perlindungan data tangguh menggunakan **Supabase Cloud** dan **SQLite lokal (Offline-Ready)**.

---

## 🌟 Fitur Utama

- 🔐 **Autentikasi & Registrasi Akun**:
  - Pendaftaran akun baru (*Kasir* atau *Pemilik Toko*).
  - Login aman berbasis token **JSON Web Token (JWT)** & enkripsi kata sandi **bcrypt**.
  - Pintasan demo login 1-klik untuk pengujian cepat.
- 📊 **Dashboard Analitik Real-Time**:
  - Total omzet & jumlah transaksi hari ini langsung dari database.
  - Perkiraan laba bersih hari ini (berdasarkan margin harga modal).
  - Indikator peringatan barang dengan stok menipis.
  - Grafik batang penjualan 7 hari terakhir.
  - 5 transaksi belanja terkini.
- 📦 **Manajemen Produk & Kategori**:
  - CRUD lengkap: Tambah, Ubah, Hapus, dan Pencarian instan (Nama, SKU, Barcode).
  - Filter kategori dan filter khusus produk stok menipis.
  - Snapshot harga modal (*cost price*) dan harga jual dengan indikator margin laba.
  - Pencatatan log mutasi stok (*Stock Movements Audit Trail*) otomatis.
- 🛒 **Halaman Kasir (POS)**:
  - Antarmuka kasir cepat dengan pencarian barcode dan filter kategori.
  - Keranjang belanja dinamis, penyesuaian kuantitas barang, dan kalkulator uang kembalian.
- 🧾 **Riwayat Transaksi & Cetak Struk**:
  - Filter rentang tanggal dan pencarian nomor faktur nota.
  - Modal simulator struk belanja bergaya kertas thermal standar (58mm/80mm).
- 📱 **Tampilan Mobile Ergonomis**:
  - Navigasi bawah (*Floating Bottom Nav*) yang nyaman digunakan dengan satu tangan di smartphone.
  - Desain kartu responsif dan form bottom-sheet.
- ☁️ **Dual Database (Supabase Cloud + Offline SQLite)**:
  - Dukungan cloud PostgreSQL Supabase dengan skema DDL dan RLS policies teruji.
  - Mode tangguh otomatis: tetap beroperasi mulus secara lokal walau tanpa internet.

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

- **Frontend**: React.js 18, Vite, Lucide React Icons, Modern Responsive CSS System.
- **Backend**: Node.js v22+, Express.js REST API, JSON Web Token (JWT), Bcryptjs.
- **Database**:
  - Cloud: [Supabase](https://supabase.com) (PostgreSQL)
  - Lokal: SQLite (via `node:sqlite` dengan mode Write-Ahead Logging / WAL)

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Prasyarat
- Pastikan telah terinstal [Node.js](https://nodejs.org/) (versi 20 atau yang lebih baru).

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (.env)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
*(Opsional) Jika ingin menghubungkan ke Cloud Supabase, masukkan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` Anda di file `.env`.*

### 4. Menjalankan Aplikasi
Jalankan backend server dan frontend sekaligus dengan satu perintah:
```bash
npm run dev:all
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🔑 Akun Demo Default

| Peran | Username | Kata Sandi |
| :--- | :--- | :--- |
| **Pemilik Toko (Admin)** | `admin` | `admin123` |
| **Petugas Kasir** | `kasir1` | `kasir123` |

*Atau klik tab **"Daftar Baru"** di halaman login untuk membuat akun kasir baru Anda sendiri.*

---

## 📄 Lisensi
Hak Cipta &copy; 2026 Toko Rayyan. Dirancang dan dikembangkan dengan standar rekayasa perangkat lunak profesional.
