// src/contexts/OrderContext.tsx
// MODULAR VERSION - Integrated with Orders Components

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

// Import modular orders types and utils
import { Order, NewOrder, OrderContextType } from '@/components/orders/types';
import { 
  formatCurrency,
  formatDateForDisplay,
  parseDate,
  isValidDate
} from '@/components/orders/utils';
import { getStatusText } from '@/components/orders/constants/orderConstants';

// Dependencies
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { useFinancial } from './FinancialContext';
import { useUserSettings } from './UserSettingsContext';
import { useNotification } from './NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils';

// Enhanced context interface extending the modular one
interface EnhancedOrderContextType extends OrderContextType {
  // Real-time subscription status
  isConnected: boolean;
  // Additional context-specific methods
  refreshData: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: string) => Order[];
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  // Bulk operations
  bulkUpdateStatus: (orderIds: string[], newStatus: string) => Promise<boolean>;
  bulkDeleteOrders: (orderIds: string[]) => Promise<boolean>;
}

const OrderContext = createContext<EnhancedOrderContextType | undefined>(undefined);

// Utility functions
const transformOrderFromDB = (dbItem: any): Order => ({
  id: dbItem.id,
  nomorPesanan: dbItem.nomor_pesanan,
  namaPelanggan: dbItem.nama_pelanggan,
  teleponPelanggan: dbItem.telepon_pelanggan,
  emailPelanggan: dbItem.email_pelanggan,
  alamatPengiriman: dbItem.alamat_pengiriman,
  tanggal: parseDate(dbItem.tanggal) || new Date(),
  items: dbItem.items || [],
  totalPesanan: Number(dbItem.total_pesanan) || 0,
  status: dbItem.status,
  catatan: dbItem.catatan,
  subtotal: Number(dbItem.subtotal) || 0,
  pajak: Number(dbItem.pajak) || 0,
  userId: dbItem.user_id,
  createdAt: parseDate(dbItem.created_at) || new Date(),
  updatedAt: parseDate(dbItem.updated_at) || new Date(),
});

const transformOrderToDB = (data: Partial<Order>): { [key: string]: any } => {
  const dbData: { [key: string]: any } = {};
  
  if (data.namaPelanggan !== undefined) dbData.nama_pelanggan = data.namaPelanggan;
  if (data.teleponPelanggan !== undefined) dbData.telepon_pelanggan = data.teleponPelanggan;
  if (data.emailPelanggan !== undefined) dbData.email_pelanggan = data.emailPelanggan;
  if (data.alamatPengiriman !== undefined) dbData.alamat_pengiriman = data.alamatPengiriman;
  if (data.status !== undefined) dbData.status = data.status;
  if (data.items !== undefined) dbData.items = data.items;
  if (data.totalPesanan !== undefined) dbData.total_pesanan = data.totalPesanan;
  if (data.catatan !== undefined) dbData.catatan = data.catatan;
  if (data.tanggal !== undefined) {
    dbData.tanggal = data.tanggal instanceof Date 
      ? toSafeISOString(data.tanggal)
      : data.tanggal;
  }
  if (data.subtotal !== undefined) dbData.subtotal = data.subtotal;
  if (data.pajak !== undefined) dbData.pajak = data.pajak;
  
  return dbData;
};

