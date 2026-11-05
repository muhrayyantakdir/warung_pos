// Initial dataset matching the user's reference design exactly
export const initialProducts = [
  {
    id: 1,
    name: "Beras Rojo Lele 5kg",
    sku: "BRS-001",
    category: "Sembako",
    price: 75000,
    stock: 12,
    icon: "🌾",
    color: "#e8f5e9",
    description: "Beras pulen super kualitas nomor satu kemasan 5kg"
  },
  {
    id: 2,
    name: "Minyak Goreng Bimoli 2L",
    sku: "MYK-002",
    category: "Sembako",
    price: 38000,
    stock: 24,
    icon: "🌻",
    color: "#fff8e1",
    description: "Minyak goreng kelapa sawit higienis 2 Liter"
  },
  {
    id: 3,
    name: "Mie Instan Indomie Soto",
    sku: "MIE-003",
    category: "Makanan",
    price: 3100,
    stock: 120,
    icon: "🍜",
    color: "#fbe9e7",
    description: "Mie kuah rasa soto khas Indonesia gurih segar"
  },
  {
    id: 4,
    name: "Gula Pasir Gulaku 1kg",
    sku: "GLA-004",
    category: "Sembako",
    price: 18000,
    stock: 3, // Low stock ("Sisa: 3") in mockup
    icon: "🧂",
    color: "#e0f7fa",
    description: "Gula tebu kristal putih murni kemasan 1kg"
  },
  {
    id: 5,
    name: "Kopi Kapal Api Spesial",
    sku: "KPI-005",
    category: "Minuman",
    price: 12500,
    stock: 45,
    icon: "☕",
    color: "#efebe9",
    description: "Kopi bubuk hitam mantap beraroma khas nusantara"
  },
  {
    id: 6,
    name: "Teh Celup Sosro Isi 30",
    sku: "TEH-006",
    category: "Minuman",
    price: 7500,
    stock: 38,
    icon: "🍵",
    color: "#e8f5e9",
    description: "Teh celup wangi melati alami isi 30 bag"
  },
  {
    id: 7,
    name: "Telur Ayam Negeri 1kg",
    sku: "TLR-007",
    category: "Sembako",
    price: 28500,
    stock: 15,
    icon: "🥚",
    color: "#fff3e0",
    description: "Telur ayam ras segar pilihan kualitas terbaik"
  },
  {
    id: 8,
    name: "Sabun Cuci Piring Sunlight 750ml",
    sku: "SBN-008",
    category: "Kebersihan",
    price: 14000,
    stock: 22,
    icon: "🍋",
    color: "#f1f8e9",
    description: "Cairan pencuci piring ekstrak jeruk nipis asli"
  }
];

// Initial cart starts empty for fresh installation
export const initialCart = {};

// Initial sales history starts empty for fresh installation
export const initialTransactions = [];


export const storeProfile = {
  name: "Toko Rayyan",
  tagline: "Selamat Datang di Toko Rayyan 🏪",
  initials: "TB",
  address: "Jl. Mawar No. 4, Jakarta",
  phone: "0812-3456-7890",
  receiptFooter: "Terima Kasih Atas Kunjungan Anda! Barang yang sudah dibeli tidak dapat ditukar kembali."
};
