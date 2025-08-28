import React, { ReactNode, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { FollowUpTemplateProvider } from '@/contexts/FollowUpTemplateContext';
import OrderContext from './OrderContext';
import { UnifiedDateHandler } from '@/utils/unifiedDateHandler';
import { safeParseDate, isValidDate } from '@/utils/unifiedDateUtils'; // Keep for transition
import { transformOrderFromDB } from '../utils';
import type { Order, NewOrder, OrderStatus } from '../types';
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
      toast.error(`Gagal memuat pesanan: ${error instanceof Error ? error.message : String(error)}`);
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
      toast.error(`Gagal menambahkan pesanan: ${error instanceof Error ? error.message : String(error)}`);
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
      setOrders(prev => prev.map(o => (ids.includes(o.id) ? { ...o, status: status as OrderStatus } : o)));
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

  const bulkAddOrders = useCallback(async (orders: NewOrder[]) => {
    if (!userId || !orders.length) return { success: 0, total: orders.length };
    
    let success = 0;
    const results = [];
    
    for (const order of orders) {
      try {
        const created = await orderService.addOrder(userId, order);
        results.push(created);
        success++;
      } catch (error) {
        console.error('Error adding order during bulk import:', error);
      }
    }
    
    // Update state with all successfully created orders at once
    if (results.length > 0) {
      setOrders(prev => [...results, ...prev]);
      if (fallbackModeRef.current) {
        throttledFetch(refreshData);
      }
    }
    
    return { success, total: orders.length };
  }, [userId, throttledFetch, refreshData]);

  // ULTRA PERFORMANCE: Memoized computed values untuk mencegah re-calculation
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  
  const computedStats = useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'preparing').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.totalPesanan || 0), 0);
    
    return {
      pending,
      processing, 
      completed,
      cancelled,
      totalRevenue
    };
  }, [orders]);

  // PERFORMANCE: Stable references untuk functions yang tidak berubah
  const getOrderById = useCallback((id: string) => ordersRef.current.find(o => o.id === id), []);
  
  const getOrdersByStatus = useCallback((status: string) => ordersRef.current.filter(o => o.status === status), []);
  
  const getOrdersByDateRange = useCallback((start: Date, end: Date) => {
    if (!isValidDate(start) || !isValidDate(end)) return [];
    return ordersRef.current.filter(o => {
      const result = UnifiedDateHandler.parseDate(o.tanggal);
      const d = result.isValid && result.date ? result.date : null;
      return d && d >= start && d <= end;
    });
  }, []);

  const searchOrders = useCallback((term: string) => {
    const t = term?.toLowerCase?.() || '';
    if (!t) return ordersRef.current;
    return ordersRef.current.filter(o =>
      o.namaPelanggan.toLowerCase().includes(t) ||
      o.nomorPesanan.toLowerCase().includes(t) ||
      o.teleponPelanggan?.toLowerCase().includes(t) ||
      o.emailPelanggan?.toLowerCase().includes(t)
    );
  }, []);

  // PERFORMANCE: Return computed stats instead of recalculating
  const getTotalRevenue = useCallback(() => computedStats.totalRevenue, [computedStats.totalRevenue]);
  const getPendingOrdersCount = useCallback(() => computedStats.pending, [computedStats.pending]);
  const getProcessingOrdersCount = useCallback(() => computedStats.processing, [computedStats.processing]);
  const getCompletedOrdersCount = useCallback(() => computedStats.completed, [computedStats.completed]);
  const getCancelledOrdersCount = useCallback(() => computedStats.cancelled, [computedStats.cancelled]);

  // ULTRA PERFORMANCE: Minimal dependencies untuk contextValue
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
    bulkAddOrders,
    searchOrders,
    getTotalRevenue,
    getPendingOrdersCount,
    getProcessingOrdersCount,
    getCompletedOrdersCount,
    getCancelledOrdersCount,
    contextReady: !!userId,
  }), [
    // PERFORMANCE: Hanya dependencies yang benar-benar berubah
    orders,
    loading,
    isConnected,
    userId,
    // Functions sudah stable dengan useCallback tanpa dependencies
    addOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    refreshData,
    bulkUpdateStatus,
    bulkDeleteOrders,
    bulkAddOrders,
    // Stats functions dengan computed dependencies
    getTotalRevenue,
    getPendingOrdersCount,
    getProcessingOrdersCount,
    getCompletedOrdersCount,
    getCancelledOrdersCount,
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
