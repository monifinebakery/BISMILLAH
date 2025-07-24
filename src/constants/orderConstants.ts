// src/components/orders/constants/orderConstants.ts
import { OrderStatus, OrderStatusOption } from '../types';

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusOption> = {
  pending: {
    key: 'pending',
    label: 'Menunggu Konfirmasi',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700'
  },
  confirmed: {
    key: 'confirmed',
    label: 'Dikonfirmasi',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  },
  processing: {
    key: 'processing',
    label: 'Diproses',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700'
  },
  ready: {
    key: 'ready',
    label: 'Siap Diantar',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700'
  },
  delivered: {
    key: 'delivered',
    label: 'Bisa diambil',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700'
  },
  completed: {
    key: 'completed',
    label: 'Selesai',
    color: 'bg-green-100 text-green-800 border-green-200',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700'
  },
  cancelled: {
    key: 'cancelled',
    label: 'Dibatalkan',
    color: 'bg-red-100 text-red-800 border-red-200',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700'
  }
};

export const orderStatusList: OrderStatusOption[] = Object.values(ORDER_STATUS_CONFIG);

export const getStatusText = (status: string): string => {
  return ORDER_STATUS_CONFIG[status as OrderStatus]?.label || status;
};

export const getStatusColor = (status: string): string => {
  return ORDER_STATUS_CONFIG[status as OrderStatus]?.color || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getStatusBgColor = (status: string): string => {
  return ORDER_STATUS_CONFIG[status as OrderStatus]?.bgColor || 'bg-gray-50';
};

export const getStatusTextColor = (status: string): string => {
  return ORDER_STATUS_CONFIG[status as OrderStatus]?.textColor || 'text-gray-700';
};

// Pagination constants
export const DEFAULT_ITEMS_PER_PAGE = 10;
export const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

// Date range presets
export const DATE_RANGE_PRESETS = [
  { label: "Hari Ini", days: 0, key: 'today' },
  { label: "Kemarin", days: 1, key: 'yesterday' },
  { label: "7 Hari Terakhir", days: 6, key: 'last7days' },
  { label: "30 Hari Terakhir", days: 29, key: 'last30days' },
  { label: "Bulan Ini", days: null, key: 'thisMonth' },
  { label: "Bulan Lalu", days: null, key: 'lastMonth' }
];