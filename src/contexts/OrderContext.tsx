// src/contexts/OrderContext.tsx
// Implementasi Logika Otomatisasi Laporan Keuangan (Pemasukan Order)

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, NewOrder } from '@/types/order';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils';
import { useFinancial } from './FinancialContext'; // ✅ PERBAIKAN: IMPOR useFinancial
import { useUserSettings } from './UserSettingsContext'; 

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
  const { addFinancialTransaction } = useFinancial(); // ✅ PERBAIKAN: PANGGIL HOOK useFinancial
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
          if (payload.eventType === 'INSERT') setOrders(current => [transform(payload.new), ...current]);
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
        status: order.status || 'pending',
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

  // --- UPDATE FUNGSI: LOGIKA BARU UNTUK TRANSAKSI KEUANGAN (PEMASUKAN) ---
  const updateOrder = async (id: string, updatedData: Partial<Order>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk memperbarui pesanan');
      return false;
    }

    const oldOrder = orders.find(o => o.id === id); // Ambil data order lama untuk membandingkan status

    const orderToUpdate: {[key: string]: any} = {
      updated_at: new Date().toISOString(),
    };

    if (updatedData.namaPelanggan !== undefined) orderToUpdate.nama_pelanggan = updatedData.namaPelanggan;
    if (updatedData.teleponPelanggan !== undefined) orderToUpdate.telepon_pelanggan = updatedData.teleponPelanggan;
    if (updatedData.emailPelanggan !== undefined) orderToUpdate.email_pelanggan = updatedData.emailPelanggan;
    if (updatedData.alamatPengiriman !== undefined) orderToUpdate.alamat_pengiriman = updatedData.alamatPengiriman;
    if (updatedData.tanggal !== undefined) orderToUpdate.tanggal = toSafeISOString(updatedData.tanggal);
    if (updatedData.items !== undefined) orderToUpdate.items = updatedData.items;
    if (updatedData.totalPesanan !== undefined) orderToUpdate.total_pesanan = updatedData.totalPesanan;
    if (updatedData.status !== undefined) orderToUpdate.status = updatedData.status;
    if (updatedData.catatan !== undefined) orderToUpdate.catatan = updatedData.catatan;
    if (updatedData.subtotal !== undefined) orderToUpdate.subtotal = updatedData.subtotal;
    if (updatedData.pajak !== undefined) orderToUpdate.pajak = updatedData.pajak;

    const { error } = await supabase.from('orders').update(orderToUpdate).eq('id', id);
    if (error) {
      toast.error(`Gagal memperbarui pesanan: ${error.message}`);
      return false;
    }

    // ✅ LOGIKA BARU: Masuk ke laporan keuangan jika status order menjadi 'delivered' (atau 'completed')
    if (oldOrder && oldOrder.status !== 'delivered' && updatedData.status === 'delivered') { // Sesuaikan 'delivered' jika status selesai Anda adalah 'completed'
        // Gunakan kategori pemasukan dari settings, default 'Penjualan Produk'
        const incomeCategory = settings.financialCategories?.income?.[0] || 'Penjualan Produk';

        const successFinancial = await addFinancialTransaction({
            type: 'income',
            category: incomeCategory,
            description: `Penjualan produk kepada ${oldOrder.namaPelanggan} (Order #${oldOrder.nomorPesanan})`,
            amount: oldOrder.totalPesanan,
            date: oldOrder.tanggal, 
            relatedId: oldOrder.id, 
        });

        if (successFinancial) {
            toast.success('Pemasukan penjualan berhasil dicatat!');
            addActivity({ 
                title: 'Pemasukan Dicatat (Penjualan)', 
                description: `Pemasukan Rp ${oldOrder.totalPesanan.toLocaleString('id-ID')} dicatat dari penjualan kepada ${oldOrder.namaPelanggan}.`, 
                type: 'keuangan', 
                value: oldOrder.totalPesanan.toString() 
            });
        } else {
            console.error('Gagal mencatat pemasukan untuk penjualan.');
            toast.error('Gagal mencatat pemasukan untuk penjualan.');
        }
    }
    toast.success("Pesanan berhasil diperbarui.");
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