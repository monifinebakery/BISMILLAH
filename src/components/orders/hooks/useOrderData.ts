// src/components/orders/hooks/useOrderData.ts - FIXED VERSION (No Race Conditions)

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
  const initialFetchDoneRef = useRef<boolean>(false);
  
  // ✅ FIX: Add locks to prevent race conditions
  const setupLockRef = useRef<boolean>(false);
  const fetchLockRef = useRef<boolean>(false);
  const cleanupLockRef = useRef<boolean>(false);
  
  // ===== CONSTANTS =====
  const maxRetries = 3;
  const retryDelayBase = 2000; // Increased from 1000ms

  logger.context('useOrderData', 'Hook initialized', {
    hasUser: !!user,
    hasAllDependencies,
    userId: user?.id
  });

  // ✅ FIX: Enhanced cleanup with lock
  const cleanupSubscription = useCallback(async () => {
    // Prevent concurrent cleanups
    if (cleanupLockRef.current) {
      logger.debug('OrderData', 'Cleanup already in progress, skipping');
      return;
    }
    
    cleanupLockRef.current = true;
    
    try {
      if (!subscriptionRef.current) {
        logger.debug('OrderData', 'No subscription to cleanup');
        return;
      }
      
      logger.context('OrderData', 'Starting subscription cleanup');
      
      const subscription = subscriptionRef.current;
      subscriptionRef.current = null;
      
      // Unsubscribe first
      if (subscription && typeof subscription.unsubscribe === 'function') {
        try {
          await subscription.unsubscribe();
          logger.debug('OrderData', 'Subscription unsubscribed successfully');
        } catch (unsubError) {
          logger.warn('OrderData', 'Error during unsubscribe:', unsubError);
        }
      }
      
      // Small delay to ensure unsubscribe completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Then remove channel
      try {
        await supabase.removeChannel(subscription);
        logger.debug('OrderData', 'Channel removed from supabase');
      } catch (removeError) {
        logger.warn('OrderData', 'Channel already removed or invalid:', removeError);
      }
      
    } catch (error) {
      logger.error('OrderData', 'Error during subscription cleanup:', error);
    } finally {
      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      cleanupLockRef.current = false;
      logger.context('OrderData', 'Subscription cleanup completed');
    }
  }, []);

  // ✅ FIX: Enhanced fetch with lock
  const fetchOrders = useCallback(async (forceRefresh = false) => {
    if (!hasAllDependencies || !user || !isMountedRef.current) {
      logger.debug('OrderData', 'Cannot fetch - dependencies not ready');
      setOrders([]);
      setLoading(false);
      return;
    }

    // Prevent concurrent fetches unless forced
    if (fetchLockRef.current && !forceRefresh) {
      logger.debug('OrderData', 'Fetch already in progress, skipping');
      return;
    }
    
    // Skip if already fetched and not forcing refresh
    if (initialFetchDoneRef.current && !forceRefresh) {
      logger.debug('OrderData', 'Initial fetch already done, skipping');
      return;
    }

    fetchLockRef.current = true;
    logger.context('OrderData', 'Fetching orders', {
      userId: user.id,
      forced: forceRefresh
    });
    
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('tanggal', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      if (!isMountedRef.current) {
        logger.debug('OrderData', 'Component unmounted during fetch, ignoring results');
        return;
      }

      const transformedData = (data || [])
        .map(item => {
          try {
            return transformOrderFromDB(item);
          } catch (transformError) {
            logger.error('OrderData', 'Error transforming order:', transformError, item);
            return null;
          }
        })
        .filter(Boolean) as Order[];

      logger.success('OrderData', 'Orders fetched successfully', {
        count: transformedData.length,
        isInitial: !initialFetchDoneRef.current
      });
      
      setOrders(transformedData);
      initialFetchDoneRef.current = true;

    } catch (error: any) {
      if (!isMountedRef.current) return;
      
      logger.error('OrderData', 'Error fetching orders:', error);
      toast.error(`Gagal memuat pesanan: ${error.message || 'Unknown error'}`);
      setOrders([]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      fetchLockRef.current = false;
    }
  }, [user, hasAllDependencies]);

  // ✅ FIX: Handle real-time events with better filtering
  const handleRealtimeEvent = useCallback((payload: any) => {
    if (!isMountedRef.current) {
      logger.debug('OrderData', 'Ignoring real-time event: component unmounted');
      return;
    }
    
    // Skip if initial fetch not done
    if (!initialFetchDoneRef.current) {
      logger.debug('OrderData', 'Skipping real-time event: initial fetch not complete');
      return;
    }
    
    logger.context('OrderData', 'Real-time event received', {
      eventType: payload.eventType,
      orderId: payload.new?.id || payload.old?.id,
      nomorPesanan: payload.new?.nomor_pesanan || payload.old?.nomor_pesanan
    });
    
    // Reset retry count on successful event
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
            // Check if order already exists (prevent duplicates)
            const exists = newOrders.some(o => o.id === newOrder.id);
            if (!exists) {
              newOrders = [newOrder, ...newOrders].sort((a, b) => 
                new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
              );
              logger.context('OrderData', 'Order added from real-time:', newOrder.id);
            }
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
  }, []);

  // ✅ FIX: Improved retry logic with exponential backoff
  const retrySubscription = useCallback(() => {
    if (retryCountRef.current >= maxRetries) {
      logger.error('OrderData', `Max retries (${maxRetries}) reached, giving up`);
      setIsConnected(false);
      setupLockRef.current = false;
      return;
    }

    if (!isMountedRef.current || !user) {
      logger.debug('OrderData', 'Component unmounted or no user, skipping retry');
      setupLockRef.current = false;
      return;
    }

    retryCountRef.current++;
    const delay = Math.min(retryDelayBase * Math.pow(2, retryCountRef.current - 1), 30000);
    
    logger.context('OrderData', `Scheduling retry`, {
      attempt: `${retryCountRef.current}/${maxRetries}`,
      delayMs: delay
    });
    
    retryTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && user && !setupLockRef.current) {
        logger.context('OrderData', 'Executing subscription retry');
        setupSubscription();
      } else {
        logger.debug('OrderData', 'Retry cancelled: conditions not met');
        setupLockRef.current = false;
      }
    }, delay);
  }, [user]); // Will be defined below

  // ✅ FIX: Enhanced subscription setup with lock
  const setupSubscription = useCallback(async () => {
    if (!hasAllDependencies || !user || !isMountedRef.current) {
      logger.debug('OrderData', 'Cannot setup subscription: dependencies not ready');
      setupLockRef.current = false;
      return;
    }

    // Prevent concurrent setup attempts
    if (setupLockRef.current) {
      logger.debug('OrderData', 'Subscription setup already in progress, skipping');
      return;
    }

    setupLockRef.current = true;
    logger.context('OrderData', 'Setting up subscription', { userId: user.id });

    // Clean up any existing subscription first
    await cleanupSubscription();
    
    // Wait a bit to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (!isMountedRef.current) {
      setupLockRef.current = false;
      return;
    }

    try {
      // Use simpler channel name
      const channelName = `orders_${user.id}`;
      
      logger.debug('OrderData', 'Creating channel:', channelName);
      
      // Check and remove any existing channel with same name
      try {
        const existingChannel = supabase.channel(channelName);
        if (existingChannel) {
          await supabase.removeChannel(existingChannel);
          logger.debug('OrderData', 'Removed existing channel with same name');
        }
      } catch (removeErr) {
        // Ignore removal errors
      }
      
      const channel = supabase
        .channel(channelName, {
          config: {
            presence: { key: user.id },
            broadcast: { self: false }, // Don't receive own broadcasts
          },
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        }, handleRealtimeEvent)
        .subscribe(async (status, err) => {
          if (!isMountedRef.current) {
            logger.debug('OrderData', 'Subscription status ignored: component unmounted');
            return;
          }
          
          logger.context('OrderData', 'Subscription status changed', {
            status,
            error: err?.message
          });
          
          switch (status) {
            case 'SUBSCRIBED':
              setIsConnected(true);
              subscriptionRef.current = channel;
              retryCountRef.current = 0;
              setupLockRef.current = false;
              logger.success('OrderData', '✅ Successfully subscribed to real-time updates');
              break;
              
            case 'CHANNEL_ERROR':
              logger.error('OrderData', 'Channel error occurred', {
                error: err?.message,
                code: err?.code,
                details: err?.details
              });
              setIsConnected(false);
              setupLockRef.current = false;
              
              if (subscriptionRef.current === channel) {
                subscriptionRef.current = null;
              }
              
              // Only retry if not at max attempts
              if (retryCountRef.current < maxRetries) {
                retrySubscription();
              }
              break;
              
            case 'TIMED_OUT':
              logger.error('OrderData', 'Subscription timed out');
              setIsConnected(false);
              setupLockRef.current = false;
              
              if (subscriptionRef.current === channel) {
                subscriptionRef.current = null;
              }
              
              // Only retry if not at max attempts
              if (retryCountRef.current < maxRetries) {
                retrySubscription();
              }
              break;
              
            case 'CLOSED':
              logger.context('OrderData', 'Subscription closed');
              setIsConnected(false);
              setupLockRef.current = false;
              
              if (subscriptionRef.current === channel) {
                subscriptionRef.current = null;
              }
              break;
              
            default:
              logger.debug('OrderData', 'Subscription status:', status);
              break;
          }
        });

    } catch (error) {
      logger.error('OrderData', 'Error setting up subscription:', error);
      setIsConnected(false);
      setupLockRef.current = false;
      
      // Only retry if not at max attempts
      if (retryCountRef.current < maxRetries) {
        retrySubscription();
      }
    }
  }, [user, hasAllDependencies, cleanupSubscription, handleRealtimeEvent, retrySubscription]);

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
        // Use callback functions with safety checks
        if (typeof addActivity === 'function') {
          try {
            await addActivity({ 
              title: 'Pesanan Baru Dibuat', 
              description: `Pesanan #${createdOrder.nomor_pesanan} dari ${createdOrder.nama_pelanggan} telah dibuat.`,
              type: 'order'
            });
          } catch (activityError) {
            logger.error('OrderData', 'Error adding activity:', activityError);
          }
        }

        toast.success(`Pesanan #${createdOrder.nomor_pesanan} berhasil ditambahkan!`);

        if (typeof addNotification === 'function') {
          try {
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
          } catch (notifError) {
            logger.error('OrderData', 'Error adding notification:', notifError);
          }
        }
      }

      return true;
    } catch (error: any) {
      logger.error('OrderData', 'Error adding order:', error);
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

        // Add financial transaction with safety check
        if (typeof addFinancialTransaction === 'function') {
          try {
            const incomeCategory = settings?.financialCategories?.income?.[0] || 'Penjualan Produk';
            await addFinancialTransaction({
              type: 'income',
              category: incomeCategory,
              description: `Penjualan dari pesanan #${oldOrder.nomorPesanan}`,
              amount: oldOrder.totalPesanan,
              date: new Date(),
              relatedId: oldOrder.id,
            });
          } catch (financialError) {
            logger.error('OrderData', 'Error adding financial transaction:', financialError);
          }
        }

        if (typeof addActivity === 'function') {
          try {
            await addActivity({
              title: 'Pesanan Selesai',
              description: `Pesanan #${oldOrder.nomorPesanan} telah selesai.`,
              type: 'order',
            });
          } catch (activityError) {
            logger.error('OrderData', 'Error adding activity:', activityError);
          }
        }

        toast.success(`Pesanan #${oldOrder.nomorPesanan} selesai!`);

        if (typeof addNotification === 'function') {
          try {
            await addNotification({
              title: '🎉 Pesanan Selesai!',
              message: `Pesanan #${oldOrder.nomorPesanan} telah selesai dengan total ${formatCurrency(oldOrder.totalPesanan)}.`,
              type: 'success',
              icon: 'check-circle',
              priority: 2,
              related_type: 'order',
              related_id: id,
              action_url: '/orders',
              is_read: false,
              is_archived: false
            });
          } catch (notifError) {
            logger.error('OrderData', 'Error adding notification:', notifError);
          }
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

        if (newStatus && oldStatus !== newStatus && typeof addNotification === 'function') {
          try {
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
          } catch (notifError) {
            logger.error('OrderData', 'Error adding notification:', notifError);
          }
        }
      }

      return true;
    } catch (error: any) {
      logger.error('OrderData', 'Error updating order:', error);
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

      // Delete related financial transactions
      try {
        await supabase
          .from('financial_transactions')
          .delete()
          .eq('related_id', id)
          .eq('user_id', user.id);
      } catch (finError) {
        logger.error('OrderData', 'Error deleting related transactions:', finError);
      }

      if (typeof addActivity === 'function') {
        try {
          await addActivity({ 
            title: 'Pesanan Dihapus', 
            description: `Pesanan #${orderToDelete.nomorPesanan} telah dihapus`, 
            type: 'order' 
          });
        } catch (activityError) {
          logger.error('OrderData', 'Error adding activity:', activityError);
        }
      }

      toast.success('Pesanan berhasil dihapus.');
      return true;
    } catch (error: any) {
      logger.error('OrderData', 'Error deleting order:', error);
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
      
      // Refresh data to get updated orders
      await fetchOrders(true);
      
      return true;
    } catch (error: any) {
      toast.error(`Gagal mengubah status: ${error.message || 'Unknown error'}`);
      return false;
    }
  }, [user, hasAllDependencies, fetchOrders]);

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

      // Delete related financial transactions
      try {
        await supabase
          .from('financial_transactions')
          .delete()
          .in('related_id', orderIds)
          .eq('user_id', user.id);
      } catch (finError) {
        logger.error('OrderData', 'Error deleting related transactions:', finError);
      }

      toast.success(`${orderIds.length} pesanan berhasil dihapus`);

      // Refresh data to reflect deletions
      await fetchOrders(true);

      return true;
    } catch (error: any) {
      toast.error(`Gagal menghapus pesanan: ${error.message || 'Unknown error'}`);
      return false;
    }
  }, [user, hasAllDependencies, fetchOrders]);

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
        logger.error('OrderData', 'Invalid dates for getOrdersByDateRange:', { startDate, endDate });
        return [];
      }
      
      return orders.filter(order => {
        try {
          const orderDate = safeParseDate(order.tanggal);
          if (!orderDate) return false;
          return orderDate >= startDate && orderDate <= endDate;
        } catch (error) {
          logger.error('OrderData', 'Error processing order date:', error, order);
          return false;
        }
      });
    } catch (error) {
      logger.error('OrderData', 'Error in getOrdersByDateRange:', error);
      return [];
    }
  }, [orders]);

  // ✅ FIX: Improved connection health check
  const checkConnectionHealth = useCallback(() => {
    if (!user || !isMountedRef.current || setupLockRef.current) {
      return;
    }

    if (!isConnected && !subscriptionRef.current) {
      logger.context('OrderData', 'Connection health check: attempting reconnect');
      setupSubscription();
    }
  }, [user, isConnected, setupSubscription]);

  const refreshData = useCallback(async () => {
    logger.context('OrderData', 'Manual refresh requested');
    
    // Force refresh the data
    await fetchOrders(true);
    
    // If not connected, try to establish connection
    if (!isConnected && user && hasAllDependencies && !setupLockRef.current) {
      logger.debug('OrderData', 'Attempting to reconnect during refresh');
      await setupSubscription();
    }
  }, [fetchOrders, isConnected, user, hasAllDependencies, setupSubscription]);

  // ===== EFFECTS =====
  
  // Component mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    logger.context('OrderData', 'Component mounted');
    
    return () => {
      logger.context('OrderData', 'Component unmounting');
      isMountedRef.current = false;
      cleanupSubscription();
    };
  }, []); // Only on mount/unmount

  // ✅ FIX: Sequential initialization with proper delays
  useEffect(() => {
    if (!user) {
      logger.context('OrderData', 'User not ready, resetting state');
      cleanupSubscription();
      setOrders([]);
      setLoading(false);
      setIsConnected(false);
      retryCountRef.current = 0;
      setupLockRef.current = false;
      fetchLockRef.current = false;
      initialFetchDoneRef.current = false;
      return;
    }

    if (!hasAllDependencies) {
      logger.context('OrderData', 'Dependencies not ready, waiting...');
      return;
    }

    let cancelled = false;

    const initializeSequentially = async () => {
      try {
        // Step 1: Fetch initial data
        logger.debug('OrderData', 'Step 1: Fetching initial data');
        await fetchOrders();
        
        if (cancelled || !isMountedRef.current) return;
        
        // Step 2: Wait to ensure fetch is complete and avoid race
        logger.debug('OrderData', 'Step 2: Waiting before subscription setup');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay
        
        if (cancelled || !isMountedRef.current) return;
        
        // Step 3: Setup subscription
        logger.debug('OrderData', 'Step 3: Setting up real-time subscription');
        await setupSubscription();
        
      } catch (error) {
        logger.error('OrderData', 'Initialization failed:', error);
      }
    };
    
    // Start initialization with a small delay to ensure everything is ready
    const initTimer = setTimeout(() => {
      if (!cancelled && isMountedRef.current && user && hasAllDependencies) {
        initializeSequentially();
      }
    }, 500); // Initial delay before starting

    return () => {
      cancelled = true;
      clearTimeout(initTimer);
      cleanupSubscription();
    };
  }, [user?.id, hasAllDependencies]); // Stable dependencies

  // ✅ FIX: Connection health check with proper interval
  useEffect(() => {
    if (!user || !hasAllDependencies) return;

    const healthCheckInterval = setInterval(() => {
      checkConnectionHealth();
    }, 60000); // Every 60 seconds

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [user?.id, hasAllDependencies, checkConnectionHealth]);

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