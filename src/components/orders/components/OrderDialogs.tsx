// src/components/orders/components/OrderDialogs.tsx - Optimized Dependencies (6 → 4)

import React, { Suspense, useMemo } from 'react';

// ✅ ESSENTIAL TYPES: Only what's needed
import type { Order, NewOrder } from '../types';

// ✅ SHARED COMPONENT: Direct import
import { DialogLoader } from './shared/LoadingStates';

import { logger } from '@/utils/logger';

// ✅ OPTIMIZED: Lazy loading sederhana untuk dialog
const BulkDeleteDialog = React.lazy(() => import('./dialogs/BulkDeleteDialog'));
const BulkEditDialog = React.lazy(() => import('./dialogs/BulkEditDialog'));
const OrderDetailDialog = React.lazy(() => import('./dialogs/OrderDetailDialog'));

// ❌ REMOVED: Unnecessary imports - already optimized

// ✅ INTERFACES: Props interface
interface OrderDialogsProps {
  // Detail dialog
  showDetailDialog?: boolean;
  detailOrder?: Order | null;
  onCloseDetail?: () => void;
  
  // Bulk operations (optional - for future use)
  showBulkDeleteDialog?: boolean;
  showBulkEditDialog?: boolean;
  selectedOrders?: Order[];
  selectedCount?: number;
  onBulkDelete?: (orderIds: string[]) => Promise<void>;
  onBulkEdit?: (orderIds: string[], updates: Partial<Order>) => Promise<void>;
  onCloseBulkDelete?: () => void;
  onCloseBulkEdit?: () => void;
}

const OrderDialogs: React.FC<OrderDialogsProps> = ({
  // Detail dialog props
  showDetailDialog = false,
  detailOrder = null,
  onCloseDetail,
  
  // Bulk operations props (optional)
  showBulkDeleteDialog = false,
  showBulkEditDialog = false,
  selectedOrders = [],
  selectedCount = 0,
  onBulkDelete,
  onBulkEdit,
  onCloseBulkDelete,
  onCloseBulkEdit
}) => {

  // ✅ MEMOIZED: Bulk operation handlers
  const bulkHandlers = useMemo(() => ({
    delete: async () => {
      if (!onBulkDelete || selectedCount === 0) return;
      
      const orderIds = selectedOrders.map(order => order.id);
      await onBulkDelete(orderIds);
    },
    
    edit: async (updates: Partial<Order>) => {
      if (!onBulkEdit || selectedCount === 0) return;
      
      const orderIds = selectedOrders.map(order => order.id);
      await onBulkEdit(orderIds, updates);
    }
  }), [onBulkDelete, onBulkEdit, selectedOrders, selectedCount]);

  return (
    <>
      {/* ✅ ORDER DETAIL DIALOG: Informasi detail pesanan */}
      {showDetailDialog && detailOrder && (
        <Suspense fallback={<DialogLoader message="Memuat detail pesanan..." />}>
          <OrderDetailDialog
            open={showDetailDialog}
            order={detailOrder}
            onOpenChange={onCloseDetail || (() => {})}
          />
        </Suspense>
      )}

      {/* ✅ BULK DELETE DIALOG: Delete multiple orders */}
      {showBulkDeleteDialog && selectedCount > 0 && (
        <Suspense fallback={<DialogLoader message="Memuat dialog hapus..." />}>
          <BulkDeleteDialog
            isOpen={showBulkDeleteDialog}
            onClose={onCloseBulkDelete || (() => {})}
            onConfirm={bulkHandlers.delete}
            selectedOrders={selectedOrders}
            selectedCount={selectedCount}
          />
        </Suspense>
      )}

      {/* ✅ BULK EDIT DIALOG: Edit multiple orders */}
      {showBulkEditDialog && selectedCount > 0 && (
        <Suspense fallback={<DialogLoader message="Memuat dialog edit..." />}>
          <BulkEditDialog
            isOpen={showBulkEditDialog}
            onClose={onCloseBulkEdit || (() => {})}
            onConfirm={bulkHandlers.edit}
            selectedOrders={selectedOrders}
            selectedCount={selectedCount}
          />
        </Suspense>
      )}
    </>
  );
};

export default OrderDialogs;
