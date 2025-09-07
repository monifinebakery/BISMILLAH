// src/utils/constants.ts
// Placeholder constant definitions referenced in utils/index.ts

export const PROMO_TYPES = {};
export const PROMO_TYPE_LABELS = {};
export const VALIDATION_RULES = {};
export const MARGIN_THRESHOLDS = {};
export const MARGIN_COLORS = {};
export const UI_CONFIG = {};
export const BREAKPOINTS = {};
export const STATUS_TYPES = {};
export const CHART_CONFIG = {};
export const INPUT_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\d+$/,
};
export const FILE_CONFIG = {};
export const API_CONFIG = {};
export const PERFORMANCE_THRESHOLDS = {};
export const SEARCH_CONFIG = {};
export const DATE_FORMATS = {};
export const LOCALES = {};
export const CURRENCY_CONFIG = {};
export const SECURITY_CONFIG = {
  RATE_LIMIT: {
    WINDOW_MS: 900000, // 15 minutes
    MAX_REQUESTS: 100,
    MESSAGE: 'Terlalu banyak permintaan, coba lagi nanti'
  },
  CORS_OPTIONS: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  PASSWORD_POLICY: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: true
  },
  SESSION: {
    TIMEOUT: 3600000, // 1 hour
    EXTEND_ON_ACTIVITY: true
  },
  HEADERS: {
    CSP: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: true
    },
    HSTS: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: false
    },
    X_FRAME_OPTIONS: 'DENY',
    X_CONTENT_TYPE_OPTIONS: 'nosniff',
    X_XSS_PROTECTION: '1; mode=block',
    REFERRER_POLICY: 'strict-origin-when-cross-origin'
  },
  VALIDATION: {
    MAX_INPUT_LENGTH: 255,
    MAX_TEXTAREA_LENGTH: 1000,
    MAX_FILE_SIZE: 5242880, // 5MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  },
  ENCRYPTION: {
    ALGORITHM: 'aes-256-gcm',
    IV_LENGTH: 16,
    SALT_LENGTH: 64,
    ITERATIONS: 10000
  }
};
export const ANALYTICS_EVENTS = {};
export const FEATURE_FLAGS = {};
export const LOADING_MESSAGES = {};
export const ERROR_MESSAGES = {};
export const SUCCESS_MESSAGES = {};
export const DEFAULT_VALUES = {};
export const CALCULATION_CONSTANTS = {};
export const ANIMATION_DURATIONS = {};
export const DEVICE_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
};

export const FILTER_OPTIONS = {};
export const CONSTANTS = {};

export default {
  PROMO_TYPES,
  PROMO_TYPE_LABELS,
  VALIDATION_RULES,
  MARGIN_THRESHOLDS,
  MARGIN_COLORS,
  UI_CONFIG,
  BREAKPOINTS,
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
  FILTER_OPTIONS,
  CONSTANTS,
};

