// src/components/operational-costs/utils/validationAndMicrocopy.ts
// 📋 Validation & Indonesian Microcopy (Revision 8)
// Comprehensive guardrails and user-friendly messages



// ====================================
// VALIDATION CONSTANTS
// ====================================

export const VALIDATION_RULES = {
  const { formatCurrency } = useCurrency();  // Target output validation
  TARGET_OUTPUT: {
    MIN: 1,
    MAX: 1000000,
    RECOMMENDED_MIN: 100,
    RECOMMENDED_MAX: 50000
  },
  
  // Monthly amount validation
  MONTHLY_AMOUNT: {
    MIN: 1000,
    MAX: 10000000000,
    RECOMMENDED_MIN: 50000,
    RECOMMENDED_MAX: 100000000
  },
  
  // Cost name validation
  COST_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
    FORBIDDEN_CHARS: ['<', '>', '&', '"', "'", '\\']
  },
  
  // Percentage validation
  PERCENTAGE: {
    MIN: 0,
    MAX: 1000,
    RECOMMENDED_MAX: 100
  },
  
  // Currency rounding
  ROUNDING: {
    DEFAULT: 1,
    FIFTY: 50,
    HUNDRED: 100
  }
} as const;

// ====================================
// INDONESIAN MICROCOPY
// ====================================

