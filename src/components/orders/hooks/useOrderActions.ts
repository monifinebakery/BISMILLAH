// src/components/orders/hooks/useOrderActions.ts
import { useMemo } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { getStatusText } from '../constants';
import { to_snake_order } from '../naming';
import type { EnhancedOrderContextType, Order, NewOrder, OrderStatus } from '../types';
import { useOrderOperationsSnake } from './useOrderData';

interface DialogControls {
  openOrderForm: (order?: Order | null) => void;
  closeOrderForm: () => void;
}

interface UseOrderActionsArgs {
  context: EnhancedOrderContextType;
  ordersForView: Order[];
  // Selection helpers from UI state
  selectedIds: string[];
  toggleSelectOrder: (orderId: string, forceValue?: boolean) => void;
  // Editing state
  editingOrder: Order | null;
  // Dialog controls
  dialog: DialogControls;
}

export const useOrderActions = ({
  context,
  ordersForView,
  selectedIds,
  toggleSelectOrder,
  editingOrder,
  dialog,
}: UseOrderActionsArgs) => {
  const { addOrder: addOrderSnake, updateOrder: updateOrderSnake } = useOrderOperationsSnake();

  const actions = useMemo(() => ({
    newOrder: () => {
      try {
        logger.component('useOrderActions', 'New order requested');
        dialog.openOrderForm();
      } catch (error) {
        logger.error('Error opening new order form:', error);
        toast.error('Gagal membuka form pesanan baru');
      }
    },

    editOrder: (order: Order) => {
      try {
        if (!order?.id) {
          logger.warn('Invalid order data for edit:', order);
          toast.error('Data pesanan tidak valid');
          return;
        }
        logger.component('useOrderActions', 'Edit order requested:', { orderId: order.id });
        dialog.openOrderForm(order);
      } catch (error) {
        logger.error('Error opening edit form:', error);
        toast.error('Gagal membuka form edit pesanan');
      }
    },

    deleteOrder: async (orderId: string) => {
      try {
        if (!orderId) {
          logger.warn('Invalid order ID for delete:', orderId);
          toast.error('ID pesanan tidak valid');
          return;
        }

        logger.component('useOrderActions', 'Delete order requested:', orderId);

        // Remove from selection if selected
        if (selectedIds.includes(orderId)) {
          logger.debug('Removing deleted order from selection:', orderId);
          toggleSelectOrder(orderId, false);
        }

        const success = await context.deleteOrder(orderId);
        if (success) {
          logger.success('Order deleted successfully:', orderId);
          // Success toast handled in context layer if present
        }
      } catch (error) {
        logger.error('Error deleting order:', error);
        toast.error('Gagal menghapus pesanan');
      }
    },

    statusChange: async (orderId: string, newStatus: string) => {
      try {
        if (!orderId || !newStatus) {
          logger.warn('Invalid parameters for status change:', { orderId, newStatus });
          toast.error('Parameter tidak valid');
          return;
        }

        logger.component('useOrderActions', 'Status change requested:', { orderId, newStatus });

        // Try context updateOrderStatus
        if (typeof context.updateOrderStatus === 'function') {
          logger.debug('Using context.updateOrderStatus');
          try {
            await context.updateOrderStatus(orderId, newStatus as OrderStatus);
            const order = ordersForView.find(o => o.id === orderId);
            logger.success('Status updated via updateOrderStatus:', { orderId, newStatus, orderNumber: (order as any)?.nomor_pesanan || (order as any)?.order_number });
            return;
          } catch (error) {
            logger.warn('updateOrderStatus failed, falling back:', error);
          }
        }

        // Fallback: context.updateOrder
        if (typeof context.updateOrder === 'function') {
          logger.debug('Using context.updateOrder fallback');
          const success = await context.updateOrder(orderId, { status: newStatus as Order['status'] });
          if (success) {
            const order = context.orders.find(o => o.id === orderId);
            logger.success('Status updated via updateOrder fallback:', { orderId, newStatus, orderNumber: (order as any)?.nomor_pesanan || (order as any)?.order_number });
            toast.success(`Status pesanan berhasil diubah ke ${getStatusText(newStatus as Order['status'])}`);
            return;
          } else {
            logger.warn('updateOrder returned false, trying direct Supabase');
          }
        }

        // Direct Supabase update
        logger.debug('Using direct Supabase call');
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('orders')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', orderId)
          .eq('user_id', auth.user.id)
          .select('*')
          .single();

        if (error) throw new Error(`Database error: ${error instanceof Error ? error.message : String(error)}`);
        if (!data) throw new Error('Order not found or access denied');

        logger.success('Status updated via direct Supabase:', { orderId, newStatus, orderNumber: (data as any).nomor_pesanan });

        if (newStatus === 'completed') {
          try {
            logger.debug('Triggering financial sync for completed order');
            const { transformOrderFromDB } = await import('../utils');
            const orderForSync = transformOrderFromDB(data as any);
            const { syncOrderToFinancialTransaction } = await import('@/utils/orderFinancialSync');
            await syncOrderToFinancialTransaction(orderForSync, auth.user.id);
          } catch (syncError) {
            logger.error('Error in manual financial sync (non-critical):', syncError);
          }
        }

        toast.success(`Status pesanan #${(data as any).nomor_pesanan} berhasil diubah ke ${getStatusText(newStatus as Order['status'])}`);

        if (typeof context.refreshData === 'function') {
          await context.refreshData();
        }
      } catch (error) {
        logger.error('Error updating status:', error);
        toast.error(`Gagal mengubah status pesanan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    submitOrder: async (data: Partial<Order> | Partial<NewOrder>) => {
      const isEditing = !!editingOrder;
      try {
        if (!data) {
          logger.warn('Invalid order data for submit:', data);
          toast.error('Data pesanan tidak valid');
          return;
        }

        logger.component('useOrderActions', 'Order submission started:', { isEdit: isEditing, orderId: editingOrder?.id });

        const snakePayload = to_snake_order(data as any);
        if (isEditing && editingOrder?.id) {
          await updateOrderSnake({ id: editingOrder.id, data: snakePayload });
        } else {
          await addOrderSnake(snakePayload);
        }

        logger.success('Order submitted successfully:', { isEdit: isEditing, orderId: editingOrder?.id });
        dialog.closeOrderForm();
      } catch (error) {
        logger.error('Error submitting order:', error);
        toast.error(isEditing ? 'Gagal memperbarui pesanan' : 'Gagal menambahkan pesanan');
      }
    },
  }), [context, ordersForView, selectedIds, toggleSelectOrder, editingOrder, dialog, addOrderSnake, updateOrderSnake]);

  return actions;
};

export default useOrderActions;

