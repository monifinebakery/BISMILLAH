import type { PurchaseStatus } from '../types/purchase.types';

export const STATUS_OPTIONS: { value: PurchaseStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'completed', label: 'Selesai', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-100 text-red-800 border-red-200' },
];

