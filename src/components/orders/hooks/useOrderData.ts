// 🎯 200 lines - CRUD + Real-time dengan semua logika asli
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { formatCurrency } from '@/utils/formatUtils';
import type { Order, NewOrder, UseOrderDataReturn } from '../types';
import { transformOrderFromDB, transformOrderToDB, toSafeISOString, validateOrderData } from '../utils';
import { getStatusText } from '../constants';

export const useOrderData = (
  user: any,
  addActivity: any,
  addFinancialTransaction: any,
  settings: any,
  addNotification: any
): UseOrderDataReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // CRUD Operations dengan logika asli lengkap
  const addOrder = useCallback(async (order: NewOrder): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk membuat pesanan');
      return false;
    }

    // Validation dengan logika asli
    const validation = validateOrderData(order);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return false;
    }

    try {
      logger.context('OrderData', 'Adding new order:', order.namaPelanggan);

      // Safe data preparation seperti kode asli
      const orderData = {
        user_id: user.id,
        tanggal: toSafeISOString(order.tanggal || new Date()),
        status: order.status || 'pending',
        nama_pelanggan: order.namaPelanggan.trim(),
        telepon_pelanggan: order.telefonPelanggan || '',
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
        // Activity log seperti kode asli
        if (addActivity && typeof addActivity === 'function') {
          addActivity({ 
            title: 'Pesanan Baru Dibuat', 
            description: `Pesanan #${createdOrder.nomor_pesanan} dari ${createdOrder.nama_pelanggan} telah dibuat.`,
            type: 'order'
          });
        }

        toast.success(`Pesanan #${createdOrder.nomor_pesanan} baru berhasil ditambahkan!`);

        // Notification seperti kode asli
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
        // Complete order dengan stock deduction seperti kode asli
        const { error: rpcError } = await supabase.rpc('complete_order_and_deduct_stock', { 
          order_id: id 
        });
        if (rpcError) throw new Error(rpcError.message);

        // Add financial transaction seperti kode asli
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

        // Activity log dan notifications seperti kode asli
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
        // Regular update seperti kode asli
        const dbData = transformOrderToDB(updatedData);
        const { error } = await supabase
          .from('orders')
          .update(dbData)
          .eq('id', id)
          .eq('user_id', user.id);
        
        if (error) throw new Error(error.message);

        toast.success(`Pesanan #${oldOrder.nomorPesanan} berhasil diperbarui.`);

        // Status change notification seperti kode asli
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

      // Activity log seperti kode asli
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

  // Fetch orders dengan logika asli
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

      // Safe transformation dengan error handling seperti kode asli
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

  // Real-time subscription dengan logika asli
  const setupSubscription = useCallback(() => {
    if (!user || !isMountedRef.current) return;

    // Clean up existing subscription seperti kode asli
    if (subscriptionRef.current) {
      logger.context('OrderData', 'Cleaning up existing subscription');
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    logger.context('OrderData', 'Setting up new subscription for user:', user.id);

    try {
      const channel = supabase
        .channel(`orders_changes_${user.id}_${Date.now()}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          if (!isMountedRef.current) return;
          
          logger.context('OrderData', 'Real-time event:', payload.eventType, payload.new?.id || payload.old?.id);
          
          // Safe real-time state updates seperti kode asli
          setOrders((prevOrders) => {
            try {
              let newOrders = [...prevOrders];
              
              if (payload.eventType === 'DELETE' && payload.old?.id) {
                newOrders = newOrders.filter((item) => item.id !== payload.old.id);
              }
              
              if (payload.eventType === 'INSERT' && payload.new) {
                const newOrder = transformOrderFromDB(payload.new);
                newOrders = [newOrder, ...newOrders].sort((a, b) => 
                  new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
                );
              }
              
              if (payload.eventType === 'UPDATE' && payload.new) {
                const updatedOrder = transformOrderFromDB(payload.new);
                newOrders = newOrders.map((item) =>
                  item.id === updatedOrder.id ? updatedOrder : item
                );
              }
              
              return newOrders;
            } catch (error) {
              console.error('OrderData: Error processing real-time update:', error);
              return prevOrders;
            }
          });
        })
        .subscribe((status) => {
          if (!isMountedRef.current) return;
          
          logger.context('OrderData', 'Subscription status:', status);
          
          switch (status) {
            case 'SUBSCRIBED':
              setIsConnected(true);
              subscriptionRef.current = channel;
              fetchOrders();
              break;
              
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
            case 'CLOSED':
              logger.error('OrderData', 'Subscription error:', status);
              subscriptionRef.current = null;
              setIsConnected(false);
              break;
          }
        });
    } catch (error) {
      logger.error('OrderData', 'Error setting up subscription:', error);
      setIsConnected(false);
    }
  }, [user, fetchOrders]);

  // Bulk operations
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

  // Utility functions
  const getOrderById = useCallback((id: string): Order | undefined => {
    return orders.find(order => order.id === id);
  }, [orders]);

  const getOrdersByStatus = useCallback((status: string): Order[] => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  // Effects
  useEffect(() => {
    if (!user) {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      setOrders([]);
      setLoading(false);
      setIsConnected(false);
      return;
    }

    setupSubscription();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user?.id, setupSubscription]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshData = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

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
    bulkUpdateStatus,
    bulkDeleteOrders
  };
};