// 🎯 Fixed useOrderData - Mengatasi "hooks render" error
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
  // ===== SEMUA STATE HOOKS DIDEKLARASI DI ATAS (TIDAK KONDISIONAL) =====
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  // ===== SEMUA REF HOOKS DIDEKLARASI DI ATAS (TIDAK KONDISIONAL) =====
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  
  // ===== KONSTANTA =====
  const maxRetries = 3;

  // ===== CLEANUP FUNCTIONS =====
  const cleanupSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      logger.context('OrderData', 'Cleaning up subscription');
      try {
        // Double check untuk memastikan subscription masih valid
        if (subscriptionRef.current && typeof subscriptionRef.current.unsubscribe === 'function') {
          subscriptionRef.current.unsubscribe();
        }
        
        // Safe removal dari supabase
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current);
        }
      } catch (error) {
        logger.error('OrderData', 'Error during subscription cleanup:', error);
        // Tetap lanjutkan cleanup meskipun ada error
      } finally {
        subscriptionRef.current = null;
      }
    }

    // Clear retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // ===== FETCH ORDERS =====
  const fetchOrders = useCallback(async () => {
    if (!user || !isMountedRef.current) {
      setOrders([]);
      setLoading(false);
      return;
    }

    logger.context('OrderData', 'Fetching orders...');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('tanggal', { ascending: false });

      if (error) throw new Error(error.message);

      if (!isMountedRef.current) return;

      const transformedData = data
        .map(item => {
          try {
            return transformOrderFromDB(item);
          } catch (transformError) {
            console.error('OrderData: Error transforming individual order:', transformError, item);
            return null;
          }
        })
        .filter(Boolean) as Order[];

      logger.context('OrderData', 'Orders loaded:', transformedData.length, 'items');
      setOrders(transformedData);

    } catch (error: any) {
      if (!isMountedRef.current) return;
      
      logger.error('OrderData - Error fetching orders:', error);
      toast.error(`Gagal memuat pesanan: ${error.message || 'Unknown error'}`);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  // ===== RETRY LOGIC =====
  const retrySubscription = useCallback(() => {
    if (retryCountRef.current < maxRetries && isMountedRef.current && user) {
      retryCountRef.current++;
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000);
      
      logger.context('OrderData', `Retrying subscription in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
      
      retryTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setupSubscription();
        }
      }, delay);
    } else {
      logger.context('OrderData', 'Max retries reached or component unmounted');
      setIsConnected(false);
    }
  }, [user]); // setupSubscription akan didefinisikan setelah ini

  // ===== SUBSCRIPTION SETUP =====
  const setupSubscription = useCallback(() => {
    if (!user || !isMountedRef.current) {
      logger.context('OrderData', 'Cannot setup subscription: no user or component unmounted');
      return;
    }

    // Cleanup any existing subscription first
    cleanupSubscription();

    logger.context('OrderData', 'Setting up new subscription for user:', user.id);

    try {
      const channelName = `orders_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
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
          
          logger.context('OrderData', 'Real-time event:', payload.eventType, payload.new?.id || payload.old?.id);
          
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
          if (!isMountedRef.current) return;
          
          logger.context('OrderData', 'Subscription status:', status, err ? { error: err } : '');
          
          switch (status) {
            case 'SUBSCRIBED':
              setIsConnected(true);
              subscriptionRef.current = channel;
              retryCountRef.current = 0;
              fetchOrders();
              logger.context('OrderData', 'Successfully subscribed to real-time updates');
              break;
              
            case 'CHANNEL_ERROR':
              logger.error('OrderData', 'Channel error:', err);
              setIsConnected(false);
              // Set to null immediately to prevent unsubscribe errors
              subscriptionRef.current = null;
              retrySubscription();
              break;
              
            case 'TIMED_OUT':
              logger.error('OrderData', 'Subscription timed out');
              setIsConnected(false);
              // Set to null immediately to prevent unsubscribe errors
              subscriptionRef.current = null;
              retrySubscription();
              break;
              
            case 'CLOSED':
              logger.context('OrderData', 'Subscription closed');
              setIsConnected(false);
              // Set to null immediately to prevent unsubscribe errors
              subscriptionRef.current = null;
              break;
              
            default:
              logger.context('OrderData', 'Unknown subscription status:', status);
          }
        });

    } catch (error) {
      logger.error('OrderData', 'Error setting up subscription:', error);
      setIsConnected(false);
      subscriptionRef.current = null;
      retrySubscription();
    }
  }, [user, fetchOrders, cleanupSubscription, retrySubscription]);

  // ===== CRUD OPERATIONS =====
  const addOrder = useCallback(async (order: NewOrder): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk membuat pesanan');
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
  }, [user, addActivity, addNotification]);

  const updateOrder = useCallback(async (id: string, updatedData: Partial<Order>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login.');
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
          console.error('OrderData: Error adding financial transaction:', financialError);
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
  }, [user, orders, addActivity, addFinancialTransaction, settings, addNotification]);

  const deleteOrder = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menghapus pesanan');
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
  }, [user, orders, addActivity]);

  // ===== BULK OPERATIONS =====
  const bulkUpdateStatus = useCallback(async (orderIds: string[], newStatus: string): Promise<boolean> => {
    if (!user || !Array.isArray(orderIds) || orderIds.length === 0) {
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
  }, [user]);

  const bulkDeleteOrders = useCallback(async (orderIds: string[]): Promise<boolean> => {
    if (!user || !Array.isArray(orderIds) || orderIds.length === 0) {
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
  }, [user]);

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
        console.error('OrderData: Invalid dates for getOrdersByDateRange:', { startDate, endDate });
        return [];
      }
      
      return orders.filter(order => {
        try {
          const orderDate = safeParseDate(order.tanggal);
          if (!orderDate) return false;
          return orderDate >= startDate && orderDate <= endDate;
        } catch (error) {
          console.error('OrderData: Error processing order date:', error, order);
          return false;
        }
      });
    } catch (error) {
      console.error('OrderData: Error in getOrdersByDateRange:', error);
      return [];
    }
  }, [orders]);

  const checkConnectionHealth = useCallback(() => {
    if (!user || !isMountedRef.current) return;

    if (!isConnected && !subscriptionRef.current) {
      logger.context('OrderData', 'Connection health check: attempting reconnect');
      setupSubscription();
    }
  }, [user, isConnected, setupSubscription]);

  const refreshData = useCallback(async () => {
    logger.context('OrderData', 'Manual refresh requested');
    await fetchOrders();
    
    if (!isConnected && user) {
      setupSubscription();
    }
  }, [fetchOrders, isConnected, user, setupSubscription]);

  // ===== EFFECTS (SEMUA DI BAWAH, TIDAK KONDISIONAL) =====
  
  // Component mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      cleanupSubscription();
    };
  }, [cleanupSubscription]);

  // Main effect for user changes
  useEffect(() => {
    if (!user) {
      logger.context('OrderData', 'User logged out, cleaning up');
      cleanupSubscription();
      setOrders([]);
      setLoading(false);
      setIsConnected(false);
      retryCountRef.current = 0;
      return;
    }

    logger.context('OrderData', 'User changed, setting up subscription');
    setupSubscription();

    return () => {
      cleanupSubscription();
    };
  }, [user?.id, setupSubscription, cleanupSubscription]);

  // Periodic connection health check
  useEffect(() => {
    if (!user) return;

    const healthCheckInterval = setInterval(checkConnectionHealth, 30000);

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [user, checkConnectionHealth]);

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