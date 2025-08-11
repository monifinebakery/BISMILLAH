// src/components/orders/hooks/useOrderData.ts - COMPLETE FIXED VERSION

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { formatCurrency } from '@/utils/formatUtils';
import type { Order, NewOrder, UseOrderDataReturn } from '../types';
import { transformOrderFromDB, transformOrderToDB, toSafeISOString, validateOrderData, safeParseDate, isValidDate } from '../utils';
import { getStatusText } from '../constants';

export const useOrderData = (
  user: any,
  addActivity: any,
  addFinancialTransaction: any,
  settings: any,
  addNotification: any
): UseOrderDataReturn => {
  
  // ✅ EARLY VALIDATION: Check if all dependencies are ready
  const hasAllDependencies = !!(user && addActivity && addFinancialTransaction && settings && addNotification);
  
  // ===== STATE HOOKS =====
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  // ===== REF HOOKS =====
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const setupInProgressRef = useRef<boolean>(false);
  const initialFetchDoneRef = useRef<boolean>(false); // ✅ NEW: Track initial fetch
  
  // ===== CONSTANTS =====
  const maxRetries = 3;
  const retryDelayBase = 1000;

  logger.context('useOrderData', 'Hook called with dependencies:', {
    hasUser: !!user,
    hasActivity: !!addActivity,
    hasFinancial: !!addFinancialTransaction,
    hasSettings: !!settings,
    hasNotification: !!addNotification,
    allReady: hasAllDependencies
  });

  // ✅ ENHANCED: Improved cleanup with safety checks
  const cleanupSubscription = useCallback(() => {
    if (!subscriptionRef.current) return;
    
    logger.context('OrderData', 'Starting subscription cleanup');
    
    try {
      const subscription = subscriptionRef.current;
      subscriptionRef.current = null;
      
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
        logger.debug('OrderData', 'Subscription unsubscribed successfully');
      }
      
      try {
        supabase.removeChannel(subscription);
        logger.debug('OrderData', 'Channel removed from supabase');
      } catch (removeError) {
        logger.warn('OrderData', 'Channel already removed or invalid:', removeError);
      }
      
    } catch (error) {
      logger.error('OrderData', 'Error during subscription cleanup:', error);
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
      logger.debug('OrderData', 'Retry timeout cleared');
    }
    
    setupInProgressRef.current = false;
    logger.context('OrderData', 'Subscription cleanup completed');
  }, []);

  // ✅ ENHANCED: Immediate fetch on mount
  const fetchOrders = useCallback(async (forceRefresh = false) => {
    if (!hasAllDependencies || !user || !isMountedRef.current) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // ✅ Skip if already fetched and not forcing refresh
    if (initialFetchDoneRef.current && !forceRefresh) {
      logger.debug('OrderData', 'Skipping fetch - already done');
      return;
    }

    logger.context('OrderData', 'Fetching orders for user:', user.id, forceRefresh ? '(forced)' : '(initial)');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('tanggal', { ascending: false });

      if (error) throw new Error(error.message);

      if (!isMountedRef.current) {
        logger.debug('OrderData', 'Component unmounted during fetch, ignoring results');
        return;
      }

      const transformedData = data
        .map(item => {
          try {
            return transformOrderFromDB(item);
          } catch (transformError) {
            logger.error('OrderData: Error transforming individual order:', transformError, item);
            return null;
          }
        })
        .filter(Boolean) as Order[];

      logger.success('OrderData', 'Orders loaded successfully:', {
        count: transformedData.length,
        isInitial: !initialFetchDoneRef.current
      });
      
      setOrders(transformedData);
      initialFetchDoneRef.current = true; // ✅ Mark initial fetch as done

    } catch (error: any) {
      if (!isMountedRef.current) return;
      
      logger.error('OrderData - Error fetching orders:', error);
      toast.error(`Gagal memuat pesanan: ${error.message || 'Unknown error'}`);
      setOrders([]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, hasAllDependencies]);

  // ✅ ENHANCED: Improved retry logic with exponential backoff
  const retrySubscription = useCallback(() => {
    if (retryCountRef.current >= maxRetries) {
      logger.context('OrderData', `Max retries (${maxRetries}) reached, giving up`);
      setIsConnected(false);
      setupInProgressRef.current = false;
      return;
    }

    if (!isMountedRef.current || !user) {
      logger.context('OrderData', 'Component unmounted or no user, skipping retry');
      setupInProgressRef.current = false;
      return;
    }

    retryCountRef.current++;
    const delay = Math.min(retryDelayBase * Math.pow(2, retryCountRef.current - 1), 10000);
    
    logger.context('OrderData', `Scheduling subscription retry in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
    
    retryTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && user && !setupInProgressRef.current) {
        logger.context('OrderData', 'Executing subscription retry');
        setupSubscription();
      } else {
        logger.context('OrderData', 'Retry cancelled: component unmounted or setup in progress');
        setupInProgressRef.current = false;
      }
    }, delay);
  }, [user]);

  // ✅ ENHANCED: Improved subscription setup with safety checks
  const setupSubscription = useCallback(() => {
    if (!hasAllDependencies || !user || !isMountedRef.current) {
      logger.context('OrderData', 'Cannot setup subscription: dependencies not ready or component unmounted');
      setupInProgressRef.current = false;
      return;
    }

    if (setupInProgressRef.current) {
      logger.context('OrderData', 'Subscription setup already in progress, skipping');
      return;
    }

    setupInProgressRef.current = true;
    logger.context('OrderData', 'Setting up new subscription for user:', user.id);

    cleanupSubscription();

    try {
      const channelName = `orders_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      logger.debug('OrderData', 'Creating channel:', channelName);
      
      const channel = supabase
        .channel(channelName, {
          config: {
            presence: { key: user.id },
          },
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          if (!isMountedRef.current) {
            logger.context('OrderData', 'Ignoring real-time event: component unmounted');
            return;
          }
          
          logger.context('OrderData', 'Real-time event received:', {
            eventType: payload.eventType,
            orderId: payload.new?.id || payload.old?.id,
            nomorPesanan: payload.new?.nomor_pesanan || payload.old?.nomor_pesanan
          });
          
          retryCountRef.current = 0;
          
          setOrders((prevOrders) => {
            try {
              let newOrders = [...prevOrders];
              
              if (payload.eventType === 'DELETE' && payload.old?.id) {
                newOrders = newOrders.filter((item) => item.id !== payload.old.id);
                logger.context('OrderData', 'Order deleted from real-time:', payload.old.id);
              }
              
              if (payload.eventType === 'INSERT' && payload.new) {
                try {
                  const newOrder = transformOrderFromDB(payload.new);
                  newOrders = [newOrder, ...newOrders].sort((a, b) => 
                    new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
                  );
                  logger.context('OrderData', 'Order added from real-time:', newOrder.id);
                } catch (transformError) {
                  logger.error('OrderData', 'Error transforming new order:', transformError);
                }
              }
              
              if (payload.eventType === 'UPDATE' && payload.new) {
                try {
                  const updatedOrder = transformOrderFromDB(payload.new);
                  newOrders = newOrders.map((item) =>
                    item.id === updatedOrder.id ? updatedOrder : item
                  );
                  logger.context('OrderData', 'Order updated from real-time:', updatedOrder.id);
                } catch (transformError) {
                  logger.error('OrderData', 'Error transforming updated order:', transformError);
                }
              }
              
              return newOrders;
            } catch (error) {
              logger.error('OrderData', 'Error processing real-time update:', error);
              return prevOrders;
            }
          });
        })
        .subscribe((status, err) => {
          if (!isMountedRef.current) {
            logger.debug('OrderData', 'Subscription status ignored: component unmounted');
            return;
          }
          
          logger.context('OrderData', 'Subscription status changed:', status, err ? { error: err } : '');
          
          switch (status) {
            case 'SUBSCRIBED':
              setIsConnected(true);
              subscriptionRef.current = channel;
              retryCountRef.current = 0;
              setupInProgressRef.current = false;
              
              // ✅ REMOVED: Don't fetch again here - already fetched on mount
              logger.success('OrderData', 'Successfully subscribed to real-time updates');
              break;
              
            case 'CHANNEL_ERROR':
              logger.error('OrderData', 'Channel error occurred:', err);
              setIsConnected(false);
              setupInProgressRef.current = false;
              
              if (subscriptionRef.current === channel) {
                subscriptionRef.current = null;
              }
              
              retrySubscription();
              break;
              
            case 'TIMED_OUT':
              logger.error('OrderData', 'Subscription timed out');
              setIsConnected(false);
              setupInProgressRef.current = false;
              
              if (subscriptionRef.current === channel) {
                subscriptionRef.current = null;
              }
              
              retrySubscription();
              break;
              
            case 'CLOSED':
              logger.context('OrderData', 'Subscription closed');
              setIsConnected(false);
              setupInProgressRef.current = false;
              
              if (subscriptionRef.current === channel) {
                subscriptionRef.current = null;
              }
              break;
              
            default:
              logger.context('OrderData', 'Unknown subscription status:', status);
              break;
          }
        });

    } catch (error) {
      logger.error('OrderData', 'Error setting up subscription:', error);
      setIsConnected(false);
      setupInProgressRef.current = false;
      retrySubscription();
    }
  }, [user, hasAllDependencies, cleanupSubscription, retrySubscription]);

  // ===== CRUD OPERATIONS =====
  const addOrder = useCallback(async (order: NewOrder): Promise<boolean> => {
    if (!hasAllDependencies || !user) {
      toast.error('Sistem belum siap, silakan tunggu...');
      return false;
    }

    const validation = validateOrderData(order);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return false;
    }

    try {
      logger.context('OrderData', 'Adding new order:', order.namaPelanggan);

      const orderData = {
        user_id: user.id,
        tanggal: toSafeISOString(order.tanggal || new Date()),
        status: order.status || 'pending',
        nama_pelanggan: order.namaPelanggan.trim(),
        telepon_pelanggan: order.teleponPelanggan || '',
        email_pelanggan: order.emailPelanggan || '',
        alamat_pengiriman: order.alamatPengiriman || '',
        items: Array.isArray(order.items) ? order.items : [],
        total_pesanan: Number(order.totalPesanan) || 0,
        catatan: order.catatan || '',
        subtotal: Number(order.subtotal) || 0,
        pajak: Number(order.pajak) || 0,
      };

      const { data, error } = await supabase.rpc('create_new_order', {
        order_data: orderData,
      });

      if (error) throw new Error(error.message);

      const createdOrder = Array.isArray(data) ? data[0] : data;
      if (createdOrder) {
        if (addActivity && typeof addActivity === 'function') {
          addActivity({ 
            title: 'Pesanan Baru Dibuat', 
            description: `Pesanan #${createdOrder.nomor_pesanan} dari ${createdOrder.nama_pelanggan} telah dibuat.`,
            type: 'order'
          });
        }

        toast.success(`Pesanan #${createdOrder.nomor_pesanan} baru berhasil ditambahkan!`);

        if (addNotification && typeof addNotification === 'function') {
          await addNotification({
            title: '🛍️ Pesanan Baru Dibuat!',
            message: `Pesanan #${createdOrder.nomor_pesanan} dari ${createdOrder.nama_pelanggan} berhasil dibuat dengan total ${formatCurrency(createdOrder.total_pesanan)}`,
            type: 'success',
            icon: 'shopping-cart',
            priority: 2,
            related_type: 'order',
            related_id: createdOrder.id,
            action_url: '/orders',
            is_read: false,
            is_archived: false
          });
        }
      }

      return true;
    } catch (error: any) {
      logger.error('OrderData - Error adding order:', error);
      toast.error(`Gagal menambahkan pesanan: ${error.message || 'Unknown error'}`);
      return false;
    }
  }, [user, addActivity, addNotification, hasAllDependencies]);

  const updateOrder = useCallback(async (id: string, updatedData: Partial<Order>): Promise<boolean> => {
    if (!hasAllDependencies || !user) {
      toast.error('Sistem belum siap, silakan tunggu...');
      return false;
    }

    const oldOrder = orders.find(o => o.id === id);
    if (!oldOrder) {
      toast.error('Pesanan tidak ditemukan.');
      return false;
    }

    try {
      logger.context('OrderData', 'Updating order:', id, updatedData);

      const oldStatus = oldOrder.status;
      const newStatus = updatedData.status;
      const isCompletingOrder = oldStatus !== 'completed' && newStatus === 'completed';

      if (isCompletingOrder) {
        const { error: rpcError } = await supabase.rpc('complete_order_and_deduct_stock', { 
          order_id: id 
        });
        if (rpcError) throw new Error(rpcError.message);

        try {
          const incomeCategory = settings?.financialCategories?.income?.[0] || 'Penjualan Produk';
          if (addFinancialTransaction && typeof addFinancialTransaction === 'function') {
            await addFinancialTransaction({
              type: 'income',
              category: incomeCategory,
              description: `Penjualan dari pesanan #${oldOrder.nomorPesanan}`,
              amount: oldOrder.totalPesanan,
              date: new Date(),
              relatedId: oldOrder.id,
            });
          }
        } catch (financialError) {
          logger.error('OrderData: Error adding financial transaction:', financialError);
        }

        if (addActivity && typeof addActivity === 'function') {
          addActivity({
            title: 'Pesanan Selesai',
            description: `Pesanan #${oldOrder.nomorPesanan} lunas, stok diperbarui.`,
            type: 'order',
          });
        }

        toast.success(`Pesanan #${oldOrder.nomorPesanan} selesai, stok dikurangi, & pemasukan dicatat!`);

        if (addNotification && typeof addNotification === 'function') {
          await addNotification({
            title: '🎉 Pesanan Selesai!',
            message: `Pesanan #${oldOrder.nomorPesanan} telah selesai. Revenue ${formatCurrency(oldOrder.totalPesanan)} tercatat dan stok diperbarui.`,
            type: 'success',
            icon: 'check-circle',
            priority: 2,
            related_type: 'order',
            related_id: id,
            action_url: '/orders',
            is_read: false,
            is_archived: false
          });
        }

      } else {
        const dbData = transformOrderToDB(updatedData);
        const { error } = await supabase
          .from('orders')
          .update(dbData)
          .eq('id', id)
          .eq('user_id', user.id);
        
        if (error) throw new Error(error.message);

        toast.success(`Pesanan #${oldOrder.nomorPesanan} berhasil diperbarui.`);

        if (newStatus && oldStatus !== newStatus && addNotification && typeof addNotification === 'function') {
          await addNotification({
            title: '📝 Status Pesanan Diubah',
            message: `Pesanan #${oldOrder.nomorPesanan} dari "${getStatusText(oldStatus)}" menjadi "${getStatusText(newStatus)}"`,
            type: 'info',
            icon: 'refresh-cw',
            priority: 2,
            related_type: 'order',
            related_id: id,
            action_url: '/orders',
            is_read: false,
            is_archived: false
          });
        }
      }

      return true;
    } catch (error: any) {
      logger.error('OrderData - Error updating order:', error);
      toast.error(`Gagal memperbarui pesanan: ${error.message || 'Unknown error'}`);
      return false;
    }
  }, [user, orders, addActivity, addFinancialTransaction, settings, addNotification, hasAllDependencies]);

  const deleteOrder = useCallback(async (id: string): Promise<boolean> => {
    if (!hasAllDependencies || !user) {
      toast.error('Sistem belum siap, silakan tunggu...');
      return false;
    }

    const orderToDelete = orders.find(o => o.id === id);
    if (!orderToDelete) {
      toast.error('Pesanan tidak ditemukan.');
      return false;
    }

    try {
      logger.context('OrderData', 'Deleting order:', id);

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw new Error(error.message);

      if (addActivity && typeof addActivity === 'function') {
        addActivity({ 
          title: 'Pesanan Dihapus', 
          description: `Pesanan #${orderToDelete.nomorPesanan} telah dihapus`, 
          type: 'order' 
        });
      }

      toast.success('Pesanan berhasil dihapus.');
      return true;
    } catch (error: any) {
      logger.error('OrderData - Error deleting order:', error);
      toast.error(`Gagal menghapus pesanan: ${error.message || 'Unknown error'}`);
      return false;
    }
  }, [user, orders, addActivity, hasAllDependencies]);

  // ===== BULK OPERATIONS =====
  const bulkUpdateStatus = useCallback(async (orderIds: string[], newStatus: string): Promise<boolean> => {
    if (!hasAllDependencies || !user || !Array.isArray(orderIds) || orderIds.length === 0) {
      toast.error('Tidak ada pesanan yang dipilih');
      return false;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .in('id', orderIds)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);

      toast.success(`${orderIds.length} pesanan berhasil diubah statusnya ke ${getStatusText(newStatus)}`);
      return true;
    } catch (error: any) {
      toast.error(`Gagal mengubah status: ${error.message || 'Unknown error'}`);
      return false;
    }
  }, [user, hasAllDependencies]);

  const bulkDeleteOrders = useCallback(async (orderIds: string[]): Promise<boolean> => {
    if (!hasAllDependencies || !user || !Array.isArray(orderIds) || orderIds.length === 0) {
      toast.error('Tidak ada pesanan yang dipilih');
      return false;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);

      toast.success(`${orderIds.length} pesanan berhasil dihapus`);
      return true;
    } catch (error: any) {
      toast.error(`Gagal menghapus pesanan: ${error.message || 'Unknown error'}`);
      return false;
    }
  }, [user, hasAllDependencies]);

  // ===== UTILITY FUNCTIONS =====
  const getOrderById = useCallback((id: string): Order | undefined => {
    return orders.find(order => order.id === id);
  }, [orders]);

  const getOrdersByStatus = useCallback((status: string): Order[] => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  const getOrdersByDateRange = useCallback((startDate: Date, endDate: Date): Order[] => {
    try {
      if (!isValidDate(startDate) || !isValidDate(endDate)) {
        logger.error('OrderData: Invalid dates for getOrdersByDateRange:', { startDate, endDate });
        return [];
      }
      
      return orders.filter(order => {
        try {
          const orderDate = safeParseDate(order.tanggal);
          if (!orderDate) return false;
          return orderDate >= startDate && orderDate <= endDate;
        } catch (error) {
          logger.error('OrderData: Error processing order date:', error, order);
          return false;
        }
      });
    } catch (error) {
      logger.error('OrderData: Error in getOrdersByDateRange:', error);
      return [];
    }
  }, [orders]);

  // ✅ ENHANCED: Improved connection health check with throttling
  const checkConnectionHealth = useCallback(() => {
    if (!user || !isMountedRef.current || setupInProgressRef.current) return;

    if (!isConnected && !subscriptionRef.current) {
      logger.context('OrderData', 'Connection health check: attempting reconnect');
      setupSubscription();
    }
  }, [user, isConnected, setupSubscription]);

  const refreshData = useCallback(async () => {
    logger.context('OrderData', 'Manual refresh requested');
    await fetchOrders(true); // Force refresh
    
    if (!isConnected && user && hasAllDependencies && !setupInProgressRef.current) {
      setupSubscription();
    }
  }, [fetchOrders, isConnected, user, hasAllDependencies, setupSubscription]);

  // ===== EFFECTS =====
  
  // Component mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    logger.context('OrderData', 'Component mounted');
    
    return () => {
      logger.context('OrderData', 'Component unmounting, cleaning up');
      isMountedRef.current = false;
      cleanupSubscription();
    };
  }, [cleanupSubscription]);

  // ✅ FIXED: Stable effect with no conditional dependencies
  useEffect(() => {
    if (!user) {
      logger.context('OrderData', 'User not ready, cleaning up');
      cleanupSubscription();
      setOrders([]);
      setLoading(false);
      setIsConnected(false);
      retryCountRef.current = 0;
      setupInProgressRef.current = false;
      initialFetchDoneRef.current = false;
      return;
    }

    if (!hasAllDependencies) {
      logger.context('OrderData', 'Dependencies not ready, skipping setup');
      return;
    }

    logger.context('OrderData', 'User and dependencies ready, fetching data immediately');
    
    // ✅ IMMEDIATE FETCH: Fetch data immediately when user is ready
    fetchOrders().then(() => {
      // ✅ THEN SETUP SUBSCRIPTION: After initial fetch, setup real-time
      setTimeout(() => {
        if (isMountedRef.current && user && hasAllDependencies) {
          setupSubscription();
        }
      }, 100); // Small delay to ensure fetch is complete
    });

    return () => {
      cleanupSubscription();
    };
  }, [user?.id]); // ✅ FIXED: Only depend on user.id, not functions

  // ✅ FIXED: Separate effect for connection health check
  useEffect(() => {
    if (!user) return;

    const healthCheckInterval = setInterval(() => {
      if (!user || !isMountedRef.current || setupInProgressRef.current) return;

      if (!isConnected && !subscriptionRef.current) {
        logger.context('OrderData', 'Connection health check: attempting reconnect');
        setupSubscription();
      }
    }, 60000); // Every 60 seconds

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [user?.id, isConnected]); // ✅ FIXED: Stable dependencies

  // ===== RETURN =====
  return {
    orders,
    loading,
    isConnected,
    addOrder,
    updateOrder,
    deleteOrder,
    refreshData,
    getOrderById,
    getOrdersByStatus,
    getOrdersByDateRange,
    bulkUpdateStatus,
    bulkDeleteOrders,
  };
};