// profitConstants.ts
// ==============================================
// Konstanta untuk analisis profit dalam Bahasa Indonesia

export const PROFIT_CONSTANTS = {
  // Tipe periode analisis
  PERIOD_TYPES: {
    MONTHLY: 'monthly' as const,     // Bulanan
    QUARTERLY: 'quarterly' as const, // Kuartalan  
    YEARLY: 'yearly' as const,       // Tahunan
  },
  
  // Metode kalkulasi
  CALCULATION_METHODS: {
    REAL_TIME: 'real_time' as const, // Hitung on-demand
    STORED: 'stored' as const,       // Gunakan data pre-kalkulasi
  },
  
  // Ambang batas margin profit
  MARGIN_THRESHOLDS: {
    EXCELLENT: {
      gross: 0.50, // 50% - Sangat Baik
      net: 0.20,   // 20% - Sangat Baik
    },
    GOOD: {
      gross: 0.40, // 40% - Baik
      net: 0.15,   // 15% - Baik
    },
    FAIR: {
      gross: 0.30, // 30% - Cukup
      net: 0.10,   // 10% - Cukup
    },
    POOR: {
      gross: 0.20, // 20% - Kurang
      net: 0.05,   // 5% - Kurang
    }
  },
  
  // Periode default
  DEFAULT_PERIODS: {
    CURRENT_MONTH: new Date().toISOString().slice(0, 7), // "2024-12"
    MONTHS_TO_ANALYZE: 12, // Analisis 12 bulan terakhir
  },
  
  // Label rating margin dalam Bahasa Indonesia
  MARGIN_RATINGS: {
    EXCELLENT: 'Sangat Baik',
    GOOD: 'Baik', 
    FAIR: 'Cukup',
    POOR: 'Kurang'
  },
  
  // Status performa
  PERFORMANCE_STATUS: {
    IMPROVING: 'Membaik',
    DECLINING: 'Menurun',
    STABLE: 'Stabil'
  }
} as const;

// 🍽️ Kategori pendapatan untuk F&B UMKM
export const FNB_REVENUE_CATEGORIES = [
  'Penjualan Makanan',
  'Penjualan Minuman', 
  'Paket Catering',
  'Delivery/Ojol',
  'Event & Acara',
  'Lainnya'
] as const;

// 🍽️ Kategori HPP (Modal Bahan Baku) untuk F&B
export const FNB_COGS_CATEGORIES = [
  'Bahan Makanan Utama',
  'Bumbu & Rempah',
  'Minuman & Sirup',
  'Kemasan & Wadah',
  'Gas & Bahan Bakar',
  'Lainnya'
] as const;

// 🏪 Kategori biaya operasional untuk warung/resto
export const FNB_OPEX_CATEGORIES = [
  'Gaji Karyawan',
  'Sewa Tempat',
  'Listrik & Air',
  'Promosi & Iklan',
  'Transportasi',
  'Internet & Pulsa',
  'Administrasi',
  'Lainnya'
] as const;

// 🔄 Fallback untuk bisnis non-F&B
export const REVENUE_CATEGORIES = [
  'Penjualan Produk',
  'Jasa Konsultasi', 
  'Penjualan Online',
  'Komisi Penjualan',
  'Pendapatan Pasif',
  'Lainnya'
] as const;

export const OPEX_CATEGORIES = [
  'Gaji & Tunjangan',
  'Sewa Kantor',
  'Utilitas',
  'Pemasaran & Iklan',
  'Transportasi',
  'Komunikasi',
  'Administrasi',
  'Lainnya'
] as const;

// Konfigurasi chart dan warna - Orange sebagai primary
export const CHART_CONFIG = {
  // 🍽️ Warna utama dengan orange dominan untuk F&B
  colors: {
    primary: '#ea580c',      // 🔥 Orange Utama - Brand Color
    revenue: '#16a34a',      // 💰 Hijau - Omset/Penjualan
    cogs: '#f59e0b',         // 🥘 Orange - Modal Bahan Baku (Highlight)
    opex: '#ef4444',         // 🏪 Merah - Biaya Bulanan Tetap
    gross_profit: '#ea580c', // 📈 Orange - Untung Kotor (Primary)
    net_profit: '#dc2626',   // 💎 Merah Gelap - Untung Bersih
    positive: '#16a34a',     // ✅ Hijau - Untung
    negative: '#dc2626',     // ❌ Merah - Rugi
    neutral: '#64748b',      // ⚪ Abu-abu - Netral
    warning: '#f59e0b',      // ⚠️ Orange Terang - Warning
    info: '#ea580c'          // ℹ️ Orange - Info
  },
  
  // Warna berdasarkan rating margin dengan orange accent
  margin_colors: {
    excellent: '#16a34a',    // Hijau - Sangat Baik
    good: '#ea580c',         // Orange - Baik (Brand Color)
    fair: '#f59e0b',         // Orange Terang - Cukup
    poor: '#dc2626'          // Merah - Kurang
  },
  
  // Pengaturan grafik default
  chart_settings: {
    animation_duration: 1000,
    bar_radius: 4,
    line_width: 2,
    point_radius: 4
  }
} as const;

