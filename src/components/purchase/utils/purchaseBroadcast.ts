// src/components/purchase/utils/purchaseBroadcast.ts
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

import type { Purchase } from '../types/purchase.types';

interface ActivityFn {
  (payload: { title: string; description: string; type: string; value: any }): void;
}

interface NotificationFn {
  (payload: {
    title: string;
    message: string;
    type: 'success' | 'warning' | 'info' | 'error';
    icon?: string;
    priority?: number;
    related_type?: string;
    related_id?: string;
    action_url?: string;
    is_read?: boolean;
  }): void;
}

export function broadcastPurchaseCreated(
  purchase: Purchase,
  getSupplierName: (idOrName: string) => string,
  addActivity?: ActivityFn,
  addNotification?: NotificationFn
) {
  try {
    const supplierName = getSupplierName(purchase.supplier);
    const totalValue = formatCurrency(((purchase as any).totalNilai ?? (purchase as any).total_nilai) as number);

    toast.success(`Pembelian dibuat (${supplierName} • ${totalValue})`);

    addActivity?.({
      title: 'Pembelian Ditambahkan',
      description: `Pembelian dari ${supplierName} senilai ${totalValue}`,
      type: 'purchase',
      value: null,
    });

    addNotification?.({
      title: '📦 Pembelian Baru',
      message: `Pembelian dari ${supplierName} senilai ${totalValue}`,
      type: 'success',
      icon: 'shopping-cart',
      priority: 2,
      related_type: 'purchase',
      related_id: purchase.id,
      action_url: '/pembelian',
      is_read: false,
    });
  } catch (e) {
    logger.warn('broadcastPurchaseCreated failed', e);
  }
}

