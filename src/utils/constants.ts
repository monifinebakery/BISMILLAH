// utils/constants.ts - Constants & Configurations

// 🎯 Promo Configuration
export const PROMO_TYPES = {
  DISCOUNT_PERCENT: 'discount_percent',
  DISCOUNT_RP: 'discount_rp',
  BOGO: 'bogo'
} as const;

export const PROMO_TYPE_LABELS = {
  [PROMO_TYPES.DISCOUNT_PERCENT]: 'Diskon Persentase (%)',
  [PROMO_TYPES.DISCOUNT_RP]: 'Diskon Nominal (Rp)',
  [PROMO_TYPES.BOGO]: 'Beli X Gratis Y (BOGO)'
};

// 🔢 Validation Rules
export const VALIDATION_RULES = {
  PROMO_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100
  },
  DISCOUNT_PERCENT: {
    MIN: 0.1,
    MAX: 99.9
  },
  DISCOUNT_RP: {
    MIN: 100,
    MAX: 1000000
  },
  BOGO: {
    MIN_BUY: 1,
    MAX_BUY: 10,
    MIN_GET: 0,
    MAX_GET: 10
  }
};

// 📊 Margin Thresholds
export const MARGIN_THRESHOLDS = {
  NEGATIVE: 0,
  LOW: 0.1,      // 10%
  MEDIUM: 0.2,   // 20%
  GOOD: 0.3,     // 30%
  EXCELLENT: 0.5 // 50%
};

export const MARGIN_COLORS = {
  NEGATIVE: 'text-red-600 bg-red-50',
  LOW: 'text-orange-600 bg-orange-50',
  MEDIUM: 'text-yellow-600 bg-yellow-50',
  GOOD: 'text-green-600 bg-green-50',
  EXCELLENT: 'text-blue-600 bg-blue-50'
};

// 📱 UI Configuration
export const UI_CONFIG = {
  ITEMS_PER_PAGE: 5,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
  MODAL_ANIMATION_DURATION: 200,
  SKELETON_LINES: 3
};

// 📏 Breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536
};

// 🎨 Theme Colors
export const THEME_COLORS = {
  PRIMARY: '#F97316', // orange-500
  SECONDARY: '#EF4444', // red-500
  SUCCESS: '#10B981', // emerald-500
  WARNING: '#F59E0B', // amber-500
  ERROR: '#EF4444', // red-500
  INFO: '#3B82F6', // blue-500
  NEUTRAL: '#6B7280' // gray-500
};

// 🎭 Status Types
export const STATUS_TYPES = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  IDLE: 'idle'
} as const;

// 📊 Chart Configuration
export const CHART_CONFIG = {
  COLORS: [
    '#F97316', // orange-500
    '#EF4444', // red-500
    '#10B981', // emerald-500
    '#3B82F6', // blue-500
    '#8B5CF6', // violet-500
    '#F59E0B', // amber-500
    '#EC4899', // pink-500
    '#06B6D4'  // cyan-500
  ],
  HEIGHT: 300,
  RESPONSIVE: true
};

// 🔤 Input Patterns
export const INPUT_PATTERNS = {
  PHONE: /^[\+]?[\d\s\-\(\)]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NUMERIC: /^[\d\.,]+$/,
  CURRENCY: /^[\d\.,]+$/,
  PERCENTAGE: /^[\d\.,]+%?$/
};

// 📁 File Configuration
export const FILE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  UPLOAD_URL: '/api/upload'
};

// 🔄 API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || '/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// 📊 Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  CALCULATION_TIME: 100, // ms
  RENDER_TIME: 16, // ms (60fps)
  BUNDLE_SIZE: 500, // KB
  MEMORY_USAGE: 50 // MB
};

// 🔍 Search Configuration
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 100,
  HIGHLIGHT_CLASS: 'bg-yellow-200'
};

// 📅 Date Formats
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd MMMM yyyy',
  TIME: 'dd/MM/yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  DISPLAY: 'EEEE, dd MMMM yyyy'
};

// 🌐 Localization
export const LOCALES = {
  ID: 'id-ID',
  EN: 'en-US'
};

export const CURRENCY_CONFIG = {
  LOCALE: LOCALES.ID,
  CURRENCY: 'IDR',
  SYMBOL: 'Rp',
  DECIMAL_PLACES: 0
};

// 🔐 Security Configuration
export const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 60 * 60 * 1000, // 1 hour
  CSRF_TOKEN_HEADER: 'X-CSRF-Token'
};

