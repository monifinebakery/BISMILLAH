import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, NewOrder } from '@/types/order';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils';
import { useFinancial } from './FinancialContext';
import { useUserSettings } from './UserSettingsContext';
import { orderStatus } from '@/constants/orderConstants'; // Diasumsikan Anda sudah membuat file ini
import { formatCurrency } from '@/utils/currencyUtils';

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  addOrder: (order: Partial<NewOrder>) => Promise<boolean>;
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
  
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    const fetchInitialOrders = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('tanggal', { ascending: false });

      if (error) {
        toast.error(`Gagal memuat pesanan: ${error.message}`);
      } else if (data) {
        setOrders(data.map(transformOrderFromDB));
      }
      setIsLoading(false);
    };

    fetchInitialOrders();

    const channel = supabase
      .channel(`realtime-orders-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const transform = transformOrderFromDB;
          if (payload.eventType === 'INSERT') setOrders(current => [transform(payload.new), ...current].sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
          if (payload.eventType === 'UPDATE') setOrders(current => current.map(o => o.id === payload.new.id ? transform(payload.new) : o));
          if (payload.eventType === 'DELETE') setOrders(current => current.filter(o => o.id !== payload.old.id));
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const addOrder = async (order: Partial<NewOrder>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk membuat pesanan');
      return false;
    }
    
    const newOrderData = {
        user_id: user.id,
        tanggal: toSafeISOString(order.tanggal) || new Date().toISOString(),
        status: order.status || ORDER_STATUS.PENDING,
        nama_pelanggan: order.namaPelanggan,
        telepon_pelanggan: order.teleponPelanggan,
        email_pelanggan: order.emailPelanggan,
        alamat_pengiriman: order.alamatPengiriman,
        items: order.items,
        subtotal: order.subtotal,
        pajak: order.pajak,
        total_pesanan: order.totalPesanan,
        catatan: order.catatan,
    };
    
    const { data, error } = await supabase.rpc('create_new_order', { order_data: newOrderData });

    if (error) {
      toast.error(`Gagal menambahkan pesanan: ${error.message}`);
      return false;
    }
    
    const createdOrder = Array.isArray(data) ? data[0] : data;
    if (createdOrder) {
        addActivity({ title: 'Pesanan Baru', description: `Pesanan #${createdOrder.nomor_pesanan} dari ${createdOrder.nama_pelanggan}`, type: 'order', value: null });
        toast.success(`Pesanan #${createdOrder.nomor_pesanan} berhasil ditambahkan!`);
    }
    return true;
  };

  const updateOrder = async (id: string, updatedData: Partial<Order>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk memperbarui pesanan');
      return false;
    }

    const oldOrder = orders.find(o => o.id === id);
    if (!oldOrder) {
        toast.error('Pesanan tidak ditemukan untuk diperbarui.');
        return false;
    }
    
    const orderToUpdate: { [key: string]: any } = { updated_at: new Date().toISOString() };
    const keyMapping = {
        nomorPesanan: 'nomor_pesanan', namaPelanggan: 'nama_pelanggan', teleponPelanggan: 'telepon_pelanggan',
        emailPelanggan: 'email_pelanggan', alamatPengiriman: 'alamat_pengiriman', totalPesanan: 'total_pesanan'
    };
    
    Object.keys(updatedData).forEach(key => {
        const dbKey = keyMapping[key] || key;
        orderToUpdate[dbKey] = updatedData[key];
    });

    if (updatedData.tanggal) {
        orderToUpdate.tanggal = toSafeISOString(updatedData.tanggal);
    }
    
    const { error } = await supabase.from('orders').update(orderToUpdate).eq('id', id);

    if (error) {
      toast.error(`Gagal memperbarui pesanan: ${error.message}`);
      return false;
    }

    let wasIncomeRecorded = false;

    if (oldOrder.status !== ORDER_STATUS.DELIVERED && updatedData.status === ORDER_STATUS.DELIVERED) {
      const incomeCategory = settings.financialCategories?.income?.[0] || 'Penjualan Produk';

      const financialRecordSuccess = await addFinancialTransaction({
        type: 'income',
        category: incomeCategory,
        description: `Penjualan kepada ${oldOrder.namaPelanggan} (Order #${oldOrder.nomorPesanan})`,
        amount: oldOrder.totalPesanan,
        date: new Date(),
        relatedId: oldOrder.id,
      });

      if (financialRecordSuccess) {
        wasIncomeRecorded = true;
        addActivity({
          title: 'Pemasukan Dicatat',
          description: `Pemasukan ${formatCurrency(oldOrder.totalPesanan)} dari pesanan #${oldOrder.nomorPesanan}.`,
          type: 'keuangan',
          value: oldOrder.totalPesanan.toString()
        });
      } else {
        toast.error('Pesanan diperbarui, tapi gagal mencatat pemasukan ke laporan keuangan.');
        return true;
      }
    }
    
    if (wasIncomeRecorded) {
        toast.success(`Pesanan #${oldOrder.nomorPesanan} selesai & pemasukan dicatat.`);
    } else {
        toast.success(`Pesanan #${oldOrder.nomorPesanan} berhasil diperbarui.`);
    }

    return true;
  };
  
  const deleteOrder = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menghapus pesanan');
      return false;
    }

    const orderToDelete = orders.find(o => o.id === id);

    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      toast.error(`Gagal menghapus pesanan: ${error.message}`);
      return false;
    }

    if (orderToDelete) {
        addActivity({ title: 'Pesanan Dihapus', description: `Pesanan ${orderToDelete.nomorPesanan} telah dihapus`, type: 'order', value: null });
        toast.success("Pesanan berhasil dihapus.");
    }
    return true;
  };
  
  const value = {
    orders,
    isLoading,
    addOrder,
    updateOrder,
    deleteOrder,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};