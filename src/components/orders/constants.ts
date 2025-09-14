// src/components/orders/constants.ts - Optimized Constants & Performance
/**
 * Orders Constants - Essential Constants Only
 * 
 * Core constants optimized for performance and maintainability
 * ✅ UPDATED: Aligned statuses with types.ts ('preparing', 'ready' instead of 'processing', 'shipped')
 * ✅ UPDATED: Added possible reversals in transitions for flexibility (e.g., back to 'preparing' if needed)
 */

import { OrderStatus } from './types';

// ✅ ORDER STATUS: Core status definitions aligned with types.ts
export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed', 
  'preparing',
  'ready',
  'delivered',
  'cancelled',
  'completed'
] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  preparing: 'Sedang Diproses',
  ready: 'Siap Diambil/Dikirim',
  delivered: 'Sudah Diterima',
  cancelled: 'Dibatalkan',
  completed: 'Selesai'
} as const;

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-purple-100 text-purple-800 border-purple-200',
  ready: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200'
} as const;

// ✅ STATUS GROUPS: Logical groupings for business logic
export const EDITABLE_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing'
] as const;

export const FINAL_STATUSES: OrderStatus[] = [
  'delivered',
  'cancelled', 
  'completed'
] as const;

export const ACTIVE_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready'
] as const;

// ✅ DEFAULTS: Default values
export const DEFAULT_ORDER_STATUS: OrderStatus = 'pending';
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_BULK_OPERATIONS = 100;

// ✅ TABLE CONFIGURATION: UI constants
export const TABLE_PAGE_SIZES = [5, 10, 20, 50, 100] as const;

export const DIALOG_SIZES = {
  small: 'max-w-md',
  medium: 'max-w-lg', 
  large: 'max-w-2xl',
  extraLarge: 'max-w-4xl'
} as const;

// ✅ MESSAGES: User-facing messages
export const LOADING_MESSAGES = {
  orders: 'Memuat pesanan...',
  saving: 'Menyimpan pesanan...',
  deleting: 'Menghapus pesanan...',
  updating: 'Memperbarui pesanan...',
  sending: 'Mengirim pesan...'
} as const;

export const ERROR_MESSAGES = {
  generic: 'Terjadi kesalahan tidak terduga',
  network: 'Koneksi bermasalah, silakan coba lagi',
  validation: 'Data yang dimasukkan tidak valid',
  notFound: 'Data tidak ditemukan',
  unauthorized: 'Anda tidak memiliki akses',
  timeout: 'Permintaan timeout, silakan coba lagi'
} as const;

export const SUCCESS_MESSAGES = {
  created: 'Pesanan berhasil dibuat',
  updated: 'Pesanan berhasil diperbarui',
  deleted: 'Pesanan berhasil dihapus',
  sent: 'Pesan berhasil dikirim'
} as const;

// ✅ VALIDATION: Validation constants
export const VALIDATION_LIMITS = {
  customer_name: { min: 2, max: 100 },
  phone: { min: 8, max: 20 },
  email: { max: 254 },
  address: { max: 500 },
  notes: { max: 1000 },
  order_value: { min: 1, max: 1000000000 },
  items_per_order: { min: 1, max: 100 }
} as const;

// ✅ WHATSAPP: WhatsApp integration constants
export const WHATSAPP_CONFIG = {
  baseUrl: 'https://wa.me/',
  defaultMessage: 'Halo, saya ingin menanyakan tentang pesanan',
  maxMessageLength: 2000
} as const;

// ✅ HELPER FUNCTIONS: Optimized with memoization potential
const statusTextCache = new Map<OrderStatus, string>();
const statusColorCache = new Map<OrderStatus, string>();

export const getStatusText = (status: OrderStatus): string => {
  if (statusTextCache.has(status)) {
    return statusTextCache.get(status)!;
  }
  
  const text = ORDER_STATUS_LABELS[status] || status;
  statusTextCache.set(status, text);
  return text;
};

export const getStatusColor = (status: OrderStatus): string => {
  if (statusColorCache.has(status)) {
    return statusColorCache.get(status)!;
  }
  
  const color = ORDER_STATUS_COLORS[status] || ORDER_STATUS_COLORS.pending;
  statusColorCache.set(status, color);
  return color;
};

export const isEditableStatus = (status: OrderStatus): boolean => {
  return EDITABLE_STATUSES.includes(status);
};

export const isFinalStatus = (status: OrderStatus): boolean => {
  return FINAL_STATUSES.includes(status);
};

export const isActiveStatus = (status: OrderStatus): boolean => {
  return ACTIVE_STATUSES.includes(status);
};

// ✅ STATUS TRANSITIONS: Valid status transitions with added flexibility for reversals
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled', 'pending'], // ✅ Added: Allow back to pending if needed
  preparing: ['ready', 'cancelled', 'confirmed'], // ✅ Added: Allow back to confirmed
  ready: ['delivered', 'cancelled', 'preparing'], // ✅ Added: Allow back to preparing
  delivered: ['completed'],
  cancelled: [], // No transitions from cancelled
  completed: []  // No transitions from completed
} as const;

export const canTransitionTo = (from: OrderStatus, to: OrderStatus): boolean => {
  return STATUS_TRANSITIONS[from]?.includes(to) || false;
};

// ✅ EXPORT: All constants in organized groups
export const OrderConstants = {
  // Status definitions
  statuses: {
    all: ORDER_STATUSES,
    labels: ORDER_STATUS_LABELS,
    colors: ORDER_STATUS_COLORS,
    editable: EDITABLE_STATUSES,
    final: FINAL_STATUSES,
    active: ACTIVE_STATUSES,
    default: DEFAULT_ORDER_STATUS,
    transitions: STATUS_TRANSITIONS
  },
  
  // UI configuration
  ui: {
    pagination: {
      sizes: TABLE_PAGE_SIZES,
      default: DEFAULT_PAGE_SIZE
    },
    dialogs: DIALOG_SIZES,
    bulk: {
      maxOperations: MAX_BULK_OPERATIONS
    }
  },
  
  // Messages
  messages: {
    loading: LOADING_MESSAGES,
    error: ERROR_MESSAGES,
    success: SUCCESS_MESSAGES
  },
  
  // Validation
  validation: VALIDATION_LIMITS,
  
  // WhatsApp
  whatsapp: WHATSAPP_CONFIG,
  
  // Helper functions
  helpers: {
    getStatusText,
    getStatusColor,
    isEditableStatus,
    isFinalStatus,
    isActiveStatus,
    canTransitionTo
  }
} as const;