// Format mata uang Indonesia
export const CURRENCY_CONFIG = {
  locale: 'id-ID',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
} as const;

// Konfigurasi periode untuk dropdown
export const PERIOD_OPTIONS = {
  // Generate options untuk 2 tahun terakhir
  getMonthlyOptions: (startYear: number = new Date().getFullYear() - 1) => {
    const options = [];
    const currentDate = new Date();
    
    for (let year = startYear; year <= currentDate.getFullYear(); year++) {
      for (let month = 1; month <= 12; month++) {
        const value = `${year}-${month.toString().padStart(2, '0')}`;
        const label = `${getMonthName(month)} ${year}`;
        
        options.push({ value, label });
        
        // Stop jika sudah mencapai bulan sekarang
        if (year === currentDate.getFullYear() && month === currentDate.getMonth() + 1) {
          break;
        }
      }
    }
    
    return options.reverse(); // Terbaru di atas
  }
} as const;

// Helper function untuk nama bulan dalam Bahasa Indonesia
function getMonthName(month: number): string {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return monthNames[month - 1];
}

// Export helper function
export { getMonthName };

// 🍽️ Label dan terminologi ramah untuk F&B UMKM
export const FNB_LABELS = {
  // Revenue labels
  revenue: {
    title: '💰 Omset Bulan Ini',
    short: 'Omset',
    description: 'Total uang masuk dari penjualan makanan dan minuman',
    hint: 'Semua hasil jualan dalam sebulan'
  },
  
  // COGS labels (Modal Bahan Baku)
  cogs: {
    title: '🥘 Modal Bahan Baku',
    short: 'Modal Bahan',
    description: 'Uang yang dikeluarkan untuk membeli bahan makanan, bumbu, dan kemasan',
    hint: 'Semua pengeluaran untuk bahan yang dijual'
  },
  
  // OPEX labels (Biaya Bulanan Tetap)
  opex: {
    title: '🏪 Biaya Bulanan Tetap',
    short: 'Biaya Tetap',
    description: 'Biaya yang harus dibayar setiap bulan (sewa, listrik, gaji, dll)',
    hint: 'Pengeluaran rutin yang tidak tergantung jualan'
  },
  
  // Profit labels
  grossProfit: {
    title: '📈 Untung Kotor',
    short: 'Untung Kotor', 
    description: 'Omset dikurangi modal bahan baku',
    hint: 'Keuntungan sebelum potong biaya tetap'
  },
  
  netProfit: {
    title: '💎 Untung Bersih',
    short: 'Untung Bersih',
    description: 'Keuntungan sesudah dikurangi semua biaya',
    hint: 'Uang yang benar-benar masuk kantong'
  },
  
  // WAC specific
  wac: {
    title: '⚖️ Modal Rata-rata Tertimbang',
    short: 'WAC',
    description: 'Perhitungan modal bahan baku berdasarkan harga rata-rata pembelian',
    hint: 'Lebih akurat dari harga terakhir'
  }
} as const;

// 🎯 Threshold khusus untuk bisnis F&B
export const FNB_THRESHOLDS = {
  // Margin sehat untuk F&B
  MARGIN_TARGETS: {
    // F&B umumnya margin lebih tipis
    EXCELLENT: { gross: 0.65, net: 0.25 }, // 65% gross, 25% net
    GOOD: { gross: 0.55, net: 0.18 },      // 55% gross, 18% net  
    FAIR: { gross: 0.45, net: 0.12 },      // 45% gross, 12% net
    POOR: { gross: 0.35, net: 0.05 }       // 35% gross, 5% net
  },
  
  // Rasio COGS khusus F&B
  COGS_RATIOS: {
    EXCELLENT: 0.35, // 35% dari omset
    GOOD: 0.45,      // 45% dari omset
    FAIR: 0.55,      // 55% dari omset  
    POOR: 0.65       // 65% dari omset (terlalu tinggi)
  },
  
  // Alert thresholds
  ALERTS: {
    high_ingredient_cost: 0.6,    // Modal bahan > 60% omset
    low_revenue: 2000000,         // Omset < 2 juta (untuk warung)
    negative_margin: 0,           // Margin negatif
    expensive_item_threshold: 500000 // Item > 500rb (bahan mahal)
  }
} as const;

// Validasi threshold (tetap ada untuk backward compatibility)
export const VALIDATION_RULES = {
  // Minimum values untuk validasi data
  MIN_REVENUE: 0,
  MIN_MARGIN: -100, // Bisa negatif (rugi)
  MAX_MARGIN: 100,  // Maximum 100%
  
  // Peringatan threshold
  WARNING_THRESHOLDS: {
    low_revenue: 1000000,      // 1 juta - revenue rendah
    negative_margin: 0,        // Margin negatif
    high_cogs_ratio: 0.8,      // HPP > 80% dari revenue
    high_opex_ratio: 0.5       // OpEx > 50% dari revenue
  }
} as const;
