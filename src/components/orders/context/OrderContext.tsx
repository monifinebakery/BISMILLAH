// src/contexts/OrderContext.tsx - FIXED VERSION
// Enhanced error handling & improved subscription management

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

// Import modular orders types and utils
import { Order, NewOrder, OrderContextType } from '../types/order';
import { 
  parseDate, 
  safeParseDate, 
  toSafeISOString, 
  isValidDate,
  formatDateForDisplay 
} from '@/utils/unifiedDateUtils';
import { formatCurrency } from '@/utils/formatUtils';
import { getStatusText } from '../constants/orderConstants';

// Dependencies
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useFinancial } from '@/components/financial/contexts/FinancialContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useNotification } from '@/contexts/NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';

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

// 🔧 FIXED: Enhanced utility functions with better error handling
const transformOrderFromDB = (dbItem: any): Order => {
  try {
    if (!dbItem || typeof dbItem !== 'object') {
      console.error('OrderContext: Invalid DB item for transformation:', dbItem);
      throw new Error('Invalid order data from database');
    }

    // 🔧 FIX: Safe date parsing with fallbacks
    const parsedTanggal = safeParseDate(dbItem.tanggal);
    const parsedCreatedAt = safeParseDate(dbItem.created_at);
    const parsedUpdatedAt = safeParseDate(dbItem.updated_at);

    return {
      id: dbItem.id,
      nomorPesanan: dbItem.nomor_pesanan || '',
      namaPelanggan: dbItem.nama_pelanggan || '',
      teleponPelanggan: dbItem.telepon_pelanggan || '',
      emailPelanggan: dbItem.email_pelanggan || '',
      alamatPengiriman: dbItem.alamat_pengiriman || '',
      tanggal: parsedTanggal || new Date(),
      items: Array.isArray(dbItem.items) ? dbItem.items : [],
      totalPesanan: Number(dbItem.total_pesanan) || 0,
      status: dbItem.status || 'pending',
      catatan: dbItem.catatan || '',
      subtotal: Number(dbItem.subtotal) || 0,
      pajak: Number(dbItem.pajak) || 0,
      userId: dbItem.user_id,
      createdAt: parsedCreatedAt || new Date(),
      updatedAt: parsedUpdatedAt || new Date(),
    };
  } catch (error) {
    console.error('OrderContext: Error transforming order from DB:', error, dbItem);
    // Return a safe fallback order
    return {
      id: dbItem?.id || 'error',
      nomorPesanan: 'ERROR',
      namaPelanggan: 'Data Error',
      teleponPelanggan: '',
      emailPelanggan: '',
      alamatPengiriman: '',
      tanggal: new Date(),
      items: [],
      totalPesanan: 0,
      status: 'pending',
      catatan: 'Error loading order data',
      subtotal: 0,
      pajak: 0,
      userId: dbItem?.user_id || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
};

const transformOrderToDB = (data: Partial<Order>): { [key: string]: any } => {
  try {
    const dbData: { [key: string]: any } = {};
    
    // 🔧 FIX: Safe property mapping with validation
    if (data.namaPelanggan !== undefined) dbData.nama_pelanggan = data.namaPelanggan;
    if (data.teleponPelanggan !== undefined) dbData.telepon_pelanggan = data.teleponPelanggan;
    if (data.emailPelanggan !== undefined) dbData.email_pelanggan = data.emailPelanggan;
    if (data.alamatPengiriman !== undefined) dbData.alamat_pengiriman = data.alamatPengiriman;
    if (data.status !== undefined) dbData.status = data.status;
    if (data.items !== undefined) dbData.items = data.items;
    if (data.totalPesanan !== undefined) dbData.total_pesanan = data.totalPesanan;
    if (data.catatan !== undefined) dbData.catatan = data.catatan;
    if (data.subtotal !== undefined) dbData.subtotal = data.subtotal;
    if (data.pajak !== undefined) dbData.pajak = data.pajak;
    
    // 🔧 FIX: Enhanced date handling
    if (data.tanggal !== undefined) {
      if (data.tanggal instanceof Date && isValidDate(data.tanggal)) {
        dbData.tanggal = toSafeISOString(data.tanggal);
      } else if (typeof data.tanggal === 'string') {
        const parsedDate = safeParseDate(data.tanggal);
        dbData.tanggal = parsedDate ? toSafeISOString(parsedDate) : toSafeISOString(new Date());
      } else {
        dbData.tanggal = toSafeISOString(new Date());
      }
    }
    
    return dbData;
  } catch (error) {
    console.error('OrderContext: Error transforming order to DB:', error, data);
    // Return safe minimal data
    return {
      nama_pelanggan: data.namaPelanggan || 'Error',
      status: data.status || 'pending',
      total_pesanan: data.totalPesanan || 0,
      tanggal: toSafeISOString(new Date())
    };
  }
};

// 🔧 FIXED: Enhanced order operations hook with comprehensive error handling
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

    // 🔧 FIX: Enhanced input validation
    if (!order || typeof order !== 'object') {
      console.error('OrderContext: Invalid order data for creation:', order);
      toast.error('Data pesanan tidak valid');
      return false;
    }

    if (!order.namaPelanggan || !order.totalPesanan) {
      toast.error('Nama pelanggan dan total pesanan harus diisi');
      return false;
    }

    try {
      logger.context('OrderContext', 'Adding new order:', order.namaPelanggan);

      // 🔧 FIX: Safe data preparation
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
        // Activity log
        if (addActivity && typeof addActivity === 'function') {
          addActivity({ 
            title: 'Pesanan Baru Dibuat', 
            description: `Pesanan #${createdOrder.nomor_pesanan} dari ${createdOrder.nama_pelanggan} telah dibuat.`,
            type: 'order'
          });
        }

        // Success toast
        toast.success(`Pesanan #${createdOrder.nomor_pesanan} baru berhasil ditambahkan!`);

        // Create success notification
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
      logger.error('OrderContext - Error adding order:', error);
      toast.error(`Gagal menambahkan pesanan: ${error.message || 'Unknown error'}`);

      if (addNotification && typeof addNotification === 'function') {
        await addNotification(createNotificationHelper.systemError(
          `Gagal menambahkan pesanan: ${error.message || 'Unknown error'}`
        ));
      }

      return false;
    }
  }, [user, addActivity, addNotification]);

  const updateOrder = useCallback(async (id: string, updatedData: Partial<Order>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login.');
      return false;
    }

    // 🔧 FIX: Enhanced validation
    if (!id || typeof id !== 'string') {
      console.error('OrderContext: Invalid order ID for update:', id);
      toast.error('ID pesanan tidak valid');
      return false;
    }

    if (!updatedData || typeof updatedData !== 'object') {
      console.error('OrderContext: Invalid update data:', updatedData);
      toast.error('Data update tidak valid');
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
          console.error('OrderContext: Error adding financial transaction:', financialError);
          // Don't fail the order completion for financial transaction errors
        }

        // Activity log
        if (addActivity && typeof addActivity === 'function') {
          addActivity({
            title: 'Pesanan Selesai',
            description: `Pesanan #${oldOrder.nomorPesanan} lunas, stok diperbarui.`,
            type: 'order',
          });
        }

        // Success toast
        toast.success(`Pesanan #${oldOrder.nomorPesanan} selesai, stok dikurangi, & pemasukan dicatat!`);

        // Create order completed notification
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
        // Regular update
        const dbData = transformOrderToDB(updatedData);
        const { error } = await supabase
          .from('orders')
          .update(dbData)
          .eq('id', id)
          .eq('user_id', user.id);
        
        if (error) throw new Error(error.message);

        toast.success(`Pesanan #${oldOrder.nomorPesanan} berhasil diperbarui.`);

        // Create status change notification (if status changed)
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
      logger.error('OrderContext - Error updating order:', error);
      toast.error(`Gagal memperbarui pesanan: ${error.message || 'Unknown error'}`);

      if (addNotification && typeof addNotification === 'function') {
        await addNotification(createNotificationHelper.systemError(
          `Gagal memperbarui pesanan #${oldOrder.nomorPesanan}: ${error.message || 'Unknown error'}`
        ));
      }

      return false;
    }
  }, [user, orders, addActivity, addFinancialTransaction, settings, addNotification]);

  const deleteOrder = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menghapus pesanan');
      return false;
    }

    // 🔧 FIX: Enhanced validation
    if (!id || typeof id !== 'string') {
      console.error('OrderContext: Invalid order ID for deletion:', id);
      toast.error('ID pesanan tidak valid');
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
      if (addActivity && typeof addActivity === 'function') {
        addActivity({ 
          title: 'Pesanan Dihapus', 
          description: `Pesanan #${orderToDelete.nomorPesanan} telah dihapus`, 
          type: 'order' 
        });
      }

      // Success toast
      toast.success('Pesanan berhasil dihapus.');

      // Create delete notification
      if (addNotification && typeof addNotification === 'function') {
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
      }

      return true;
    } catch (error: any) {
      logger.error('OrderContext - Error deleting order:', error);
      toast.error(`Gagal menghapus pesanan: ${error.message || 'Unknown error'}`);

      if (addNotification && typeof addNotification === 'function') {
        await addNotification(createNotificationHelper.systemError(
          `Gagal menghapus pesanan #${orderToDelete.nomorPesanan}: ${error.message || 'Unknown error'}`
        ));
      }

      return false;
    }
  }, [user, orders, addActivity, addNotification]);

  // 🔧 FIXED: Enhanced bulk operations
  const bulkUpdateStatus = useCallback(async (orderIds: string[], newStatus: string): Promise<boolean> => {
    if (!user || !Array.isArray(orderIds) || orderIds.length === 0) {
      toast.error('Tidak ada pesanan yang dipilih');
      return false;
    }

    if (!newStatus || typeof newStatus !== 'string') {
      toast.error('Status tidak valid');
      return false;
    }

    try {
      logger.context('OrderContext', 'Bulk updating status:', orderIds.length, 'orders to', newStatus);

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .in('id', orderIds)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);

      toast.success(`${orderIds.length} pesanan berhasil diubah statusnya ke ${getStatusText(newStatus)}`);

      if (addNotification && typeof addNotification === 'function') {
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
      }

      return true;
    } catch (error: any) {
      logger.error('OrderContext - Error bulk updating status:', error);
      toast.error(`Gagal mengubah status: ${error.message || 'Unknown error'}`);

      if (addNotification && typeof addNotification === 'function') {
        await addNotification(createNotificationHelper.systemError(
          `Gagal bulk update status: ${error.message || 'Unknown error'}`
        ));
      }

      return false;
    }
  }, [user, addNotification]);

  const bulkDeleteOrders = useCallback(async (orderIds: string[]): Promise<boolean> => {
    if (!user || !Array.isArray(orderIds) || orderIds.length === 0) {
      toast.error('Tidak ada pesanan yang dipilih');
      return false;
    }

    try {
      logger.context('OrderContext', 'Bulk deleting orders:', orderIds.length);

      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);

      toast.success(`${orderIds.length} pesanan berhasil dihapus`);

      if (addNotification && typeof addNotification === 'function') {
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
      }

      return true;
    } catch (error: any) {
      logger.error('OrderContext - Error bulk deleting orders:', error);
      toast.error(`Gagal menghapus pesanan: ${error.message || 'Unknown error'}`);

      if (addNotification && typeof addNotification === 'function') {
        await addNotification(createNotificationHelper.systemError(
          `Gagal bulk delete: ${error.message || 'Unknown error'}`
        ));
      }

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

// 🔧 FIXED: Connection state management
const useConnectionManager = () => {
  const [isConnected, setIsConnected] = useState(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const baseRetryDelay = 1000; // 1 second

  const resetConnection = useCallback(() => {
    setIsConnected(false);
    retryCountRef.current = 0;
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
  }, []);

  const handleConnectionError = useCallback((callback: () => void) => {
    setIsConnected(false);
    retryCountRef.current += 1;
    
    if (retryCountRef.current <= maxRetries) {
      const delay = baseRetryDelay * Math.pow(2, retryCountRef.current - 1); // Exponential backoff
      logger.context('OrderContext', `Retrying connection in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
      
      connectionTimeoutRef.current = setTimeout(() => {
        callback();
      }, delay);
    } else {
      logger.error('OrderContext', 'Max connection retries reached');
    }
  }, []);

  const cleanup = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
  }, []);

  return {
    isConnected,
    setIsConnected,
    resetConnection,
    handleConnectionError,
    cleanup
  };
};

// Provider Component
export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addFinancialTransaction } = useFinancial();
  const { settings } = useUserSettings();
  const { addNotification } = useNotification();

  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const connectionManager = useConnectionManager();

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
    connected: connectionManager.isConnected
  });

  // 🔧 FIXED: Enhanced data fetching with better error handling
  const fetchOrders = useCallback(async () => {
    if (!user || !isMountedRef.current) {
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

      if (!isMountedRef.current) return; // Prevent state update if unmounted

      // 🔧 FIX: Safe transformation with error handling
      const transformedData = data
        .map(item => {
          try {
            return transformOrderFromDB(item);
          } catch (transformError) {
            console.error('OrderContext: Error transforming individual order:', transformError, item);
            return null;
          }
        })
        .filter(Boolean) as Order[]; // Remove null items

      logger.context('OrderContext', 'Orders loaded:', transformedData.length, 'items');
      setOrders(transformedData);

    } catch (error: any) {
      if (!isMountedRef.current) return;
      
      logger.error('OrderContext - Error fetching orders:', error);
      toast.error(`Gagal memuat pesanan: ${error.message || 'Unknown error'}`);

      if (addNotification && typeof addNotification === 'function') {
        await addNotification(createNotificationHelper.systemError(
          `Gagal memuat pesanan: ${error.message || 'Unknown error'}`
        ));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, addNotification]);

  const refreshData = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  // 🔧 FIXED: Robust subscription management
  const setupSubscription = useCallback(() => {
    if (!user || !isMountedRef.current) return;

    // Clean up existing subscription
    if (subscriptionRef.current) {
      logger.context('OrderContext', 'Cleaning up existing subscription');
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    logger.context('OrderContext', 'Setting up new subscription for user:', user.id);

    try {
      const channel = supabase
        .channel(`orders_changes_${user.id}_${Date.now()}`) // Add timestamp to make unique
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          if (!isMountedRef.current) return;
          
          logger.context('OrderContext', 'Real-time event:', payload.eventType, payload.new?.id || payload.old?.id);
          
          // 🔧 FIXED: Safe real-time state updates
          setOrders((prevOrders) => {
            try {
              let newOrders = [...prevOrders];
              
              if (payload.eventType === 'DELETE' && payload.old?.id) {
                newOrders = newOrders.filter((item) => item.id !== payload.old.id);
                logger.context('OrderContext', 'Order deleted via real-time:', payload.old.id);
              }
              
              if (payload.eventType === 'INSERT' && payload.new) {
                const newOrder = transformOrderFromDB(payload.new);
                newOrders = [newOrder, ...newOrders].sort((a, b) => 
                  new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
                );
                logger.context('OrderContext', 'Order added via real-time:', newOrder.id);
              }
              
              if (payload.eventType === 'UPDATE' && payload.new) {
                const updatedOrder = transformOrderFromDB(payload.new);
                newOrders = newOrders.map((item) =>
                  item.id === updatedOrder.id ? updatedOrder : item
                );
                logger.context('OrderContext', 'Order updated via real-time:', updatedOrder.id);
              }
              
              return newOrders;
            } catch (error) {
              console.error('OrderContext: Error processing real-time update:', error);
              return prevOrders; // Return previous state on error
            }
          });
        })
        .subscribe((status) => {
          if (!isMountedRef.current) return;
          
          logger.context('OrderContext', 'Subscription status:', status);
          
          switch (status) {
            case 'SUBSCRIBED':
              connectionManager.setIsConnected(true);
              subscriptionRef.current = channel;
              // Initial data load after subscription is ready
              fetchOrders();
              break;
              
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
            case 'CLOSED':
              logger.error('OrderContext', 'Subscription error:', status);
              subscriptionRef.current = null;
              connectionManager.handleConnectionError(setupSubscription);
              break;
              
            default:
              break;
          }
        });
    } catch (error) {
      logger.error('OrderContext', 'Error setting up subscription:', error);
      connectionManager.handleConnectionError(setupSubscription);
    }
  }, [user, fetchOrders, connectionManager]);

  // 🔧 FIXED: Subscription setup effect
  useEffect(() => {
    if (!user) {
      // Clean up if no user
      if (subscriptionRef.current) {
        logger.context('OrderContext', 'Cleaning up subscription - no user');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      setOrders([]);
      setLoading(false);
      connectionManager.resetConnection();
      return;
    }

    // Setup subscription
    setupSubscription();

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        logger.context('OrderContext', 'Cleaning up subscription');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      connectionManager.cleanup();
    };
  }, [user?.id, setupSubscription, connectionManager]);

  // 🔧 FIXED: Component cleanup tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      connectionManager.cleanup();
    };
  }, [connectionManager]);

  // 🔧 FIXED: Enhanced utility methods with error handling
  const getOrderById = useCallback((id: string): Order | undefined => {
    try {
      if (!id || typeof id !== 'string') {
        console.error('OrderContext: Invalid ID for getOrderById:', id);
        return undefined;
      }
      return orders.find(order => order.id === id);
    } catch (error) {
      console.error('OrderContext: Error in getOrderById:', error);
      return undefined;
    }
  }, [orders]);

  const getOrdersByStatus = useCallback((status: string): Order[] => {
    try {
      if (!status || typeof status !== 'string') {
        console.error('OrderContext: Invalid status for getOrdersByStatus:', status);
        return [];
      }
      return orders.filter(order => order.status === status);
    } catch (error) {
      console.error('OrderContext: Error in getOrdersByStatus:', error);
      return [];
    }
  }, [orders]);

  const getOrdersByDateRange = useCallback((startDate: Date, endDate: Date): Order[] => {
    try {
      if (!isValidDate(startDate) || !isValidDate(endDate)) {
        console.error('OrderContext: Invalid dates for getOrdersByDateRange:', { startDate, endDate });
        return [];
      }
      
      return orders.filter(order => {
        try {
          const orderDate = safeParseDate(order.tanggal);
          if (!orderDate) return false;
          return orderDate >= startDate && orderDate <= endDate;
        } catch (error) {
          console.error('OrderContext: Error processing order date:', error, order);
          return false;
        }
      });
    } catch (error) {
      console.error('OrderContext: Error in getOrdersByDateRange:', error);
      return [];
    }
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
    isConnected: connectionManager.isConnected,
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
    connected: connectionManager.isConnected
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