// 📊 Analytics Events
export const ANALYTICS_EVENTS = {
  PROMO_CALCULATED: 'promo_calculated',
  PROMO_SAVED: 'promo_saved',
  PROMO_DELETED: 'promo_deleted',
  PAGE_VIEW: 'page_view',
  FORM_INTERACTION: 'form_interaction',
  ERROR_OCCURRED: 'error_occurred'
};

// 🎯 Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  ENABLE_ERROR_TRACKING: process.env.REACT_APP_ENABLE_ERROR_TRACKING === 'true',
  ENABLE_PERFORMANCE_MONITORING: process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true',
  ENABLE_DARK_MODE: process.env.REACT_APP_ENABLE_DARK_MODE === 'true',
  ENABLE_EXPORT_FEATURES: process.env.REACT_APP_ENABLE_EXPORT_FEATURES === 'true'
};

// 🔄 Loading States
export const LOADING_MESSAGES = {
  CALCULATING: 'Menghitung promo...',
  SAVING: 'Menyimpan data...',
  LOADING: 'Memuat data...',
  DELETING: 'Menghapus data...',
  UPLOADING: 'Mengupload file...'
};

// ⚠️ Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Koneksi internet bermasalah',
  SERVER_ERROR: 'Terjadi kesalahan pada server',
  VALIDATION_ERROR: 'Data yang dimasukkan tidak valid',
  UNAUTHORIZED: 'Anda tidak memiliki akses',
  NOT_FOUND: 'Data tidak ditemukan',
  TIMEOUT: 'Permintaan timeout',
  UNKNOWN_ERROR: 'Terjadi kesalahan yang tidak diketahui'
};

// ✅ Success Messages
export const SUCCESS_MESSAGES = {
  PROMO_SAVED: 'Promo berhasil disimpan',
  PROMO_DELETED: 'Promo berhasil dihapus',
  DATA_UPDATED: 'Data berhasil diperbarui',
  FILE_UPLOADED: 'File berhasil diupload',
  SETTINGS_SAVED: 'Pengaturan berhasil disimpan'
};

// 🎯 Default Values
export const DEFAULT_VALUES = {
  PROMO_TYPE: PROMO_TYPES.DISCOUNT_PERCENT,
  DISCOUNT_PERCENT: 10,
  DISCOUNT_RP: 5000,
  BOGO_BUY: 2,
  BOGO_GET: 1,
  ITEMS_PER_PAGE: 5,
  CURRENT_PAGE: 1
};

// 📊 Calculation Constants
export const CALCULATION_CONSTANTS = {
  MAX_DISCOUNT_PERCENT: 99,
  MIN_DISCOUNT_PERCENT: 0.1,
  DEFAULT_MARGIN_ESTIMATE: 0.3, // 30%
  PROFIT_TAX_RATE: 0.1, // 10%
  MINIMUM_PRICE: 100 // Rp 100
};

// 🎨 Animation Durations
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000
};

// 📱 Device Detection
export const DEVICE_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280
};

// 🔍 Filter Options
export const FILTER_OPTIONS = {
  PROMO_TYPES: [
    { value: PROMO_TYPES.DISCOUNT_PERCENT, label: 'Diskon Persentase' },
    { value: PROMO_TYPES.DISCOUNT_RP, label: 'Diskon Rupiah' },
    { value: PROMO_TYPES.BOGO, label: 'BOGO' }
  ],
  DATE_RANGES: [
    { value: 'today', label: 'Hari Ini' },
    { value: '7days', label: '7 Hari Terakhir' },
    { value: '30days', label: '30 Hari Terakhir' },
    { value: 'custom', label: 'Kustom' }
  ]
};

// 🎯 Export all constants for easy importing
export const CONSTANTS = {
  PROMO_TYPES,
  PROMO_TYPE_LABELS,
  VALIDATION_RULES,
  MARGIN_THRESHOLDS,
  MARGIN_COLORS,
  UI_CONFIG,
  BREAKPOINTS,
  THEME_COLORS,
  STATUS_TYPES,
  CHART_CONFIG,
  INPUT_PATTERNS,
  FILE_CONFIG,
  API_CONFIG,
  PERFORMANCE_THRESHOLDS,
  SEARCH_CONFIG,
  DATE_FORMATS,
  LOCALES,
  CURRENCY_CONFIG,
  SECURITY_CONFIG,
  ANALYTICS_EVENTS,
  FEATURE_FLAGS,
  LOADING_MESSAGES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULT_VALUES,
  CALCULATION_CONSTANTS,
  ANIMATION_DURATIONS,
  DEVICE_BREAKPOINTS,
  FILTER_OPTIONS
} as const;