export const MICROCOPY = {
  const { formatCurrency } = useCurrency();  // Form labels and placeholders
  LABELS: {
    COST_NAME: 'Nama Biaya',
    MONTHLY_AMOUNT: 'Jumlah per Bulan',
    COST_TYPE: 'Jenis Biaya',
    COST_GROUP: 'Kelompok Biaya',
    TARGET_OUTPUT: 'Target Produksi Bulanan',
    DESCRIPTION: 'Deskripsi (Opsional)',
    STATUS: 'Status'
  },
  
  PLACEHOLDERS: {
    COST_NAME: 'Contoh: Gas oven, Sewa dapur, Marketing digital',
    MONTHLY_AMOUNT: '500.000',
    TARGET_OUTPUT: '3.000',
    DESCRIPTION: 'Tambahkan catatan tentang biaya ini...'
  },
  
  // Group descriptions
  GROUPS: {
    HPP: {
      LABEL: 'Overhead Pabrik (masuk HPP)',
      DESCRIPTION: 'Biaya tidak langsung yang terkait dengan proses produksi, seperti gas oven, sewa dapur, dan supervisi produksi. Biaya ini akan ditambahkan ke HPP produk.',
      EXAMPLES: 'Contoh: Gas oven, sewa dapur, penyusutan mixer, supervisor produksi'
    },
    OPERASIONAL: {
      LABEL: 'Biaya Operasional',
      DESCRIPTION: 'Biaya untuk menjalankan operasional bisnis (marketing, administrasi, marketplace, dll). Di aplikasi, biaya ini didistribusikan per pcs dan ikut masuk HPP resep agar pricing lebih realistis. Juga digunakan untuk analisis BEP.',
      EXAMPLES: 'Contoh: Marketing, admin kasir, internet toko, biaya marketplace'
    }
  },
  
  // Cost types
  TYPES: {
    TETAP: {
      LABEL: 'Biaya Tetap',
      DESCRIPTION: 'Biaya yang jumlahnya relatif sama setiap bulan, tidak terpengaruh volume produksi',
      EXAMPLES: 'Sewa, gaji tetap, asuransi, listrik dasar'
    },
    VARIABEL: {
      LABEL: 'Biaya Variabel', 
      DESCRIPTION: 'Biaya yang berubah sesuai dengan volume produksi atau penjualan',
      EXAMPLES: 'Packaging, komisi marketplace, biaya kirim, iklan performance'
    }
  },
  
  // Validation messages
  VALIDATION: {
    REQUIRED: (field: string) => `${field} wajib diisi`,
    MIN_LENGTH: (field: string, min: number) => `${field} minimal ${min} karakter`,
    MAX_LENGTH: (field: string, max: number) => `${field} maksimal ${max} karakter`,
    MIN_VALUE: (field: string, min: number) => `${field} minimal ${formatCurrency(min)}`,
    MAX_VALUE: (field: string, max: number) => `${field} maksimal ${formatCurrency(max)}`,
    INVALID_CHARS: (field: string) => `${field} mengandung karakter yang tidak diperbolehkan`,
    INVALID_FORMAT: (field: string) => `Format ${field} tidak valid`,
    
    // Specific validation messages
    TARGET_OUTPUT_TOO_LOW: 'Target produksi terlalu rendah. Untuk bisnis UMKM, minimal 100 pcs per bulan disarankan.',
    TARGET_OUTPUT_TOO_HIGH: 'Target produksi sangat tinggi. Pastikan angka sudah benar.',
    AMOUNT_TOO_LOW: 'Jumlah biaya terlalu kecil. Minimal 1.000 untuk pencatatan yang akurat.',
      AMOUNT_TOO_HIGH: 'Jumlah biaya sangat besar. Pastikan angka sudah benar.',
      COST_NAME_EMPTY: 'Nama biaya tidak boleh kosong',
      COST_NAME_TOO_SHORT: 'Nama biaya terlalu pendek. Minimal 3 karakter untuk kejelasan.',

      // Calculation specific
      DIVISION_BY_ZERO: 'Target produksi tidak boleh 0 pcs. Masukkan jumlah produk yang akan dibuat per bulan.',
      NEGATIVE_RESULT: 'Hasil kalkulasi tidak boleh negatif. Periksa kembali input Anda.',
      PERCENTAGE_TOO_HIGH: 'Persentase terlalu tinggi. Maksimal 1000% untuk keamanan kalkulasi.'
    },
  
  // Success messages
  SUCCESS: {
    COST_ADDED: 'Biaya berhasil ditambahkan',
    COST_UPDATED: 'Biaya berhasil diperbarui',
    COST_DELETED: 'Biaya berhasil dihapus',
    CALCULATION_COMPLETE: 'Kalkulasi berhasil diselesaikan',
    SETTINGS_SAVED: 'Pengaturan berhasil disimpan',
    CLASSIFICATION_APPLIED: 'Klasifikasi otomatis berhasil diterapkan',
    PRODUCTION_DATA_LOADED: 'Data produksi berhasil dimuat'
  },
  
  // Warning messages
  WARNING: {
    DATA_WILL_BE_LOST: 'Data yang belum disimpan akan hilang. Yakin ingin melanjutkan?',
    HIGH_OVERHEAD_PERCENTAGE: 'Persentase overhead cukup tinggi. Pastikan sudah sesuai dengan kondisi bisnis Anda.',
    LOW_PRODUCTION_TARGET: 'Target produksi terlihat rendah. Apakah sudah sesuai dengan kapasitas bisnis Anda?',
    NO_OVERHEAD_SETTINGS: 'Belum ada penghitungan biaya produksi. Silakan gunakan Kalkulator Biaya Produksi terlebih dahulu.',
    CLASSIFICATION_LOW_CONFIDENCE: 'Tingkat keyakinan klasifikasi rendah. Silakan pilih kelompok biaya secara manual.',
    PRODUCTION_DATA_OLD: 'Data produksi mungkin sudah lama. Pertimbangkan untuk memperbarui target secara manual.'
  },
  
  // Error messages
  ERROR: {
    GENERAL: 'Terjadi kesalahan. Silakan coba lagi.',
    NETWORK: 'Koneksi bermasalah. Periksa internet Anda dan coba lagi.',
    SERVER: 'Server sedang bermasalah. Silakan coba beberapa saat lagi.',
    UNAUTHORIZED: 'Sesi Anda telah berakhir. Silakan login kembali.',
    NOT_FOUND: 'Data tidak ditemukan',
    VALIDATION_FAILED: 'Ada kesalahan dalam input. Periksa kembali form Anda.',
    CALCULATION_FAILED: 'Gagal melakukan kalkulasi. Periksa kembali input angka Anda.',
    CLASSIFICATION_FAILED: 'Gagal melakukan klasifikasi otomatis',
    PRODUCTION_DATA_FAILED: 'Gagal mengambil data produksi'
  },
  
  // Helper text
  HELPERS: {
    TARGET_OUTPUT: 'Masukkan perkiraan jumlah produk yang akan dibuat dalam 1 bulan. Angka ini digunakan untuk menghitung biaya per produk.',
    MONTHLY_AMOUNT: 'Masukkan jumlah rupiah yang dikeluarkan untuk biaya ini setiap bulan.',
    COST_GROUP_SELECTION: 'Pilih Overhead Pabrik jika biaya terkait langsung dengan produksi. Pilih Operasional jika untuk menjalankan bisnis secara umum.',
    COST_TYPE_SELECTION: 'Tetap = sama setiap bulan. Variabel = berubah sesuai volume produksi.',
    CLASSIFICATION_SUGGESTION: 'Sistem memberikan saran kelompok berdasarkan nama biaya. Anda dapat mengubahnya jika diperlukan.',
    PRODUCTION_AUTO_FETCH: 'Klik untuk mengambil data produksi 30 hari terakhir secara otomatis dari pesanan yang sudah selesai.',
    DUAL_MODE_CALCULATION: 'Kalkulasi ini mengelompokkan biaya produksi (overhead produksi + operasional) untuk distribusi per pcs.',
    OVERHEAD_PER_PCS: 'Nilai ini otomatis ditambahkan ke setiap resep sebagai biaya produksi (termasuk TKL).',
    OPERASIONAL_PER_PCS: 'Nilai ini ikut menambah HPP resep (digabung dengan overhead) dan digunakan untuk analisis BEP/pricing.'
  },
  
  // Confirmation messages
  CONFIRMATIONS: {
    DELETE_COST: 'Yakin ingin menghapus biaya ini? Data yang sudah dihapus tidak dapat dikembalikan.',
    RESET_FORM: 'Yakin ingin mengosongkan form? Data yang sudah diisi akan hilang.',
    CHANGE_GROUP: 'Yakin ingin mengubah kelompok biaya? Ini akan memengaruhi kalkulasi HPP.',
    APPLY_CLASSIFICATION: 'Yakin ingin menerapkan klasifikasi otomatis? Kelompok biaya akan berubah.',
    USE_PRODUCTION_DATA: 'Yakin ingin menggunakan data produksi ini? Target output akan berubah.',
    SAVE_CALCULATION: 'Yakin ingin menyimpan hasil kalkulasi? Ini akan memengaruhi perhitungan HPP di resep.'
  }
} as const;

