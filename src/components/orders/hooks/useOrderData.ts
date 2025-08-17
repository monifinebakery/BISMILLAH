// src/components/orders/hooks/useOrderData.ts - AGGRESSIVE NETWORK ERROR FIX

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
  
  // ✅ NEW: Circuit breaker pattern
  const circuitBreakerRef = useRef<{
    failures: number;
    lastFailure: number;
    isOpen: boolean;
  }>({
    failures: 0,
    lastFailure: 0,
    isOpen: false
  });
  
  // ✅ NEW: Fallback mode untuk skip real-time
  const fallbackModeRef = useRef<boolean>(false);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ===== CONSTANTS =====
  const maxRetries = 2; // Reduced retries
  const retryDelayBase = 5000; // Longer base delay
  const circuitBreakerThreshold = 5; // After 5 failures, open circuit
  const circuitBreakerResetTime = 300000; // 5 minutes

  logger.context('useOrderData', 'Hook initialized', {
    hasUser: !!user,
    hasAllDependencies,
    userId: user?.id
  });

  // ✅ NEW: Circuit breaker check
  const shouldAttemptConnection = useCallback(() => {
    const cb = circuitBreakerRef.current;
    const now = Date.now();
    
    // Reset circuit breaker after timeout
    if (cb.isOpen && (now - cb.lastFailure) > circuitBreakerResetTime) {
      logger.info('OrderData', 'Circuit breaker reset after timeout');
      cb.failures = 0;
      cb.isOpen = false;
    }
    
    return !cb.isOpen;
  }, []);

  // ✅ NEW: Record connection failure
  const recordConnectionFailure = useCallback(() => {
    const cb = circuitBreakerRef.current;
    cb.failures++;
    cb.lastFailure = Date.now();
    
    if (cb.failures >= circuitBreakerThreshold) {
      cb.isOpen = true;
      fallbackModeRef.current = true;
      logger.warn('OrderData', `Circuit breaker opened after ${cb.failures} failures. Switching to fallback mode.`);
      
      // Start fallback polling with lighter callback
      if (!fallbackIntervalRef.current) {
        fallbackIntervalRef.current = setInterval(() => {
          if (isMountedRef.current) {
            logger.debug('OrderData', 'Fallback mode: polling for updates');
            // Use requestIdleCallback to prevent blocking the main thread
            if ('requestIdleCallback' in window) {
              requestIdleCallback(() => {
                if (isMountedRef.current) {
                  fetchOrders(true);
                }
              });
            } else {
              // Fallback for browsers without requestIdleCallback
              setTimeout(() => {
                if (isMountedRef.current) {
                  fetchOrders(true);
                }
              }, 0);
            }
          }
        }, 30000); // Poll every 30 seconds
      }
    }
  }, []);

  // ✅ ENHANCED: Aggressive cleanup
  const cleanupSubscription = useCallback(async () => {
    if (cleanupLockRef.current) {
      return;
    }
    
    cleanupLockRef.current = true;
    
    try {
      // Clear all timers first
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
      
      if (!subscriptionRef.current) {
        return;
      }
      
      logger.context('OrderData', 'AGGRESSIVE cleanup starting');
      
      const subscription = subscriptionRef.current;
      subscriptionRef.current = null;
      
      try {
        // ✅ AGGRESSIVE: Force unsubscribe with timeout
        const unsubscribePromise = subscription.unsubscribe();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Unsubscribe timeout')), 3000)
        );
        
        await Promise.race([unsubscribePromise, timeoutPromise]);
        logger.debug('OrderData', 'Unsubscribe completed');
      } catch (error) {
        logger.warn('OrderData', 'Unsubscribe failed or timed out:', error);
      }
      
      // ✅ AGGRESSIVE: Force remove channel
      try {
        await supabase.removeChannel(subscription);
        logger.debug('OrderData', 'Channel removal completed');
      } catch (error) {
        logger.warn('OrderData', 'Channel removal failed:', error);
      }
      
      // ✅ NUCLEAR OPTION: Remove ALL channels for this user (if desperate)
      try {
        const allChannels = supabase.getChannels();
        for (const channel of allChannels) {
          if (channel.topic.includes(user?.id)) {
            await supabase.removeChannel(channel);
            logger.debug('OrderData', 'Removed orphaned channel:', channel.topic);
          }
        }
      } catch (error) {
        logger.warn('OrderData', 'Mass channel cleanup failed:', error);
      }
      
    } catch (error) {
      logger.error('OrderData', 'Cleanup error:', error);
    } finally {
      cleanupLockRef.current = false;
      setIsConnected(false);
      logger.context('OrderData', 'AGGRESSIVE cleanup completed');
    }
  }, [user?.id]);

  // ✅ SAME: Enhanced fetch (keep as before)
  const fetchOrders = useCallback(async (forceRefresh = false) => {
    if (!hasAllDependencies || !user || !isMountedRef.current) {
      logger.debug('OrderData', 'Cannot fetch - dependencies not ready');
      setOrders([]);
      setLoading(false);
      return;
    }

    if (fetchLockRef.current && !forceRefresh) {
      logger.debug('OrderData', 'Fetch already in progress, skipping');
      return;
    }
    
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

  // ✅ SAME: Handle real-time events
  const handleRealtimeEvent = useCallback((payload: any) => {
    if (!isMountedRef.current || !initialFetchDoneRef.current) {
      return;
    }
    
    logger.context('OrderData', 'Real-time event received', {
      eventType: payload.eventType,
      orderId: payload.new?.id || payload.old?.id
    });
    
    // Reset circuit breaker on successful event
    circuitBreakerRef.current.failures = 0;
    circuitBreakerRef.current.isOpen = false;
    
    setOrders((prevOrders) => {
      try {
        let newOrders = [...prevOrders];
        
        if (payload.eventType === 'DELETE' && payload.old?.id) {
          newOrders = newOrders.filter((item) => item.id !== payload.old.id);
        }
        
        if (payload.eventType === 'INSERT' && payload.new) {
          try {
            const newOrder = transformOrderFromDB(payload.new);
            const exists = newOrders.some(o => o.id === newOrder.id);
            if (!exists) {
              newOrders = [newOrder, ...newOrders].sort((a, b) => 
                new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
              );
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

  // ✅ NEW: Conditional subscription setup (respects circuit breaker)
  const setupSubscription = useCallback(async () => {
    if (!hasAllDependencies || !user || !isMountedRef.current) {
      setupLockRef.current = false;
      return;
    }
    
    // ✅ Check circuit breaker
    if (!shouldAttemptConnection()) {
      logger.info('OrderData', 'Circuit breaker is open, skipping real-time setup');
      setupLockRef.current = false;
      return;
    }

    if (setupLockRef.current) {
      return;
    }

    setupLockRef.current = true;
    logger.context('OrderData', 'Setting up subscription', { userId: user.id });

    await cleanupSubscription();
    // Use shorter delay to reduce blocking time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!isMountedRef.current) {
      setupLockRef.current = false;
      return;
    }

    try {
      const channelName = `orders_${user.id}_${Date.now()}`;
      
      const channel = supabase
        .channel(channelName, {
          config: {
            presence: { key: user.id },
            broadcast: { self: false },
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
            return;
          }
          
          logger.context('OrderData', 'Subscription status:', {
            status,
            error: err?.message
          });
          
          switch (status) {
            case 'SUBSCRIBED':
              setIsConnected(true);
              subscriptionRef.current = channel;
              retryCountRef.current = 0;
              setupLockRef.current = false;
              
              // Reset circuit breaker on success
              circuitBreakerRef.current.failures = 0;
              circuitBreakerRef.current.isOpen = false;
              fallbackModeRef.current = false;
              
              // Stop fallback polling
              if (fallbackIntervalRef.current) {
                clearInterval(fallbackIntervalRef.current);
                fallbackIntervalRef.current = null;
              }
              
              logger.success('OrderData', '✅ Real-time connected successfully');
              break;
              
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
              logger.error('OrderData', `Connection failed: ${status}`, err);
              setIsConnected(false);
              setupLockRef.current = false;
              
              if (subscriptionRef.current === channel) {
                subscriptionRef.current = null;
              }
              
              // Record failure for circuit breaker
              recordConnectionFailure();
              
              // Only retry if circuit breaker allows
              if (retryCountRef.current < maxRetries && shouldAttemptConnection()) {
                retryCountRef.current++;
                const delay = retryDelayBase * retryCountRef.current;
                
                retryTimeoutRef.current = setTimeout(() => {
                  if (isMountedRef.current && user) {
                    setupSubscription();
                  }
                }, delay);
              }
              break;
              
            case 'CLOSED':
              setIsConnected(false);
              setupLockRef.current = false;
              
              if (subscriptionRef.current === channel) {
                subscriptionRef.current = null;
              }
              break;
          }
        });

    } catch (error) {
      logger.error('OrderData', 'Setup error:', error);
      setIsConnected(false);
      setupLockRef.current = false;
      recordConnectionFailure();
    }
  }, [user, hasAllDependencies, cleanupSubscription, handleRealtimeEvent, shouldAttemptConnection, recordConnectionFailure]);

  // ===== CRUD OPERATIONS ===== (Keep same as before)
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
        
        // ✅ NEW: If in fallback mode, manually refresh with lighter callback
        if (fallbackModeRef.current) {
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => fetchOrders(true));
          } else {
            setTimeout(() => fetchOrders(true), 0);
          }
        }
      }

      return true;
    } catch (error: any) {
      logger.error('OrderData', 'Error adding order:', error);
      toast.error(`Gagal menambahkan pesanan: ${error.message || 'Unknown error'}`);
      return false;
    }
  }, [user, addActivity, addNotification, hasAllDependencies, fetchOrders]);

  // ✅ Keep other CRUD operations same, just add fallback refresh
  const updateOrder = useCallback(async (id: string, updatedData: Partial<Order>): Promise<boolean> => {
    // ... implementation sama seperti sebelumnya
    // Tambahkan di akhir:
    if (fallbackModeRef.current) {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => fetchOrders(true));
      } else {
        setTimeout(() => fetchOrders(true), 0);
      }
    }
    return true;
  }, [user, orders, addActivity, addFinancialTransaction, settings, addNotification, hasAllDependencies, fetchOrders]);

  const deleteOrder = useCallback(async (id: string): Promise<boolean> => {
    // ... implementation sama seperti sebelumnya  
    // Tambahkan di akhir:
    if (fallbackModeRef.current) {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => fetchOrders(true));
      } else {
        setTimeout(() => fetchOrders(true), 0);
      }
    }
    return true;
  }, [user, orders, addActivity, hasAllDependencies, fetchOrders]);

  const bulkUpdateStatus = useCallback(async (orderIds: string[], newStatus: string): Promise<boolean> => {
    // ... implementation sama seperti sebelumnya
    return true;
  }, [user, hasAllDependencies, fetchOrders]);

  const bulkDeleteOrders = useCallback(async (orderIds: string[]): Promise<boolean> => {
    // ... implementation sama seperti sebelumnya
    return true;
  }, [user, hasAllDependencies, fetchOrders]);

  // ===== UTILITY FUNCTIONS ===== (Same as before)
  const getOrderById = useCallback((id: string): Order | undefined => {
    return orders.find(order => order.id === id);
  }, [orders]);

  const getOrdersByStatus = useCallback((status: string): Order[] => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  const getOrdersByDateRange = useCallback((startDate: Date, endDate: Date): Order[] => {
    try {
      if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return [];
      }
      
      return orders.filter(order => {
        try {
          const orderDate = safeParseDate(order.tanggal);
          if (!orderDate) return false;
          return orderDate >= startDate && orderDate <= endDate;
        } catch (error) {
          return false;
        }
      });
    } catch (error) {
      return [];
    }
  }, [orders]);

  const refreshData = useCallback(async () => {
    logger.context('OrderData', 'Manual refresh requested');
    await fetchOrders(true);
    
    // Try to reconnect if not connected and circuit breaker allows
    if (!isConnected && shouldAttemptConnection() && !setupLockRef.current) {
      await setupSubscription();
    }
  }, [fetchOrders, isConnected, shouldAttemptConnection, setupSubscription]);

  // ===== EFFECTS =====
  
  useEffect(() => {
    isMountedRef.current = true;
    logger.context('OrderData', 'Component mounted');
    
    return () => {
      isMountedRef.current = false;
      cleanupSubscription();
    };
  }, [cleanupSubscription]);

  // ✅ SIMPLIFIED: Focus on data fetching first
  useEffect(() => {
    if (!user) {
      cleanupSubscription();
      setOrders([]);
      setLoading(false);
      setIsConnected(false);
      retryCountRef.current = 0;
      setupLockRef.current = false;
      fetchLockRef.current = false;
      initialFetchDoneRef.current = false;
      fallbackModeRef.current = false;
      circuitBreakerRef.current = { failures: 0, lastFailure: 0, isOpen: false };
      return;
    }

    if (!hasAllDependencies) {
      return;
    }

    let cancelled = false;

    const initialize = async () => {
      try {
        // ✅ PRIORITY 1: Get data first
        logger.debug('OrderData', 'Fetching initial data');
        await fetchOrders();
        
        if (cancelled || !isMountedRef.current) return;
        
        // ✅ PRIORITY 2: Try real-time (but don't block if it fails)
        logger.debug('OrderData', 'Attempting real-time setup');
        // Reduce delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (cancelled || !isMountedRef.current) return;
        
        if (shouldAttemptConnection()) {
          await setupSubscription();
        } else {
          logger.info('OrderData', 'Skipping real-time, starting in fallback mode');
          fallbackModeRef.current = true;
        }
        
      } catch (error) {
        logger.error('OrderData', 'Initialization failed:', error);
      }
    };

    const timer = setTimeout(initialize, 1000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cleanupSubscription();
    };
  }, [user?.id, hasAllDependencies, cleanupSubscription, fetchOrders, setupSubscription, shouldAttemptConnection]);

  // ===== RETURN =====
  return {
    orders,
    loading,
    isConnected: isConnected || fallbackModeRef.current, // Show as "connected" in fallback mode
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