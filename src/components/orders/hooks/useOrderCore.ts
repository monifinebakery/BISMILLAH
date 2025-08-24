// src/components/orders/hooks/useOrderCore.ts
// ✅ STANDARDIZED: Core Orders hook following Purchase module pattern

import { useState, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

// Types
import type { Order, NewOrder, OrderStatus, OrderStats } from '../types';

interface UseOrderCoreProps {
  orderContext: any; // Flexible to work with any context
}

export const useOrderCore = ({ orderContext }: UseOrderCoreProps) => {
  const { user } = useAuth();
  const { 
    orders, 
    updateOrder, 
    updateOrderStatus,
    deleteOrder,
    bulkUpdateStatus,
    bulkDeleteOrders 
  } = orderContext;

  // Processing state
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Processing helpers
  const addProcessing = useCallback((id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
  }, []);

  const removeProcessing = useCallback((id: string) => {
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isProcessing = useCallback((id: string) => processingIds.has(id), [processingIds]);

  // Stats calculation
  const stats: OrderStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum: number, order: Order) => sum + (order.totalPesanan || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const statusDistribution = orders.reduce((acc: any, order: Order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Recipe usage analysis
    const recipeUsage = orders.reduce((acc: any, order: Order) => {
      order.items?.forEach(item => {
        if (item.isFromRecipe && item.recipeId) {
          if (!acc.recipes[item.recipeId]) {
            acc.recipes[item.recipeId] = {
              recipeId: item.recipeId,
              recipeName: item.name,
              orderCount: 0,
              totalQuantity: 0,
              totalRevenue: 0
            };
          }
          acc.recipes[item.recipeId].orderCount += 1;
          acc.recipes[item.recipeId].totalQuantity += item.quantity;
          acc.recipes[item.recipeId].totalRevenue += item.total;
          acc.totalRecipeItems += item.quantity;
          acc.recipeRevenue += item.total;
        } else {
          acc.totalCustomItems += item.quantity;
          acc.customRevenue += item.total;
        }
      });
      return acc;
    }, {
      recipes: {},
      totalRecipeItems: 0,
      totalCustomItems: 0,
      recipeRevenue: 0,
      customRevenue: 0
    });

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(startOfDay.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayOrders = orders.filter((o: Order) => new Date(o.tanggal) >= startOfDay).length;
    const weekOrders = orders.filter((o: Order) => new Date(o.tanggal) >= startOfWeek).length;
    const monthOrders = orders.filter((o: Order) => new Date(o.tanggal) >= startOfMonth).length;

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      statusDistribution,
      recipeUsage: {
        ...recipeUsage,
        popularRecipes: Object.values(recipeUsage.recipes).slice(0, 10)
      },
      todayOrders,
      weekOrders,
      monthOrders
    };
  }, [orders]);

  // Validation functions
  const canEdit = useCallback((order: Order): boolean => {
    return !isProcessing(order.id) && ['pending', 'confirmed', 'preparing'].includes(order.status);
  }, [isProcessing]);

  const canDelete = useCallback((order: Order): boolean => {
    return !isProcessing(order.id) && ['pending', 'cancelled'].includes(order.status);
  }, [isProcessing]);

  const canUpdateStatus = useCallback((order: Order, newStatus: OrderStatus): boolean => {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['delivered', 'completed'],
      'delivered': ['completed'],
      'completed': [],
      'cancelled': []
    };
    
    return validTransitions[order.status]?.includes(newStatus) || false;
  }, []);

  // Core operations
  const updateOrderData = useCallback(async (id: string, data: Partial<Order>): Promise<boolean> => {
    const order = orders.find((o: Order) => o.id === id);
    if (!order) {
      toast.error('Pesanan tidak ditemukan');
      return false;
    }

    if (!canEdit(order)) {
      toast.error('Pesanan tidak dapat diubah');
      return false;
    }

    addProcessing(id);
    try {
      const success = await updateOrder(id, data);
      if (success) {
        toast.success('Pesanan berhasil diperbarui');
      }
      return success;
    } catch (error: any) {
      logger.error('Update order error:', error);
      toast.error(error?.message || 'Gagal memperbarui pesanan');
      return false;
    } finally {
      removeProcessing(id);
    }
  }, [orders, canEdit, updateOrder, addProcessing, removeProcessing]);

  const changeOrderStatus = useCallback(async (id: string, newStatus: OrderStatus): Promise<boolean> => {
    const order = orders.find((o: Order) => o.id === id);
    if (!order) {
      toast.error('Pesanan tidak ditemukan');
      return false;
    }

    if (!canUpdateStatus(order, newStatus)) {
      toast.error(`Tidak dapat mengubah status dari ${order.status} ke ${newStatus}`);
      return false;
    }

    addProcessing(id);
    try {
      const success = await updateOrderStatus(id, newStatus);
      if (success) {
        toast.success(`Status pesanan diubah ke ${newStatus}`);
      }
      return success;
    } catch (error: any) {
      logger.error('Update order status error:', error);
      toast.error(error?.message || 'Gagal mengubah status pesanan');
      return false;
    } finally {
      removeProcessing(id);
    }
  }, [orders, canUpdateStatus, updateOrderStatus, addProcessing, removeProcessing]);

  const deleteOrderById = useCallback(async (id: string): Promise<{ success: boolean; error: string | null }> => {
    const order = orders.find((o: Order) => o.id === id);
    if (!order) {
      return { success: false, error: 'Pesanan tidak ditemukan' };
    }

    if (!canDelete(order)) {
      return { success: false, error: 'Pesanan tidak dapat dihapus' };
    }

    addProcessing(id);
    try {
      const success = await deleteOrder(id);
      if (success) {
        toast.success('Pesanan berhasil dihapus');
        return { success: true, error: null };
      }
      return { success: false, error: 'Gagal menghapus pesanan' };
    } catch (error: any) {
      logger.error('Delete order error:', error);
      return { success: false, error: error?.message || 'Gagal menghapus pesanan' };
    } finally {
      removeProcessing(id);
    }
  }, [orders, canDelete, deleteOrder, addProcessing, removeProcessing]);

  // Bulk operations
  const handleBulkStatusUpdate = useCallback(async (ids: string[], newStatus: OrderStatus): Promise<void> => {
    try {
      const success = await bulkUpdateStatus(ids, newStatus);
      if (success) {
        toast.success(`${ids.length} pesanan berhasil diubah statusnya`);
      } else {
        toast.error('Gagal mengubah status pesanan');
      }
    } catch (error: any) {
      logger.error('Bulk status update error:', error);
      toast.error(error?.message || 'Gagal mengubah status pesanan');
    }
  }, [bulkUpdateStatus]);

  const handleBulkDelete = useCallback(async (ids: string[]): Promise<void> => {
    try {
      const success = await bulkDeleteOrders(ids);
      if (success) {
        toast.success(`${ids.length} pesanan berhasil dihapus`);
      } else {
        toast.error('Gagal menghapus pesanan');
      }
    } catch (error: any) {
      logger.error('Bulk delete error:', error);
      toast.error(error?.message || 'Gagal menghapus pesanan');
    }
  }, [bulkDeleteOrders]);

  // Utility functions
  const findOrder = useCallback((id: string) => {
    return orders.find((o: Order) => o.id === id);
  }, [orders]);

  const getOrdersByStatus = useCallback((status: string) => {
    return orders.filter((o: Order) => o.status === status);
  }, [orders]);

  const getOrdersByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return orders.filter((o: Order) => {
      const orderDate = new Date(o.tanggal);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders]);

  return {
    // Stats
    stats,

    // Validation
    canEdit,
    canDelete,
    canUpdateStatus,

    // Core operations
    updateOrder: updateOrderData,
    updateOrderStatus: changeOrderStatus,
    deleteOrder: deleteOrderById,

    // Bulk operations
    handleBulkStatusUpdate,
    handleBulkDelete,

    // Processing state
    isProcessing,
    processingCount: processingIds.size,

    // Utilities
    findOrder,
    getOrdersByStatus,
    getOrdersByDateRange
  };
};