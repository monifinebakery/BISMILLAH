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

// Kategori pendapatan dalam Bahasa Indonesia
export const REVENUE_CATEGORIES = [
  'Penjualan Produk',
  'Jasa Konsultasi', 
  'Penjualan Online',
  'Komisi Penjualan',
  'Pendapatan Pasif',
  'Lainnya'
] as const;

// Kategori biaya operasional
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

// Konfigurasi chart dan warna
export const CHART_CONFIG = {
  // Warna utama untuk komponen keuangan
  colors: {
    revenue: '#16a34a',      // Hijau - Pendapatan
    cogs: '#f59e0b',         // Kuning - HPP
    opex: '#dc2626',         // Merah - Biaya Operasional
    gross_profit: '#2563eb', // Biru - Laba Kotor
    net_profit: '#8b5cf6',   // Ungu - Laba Bersih
    positive: '#16a34a',     // Hijau - Positif
    negative: '#dc2626',     // Merah - Negatif
    neutral: '#6b7280'       // Abu-abu - Netral
  },
  
  // Warna berdasarkan rating margin
  margin_colors: {
    excellent: '#16a34a',    // Hijau - Sangat Baik
    good: '#65a30d',         // Hijau Muda - Baik
    fair: '#f59e0b',         // Kuning - Cukup
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

// Validasi threshold
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