// Custom hook for order operations
const useOrderOperations = (
  user: any,
  orders: Order[],
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>,
  addActivity: any,
  addFinancialTransaction: any,
  settings: any,
  addNotification: any
) => {
  const addOrder = useCallback(async (order: NewOrder): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk membuat pesanan');
      return false;
    }

    try {
      logger.context('OrderContext', 'Adding new order:', order.namaPelanggan);

      const { data, error } = await supabase.rpc('create_new_order', {
        order_data: {
          user_id: user.id,
          tanggal: toSafeISOString(order.tanggal),
          status: order.status || 'pending',
          nama_pelanggan: order.namaPelanggan,
          telepon_pelanggan: order.teleponPelanggan,
          email_pelanggan: order.emailPelanggan,
          alamat_pengiriman: order.alamatPengiriman,
          items: order.items,
          total_pesanan: order.totalPesanan,
          catatan: order.catatan,
          subtotal: order.subtotal,
          pajak: order.pajak,
        },
      });

      if (error) throw new Error(error.message);

      const createdOrder = Array.isArray(data) ? data[0] : data;
      if (createdOrder) {
        // Activity log
        addActivity({ 
          title: 'Pesanan Baru Dibuat', 
          description: `Pesanan #${createdOrder.nomor_pesanan} dari ${createdOrder.nama_pelanggan} telah dibuat.`,
          type: 'order'
        });

        // Success toast
        toast.success(`Pesanan #${createdOrder.nomor_pesanan} baru berhasil ditambahkan!`);

        // Create success notification
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

      return true;
    } catch (error: any) {
      logger.error('OrderContext - Error adding order:', error);
      toast.error(`Gagal menambahkan pesanan: ${error.message}`);

      await addNotification(createNotificationHelper.systemError(
        `Gagal menambahkan pesanan: ${error.message}`
      ));

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
      logger.context('OrderContext', 'Updating order:', id, updatedData);

      const oldStatus = oldOrder.status;
      const newStatus = updatedData.status;
      const isCompletingOrder = oldStatus !== 'completed' && newStatus === 'completed';

      if (isCompletingOrder) {
        // Complete order with stock deduction
        const { error: rpcError } = await supabase.rpc('complete_order_and_deduct_stock', { 
          order_id: id 
        });
        if (rpcError) throw new Error(rpcError.message);

        // Add financial transaction
        const incomeCategory = settings?.financialCategories?.income?.[0] || 'Penjualan Produk';
        await addFinancialTransaction({
          type: 'income',
          category: incomeCategory,
          description: `Penjualan dari pesanan #${oldOrder.nomorPesanan}`,
          amount: oldOrder.totalPesanan,
          date: new Date(),
          relatedId: oldOrder.id,
        });

        // Activity log
        addActivity({
          title: 'Pesanan Selesai',
          description: `Pesanan #${oldOrder.nomorPesanan} lunas, stok diperbarui.`,
          type: 'order',
        });

        // Success toast
        toast.success(`Pesanan #${oldOrder.nomorPesanan} selesai, stok dikurangi, & pemasukan dicatat!`);

        // Create order completed notification
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

      } else {
        // Regular update
        const { error } = await supabase
          .from('orders')
          .update(transformOrderToDB(updatedData))
          .eq('id', id)
          .eq('user_id', user.id);
        
        if (error) throw new Error(error.message);

        toast.success(`Pesanan #${oldOrder.nomorPesanan} berhasil diperbarui.`);

        // Create status change notification (if status changed)
        if (newStatus && oldStatus !== newStatus) {
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
      logger.error('OrderContext - Error updating order:', error);
      toast.error(`Gagal memperbarui pesanan: ${error.message}`);

      await addNotification(createNotificationHelper.systemError(
        `Gagal memperbarui pesanan #${oldOrder.nomorPesanan}: ${error.message}`
      ));

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
      logger.context('OrderContext', 'Deleting order:', id);

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw new Error(error.message);

      // Activity log
      addActivity({ 
        title: 'Pesanan Dihapus', 
        description: `Pesanan #${orderToDelete.nomorPesanan} telah dihapus`, 
        type: 'order' 
      });

      // Success toast
      toast.success('Pesanan berhasil dihapus.');

      // Create delete notification
      await addNotification({
        title: '🗑️ Pesanan Dihapus',
        message: `Pesanan #${orderToDelete.nomorPesanan} dari ${orderToDelete.namaPelanggan} telah dihapus dari sistem`,
        type: 'warning',
        icon: 'trash-2',
        priority: 2,
        related_type: 'order',
        action_url: '/orders',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error: any) {
      logger.error('OrderContext - Error deleting order:', error);
      toast.error(`Gagal menghapus pesanan: ${error.message}`);

      await addNotification(createNotificationHelper.systemError(
        `Gagal menghapus pesanan #${orderToDelete.nomorPesanan}: ${error.message}`
      ));

      return false;
    }
  }, [user, orders, addActivity, addNotification]);

  // Bulk operations
  const bulkUpdateStatus = useCallback(async (orderIds: string[], newStatus: string): Promise<boolean> => {
    if (!user || orderIds.length === 0) return false;

    try {
      logger.context('OrderContext', 'Bulk updating status:', orderIds.length, 'orders to', newStatus);

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .in('id', orderIds)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);

      toast.success(`${orderIds.length} pesanan berhasil diubah statusnya ke ${getStatusText(newStatus)}`);

      await addNotification({
        title: '📝 Bulk Update Status',
        message: `${orderIds.length} pesanan berhasil diubah statusnya ke ${getStatusText(newStatus)}`,
        type: 'success',
        icon: 'refresh-cw',
        priority: 2,
        related_type: 'order',
        action_url: '/orders',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error: any) {
      logger.error('OrderContext - Error bulk updating status:', error);
      toast.error(`Gagal mengubah status: ${error.message}`);

      await addNotification(createNotificationHelper.systemError(
        `Gagal bulk update status: ${error.message}`
      ));

      return false;
    }
  }, [user, addNotification]);

  const bulkDeleteOrders = useCallback(async (orderIds: string[]): Promise<boolean> => {
    if (!user || orderIds.length === 0) return false;

    try {
      logger.context('OrderContext', 'Bulk deleting orders:', orderIds.length);

      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);

      toast.success(`${orderIds.length} pesanan berhasil dihapus`);

      await addNotification({
        title: '🗑️ Bulk Delete Orders',
        message: `${orderIds.length} pesanan berhasil dihapus dari sistem`,
        type: 'warning',
        icon: 'trash-2',
        priority: 2,
        related_type: 'order',
        action_url: '/orders',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error: any) {
      logger.error('OrderContext - Error bulk deleting orders:', error);
      toast.error(`Gagal menghapus pesanan: ${error.message}`);

      await addNotification(createNotificationHelper.systemError(
        `Gagal bulk delete: ${error.message}`
      ));

      return false;
    }
  }, [user, addNotification]);

  return {
    addOrder,
    updateOrder,
    deleteOrder,
    bulkUpdateStatus,
    bulkDeleteOrders
  };
};

// Provider Component
export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addFinancialTransaction } = useFinancial();
  const { settings } = useUserSettings();
  const { addNotification } = useNotification();

  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Custom hook for operations
  const operations = useOrderOperations(
    user,
    orders,
    setOrders,
    addActivity,
    addFinancialTransaction,
    settings,
    addNotification
  );

  logger.context('OrderContext', 'Provider render', { 
    user: user?.id,
    orderCount: orders.length,
    loading,
    connected: isConnected
  });

  // Data fetching
  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    logger.context('OrderContext', 'Fetching orders...');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('tanggal', { ascending: false });

      if (error) throw new Error(error.message);

      const transformedData = data.map(transformOrderFromDB);
      logger.context('OrderContext', 'Orders loaded:', transformedData.length, 'items');
      setOrders(transformedData);

    } catch (error: any) {
      logger.error('OrderContext - Error fetching orders:', error);
      toast.error(`Gagal memuat pesanan: ${error.message}`);

      await addNotification(createNotificationHelper.systemError(
        `Gagal memuat pesanan: ${error.message}`
      ));
    } finally {
      setLoading(false);
    }
  }, [user, addNotification]);

  const refreshData = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  // Setup subscription
  useEffect(() => {
    if (!user || subscriptionRef.current) return;

    logger.context('OrderContext', 'Setting up subscription for user:', user.id);

    const channel = supabase
      .channel(`orders_changes_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        logger.context('OrderContext', 'Real-time event:', payload.eventType, payload.new?.id || payload.old?.id);
        
        setOrders((prev) => {
          if (payload.eventType === 'DELETE') {
            return prev.filter((item) => item.id !== payload.old.id);
          }
          if (payload.eventType === 'INSERT') {
            const newOrder = transformOrderFromDB(payload.new);
            return [newOrder, ...prev].sort((a, b) => 
              new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
            );
          }
          if (payload.eventType === 'UPDATE') {
            const updatedOrder = transformOrderFromDB(payload.new);
            return prev.map((item) =>
              item.id === updatedOrder.id ? updatedOrder : item
            );
          }
          return prev;
        });
      })
      .subscribe((status) => {
        logger.context('OrderContext', 'Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          subscriptionRef.current = channel;
        }
      });

    return () => {
      if (subscriptionRef.current) {
        logger.context('OrderContext', 'Cleaning up subscription');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user]);

  // Initial data load
  useEffect(() => {
    logger.context('OrderContext', 'Initial data load for user:', user?.id);
    fetchOrders();
  }, [user]);

  // Utility methods
  const getOrderById = useCallback((id: string): Order | undefined => {
    return orders.find(order => order.id === id);
  }, [orders]);

  const getOrdersByStatus = useCallback((status: string): Order[] => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  const getOrdersByDateRange = useCallback((startDate: Date, endDate: Date): Order[] => {
    return orders.filter(order => {
      const orderDate = parseDate(order.tanggal);
      if (!orderDate) return false;
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders]);

  // Context value
  const value: EnhancedOrderContextType = {
    // Core context interface
    orders,
    loading,
    addOrder: operations.addOrder,
    updateOrder: operations.updateOrder,
    deleteOrder: operations.deleteOrder,
    
    // Enhanced features
    isConnected,
    refreshData,
    getOrderById,
    getOrdersByStatus,
    getOrdersByDateRange,
    bulkUpdateStatus: operations.bulkUpdateStatus,
    bulkDeleteOrders: operations.bulkDeleteOrders,
  };

  logger.context('OrderContext', 'Providing context value:', {
    orderCount: orders.length,
    loading,
    connected: isConnected
  });

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};