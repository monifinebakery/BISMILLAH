// src/components/orders/hooks/useOrderData.ts - FIXED STATUS UPDATE IMPLEMENTATION

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
  
  const setupLockRef = useRef<boolean>(false);
  const fetchLockRef = useRef<boolean>(false);
  const cleanupLockRef = useRef<boolean>(false);
  
  const circuitBreakerRef = useRef<{
    failures: number;
    lastFailure: number;
    isOpen: boolean;
  }>({
    failures: 0,
    lastFailure: 0,
    isOpen: false
  });
  
  const fallbackModeRef = useRef<boolean>(false);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ✅ NEW: Lightweight polling state
  const lastPollTimeRef = useRef<number>(0);
  const pollThrottleMs = 25000; // Minimum 25 seconds between polls
  
  // ===== CONSTANTS =====
  const maxRetries = 2;
  const retryDelayBase = 5000;
  const circuitBreakerThreshold = 5;
  const circuitBreakerResetTime = 300000;

  logger.context('useOrderData', 'Hook initialized', {
    hasUser: !!user,
    hasAllDependencies,
    userId: user?.id
  });

  // ✅ OPTIMIZED: Lightweight throttled fetch
  const throttledFetchOrders = useCallback(async () => {
    const now = Date.now();
    if (now - lastPollTimeRef.current < pollThrottleMs) {
      logger.debug('OrderData', 'Fetch throttled, too soon since last poll');
      return;
    }
    
    lastPollTimeRef.current = now;
    
    // ✅ Use RAF to prevent blocking main thread
    return new Promise<void>((resolve) => {
      requestAnimationFrame(async () => {
        try {
          await fetchOrders(true);
        } catch (error) {
          logger.warn('OrderData', 'Throttled fetch failed:', error);
        } finally {
          resolve();
        }
      });
    });
  }, []);

  const shouldAttemptConnection = useCallback(() => {
    const cb = circuitBreakerRef.current;
    const now = Date.now();
    
    if (cb.isOpen && (now - cb.lastFailure) > circuitBreakerResetTime) {
      logger.info('OrderData', 'Circuit breaker reset after timeout');
      cb.failures = 0;
      cb.isOpen = false;
    }
    
    return !cb.isOpen;
  }, []);

  // ✅ FIXED: Ultra-lightweight fallback polling
  const recordConnectionFailure = useCallback(() => {
    const cb = circuitBreakerRef.current;
    cb.failures++;
    cb.lastFailure = Date.now();
    
    if (cb.failures >= circuitBreakerThreshold) {
      cb.isOpen = true;
      fallbackModeRef.current = true;
      logger.warn('OrderData', `Circuit breaker opened. Switching to ultra-light fallback mode.`);
      
      // ✅ ULTRA-LIGHT: Use timeout chain instead of setInterval
      if (!fallbackIntervalRef.current) {
        const lightPoll = () => {
          if (!isMountedRef.current || !fallbackModeRef.current) {
            return;
          }
          
          // ✅ Super lightweight check - just schedule, don't execute immediately
          fallbackIntervalRef.current = setTimeout(() => {
            if (isMountedRef.current && fallbackModeRef.current) {
              // ✅ Use idle time for execution
              if ('requestIdleCallback' in window) {
                requestIdleCallback(
                  () => {
                    if (isMountedRef.current) {
                      throttledFetchOrders().finally(() => {
                        // Schedule next poll only after current one completes
                        if (fallbackModeRef.current) {
                          lightPoll();
                        }
                      });
                    }
                  },
                  { timeout: 5000 } // Max 5s wait for idle time
                );
              } else {
                // ✅ Non-blocking fallback
                Promise.resolve().then(() => {
                  if (isMountedRef.current) {
                    throttledFetchOrders().finally(() => {
                      if (fallbackModeRef.current) {
                        lightPoll();
                      }
                    });
                  }
                });
              }
            }
          }, 45000); // Increased to 45 seconds to reduce frequency
        };
        
        lightPoll();
      }
    }
  }, [throttledFetchOrders]);

  // ✅ ENHANCED: Aggressive cleanup
  const cleanupSubscription = useCallback(async () => {
    if (cleanupLockRef.current) {
      return;
    }
    
    cleanupLockRef.current = true;
    
    try {
      // ✅ Clear fallback polling first
      if (fallbackIntervalRef.current) {
        clearTimeout(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
      fallbackModeRef.current = false;
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      if (!subscriptionRef.current) {
        return;
      }
      
      logger.context('OrderData', 'Cleanup starting');
      
      const subscription = subscriptionRef.current;
      subscriptionRef.current = null;
      
      try {
        const unsubscribePromise = subscription.unsubscribe();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Unsubscribe timeout')), 3000)
        );
        
        await Promise.race([unsubscribePromise, timeoutPromise]);
        logger.debug('OrderData', 'Unsubscribe completed');
      } catch (error) {
        logger.warn('OrderData', 'Unsubscribe failed or timed out:', error);
      }
      
      try {
        await supabase.removeChannel(subscription);
        logger.debug('OrderData', 'Channel removal completed');
      } catch (error) {
        logger.warn('OrderData', 'Channel removal failed:', error);
      }
      
    } catch (error) {
      logger.error('OrderData', 'Cleanup error:', error);
    } finally {
      cleanupLockRef.current = false;
      setIsConnected(false);
      logger.context('OrderData', 'Cleanup completed');
    }
  }, [user?.id]);

  // ✅ FETCH ORDERS
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

  // ✅ HANDLE REAL-TIME EVENTS
  const handleRealtimeEvent = useCallback((payload: any) => {
    if (!isMountedRef.current || !initialFetchDoneRef.current) {
      return;
    }
    
    logger.context('OrderData', 'Real-time event received', {
      eventType: payload.eventType,
      orderId: payload.new?.id || payload.old?.id
    });
    
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

  // ✅ SETUP SUBSCRIPTION
  const setupSubscription = useCallback(async () => {
    if (!hasAllDependencies || !user || !isMountedRef.current) {
      setupLockRef.current = false;
      return;
    }
    
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
              
              circuitBreakerRef.current.failures = 0;
              circuitBreakerRef.current.isOpen = false;
              fallbackModeRef.current = false;
              
              // ✅ STOP fallback polling when real-time connects
              if (fallbackIntervalRef.current) {
                clearTimeout(fallbackIntervalRef.current);
                fallbackIntervalRef.current = null;
              }
              
              logger.success('OrderData', '✅ Real-time connected, fallback stopped');
              break;
              
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
              logger.error('OrderData', `Connection failed: ${status}`, err);
              setIsConnected(false);
              setupLockRef.current = false;
              
              if (subscriptionRef.current === channel) {
                subscriptionRef.current = null;
              }
              
              recordConnectionFailure();
              
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

  // ===== 🚀 FIXED: DEDICATED STATUS UPDATE FUNCTION =====
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string): Promise<boolean> => {
    if (!hasAllDependencies || !user) {
      logger.warn('OrderData', 'Cannot update status - dependencies not ready');
      toast.error('Sistem belum siap, silakan tunggu...');
      return false;
    }

    if (!orderId || !newStatus) {
      logger.warn('OrderData', 'Invalid parameters for status update:', { orderId, newStatus });
      toast.error('Parameter tidak valid');
      return false;
    }

    const existingOrder = orders.find(order => order.id === orderId);
    if (!existingOrder) {
      logger.warn('OrderData', 'Order not found for status update:', orderId);
      toast.error('Pesanan tidak ditemukan');
      return false;
    }

    try {
      logger.info('OrderData', 'Updating order status:', { 
        orderId, 
        from: existingOrder.status, 
        to: newStatus,
        orderNumber: existingOrder.nomorPesanan
      });

      // ✅ OPTIMISTIC UPDATE: Update UI immediately
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus as Order['status'], updatedAt: new Date() }
            : order
        )
      );

      // ✅ DATABASE UPDATE: Update status in database
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) {
        logger.error('OrderData', 'Database error updating status:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        logger.error('OrderData', 'No data returned from status update');
        throw new Error('Order not found or access denied');
      }

      // ✅ SYNC with actual database response
      const updatedOrder = transformOrderFromDB(data);
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? updatedOrder : order
        )
      );

      // ✅ ACTIVITY LOG for status change
      if (typeof addActivity === 'function') {
        try {
          await addActivity({
            title: 'Status Pesanan Diubah',
            description: `Status pesanan #${existingOrder.nomorPesanan} diubah dari ${getStatusText(existingOrder.status)} menjadi ${getStatusText(newStatus as Order['status'])}`,
            type: 'order'
          });
        } catch (activityError) {
          logger.error('OrderData', 'Error adding activity for status change:', activityError);
        }
      }

      // ✅ FINANCIAL TRANSACTION: Auto-create when order completed
      if (newStatus === 'completed' && existingOrder.status !== 'completed') {
        logger.info('OrderData', 'Creating financial transaction for completed order:', {
          orderId,
          orderNumber: existingOrder.nomorPesanan,
          amount: existingOrder.totalPesanan
        });

        try {
          // ✅ UPDATE: Set completion date FIRST
          const completionDate = new Date();
          const { error: completionError } = await supabase
            .from('orders')
            .update({ 
              tanggal_selesai: completionDate.toISOString() // Set tanggal selesai
            })
            .eq('id', orderId)
            .eq('user_id', user.id);

          if (completionError) {
            logger.warn('OrderData', 'Failed to set completion date:', completionError);
          }

          // ✅ AUTO-CREATE: Financial transaction dengan tanggal selesai yang tepat
          await addFinancialTransaction({
            type: 'income',
            category: 'Penjualan Produk',
            amount: existingOrder.totalPesanan || 0,
            description: `Pemasukan dari pesanan #${existingOrder.nomorPesanan} - ${existingOrder.namaPelanggan}`,
            date: completionDate, // Gunakan tanggal selesai yang sama
            notes: `Auto-generated dari pesanan selesai. Items: ${existingOrder.items.map(item => item.nama).join(', ')}`,
            relatedId: orderId // Link ke order ID
          });

        } catch (financialError: any) {
          logger.error('OrderData', 'Failed to create financial transaction:', financialError);
          // Jangan gagalkan update status, tapi beri warning
          toast.warning(`Status pesanan berhasil diubah, tapi gagal mencatat pemasukan: ${financialError.message}`);
        }
      }

      // ✅ SUCCESS MESSAGE
      toast.success(`Status pesanan #${existingOrder.nomorPesanan} berhasil diubah ke ${getStatusText(newStatus as Order['status'])}`);
      logger.success('OrderData', 'Order status updated successfully:', {
        orderId,
        oldStatus: existingOrder.status,
        newStatus: updatedOrder.status,
        orderNumber: updatedOrder.nomorPesanan
      });

      // ✅ FALLBACK MODE: Manual refresh if needed
      if (fallbackModeRef.current) {
        setTimeout(() => throttledFetchOrders(), 1000);
      }

      return true;

    } catch (error: any) {
      logger.error('OrderData', 'Error updating order status:', error);
      
      // ✅ REVERT OPTIMISTIC UPDATE on error
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? existingOrder : order
        )
      );
      
      toast.error(`Gagal mengubah status pesanan: ${error.message || 'Unknown error'}`);
      return false;
    }
  }, [user, orders, addActivity, addFinancialTransaction, hasAllDependencies, throttledFetchOrders]);

  // ===== 🚀 FIXED: COMPREHENSIVE UPDATE ORDER FUNCTION =====
  const updateOrder = useCallback(async (id: string, updatedData: Partial<Order>): Promise<boolean> => {
    if (!hasAllDependencies || !user) {
      toast.error('Sistem belum siap, silakan tunggu...');
      return false;
    }

    if (!id) {
      toast.error('ID pesanan tidak valid');
      return false;
    }

    const existingOrder = orders.find(order => order.id === id);
    if (!existingOrder) {
      toast.error('Pesanan tidak ditemukan');
      return false;
    }

    try {
      logger.info('OrderData', 'Updating order:', { id, updatedData });

      // ✅ CHECK: If only status is being updated, use dedicated status function
      if (Object.keys(updatedData).length === 1 && updatedData.status) {
        logger.debug('OrderData', 'Delegating to updateOrderStatus for status-only update');
        return await updateOrderStatus(id, updatedData.status);
      }

      // ✅ OPTIMISTIC UPDATE: Update UI immediately for full updates
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === id 
            ? { ...order, ...updatedData, updatedAt: new Date() }
            : order
        )
      );

      // ✅ FULL UPDATE: For comprehensive order updates
      logger.debug('OrderData', 'Performing full order update');
      
      const dbData = transformOrderToDB(updatedData);
      const { data, error } = await supabase
        .from('orders')
        .update({
          ...dbData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('Order not found or access denied');
      }

      const updatedOrder = transformOrderFromDB(data);
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === id ? updatedOrder : order
        )
      );

      // ✅ ACTIVITY LOG for full update
      if (typeof addActivity === 'function') {
        try {
          await addActivity({
            title: 'Pesanan Diperbarui',
            description: `Pesanan #${existingOrder.nomorPesanan} telah diperbarui`,
            type: 'order'
          });
        } catch (activityError) {
          logger.error('OrderData', 'Error adding activity for order update:', activityError);
        }
      }

      toast.success(`Pesanan #${existingOrder.nomorPesanan} berhasil diperbarui`);
      logger.success('OrderData', 'Order updated successfully:', updatedOrder);

      // ✅ FALLBACK MODE: Manual refresh if needed
      if (fallbackModeRef.current) {
        setTimeout(() => throttledFetchOrders(), 1000);
      }

      return true;

    } catch (error: any) {
      logger.error('OrderData', 'Error updating order:', error);
      
      // ✅ REVERT OPTIMISTIC UPDATE on error
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === id ? existingOrder : order
        )
      );
      
      toast.error(`Gagal memperbarui pesanan: ${error.message || 'Unknown error'}`);
      return false;
    }
  }, [user, orders, addActivity, hasAllDependencies, throttledFetchOrders, updateOrderStatus]);

  // ===== CRUD OPERATIONS - ADD ORDER =====
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
        
        // ✅ FALLBACK MODE: Manual refresh if needed
        if (fallbackModeRef.current) {
          setTimeout(() => throttledFetchOrders(), 1000);
        }
      }

      return true;
    } catch (error: any) {
      logger.error('OrderData', 'Error adding order:', error);
      toast.error(`Gagal menambahkan pesanan: ${error.message || 'Unknown error'}`);
      return false;
    }
  }, [user, addActivity, addNotification, hasAllDependencies, throttledFetchOrders]);

  // ===== CRUD OPERATIONS - DELETE ORDER =====
  const deleteOrder = useCallback(async (id: string): Promise<boolean> => {
    if (!hasAllDependencies || !user) {
      toast.error('Sistem belum siap, silakan tunggu...');
      return false;
    }

    if (!id) {
      toast.error('ID pesanan tidak valid');
      return false;
    }

    const existingOrder = orders.find(order => order.id === id);
    if (!existingOrder) {
      toast.error('Pesanan tidak ditemukan');
      return false;
    }

    try {
      logger.info('OrderData', 'Deleting order:', { id, nomorPesanan: existingOrder.nomorPesanan });

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Remove from state
      setOrders(prevOrders => prevOrders.filter(order => order.id !== id));

      if (typeof addActivity === 'function') {
        try {
          await addActivity({
            title: 'Pesanan Dihapus',
            description: `Pesanan #${existingOrder.nomorPesanan} telah dihapus`,
            type: 'order'
          });
        } catch (activityError) {
          logger.error('OrderData', 'Error adding activity for deletion:', activityError);
        }
      }

      toast.success(`Pesanan #${existingOrder.nomorPesanan} berhasil dihapus`);
      logger.success('OrderData', 'Order deleted successfully:', id);

      if (fallbackModeRef.current) {
        setTimeout(() => throttledFetchOrders(), 1000);
      }

      return true;
    } catch (error: any) {
      logger.error('OrderData', 'Error deleting order:', error);
      toast.error(`Gagal menghapus pesanan: ${error.message || 'Unknown error'}`);
      return false;
    }
  }, [user, orders, addActivity, hasAllDependencies, throttledFetchOrders]);

  // ===== BULK OPERATIONS =====
  const bulkUpdateStatus = useCallback(async (orderIds: string[], newStatus: string): Promise<boolean> => {
    if (!hasAllDependencies || !user) {
      toast.error('Sistem belum siap, silakan tunggu...');
      return false;
    }

    if (!orderIds.length || !newStatus) {
      toast.error('Parameter tidak valid');
      return false;
    }

    try {
      logger.info('OrderData', 'Bulk updating status:', { orderIds, newStatus, count: orderIds.length });

      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', orderIds)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Update state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          orderIds.includes(order.id) 
            ? { ...order, status: newStatus as Order['status'], updatedAt: new Date() }
            : order
        )
      );

      if (typeof addActivity === 'function') {
        try {
          await addActivity({
            title: 'Status Pesanan Diperbarui Massal',
            description: `${orderIds.length} pesanan telah diubah statusnya menjadi ${getStatusText(newStatus as Order['status'])}`,
            type: 'order'
          });
        } catch (activityError) {
          logger.error('OrderData', 'Error adding activity for bulk status update:', activityError);
        }
      }

      toast.success(`Status ${orderIds.length} pesanan berhasil diubah ke ${getStatusText(newStatus as Order['status'])}`);
      logger.success('OrderData', 'Bulk status update successful:', { count: orderIds.length, newStatus });

      if (fallbackModeRef.current) {
        setTimeout(() => throttledFetchOrders(), 1000);
      }

      return true;
    } catch (error: any) {
      logger.error('OrderData', 'Error bulk updating status:', error);
      toast.error(`Gagal mengubah status pesanan: ${error.message || 'Unknown error'}`);
      return false;
    }
  }, [user, hasAllDependencies, throttledFetchOrders]);

  const bulkDeleteOrders = useCallback(async (orderIds: string[]): Promise<boolean> => {
    if (!hasAllDependencies || !user) {
      toast.error('Sistem belum siap, silakan tunggu...');
      return false;
    }

    if (!orderIds.length) {
      toast.error('Tidak ada pesanan yang dipilih');
      return false;
    }

    try {
      logger.info('OrderData', 'Bulk deleting orders:', { orderIds, count: orderIds.length });

      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Remove from state
      setOrders(prevOrders => prevOrders.filter(order => !orderIds.includes(order.id)));

      if (typeof addActivity === 'function') {
        try {
          await addActivity({
            title: 'Pesanan Dihapus Massal',
            description: `${orderIds.length} pesanan telah dihapus`,
            type: 'order'
          });
        } catch (activityError) {
          logger.error('OrderData', 'Error adding activity for bulk deletion:', activityError);
        }
      }

      toast.success(`${orderIds.length} pesanan berhasil dihapus`);
      logger.success('OrderData', 'Bulk deletion successful:', { count: orderIds.length });

      if (fallbackModeRef.current) {
        setTimeout(() => throttledFetchOrders(), 1000);
      }

      return true;
    } catch (error: any) {
      logger.error('OrderData', 'Error bulk deleting orders:', error);
      toast.error(`Gagal menghapus pesanan: ${error.message || 'Unknown error'}`);
      return false;
    }
  }, [user, hasAllDependencies, throttledFetchOrders]);

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
        logger.debug('OrderData', 'Fetching initial data');
        await fetchOrders();
        
        if (cancelled || !isMountedRef.current) return;
        
        logger.debug('OrderData', 'Attempting real-time setup');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (cancelled || !isMountedRef.current) return;
        
        if (shouldAttemptConnection()) {
          await setupSubscription();
        } else {
          logger.info('OrderData', 'Starting in fallback mode');
          fallbackModeRef.current = true;
          recordConnectionFailure();
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
  }, [user?.id, hasAllDependencies, cleanupSubscription, fetchOrders, setupSubscription, shouldAttemptConnection, recordConnectionFailure]);

  // ===== RETURN =====
  return {
    orders,
    loading,
    isConnected: isConnected || fallbackModeRef.current,
    addOrder,
    updateOrder,
    updateOrderStatus, // ✅ FIXED: Export dedicated status update function
    deleteOrder,
    refreshData,
    getOrderById,
    getOrdersByStatus,
    getOrdersByDateRange,
    bulkUpdateStatus,
    bulkDeleteOrders,
  };
};