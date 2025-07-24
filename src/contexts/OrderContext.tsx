import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, NewOrder } from '@/types/order';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils';
import { useFinancial } from './FinancialContext';
import { useUserSettings } from './UserSettingsContext';
import { logger } from '@/utils/logger';
// 🔔 FIXED NOTIFICATION IMPORTS
import { useNotification } from '@/contexts/NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';
import { orderStatusList } from '@/constants/orderConstants';
import { formatCurrency } from '@/utils/currencyUtils';

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  addOrder: (order: NewOrder) => Promise<boolean>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addFinancialTransaction } = useFinancial();
  const { settings } = useUserSettings();
  
  // 🔔 ADD NOTIFICATION HOOK
  const { addNotification } = useNotification();

  const transformOrderFromDB = (dbItem: any): Order => ({
    id: dbItem.id,
    nomorPesanan: dbItem.nomor_pesanan,
    namaPelanggan: dbItem.nama_pelanggan,
    teleponPelanggan: dbItem.telepon_pelanggan,
    emailPelanggan: dbItem.email_pelanggan,
    alamatPengiriman: dbItem.alamat_pengiriman,
    tanggal: safeParseDate(dbItem.tanggal),
    items: dbItem.items || [],
    totalPesanan: Number(dbItem.total_pesanan) || 0,
    status: dbItem.status,
    catatan: dbItem.catatan,
    subtotal: Number(dbItem.subtotal) || 0,
    pajak: Number(dbItem.pajak) || 0,
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    updatedAt: safeParseDate(dbItem.updated_at),
  });

  const transformToDB = (data: Partial<Order>) => {
    const dbData: { [key: string]: any } = {};
    if (data.namaPelanggan !== undefined) dbData.nama_pelanggan = data.namaPelanggan;
    if (data.teleponPelanggan !== undefined) dbData.telepon_pelanggan = data.teleponPelanggan;
    if (data.emailPelanggan !== undefined) dbData.email_pelanggan = data.emailPelanggan;
    if (data.alamatPengiriman !== undefined) dbData.alamat_pengiriman = data.alamatPengiriman;
    if (data.status !== undefined) dbData.status = data.status;
    if (data.items !== undefined) dbData.items = data.items;
    if (data.totalPesanan !== undefined) dbData.total_pesanan = data.totalPesanan;
    if (data.catatan !== undefined) dbData.catatan = data.catatan;
    if (data.tanggal !== undefined) dbData.tanggal = toSafeISOString(data.tanggal);
    if (data.subtotal !== undefined) dbData.subtotal = data.subtotal;
    if (data.pajak !== undefined) dbData.pajak = data.pajak;
    return dbData;
  };

  // 🔔 HELPER FUNCTION FOR STATUS TEXT
  const getStatusDisplayText = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Menunggu Konfirmasi',
      'confirmed': 'Dikonfirmasi',
      'processing': 'Diproses',
      'shipped': 'Dikirim',
      'delivered': 'Selesai',
      'cancelled': 'Dibatalkan'
    };
    return statusMap[status] || status;
  };

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    const fetchInitialOrders = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('tanggal', { ascending: false });
        if (error) throw new Error(error.message);
        if (data) setOrders(data.map(transformOrderFromDB));
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error(`Gagal memuat pesanan: ${error.message}`);
        
        // 🔔 NOTIFY SYSTEM ERROR
        await addNotification(createNotificationHelper.systemError(
          `Gagal memuat pesanan: ${error.message}`
        ));
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialOrders();

    const channel = supabase.channel(`realtime-orders-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders', 
        filter: `user_id=eq.${user.id}` 
      }, (payload) => {
        const transform = transformOrderFromDB;
        try {
          if (payload.eventType === 'INSERT') {
            setOrders(current => [transform(payload.new), ...current].sort((a, b) => 
              new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
            ));
          }
          if (payload.eventType === 'UPDATE') {
            setOrders(current => current.map(o => o.id === payload.new.id ? transform(payload.new) : o));
          }
          if (payload.eventType === 'DELETE') {
            setOrders(current => current.filter(o => o.id !== payload.old.id));
          }
        } catch (error) {
          console.error('Real-time update error:', error);
          toast.error(`Error handling real-time update: ${error.message}`);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, addNotification]);

  const addOrder = async (order: NewOrder): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk membuat pesanan');
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('create_new_order', {
        order_data: {
          user_id: user.id,
          tanggal: toSafeISOString(order.tanggal),
          status: order.status || 'pending',
          nama_pelanggan: order.namaPelanggan,
          telepon_pelanggan: order.teleponPelanggan,
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
          description: `Pesanan #${createdOrder.nomor_pesanan} dari ${createdOrder.nama_pelanggan} telah dibuat.` 
        });

        // Success toast
        toast.success(`Pesanan #${createdOrder.nomor_pesanan} baru berhasil ditambahkan!`);

        // 🔔 CREATE SUCCESS NOTIFICATION
        await addNotification({
          title: '🛍️ Pesanan Baru Dibuat!',
          message: `Pesanan #${createdOrder.nomor_pesanan} dari ${createdOrder.nama_pelanggan} berhasil dibuat dengan total ${formatCurrency(createdOrder.total_pesanan)}`,
          type: 'success',
          icon: 'shopping-cart',
          priority: 2,
          related_type: 'order',
          related_id: createdOrder.id,
          action_url: `/orders`,
          is_read: false,
          is_archived: false
        });
      }

      return true;
    } catch (error) {
      console.error('Error adding order:', error);
      toast.error(`Gagal menambahkan pesanan: ${error.message}`);

      // 🔔 CREATE ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Gagal menambahkan pesanan: ${error.message}`
      ));

      return false;
    }
  };

  const updateOrder = async (id: string, updatedData: Partial<Order>): Promise<boolean> => {
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
      const deliveredStatus = orderStatusList.find(s => s.label === 'Selesai')?.key || 'delivered';
      const oldStatus = oldOrder.status;
      const newStatus = updatedData.status;

      // Check if completing order (status change to delivered)
      if (oldStatus !== deliveredStatus && newStatus === deliveredStatus) {
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

        // 🔔 CREATE ORDER COMPLETED NOTIFICATION
        await addNotification({
          title: '🎉 Pesanan Selesai!',
          message: `Pesanan #${oldOrder.nomorPesanan} telah selesai. Revenue ${formatCurrency(oldOrder.totalPesanan)} tercatat dan stok diperbarui.`,
          type: 'success',
          icon: 'check-circle',
          priority: 2,
          related_type: 'order',
          related_id: id,
          action_url: `/orders`,
          is_read: false,
          is_archived: false
        });

      } else {
        // Regular update
        const { error } = await supabase
          .from('orders')
          .update(transformToDB(updatedData))
          .eq('id', id);
        
        if (error) throw new Error(error.message);

        toast.success(`Pesanan #${oldOrder.nomorPesanan} berhasil diperbarui.`);

        // 🔔 CREATE STATUS CHANGE NOTIFICATION (if status changed)
        if (newStatus && oldStatus !== newStatus) {
          await addNotification({
            title: '📝 Status Pesanan Diubah',
            message: `Pesanan #${oldOrder.nomorPesanan} dari "${getStatusDisplayText(oldStatus)}" menjadi "${getStatusDisplayText(newStatus)}"`,
            type: 'info',
            icon: 'refresh-cw',
            priority: 2,
            related_type: 'order',
            related_id: id,
            action_url: `/orders`,
            is_read: false,
            is_archived: false
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(`Gagal memperbarui pesanan: ${error.message}`);

      // 🔔 CREATE ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Gagal memperbarui pesanan #${oldOrder.nomorPesanan}: ${error.message}`
      ));

      return false;
    }
  };

  const deleteOrder = async (id: string): Promise<boolean> => {
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
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);

      // Activity log
      addActivity({ 
        title: 'Pesanan Dihapus', 
        description: `Pesanan #${orderToDelete.nomorPesanan} telah dihapus`, 
        type: 'order' 
      });

      // Success toast
      toast.success("Pesanan berhasil dihapus.");

      // Update local state
      setOrders(prev => prev.filter(o => o.id !== id));

      // 🔔 CREATE DELETE NOTIFICATION
      await addNotification({
        title: '🗑️ Pesanan Dihapus',
        message: `Pesanan #${orderToDelete.nomorPesanan} dari ${orderToDelete.namaPelanggan} telah dihapus dari sistem`,
        type: 'warning',
        icon: 'trash-2',
        priority: 2,
        related_type: 'order',
        action_url: `/orders`,
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(`Gagal menghapus pesanan: ${error.message}`);

      // 🔔 CREATE ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Gagal menghapus pesanan #${orderToDelete.nomorPesanan}: ${error.message}`
      ));

      return false;
    }
  };

  const value = { orders, isLoading, addOrder, updateOrder, deleteOrder };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};