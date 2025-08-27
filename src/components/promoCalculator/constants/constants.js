// 📋 Constants untuk Promo Calculator

// Promo Types
export const PROMO_TYPES = {
  BOGO: 'bogo',
  DISCOUNT: 'discount',
  BUNDLE: 'bundle'
};

// Promo Status
export const PROMO_STATUS = {
  ACTIVE: 'aktif',
  INACTIVE: 'nonaktif',
  DRAFT: 'draft'
};

// Discount Types
export const DISCOUNT_TYPES = {
  PERCENTAGE: 'persentase',
  NOMINAL: 'nominal'
};

// Promo Labels
export const PROMO_LABELS = {
  [PROMO_TYPES.BOGO]: 'BOGO (Buy One Get One)',
  [PROMO_TYPES.DISCOUNT]: 'Diskon',
  [PROMO_TYPES.BUNDLE]: 'Paket Bundle'
};

// Status Labels
export const STATUS_LABELS = {
  [PROMO_STATUS.ACTIVE]: 'Aktif',
  [PROMO_STATUS.INACTIVE]: 'Non-aktif',
  [PROMO_STATUS.DRAFT]: 'Draft'
};

// Status Colors
export const STATUS_COLORS = {
  [PROMO_STATUS.ACTIVE]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  },
  [PROMO_STATUS.INACTIVE]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  [PROMO_STATUS.DRAFT]: {
    bg: 'bg-gray-200',
    text: 'text-gray-800',
    border: 'border-gray-300'
  }
};

// Promo Type Colors
export const PROMO_TYPE_COLORS = {
  [PROMO_TYPES.BOGO]: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    border: 'border-green-200',
    icon: 'text-green-600'
  },
  [PROMO_TYPES.DISCOUNT]: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    border: 'border-blue-200',
    icon: 'text-blue-600'
  },
  [PROMO_TYPES.BUNDLE]: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    border: 'border-purple-200',
    icon: 'text-purple-600'
  }
};

// Default Values
export const DEFAULT_VALUES = {
  PAGINATION: {
    PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [5, 10, 25, 50]
  },
  FORM: {
    MIN_DISCOUNT: 0.1,
    MAX_DISCOUNT_PERCENT: 100,
    MIN_BUNDLE_ITEMS: 2,
    MAX_BUNDLE_ITEMS: 10,
    MIN_QUANTITY: 1,
    MAX_QUANTITY: 999
  },
  WARNINGS: {
    LOW_MARGIN_THRESHOLD: 10,
    NEGATIVE_MARGIN_THRESHOLD: 0,
    HIGH_MARGIN_IMPACT_THRESHOLD: 20
  }
};

// Validation Rules
export const VALIDATION_RULES = {
  PROMO_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100
  },
  DESCRIPTION: {
    MAX_LENGTH: 500
  },
  DISCOUNT: {
    MIN_PERCENTAGE: 0.1,
    MAX_PERCENTAGE: 100,
    MIN_NOMINAL: 100
  }
};

// Animation Durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
};

// Export all as default object for convenience
export default {
  PROMO_TYPES,
  PROMO_STATUS,
  DISCOUNT_TYPES,
  PROMO_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  PROMO_TYPE_COLORS,
  DEFAULT_VALUES,
  VALIDATION_RULES,
  ANIMATION_DURATION
};