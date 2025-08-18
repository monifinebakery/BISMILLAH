import React, { ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { FollowUpTemplateProvider } from '@/contexts/FollowUpTemplateContext';
import OrderContext from './OrderContext';
import { safeParseDate, isValidDate, transformOrderFromDB } from '../utils';
import type { Order, NewOrder } from '../types';
import { useOrderConnection } from '../hooks/useOrderConnection';
import { useOrderSubscription } from '../hooks/useOrderSubscription';
import * as orderService from '../services/orderService';

interface Props { children: ReactNode }

export const OrderProvider: React.FC<Props> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    isConnected,
    setIsConnected,
    shouldAttemptConnection,
    recordConnectionFailure,
    throttledFetch,
    fallbackModeRef,
  } = useOrderConnection();

  const refreshData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await orderService.fetchOrders(userId);
      setOrders(data);
    } catch (error: any) {
      toast.error(`Gagal memuat pesanan: ${error.message}`);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleRealtimeEvent = useCallback((payload: any) => {
    setOrders(prev => {
      let next = [...prev];
      if (payload.eventType === 'DELETE' && payload.old?.id) {
        next = next.filter(o => o.id !== payload.old.id);
      }
      if (payload.eventType === 'INSERT' && payload.new) {
        const newOrder = transformOrderFromDB(payload.new);
        if (!next.some(o => o.id === newOrder.id)) {
          next = [newOrder, ...next];
        }
      }
      if (payload.eventType === 'UPDATE' && payload.new) {
        const updated = transformOrderFromDB(payload.new);
        next = next.map(o => (o.id === updated.id ? updated : o));
      }
      return next;
    });
  }, []);

  const { setupSubscription, cleanupSubscription } = useOrderSubscription(
    userId,
    handleRealtimeEvent,
    { shouldAttemptConnection, recordConnectionFailure, setIsConnected }
  );

  useEffect(() => {
    if (userId) {
      refreshData();
      if (shouldAttemptConnection()) {
        setupSubscription();
      }
    } else {
      setOrders([]);
      setLoading(false);
    }
    return () => {
      cleanupSubscription();
    };
  }, [userId, refreshData, setupSubscription, cleanupSubscription, shouldAttemptConnection]);

  const addOrder = useCallback(async (order: NewOrder) => {
    if (!userId) return false;
    try {
      const created = await orderService.addOrder(userId, order);
      setOrders(prev => [created, ...prev]);
      if (fallbackModeRef.current) {
        throttledFetch(refreshData);
      }
      return true;
    } catch (error: any) {
      toast.error(`Gagal menambahkan pesanan: ${error.message}`);
      return false;
    }
  }, [userId, throttledFetch, refreshData]);

  const updateOrder = useCallback(async (id: string, data: Partial<Order>) => {
    if (!userId) return false;
    try {
      const updated = await orderService.updateOrder(userId, id, data);
      setOrders(prev => prev.map(o => (o.id === id ? updated : o)));
      if (fallbackModeRef.current) {
        throttledFetch(refreshData);
      }
      return true;
    } catch (error: any) {
      toast.error(`Gagal memperbarui pesanan: ${error.message}`);
      return false;
    }
  }, [userId, throttledFetch, refreshData]);

  const updateOrderStatus = useCallback(async (id: string, status: string) => {
    if (!userId) return false;
    try {
      const updated = await orderService.updateOrderStatus(userId, id, status);
      setOrders(prev => prev.map(o => (o.id === id ? updated : o)));
      if (fallbackModeRef.current) {
        throttledFetch(refreshData);
      }
      return true;
    } catch (error: any) {
      toast.error(`Gagal memperbarui pesanan: ${error.message}`);
      return false;
    }
  }, [userId, throttledFetch, refreshData]);

  const deleteOrder = useCallback(async (id: string) => {
    if (!userId) return false;
    try {
      await orderService.deleteOrder(userId, id);
      setOrders(prev => prev.filter(o => o.id !== id));
      if (fallbackModeRef.current) {
        throttledFetch(refreshData);
      }
      return true;
    } catch (error: any) {
      toast.error(`Gagal menghapus pesanan: ${error.message}`);
      return false;
    }
  }, [userId, throttledFetch, refreshData]);

  const bulkUpdateStatus = useCallback(async (ids: string[], status: string) => {
    if (!userId) return false;
    try {
      await orderService.bulkUpdateStatus(userId, ids, status);
      setOrders(prev => prev.map(o => (ids.includes(o.id) ? { ...o, status } : o)));
      if (fallbackModeRef.current) {
        throttledFetch(refreshData);
      }
      return true;
    } catch (error: any) {
      toast.error(`Gagal memperbarui pesanan: ${error.message}`);
      return false;
    }
  }, [userId, throttledFetch, refreshData]);

  const bulkDeleteOrders = useCallback(async (ids: string[]) => {
    if (!userId) return false;
    try {
      await orderService.bulkDeleteOrders(userId, ids);
      setOrders(prev => prev.filter(o => !ids.includes(o.id)));
      if (fallbackModeRef.current) {
        throttledFetch(refreshData);
      }
      return true;
    } catch (error: any) {
      toast.error(`Gagal menghapus pesanan: ${error.message}`);
      return false;
    }
  }, [userId, throttledFetch, refreshData]);

  const getOrderById = useCallback((id: string) => orders.find(o => o.id === id), [orders]);
  const getOrdersByStatus = useCallback((status: string) => orders.filter(o => o.status === status), [orders]);
  const getOrdersByDateRange = useCallback((start: Date, end: Date) => {
    if (!isValidDate(start) || !isValidDate(end)) return [];
    return orders.filter(o => {
      const d = safeParseDate(o.tanggal);
      return d && d >= start && d <= end;
    });
  }, [orders]);

  const searchOrders = useCallback((term: string) => {
    const t = term?.toLowerCase?.() || '';
    if (!t) return orders;
    return orders.filter(o =>
      o.namaPelanggan.toLowerCase().includes(t) ||
      o.nomorPesanan.toLowerCase().includes(t) ||
      o.teleponPelanggan?.toLowerCase().includes(t) ||
      o.emailPelanggan?.toLowerCase().includes(t)
    );
  }, [orders]);

  const getTotalRevenue = useCallback(() => {
    return orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.totalPesanan || 0), 0);
  }, [orders]);

  const getPendingOrdersCount = useCallback(() => orders.filter(o => o.status === 'pending').length, [orders]);
  const getProcessingOrdersCount = useCallback(() => orders.filter(o => o.status === 'processing').length, [orders]);
  const getCompletedOrdersCount = useCallback(() => orders.filter(o => o.status === 'completed').length, [orders]);
  const getCancelledOrdersCount = useCallback(() => orders.filter(o => o.status === 'cancelled').length, [orders]);

  const contextValue = useMemo(() => ({
    orders,
    loading,
    isConnected: isConnected || fallbackModeRef.current,
    addOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    refreshData,
    getOrderById,
    getOrdersByStatus,
    getOrdersByDateRange,
    bulkUpdateStatus,
    bulkDeleteOrders,
    searchOrders,
    getTotalRevenue,
    getPendingOrdersCount,
    getProcessingOrdersCount,
    getCompletedOrdersCount,
    getCancelledOrdersCount,
    contextReady: !!userId,
  }), [
    orders,
    loading,
    isConnected,
    addOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    refreshData,
    getOrderById,
    getOrdersByStatus,
    getOrdersByDateRange,
    bulkUpdateStatus,
    bulkDeleteOrders,
    searchOrders,
    getTotalRevenue,
    getPendingOrdersCount,
    getProcessingOrdersCount,
    getCompletedOrdersCount,
    getCancelledOrdersCount,
    userId,
    fallbackModeRef.current,
  ]);

  return (
    <FollowUpTemplateProvider>
      <OrderContext.Provider value={contextValue}>
        {children}
      </OrderContext.Provider>
    </FollowUpTemplateProvider>
  );
};

export default OrderProvider;