// ====================================
// VALIDATION FUNCTIONS
// ====================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate target output
 */
export const validateTargetOutput = (value: number): ValidationResult => {
  const { formatCurrency } = useCurrency();  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!value || value <= 0) {
    errors.push(MICROCOPY.VALIDATION.DIVISION_BY_ZERO);
  } else if (value < VALIDATION_RULES.TARGET_OUTPUT.MIN) {
    errors.push(MICROCOPY.VALIDATION.TARGET_OUTPUT_TOO_LOW);
  } else if (value < VALIDATION_RULES.TARGET_OUTPUT.RECOMMENDED_MIN) {
    warnings.push(MICROCOPY.WARNING.LOW_PRODUCTION_TARGET);
  } else if (value > VALIDATION_RULES.TARGET_OUTPUT.MAX) {
    errors.push(MICROCOPY.VALIDATION.TARGET_OUTPUT_TOO_HIGH);
  } else if (value > VALIDATION_RULES.TARGET_OUTPUT.RECOMMENDED_MAX) {
    warnings.push(MICROCOPY.VALIDATION.TARGET_OUTPUT_TOO_HIGH);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate monthly amount
 */
export const validateMonthlyAmount = (value: number): ValidationResult => {
  const { formatCurrency } = useCurrency();  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!value || value <= 0) {
    errors.push(MICROCOPY.VALIDATION.REQUIRED('Jumlah per bulan'));
  } else if (value < VALIDATION_RULES.MONTHLY_AMOUNT.MIN) {
    errors.push(MICROCOPY.VALIDATION.AMOUNT_TOO_LOW);
  } else if (value < VALIDATION_RULES.MONTHLY_AMOUNT.RECOMMENDED_MIN) {
    warnings.push('Jumlah biaya terlihat kecil. Pastikan sudah sesuai dengan kondisi bisnis Anda.');
  } else if (value > VALIDATION_RULES.MONTHLY_AMOUNT.MAX) {
    errors.push(MICROCOPY.VALIDATION.AMOUNT_TOO_HIGH);
  } else if (value > VALIDATION_RULES.MONTHLY_AMOUNT.RECOMMENDED_MAX) {
    warnings.push('Jumlah biaya cukup besar. Pastikan angka sudah benar.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate cost name
 */
export const validateCostName = (value: string): ValidationResult => {
  const { formatCurrency } = useCurrency();  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!value || value.trim().length === 0) {
    errors.push(MICROCOPY.VALIDATION.COST_NAME_EMPTY);
  } else if (value.trim().length < VALIDATION_RULES.COST_NAME.MIN_LENGTH) {
    errors.push(MICROCOPY.VALIDATION.COST_NAME_TOO_SHORT);
  } else if (value.length > VALIDATION_RULES.COST_NAME.MAX_LENGTH) {
    errors.push(MICROCOPY.VALIDATION.MAX_LENGTH('Nama biaya', VALIDATION_RULES.COST_NAME.MAX_LENGTH));
  }
  
  // Check for forbidden characters
  const hasForbiddenChars = VALIDATION_RULES.COST_NAME.FORBIDDEN_CHARS.some(char => 
    value.includes(char)
  );
  if (hasForbiddenChars) {
    errors.push(MICROCOPY.VALIDATION.INVALID_CHARS('Nama biaya'));
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate percentage value
 */
export const validatePercentage = (value: number, fieldName: string = 'Persentase'): ValidationResult => {
  const { formatCurrency } = useCurrency();  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (value < VALIDATION_RULES.PERCENTAGE.MIN) {
    errors.push(`${fieldName} tidak boleh negatif`);
  } else if (value > VALIDATION_RULES.PERCENTAGE.MAX) {
    errors.push(MICROCOPY.VALIDATION.PERCENTAGE_TOO_HIGH);
  } else if (value > VALIDATION_RULES.PERCENTAGE.RECOMMENDED_MAX) {
    warnings.push(MICROCOPY.WARNING.HIGH_OVERHEAD_PERCENTAGE);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Comprehensive form validation
 */
export const validateCostForm = (data: {
  const { formatCurrency } = useCurrency();  nama_biaya: string;
  jumlah_per_bulan: number;
  jenis: string;
  group: string;
  target_output?: number;
}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate each field
  const nameValidation = validateCostName(data.nama_biaya);
  errors.push(...nameValidation.errors);
  warnings.push(...nameValidation.warnings);
  
  const amountValidation = validateMonthlyAmount(data.jumlah_per_bulan);
  errors.push(...amountValidation.errors);
  warnings.push(...amountValidation.warnings);
  
  if (data.target_output) {
    const outputValidation = validateTargetOutput(data.target_output);
    errors.push(...outputValidation.errors);
    warnings.push(...outputValidation.warnings);
  }
  
  // Validate required fields
  if (!data.jenis) {
    errors.push(MICROCOPY.VALIDATION.REQUIRED('Jenis biaya'));
  }
  
  if (!data.group) {
    errors.push(MICROCOPY.VALIDATION.REQUIRED('Kelompok biaya'));
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// ====================================
// UTILITY FUNCTIONS
// ====================================

/**
 * Round currency according to business rules
 */
export const roundCurrencyWithRule = (
  amount: number, 
  rule: keyof typeof VALIDATION_RULES.ROUNDING = 'DEFAULT'
): number => {
  const roundTo = VALIDATION_RULES.ROUNDING[rule];
  if (roundTo === 1) {
    return Math.round(amount);
  }
  return Math.round(amount / roundTo) * roundTo;
};

/**
 * Format validation message for display
 */
export const formatValidationMessage = (
  validation: ValidationResult,
  includeWarnings: boolean = true
): string => {
  const messages: string[] = [...validation.errors];
  if (includeWarnings) {
    messages.push(...validation.warnings);
  }
  return messages.join('. ');
};

/**
 * Get appropriate microcopy based on context
 */
export const getMicrocopy = (
  category: keyof typeof MICROCOPY,
  key: string,
  fallback: string = ''
): string => {
  try {
    const categoryData = MICROCOPY[category] as any;
    return categoryData[key] || fallback;
  } catch {
    return fallback;
  }
};

/**
 * Generate contextual help text
 */
export const getContextualHelp = (field: string, value?: any): string => {
  const { formatCurrency } = useCurrency();  switch (field) {
    case 'cost_name':
      return MICROCOPY.HELPERS.TARGET_OUTPUT;
    case 'monthly_amount':
      return MICROCOPY.HELPERS.MONTHLY_AMOUNT;
    case 'group':
      return MICROCOPY.HELPERS.COST_GROUP_SELECTION;
    case 'jenis':
      return MICROCOPY.HELPERS.COST_TYPE_SELECTION;
    case 'target_output':
      return MICROCOPY.HELPERS.TARGET_OUTPUT;
    default:
      return '';
  }
};
