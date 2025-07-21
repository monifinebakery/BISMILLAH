import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, NewOrder } from '@/types/order';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils';
import { useFinancial } from './FinancialContext';
import { useUserSettings } from './UserSettingsContext';
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
  
  // Helper untuk mengubah data ke format database
  const transformToDB = (data: Partial<Order>) => {
      const dbData: { [key: string]: any } = {};
      if (data.namaPelanggan !== undefined) dbData.nama_pelanggan = data.namaPelanggan;
      if (data.status !== undefined) dbData.status = data.status;
      if (data.items !== undefined) dbData.items = data.items;
      if (data.totalPesanan !== undefined) dbData.total_pesanan = data.totalPesanan;
      if (data.tanggal !== undefined) dbData.tanggal = toSafeISOString(data.tanggal);
      // Tambahkan properti lain jika bisa diedit
      return dbData;
  };
  
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    const fetchInitialOrders = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('orders').select('*').eq('user_id', user.id).order('tanggal', { ascending: false });
      if (error) { toast.error(`Gagal memuat pesanan: ${error.message}`); } 
      else if (data) { setOrders(data.map(transformOrderFromDB)); }
      setIsLoading(false);
    };

    fetchInitialOrders();

    const channel = supabase.channel(`realtime-orders-${user.id}`)
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

  const addOrder = async (order: NewOrder): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk membuat pesanan');
      return false;
    }
    
    // Memanggil RPC Supabase yang hanya membuat order, tanpa potong stok
    const { data, error } = await supabase.rpc('create_new_order', { 
      order_data: {
        user_id: user.id,
        tanggal: toSafeISOString(order.tanggal),
        status: order.status || 'pending',
        nama_pelanggan: order.namaPelanggan,
        items: order.items,
        total_pesanan: order.totalPesanan,
        catatan: order.catatan
      }
    });

    if (error) {
      toast.error(`Gagal menambahkan pesanan: ${error.message}`);
      return false;
    }
    
    const createdOrder = Array.isArray(data) ? data[0] : data;
    if (createdOrder) {
        addActivity({ title: 'Pesanan Baru Dibuat', description: `Pesanan #${createdOrder.nomor_pesanan} dari ${createdOrder.nama_pelanggan} telah dibuat.` });
        toast.success(`Pesanan #${createdOrder.nomor_pesanan} baru berhasil ditambahkan!`);
    }
    return true;
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

    const deliveredStatus = orderStatusList.find(s => s.label === 'Selesai')?.key || 'delivered';

    // LOGIKA UTAMA: Cek apakah status diubah menjadi "Selesai"
    if (oldOrder.status !== deliveredStatus && updatedData.status === deliveredStatus) {
      
      // Panggil fungsi RPC yang akan mengubah status, potong stok, DAN catat pemasukan
      const { error: rpcError } = await supabase.rpc('complete_order_and_deduct_stock', { order_id: id });
      
      if (rpcError) {
        toast.error(`Gagal menyelesaikan pesanan & potong stok: ${rpcError.message}`);
        return false;
      }
      
      // Logika untuk mencatat pemasukan ke Laporan Keuangan
      const incomeCategory = settings?.financialCategories?.income?.[0] || 'Penjualan Produk';
      await addFinancialTransaction({
        type: 'income',
        category: incomeCategory,
        description: `Penjualan dari pesanan #${oldOrder.nomorPesanan}`,
        amount: oldOrder.totalPesanan,
        date: new Date(), // Tanggal saat transaksi dianggap lunas
        relatedId: oldOrder.id,
      });

      toast.success(`Pesanan #${oldOrder.nomorPesanan} selesai, stok dikurangi, & pemasukan dicatat!`);
      addActivity({
        title: 'Pesanan Selesai',
        description: `Pesanan #${oldOrder.nomorPesanan} lunas, stok diperbarui.`,
        type: 'order'
      });

      return true;

    } else {
      // Jika hanya update biasa (misal: ganti nama pelanggan, dll)
      const { error } = await supabase.from('orders').update(transformToDB(updatedData)).eq('id', id);

      if (error) {
        toast.error(`Gagal memperbarui pesanan: ${error.message}`);
        return false;
      }
      
      toast.success(`Pesanan #${oldOrder.nomorPesanan} berhasil diperbarui.`);
      return true;
    }
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
        addActivity({ title: 'Pesanan Dihapus', description: `Pesanan ${orderToDelete.nomorPesanan} telah dihapus`, type: 'order' });
        toast.success("Pesanan berhasil dihapus.");
    }
    return true;
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