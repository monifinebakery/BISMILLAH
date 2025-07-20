// src/contexts/OrderContext.tsx
// VERSI REALTIME - DENGAN PERBAIKAN TOTAL PADA FUNGSI UPDATE

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, NewOrder } from '@/types/order';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils';

// --- INTERFACE & CONTEXT ---
interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  addOrder: (order: Omit<NewOrder, 'id' | 'tanggal' | 'createdAt' | 'updatedAt' | 'nomorPesanan' | 'status' | 'userId'>) => Promise<boolean>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { addActivity } = useActivity();

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
  
  // EFEK UTAMA: FETCH DATA & REALTIME LISTENER
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

  // --- FUNGSI-FUNGSI ---
  const addOrder = async (order: Omit<NewOrder, 'id' | 'tanggal' | 'createdAt' | 'updatedAt' | 'nomorPesanan' | 'status' | 'userId'>): Promise<boolean> => {
    if (!user) { toast.error('Anda harus login untuk membuat pesanan'); return false; }
    
    const newOrderData = {
        user_id: user.id, tanggal: new Date(), status: 'pending',
        nama_pelanggan: order.namaPelanggan, telepon_pelanggan: order.teleponPelanggan,
        email_pelanggan: order.emailPelanggan, items: order.items, total_pesanan: order.totalPesanan,
    };
    
    const { data, error } = await supabase.rpc('create_new_order', { order_data: newOrderData });

    if (error) { toast.error(`Gagal menambahkan pesanan: ${error.message}`); return false; }
    
    const createdOrder = Array.isArray(data) ? data[0] : data; 
    if (createdOrder) {
        addActivity({ title: 'Pesanan Baru', description: `Pesanan #${createdOrder.nomor_pesanan} dari ${createdOrder.nama_pelanggan}`, type: 'order', value: null });
        toast.success(`Pesanan #${createdOrder.nomor_pesanan} berhasil ditambahkan!`);
    }
    return true;
  };

  // ===================================================================
  // --- FUNGSI UPDATE YANG SUDAH DIPERBAIKI ---
  // ===================================================================
  const updateOrder = async (id: string, updatedData: Partial<Order>): Promise<boolean> => {
    if (!user) { toast.error('Anda harus login untuk memperbarui pesanan'); return false; }
    
    // Objek ini akan menampung data yang sudah diubah ke format snake_case
    const orderToUpdate: {[key: string]: any} = {
      updated_at: new Date().toISOString(), // Selalu perbarui 'updated_at'
    };

    // Secara dinamis mengubah semua field yang ada di `updatedData` ke snake_case
    if (updatedData.nomorPesanan !== undefined) orderToUpdate.nomor_pesanan = updatedData.nomorPesanan;
    if (updatedData.tanggal !== undefined) orderToUpdate.tanggal = toSafeISOString(updatedData.tanggal);
    if (updatedData.namaPelanggan !== undefined) orderToUpdate.nama_pelanggan = updatedData.namaPelanggan;
    if (updatedData.teleponPelanggan !== undefined) orderToUpdate.telepon_pelanggan = updatedData.teleponPelanggan;
    if (updatedData.emailPelanggan !== undefined) orderToUpdate.email_pelanggan = updatedData.emailPelanggan;
    if (updatedData.items !== undefined) orderToUpdate.items = updatedData.items;
    if (updatedData.totalPesanan !== undefined) orderToUpdate.total_pesanan = updatedData.totalPesanan;
    if (updatedData.status !== undefined) orderToUpdate.status = updatedData.status;

    const { error } = await supabase.from('orders').update(orderToUpdate).eq('id', id);
    if(error) {
      toast.error(`Gagal memperbarui pesanan: ${error.message}`);
      return false;
    }
    
    return true; // Berhasil, UI akan diupdate oleh listener
  };
  
  const deleteOrder = async (id: string): Promise<boolean> => {
    if (!user) { toast.error('Anda harus login untuk menghapus pesanan'); return false; }

    const orderToDelete = orders.find(o => o.id === id);

    const { error } = await supabase.from('orders').delete().eq('id', id);
    if(error) { toast.error(`Gagal menghapus pesanan: ${error.message}`); return false; }

    if (orderToDelete) {
        addActivity({ title: 'Pesanan Dihapus', description: `Pesanan ${orderToDelete.nomorPesanan} telah dihapus`, type: 'order', value: null });
    }
    return true; // Berhasil, UI akan diupdate oleh listener
  };
  
  const value: OrderContextType = {
    orders,
    isLoading,
    addOrder,
    updateOrder,
    deleteOrder,
    // Kita tidak lagi mengekspor `updateOrderStatus` karena `updateOrder` sudah bisa menanganinya
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