// utils/formatUtils.ts - Pustaka Utilitas Format Terpusat

// ==================================
// 💰 Utilitas Mata Uang & Angka
// ==================================

/**
 * Memformat angka menjadi string mata uang Rupiah (IDR).
 * @param amount Jumlah angka yang akan diformat.
 * @returns String mata uang yang diformat (misal: "Rp 50.000").
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'Rp 0';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Memformat angka dengan pemisah ribuan sesuai lokal Indonesia.
 * @param num Angka yang akan diformat.
 * @param decimals Jumlah angka di belakang koma.
 * @returns String angka yang diformat.
 */
export const formatNumber = (num: number | null | undefined, decimals: number = 0): string => {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Memformat angka desimal menjadi persentase.
 * @param decimal Angka desimal (misal: 0.25).
 * @param decimals Jumlah angka di belakang koma.
 * @returns String persentase yang diformat (misal: "25.0%").
 */
export const formatPercentage = (decimal: number | null | undefined, decimals: number = 1): string => {
  if (typeof decimal !== 'number' || isNaN(decimal)) {
    return '0%';
  }
  const percentage = decimal * 100;
  return `${percentage.toFixed(decimals)}%`;
};


// ==================================
// 📝 Utilitas Teks & String
// ==================================

/**
 * Memotong teks jika melebihi panjang maksimum dan menambahkan elipsis (...).
 * @param text Teks asli.
 * @param maxLength Panjang maksimum sebelum pemotongan.
 * @returns Teks yang telah dipotong atau teks asli.
 */
export const truncateText = (text: string | null | undefined, maxLength: number = 50): string => {
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  return text.substring(0, maxLength) + '...';
};

/**
 * Mengubah huruf pertama string menjadi kapital.
 * @param text Teks asli.
 * @returns Teks dengan huruf pertama kapital.
 */
export const capitalizeFirst = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Mengubah string menjadi format Title Case (setiap kata diawali huruf kapital).
 * @param text Teks asli.
 * @returns Teks dalam format Title Case.
 */
export const toTitleCase = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Menyorot kata kunci pencarian dalam teks dengan tag <mark>.
 * @param text Teks asli.
 * @param searchTerm Kata kunci untuk disorot.
 * @returns String HTML dengan kata kunci yang disorot.
 */
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm || !text) return text;
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200/70 px-0.5 rounded-sm">$1</mark>');
};


// ==================================
// 📞 Utilitas Nomor Telepon
// ==================================

/**
 * Memformat nomor telepon Indonesia ke format internasional (+62).
 * @param phone Nomor telepon.
 * @returns Nomor telepon dalam format +62.
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '-';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('62')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('08')) {
    return `+62${cleaned.substring(1)}`;
  } else if (cleaned.startsWith('8')) {
    return `+62${cleaned}`;
  }
  
  return phone; // Kembalikan asli jika format tidak dikenal
};


// ==================================
// 📦 Utilitas Spesifik Pesanan (Order)
// ==================================

/**
 * Membuat nomor pesanan unik berdasarkan tanggal dan angka acak.
 * @returns Nomor pesanan (misal: ORD250724123).
 */
export const generateOrderNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `ORD${year}${month}${day}${random}`;
};

/**
 * Membuat nomor pesanan unik sekuensial berdasarkan nomor pesanan terakhir.
 * @param lastOrderNumber Nomor pesanan terakhir.
 * @returns Nomor pesanan baru yang sekuensial.
 */
export const generateOrderNumberSequential = (lastOrderNumber?: string): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const currentDate = `${year}${month}${day}`;
  
  let sequence = 1;
  if (lastOrderNumber) {
    const match = lastOrderNumber.match(/ORD(\d{6})(\d{3})$/);
    if (match) {
      const lastDate = match[1];
      const lastSequence = parseInt(match[2]);
      
      if (lastDate === currentDate) {
        sequence = lastSequence + 1;
      }
    }
  }
  
  const sequenceStr = sequence.toString().padStart(3, '0');
  return `ORD${currentDate}${sequenceStr}`;
};


// ==================================
// 🎯 Utilitas Spesifik Promo
// ==================================

/**
 * Mengubah tipe promo teknis menjadi label yang mudah dibaca.
 * @param type Tipe promo (misal: 'discount_percent').
 * @returns Label promo (misal: "Diskon Persentase").
 */
export const formatPromoType = (type: string): string => {
  const promoTypes: Record<string, string> = {
    'discount_percent': 'Diskon Persentase',
    'discount_rp': 'Diskon Rupiah',
    'bogo': 'Beli 1 Gratis 1'
  };
  return promoTypes[type] || toTitleCase(type.replace(/_/g, ' '));
};

/**
 * Membuat ringkasan detail promo yang mudah dibaca.
 * @param type Tipe promo.
 * @param details Objek yang berisi detail promo.
 * @returns String ringkasan promo.
 */
export const formatPromoDetails = (type: string, details: any): string => {
  if (!details) return 'Detail tidak tersedia';
  switch (type) {
    case 'discount_percent':
      return `${details.value}% diskon`;
    case 'discount_rp':
      return `Potongan ${formatCurrency(details.value)}`;
    case 'bogo':
      return `Beli ${details.buy} Gratis ${details.get}`;
    default:
      return 'Promo tidak dikenal';
  }
};


// ==================================
// 🔧 Utilitas Lain-lain
// ==================================

/**
 * Memformat ukuran file dari byte menjadi unit yang lebih besar (KB, MB, GB).
 * @param bytes Ukuran file dalam byte.
 * @returns String ukuran file yang mudah dibaca.
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Mengubah durasi dalam milidetik menjadi format yang mudah dibaca (ms, s, m, h).
 * @param milliseconds Durasi dalam milidetik.
 * @returns String durasi yang diformat.
 */
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
  
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

/**
 * Mendapatkan kelas warna Tailwind CSS berdasarkan persentase margin.
 * @param marginPercent Persentase margin.
 * @returns String kelas warna Tailwind.
 */
export const formatMarginColor = (marginPercent: number): string => {
  if (marginPercent < 0) return 'text-red-600';
  if (marginPercent < 0.1) return 'text-orange-600';
  if (marginPercent < 0.2) return 'text-yellow-600';
  return 'text-green-600';
};

/**
 * Mendapatkan kelas warna Tailwind CSS berdasarkan status.
 * @param status Status (misal: 'active', 'pending').
 * @returns String kelas warna Tailwind.
 */
export const formatStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'active': 'text-green-600 bg-green-100',
    'inactive': 'text-gray-600 bg-gray-100',
    'pending': 'text-yellow-600 bg-yellow-100',
    'error': 'text-red-600 bg-red-100'
  };
  return statusColors[status.toLowerCase()] || 'text-gray-600 bg-gray-100';
};


// ==================================
// 🔄 Utilitas Parsing (Kebalikan dari Formatting)
// ==================================

/**
 * Mengubah string mata uang kembali menjadi angka.
 * @param currencyString String mata uang (misal: "Rp 50.000").
 * @returns Angka hasil parsing.
 */
export const parseCurrency = (currencyString: string): number => {
  if (!currencyString) return 0;
  const cleaned = currencyString.replace(/[^\d,-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Mengubah string persentase kembali menjadi angka desimal.
 * @param percentageString String persentase (misal: "25%").
 * @returns Angka desimal hasil parsing (misal: 0.25).
 */
export const parsePercentage = (percentageString: string): number => {
  if (!percentageString) return 0;
  const cleaned = percentageString.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed / 100;
};
