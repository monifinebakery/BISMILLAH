// 🎯 80 lines - All constants
import { OrderStatus } from './types';

// Order Status Constants
export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed', 
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'completed'
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Diterima',
  cancelled: 'Dibatalkan',
  completed: 'Selesai'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-purple-100 text-purple-800 border-purple-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200'
};

export const DEFAULT_ORDER_STATUS: OrderStatus = 'pending';

export const EDITABLE_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing'
];

export const FINAL_STATUSES: OrderStatus[] = [
  'delivered',
  'cancelled', 
  'completed'
];

// Table Configuration
export const TABLE_PAGE_SIZES = [5, 10, 20, 50, 100];
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_BULK_OPERATIONS = 100;

// UI Constants
export const DIALOG_SIZES = {
  small: 'max-w-md',
  medium: 'max-w-lg', 
  large: 'max-w-2xl',
  extraLarge: 'max-w-4xl'
};

export const LOADING_MESSAGES = {
  orders: 'Memuat pesanan...',
  saving: 'Menyimpan pesanan...',
  deleting: 'Menghapus pesanan...',
  updating: 'Memperbarui pesanan...'
};

export const ERROR_MESSAGES = {
  generic: 'Terjadi kesalahan tidak terduga',
  network: 'Koneksi bermasalah, silakan coba lagi',
  validation: 'Data yang dimasukkan tidak valid',
  notFound: 'Data tidak ditemukan',
  unauthorized: 'Anda tidak memiliki akses'
};

// Helper Functions
export const getStatusText = (status: OrderStatus): string => {
  return ORDER_STATUS_LABELS[status] || status;
};

export const getStatusColor = (status: OrderStatus): string => {
  return ORDER_STATUS_COLORS[status] || ORDER_STATUS_COLORS.pending;
};

export const isEditableStatus = (status: OrderStatus): boolean => {
  return EDITABLE_STATUSES.includes(status);
};

export const isFinalStatus = (status: OrderStatus): boolean => {
  return FINAL_STATUSES.includes(status);
};