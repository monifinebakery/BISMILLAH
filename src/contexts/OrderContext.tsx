// src/contexts/OrderContext.tsx
// VERSI REALTIME - DENGAN PERBAIKAN PADA LISTENER

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, NewOrder } from '@/types/order';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate } from '@/utils/dateUtils';

// --- INTERFACE & CONTEXT ---
interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  addOrder: (order: Omit<NewOrder, 'id' | 'tanggal' | 'createdAt' | 'updatedAt' | 'nomorPesanan' | 'status'>) => Promise<boolean>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<boolean>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- DEPENDENCIES ---
  const { user } = useAuth();
  const { addActivity } = useActivity();

  // --- HELPER FUNCTION ---
  const transformOrderFromDB = (dbItem: any): Order => ({
    id: dbItem.id,
    nomorPesanan: dbItem.nomor_pesanan,
    tanggal: safeParseDate(dbItem.tanggal),
    namaPelanggan: dbItem.nama_pelanggan,
    teleponPelanggan: dbItem.telepon_pelanggan,
    emailPelanggan: dbItem.email_pelanggan,
    items: dbItem.items || [],
    totalPesanan: Number(dbItem.total_pesanan) || 0,
    status: dbItem.status,
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    updatedAt: safeParseDate(dbItem.updated_at),
  });

  // --- EFEK UTAMA: FETCH DATA & REALTIME LISTENER ---
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('[OrderContext] Perubahan realtime diterima:', payload);
          const transform = transformOrderFromDB;

          if (payload.eventType === 'INSERT') {
            setOrders(current => [transform(payload.new), ...current]);
          }

          // =========================================================
          // --- PERBAIKAN #1: LOGIKA UPDATE ---
          // =========================================================
          if (payload.eventType === 'UPDATE') {
            const updatedOrder = transform(payload.new);
            setOrders(currentOrders => 
              currentOrders.map(order => 
                (order.id === updatedOrder.id ? updatedOrder : order)
              )
            );
          }

          // =========================================================
          // --- PERBAIKAN #2: LOGIKA DELETE ---
          // =========================================================
          if (payload.eventType === 'DELETE') {
            const deletedOrderId = payload.old.id; // Gunakan payload.old.id
            setOrders(currentOrders => 
              currentOrders.filter(order => order.id !== deletedOrderId)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // --- FUNGSI-FUNGSI ---
  const addOrder = async (order: Omit<NewOrder, 'id' | 'tanggal' | 'createdAt' | 'updatedAt' | 'nomorPesanan' | 'status'>): Promise<boolean> => {
    if (!user) { toast.error('Anda harus login untuk membuat pesanan'); return false; }
    
    const newOrderData = {
        user_id: user.id, tanggal: new Date(), status: 'pending',
        nama_pelanggan: order.namaPelanggan, telepon_pelanggan: order.teleponPelanggan,
        email_pelanggan: order.emailPelanggan, items: order.items, total_pesanan: order.totalPesanan,
    };
    
    const { data, error } = await supabase.rpc('create_new_order', { order_data: newOrderData });

    if (error) { toast.error(`Gagal menambahkan pesanan: ${error.message}`); return false; }
    
    // Asumsi fungsi RPC mengembalikan minimal data ini
    const createdOrder = data[0]; 
    if (createdOrder) {
        addActivity({ title: 'Pesanan Baru', description: `Pesanan #${createdOrder.nomor_pesanan} dari ${createdOrder.nama_pelanggan}`, type: 'order', value: null });
        toast.success(`Pesanan #${createdOrder.nomor_pesanan} berhasil ditambahkan!`);
    }
    return true;
  };

  const updateOrder = async (id: string, updatedOrder: Partial<Order>): Promise<boolean> => {
    if (!user) { toast.error('Anda harus login untuk memperbarui pesanan'); return false; }
    
    const orderToUpdate: {[key: string]: any} = {};
    if (updatedOrder.status !== undefined) orderToUpdate.status = updatedOrder.status;
    // ...tambahkan field lain jika perlu diupdate
    
    const { error } = await supabase.from('orders').update(orderToUpdate).eq('id', id);
    if(error) { toast.error(`Gagal memperbarui pesanan: ${error.message}`); return false; }
    
    toast.success('Pesanan berhasil diperbarui!');
    return true;
  };
  
  const deleteOrder = async (id: string): Promise<boolean> => {
    if (!user) { toast.error('Anda harus login untuk menghapus pesanan'); return false; }

    const orderToDelete = orders.find(o => o.id === id);

    const { error } = await supabase.from('orders').delete().eq('id', id);
    if(error) { toast.error(`Gagal menghapus pesanan: ${error.message}`); return false; }

    if (orderToDelete) {
        addActivity({ title: 'Pesanan Dihapus', description: `Pesanan ${orderToDelete.nomorPesanan} telah dihapus`, type: 'order', value: null });
    }
    toast.success(`Pesanan berhasil dihapus!`);
    return true;
  };
  
  const updateOrderStatus = async (id: string, status: Order['status']): Promise<boolean> => {
    return await updateOrder(id, { status });
  };

  const value: OrderContextType = {
    orders,
    isLoading,
    addOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

// --- CUSTOM HOOK ---
export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};