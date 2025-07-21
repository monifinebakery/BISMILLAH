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

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  addOrder: (order: NewOrder) => Promise<boolean>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addFinancialTransaction } = useFinancial();
  const { settings } = useUserSettings();

  // Helper untuk transform data dari database ke format Order
  const transformOrderFromDB = (dbItem: any): Order => ({
    id: dbItem.id,
    nomorPesanan: dbItem.nomor_pesanan,
    namaPelanggan: dbItem.nama_pelanggan,
    teleponPelanggan: dbItem.telepon_pelanggan || '',
    emailPelanggan: dbItem.email_pelanggan || '',
    alamatPengiriman: dbItem.alamat_pengiriman || '',
    tanggal: safeParseDate(dbItem.tanggal),
    items: dbItem.items || [],
    totalPesanan: Number(dbItem.total_pesanan) || 0,
    status: dbItem.status,
    catatan: dbItem.catatan || '',
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
    if (data.telefonPelanggan !== undefined) dbData.telepon_pelanggan = data.telefonPelanggan;
    if (data.emailPelanggan !== undefined) dbData.email_pelanggan = data.emailPelanggan;
    if (data.alamatPengiriman !== undefined) dbData.alamat_pengiriman = data.alamatPengiriman;
    if (data.status !== undefined) dbData.status = data.status;
    if (data.items !== undefined) dbData.items = data.items;
    if (data.totalPesanan !== undefined) dbData.total_pesanan = data.totalPesanan;
    if (data.subtotal !== undefined) dbData.subtotal = data.subtotal;
    if (data.pajak !== undefined) dbData.pajak = data.pajak;
    if (data.catatan !== undefined) dbData.catatan = data.catatan;
    if (data.tanggal !== undefined) dbData.tanggal = toSafeISOString(data.tanggal);
    return dbData;
  };

  // Fungsi untuk refresh data orders
  const refreshOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('tanggal', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error(`Gagal memuat pesanan: ${error.message}`);
        return;
      }

      if (data) {
        setOrders(data.map(transformOrderFromDB));
      }
    } catch (err) {
      console.error('Error in refreshOrders:', err);
      toast.error('Terjadi kesalahan saat memuat pesanan');
    }
  };

  // Setup realtime subscription dan initial data fetch
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const fetchInitialOrders = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('tanggal', { ascending: false });

        if (!mounted) return;

        if (error) {
          console.error('Error fetching initial orders:', error);
          toast.error(`Gagal memuat pesanan: ${error.message}`);
        } else if (data) {
          setOrders(data.map(transformOrderFromDB));
        }
      } catch (err) {
        console.error('Error in fetchInitialOrders:', err);
        if (mounted) {
          toast.error('Terjadi kesalahan saat memuat pesanan');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchInitialOrders();

    // Setup realtime subscription
    const channel = supabase
      .channel(`realtime-orders-${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders', 
          filter: `user_id=eq.${user.id}` 
        },
        (payload) => {
          if (!mounted) return;

          console.log('Realtime update received:', payload.eventType, payload);

          try {
            if (payload.eventType === 'INSERT' && payload.new) {
              const newOrder = transformOrderFromDB(payload.new);
              setOrders(current => {
                // Cek apakah order sudah ada untuk mencegah duplicate
                const exists = current.find(o => o.id === newOrder.id);
                if (exists) return current;
                
                const updated = [newOrder, ...current];
                return updated.sort((a, b) => 
                  new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
                );
              });
              toast.success(`Pesanan baru: #${payload.new.nomor_pesanan}`);
            }
            
            else if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedOrder = transformOrderFromDB(payload.new);
              setOrders(current => 
                current.map(order => 
                  order.id === updatedOrder.id ? updatedOrder : order
                )
              );
              toast.success(`Pesanan #${payload.new.nomor_pesanan} diperbarui`);
            }
            
            else if (payload.eventType === 'DELETE' && payload.old) {
              setOrders(current => current.filter(order => order.id !== payload.old.id));
              toast.success(`Pesanan dihapus`);
            }
          } catch (err) {
            console.error('Error processing realtime update:', err);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to realtime orders');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error');
          toast.error('Koneksi realtime terputus, data mungkin tidak sinkron');
        }
      });

    // Cleanup function
    return () => {
      mounted = false;
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addOrder = async (order: NewOrder): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk membuat pesanan');
      return false;
    }

    try {
      // Optimistic update - tambah order sementara ke UI
      const optimisticOrder: Order = {
        id: `temp-${Date.now()}`,
        nomorPesanan: `TEMP-${Date.now()}`,
        namaPelanggan: order.namaPelanggan,
        telefonPelanggan: order.telefonPelanggan || '',
        emailPelanggan: order.emailPelanggan || '',
        alamatPengiriman: order.alamatPengiriman || '',
        tanggal: order.tanggal,
        items: order.items,
        totalPesanan: order.totalPesanan,
        status: order.status || 'pending',
        catatan: order.catatan || '',
        subtotal: order.subtotal || 0,
        pajak: order.pajak || 0,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Tambah ke UI dulu (optimistic)
      setOrders(current => [optimisticOrder, ...current]);
      
      // Panggil RPC Supabase
      const { data, error } = await supabase.rpc('create_new_order', { 
        order_data: {
          user_id: user.id,
          tanggal: toSafeISOString(order.tanggal),
          status: order.status || 'pending',
          nama_pelanggan: order.namaPelanggan,
          telepon_pelanggan: order.telefonPelanggan || '',
          email_pelanggan: order.emailPelanggan || '',
          alamat_pengiriman: order.alamatPengiriman || '',
          items: order.items,
          total_pesanan: order.totalPesanan,
          subtotal: order.subtotal || 0,
          pajak: order.pajak || 0,
          catatan: order.catatan || ''
        }
      });

      if (error) {
        // Rollback optimistic update
        setOrders(current => current.filter(o => o.id !== optimisticOrder.id));
        toast.error(`Gagal menambahkan pesanan: ${error.message}`);
        return false;
      }

      // Hapus optimistic order karena realtime akan handle yang asli
      setOrders(current => current.filter(o => o.id !== optimisticOrder.id));
      
      const createdOrder = Array.isArray(data) ? data[0] : data;
      if (createdOrder) {
        addActivity({ 
          title: 'Pesanan Baru Dibuat', 
          description: `Pesanan #${createdOrder.nomor_pesanan} dari ${createdOrder.nama_pelanggan} telah dibuat.`,
          type: 'order'
        });
        toast.success(`Pesanan #${createdOrder.nomor_pesanan} berhasil ditambahkan!`);
      }
      
      return true;
    } catch (err) {
      // Rollback optimistic update
      setOrders(current => current.filter(o => !o.id.startsWith('temp-')));
      console.error('Error adding order:', err);
      toast.error('Terjadi kesalahan saat menambahkan pesanan');
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
      // Optimistic update
      const optimisticOrder = { ...oldOrder, ...updatedData };
      setOrders(current => 
        current.map(order => order.id === id ? optimisticOrder : order)
      );

      const deliveredStatus = orderStatusList.find(s => s.label === 'Selesai')?.key || 'delivered';

      // Cek apakah status diubah menjadi "Selesai"
      if (oldOrder.status !== deliveredStatus && updatedData.status === deliveredStatus) {
        
        // Panggil fungsi RPC yang akan mengubah status, potong stok, DAN catat pemasukan
        const { error: rpcError } = await supabase.rpc('complete_order_and_deduct_stock', { order_id: id });
        
        if (rpcError) {
          // Rollback optimistic update
          setOrders(current => 
            current.map(order => order.id === id ? oldOrder : order)
          );
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
          date: new Date(),
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
        // Update biasa
        const { error } = await supabase
          .from('orders')
          .update(transformToDB(updatedData))
          .eq('id', id);

        if (error) {
          // Rollback optimistic update
          setOrders(current => 
            current.map(order => order.id === id ? oldOrder : order)
          );
          toast.error(`Gagal memperbarui pesanan: ${error.message}`);
          return false;
        }
        
        toast.success(`Pesanan #${oldOrder.nomorPesanan} berhasil diperbarui.`);
        return true;
      }
    } catch (err) {
      // Rollback optimistic update
      setOrders(current => 
        current.map(order => order.id === id ? oldOrder : order)
      );
      console.error('Error updating order:', err);
      toast.error('Terjadi kesalahan saat memperbarui pesanan');
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
      toast.error('Pesanan tidak ditemukan');
      return false;
    }

    try {
      // Optimistic update - hapus dari UI dulu
      setOrders(current => current.filter(o => o.id !== id));

      const { error } = await supabase.from('orders').delete().eq('id', id);

      if (error) {
        // Rollback optimistic update
        setOrders(current => {
          const exists = current.find(o => o.id === id);
          if (exists) return current;
          return [...current, orderToDelete].sort((a, b) => 
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
          );
        });
        toast.error(`Gagal menghapus pesanan: ${error.message}`);
        return false;
      }

      addActivity({ 
        title: 'Pesanan Dihapus', 
        description: `Pesanan ${orderToDelete.nomorPesanan} telah dihapus`, 
        type: 'order' 
      });
      toast.success("Pesanan berhasil dihapus.");
      return true;
    } catch (err) {
      // Rollback optimistic update
      setOrders(current => {
        const exists = current.find(o => o.id === id);
        if (exists) return current;
        return [...current, orderToDelete].sort((a, b) => 
          new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );
      });
      console.error('Error deleting order:', err);
      toast.error('Terjadi kesalahan saat menghapus pesanan');
      return false;
    }
  };
  
  const value = { 
    orders, 
    isLoading, 
    addOrder, 
    updateOrder, 
    deleteOrder, 
    refreshOrders 
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