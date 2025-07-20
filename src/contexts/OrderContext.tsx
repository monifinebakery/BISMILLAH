import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, NewOrder } from '@/types/order';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils';

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

  // Helper yang disesuaikan sepenuhnya dengan nama kolom Anda
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
  
    // --- FUNGSI UNTUK MENGAMBIL ULANG DATA (REFETCH) ---
    // Dipanggil saat mount dan setelah operasi CUD
    const fetchOrders = async () => {
        // Jika tidak ada user (misal, belum login atau logout), kosongkan orders
        if (!user) {
            console.log('[OrderContext] User tidak ditemukan, mengosongkan pesanan.');
            setOrders([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        console.log('[OrderContext] Memulai fetchOrders untuk user:', user.id);
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('tanggal', { ascending: false }); // Urutkan berdasarkan tanggal terbaru

        if (error) {
            console.error('[OrderContext] Error memuat pesanan:', error.message);
            toast.error(`Gagal memuat pesanan: ${error.message}`);
        } else if (data) {
            const transformedData = data.map(transformOrderFromDB);
            console.log('[OrderContext] Data pesanan berhasil dimuat (raw):', data);
            console.log('[OrderContext] Data pesanan berhasil dimuat (transformed):', transformedData);
            setOrders(transformedData);
            // Log state setelah set (akan muncul di re-render berikutnya)
            // console.log('[OrderContext] State orders setelah set (akan diperbarui di render berikutnya).');
        }
        setIsLoading(false);
        console.log('[OrderContext] fetchOrders selesai.');
    };

    // --- EFFECT UNTUK INISIALISASI & REFETCH SAAT USER BERUBAH ---
  useEffect(() => {
    console.log('[OrderContext] useEffect dipicu, user:', user?.id);
    fetchOrders(); // Panggil saat mount atau user berubah

    // Karena Realtime masih 'Coming Soon', bagian listener ini TIDAK AKTIF
    // dan dihapus dari kode untuk menghindari kebingungan/overhead yang tidak perlu.

    // Contoh jika Realtime diaktifkan di masa depan, Anda bisa mengaktifkan kembali ini:
    // const channel = supabase
    //   .channel(`realtime-orders-${user.id}`)
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
    //     (payload) => {
    //       console.log('[OrderContext] Perubahan realtime diterima via listener:', payload);
    //       const transform = transformOrderFromDB;
    //       if (payload.eventType === 'INSERT') {
    //           setOrders(current => [transform(payload.new), ...current].sort((a, b) => new Date(b.tanggal!).getTime() - new Date(a.tanggal!).getTime()));
    //       }
    //       if (payload.eventType === 'UPDATE') {
    //           setOrders(current => current.map(o => o.id === payload.new.id ? transform(payload.new) : o));
    //       }
    //       if (payload.eventType === 'DELETE') {
    //           setOrders(current => current.filter(o => o.id !== payload.old.id));
    //       }
    //     }
    //   ).subscribe();

    // return () => {
    //     // Jika channel aktif, hapus saat unmount
    //     if (channel) {
    //         console.log('[OrderContext] Menghapus channel realtime.');
    //         supabase.removeChannel(channel);
    //     }
    // };
  }, [user]); // Dependensi user memastikan data di-fetch ulang jika user login/logout

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
    
    console.log('[OrderContext] Mengirim data pesanan baru:', newOrderData);
    const { data, error } = await supabase.rpc('create_new_order', { order_data: newOrderData });

    if (error) {
      toast.error(`Gagal menambahkan pesanan: ${error.message}`);
      console.error('[OrderContext] Error menambah pesanan:', error);
      return false;
    }
    
    const createdOrder = Array.isArray(data) ? data[0] : data; 
    if (createdOrder) {
        addActivity({ title: 'Pesanan Baru', description: `Pesanan #${createdOrder.nomor_pesanan} dari ${createdOrder.nama_pelanggan}`, type: 'order', value: null });
        toast.success(`Pesanan #${createdOrder.nomor_pesanan} berhasil ditambahkan!`);
        console.log('[OrderContext] Pesanan berhasil ditambahkan di DB, memicu fetchOrders.');
    } else {
        toast.success("Pesanan berhasil ditambahkan (detail nomor pesanan tidak tersedia).");
        console.log('[OrderContext] Pesanan berhasil ditambahkan di DB, tetapi data kembali kosong/tidak lengkap, memicu fetchOrders.');
    }

    // *** PENTING: PANGGIL fetchOrders UNTUK MEMPERBARUI UI SECARA MANUAL ***
    await fetchOrders(); // Tunggu hingga data terbaru diambil
    return true;
  };

  const updateOrder = async (id: string, updatedData: Partial<Order>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk memperbarui pesanan');
      return false;
    }
    
    const orderToUpdate: {[key: string]: any} = {
      updated_at: new Date().toISOString(), // Pastikan kolom ini di DB Anda
    };

    // Pastikan semua properti yang akan diupdate dipetakan ke snake_case
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

    console.log('[OrderContext] Mengirim update pesanan:', id, orderToUpdate);
    const { error } = await supabase.from('orders').update(orderToUpdate).eq('id', id);
    if (error) {
      toast.error(`Gagal memperbarui pesanan: ${error.message}`);
      console.error('[OrderContext] Error memperbarui pesanan:', error);
      return false;
    }
    
    console.log('[OrderContext] Pesanan berhasil diperbarui di DB, memicu fetchOrders.');
    await fetchOrders(); // Tunggu hingga data terbaru diambil
    toast.success("Pesanan berhasil diperbarui!"); 
    return true;
  };
  
  const deleteOrder = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menghapus pesanan');
      return false;
    }

    const orderToDelete = orders.find(o => o.id === id);

    console.log('[OrderContext] Mengirim perintah hapus pesanan:', id);
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      toast.error(`Gagal menghapus pesanan: ${error.message}`);
      console.error('[OrderContext] Error menghapus pesanan:', error);
      return false;
    }

    if (orderToDelete) {
        addActivity({ title: 'Pesanan Dihapus', description: `Pesanan ${orderToDelete.nomorPesanan} telah dihapus`, type: 'order', value: null });
    }
    
    console.log('[OrderContext] Pesanan berhasil dihapus dari DB, memicu fetchOrders.');
    await fetchOrders(); // Tunggu hingga data terbaru diambil
    toast.success("Pesanan berhasil dihapus!");
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