// src/contexts/OrderContext.tsx
// VERSI REALTIME

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, NewOrder } from '@/types/order'; // Pastikan path ke tipe data Anda benar
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
    items: dbItem.items || [], // Asumsi `items` disimpan sebagai JSONB
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
          const transform = transformOrderFromDB;
          if (payload.eventType === 'INSERT') {
            setOrders(current => [transform(payload.new), ...current]);
          }
          if (payload.eventType === 'UPDATE') {
            setOrders(current => current.map(o => o.id === payload.new.id ? transform(payload.new) : o));
          }
          if (payload.eventType === 'DELETE') {
            setOrders(currentOrders => currentOrders.filter(order => order.id !== deletedOrderId));
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
    if (!user) {
        toast.error('Anda harus login untuk membuat pesanan');
        return false;
    }
    
    // Lihat Catatan Penting di bawah mengenai pembuatan nomor pesanan
    const newOrderData = {
        user_id: user.id,
        tanggal: new Date(),
        status: 'pending', // Status default
        nama_pelanggan: order.namaPelanggan,
        telepon_pelanggan: order.teleponPelanggan,
        email_pelanggan: order.emailPelanggan,
        items: order.items,
        total_pesanan: order.totalPesanan,
    };

    // Kita akan memanggil fungsi RPC di database untuk membuat nomor pesanan
    const { data: newOrder, error } = await supabase.rpc('create_new_order', { order_data: newOrderData });

    if (error) {
        toast.error(`Gagal menambahkan pesanan: ${error.message}`);
        return false;
    }
    
    // newOrder di sini adalah hasil dari fungsi RPC, yang sudah punya nomor pesanan unik
    addActivity({ title: 'Pesanan Baru', description: `Pesanan #${newOrder.nomor_pesanan} dari ${newOrder.nama_pelanggan}`, type: 'order', value: null });
    toast.success(`Pesanan #${newOrder.nomor_pesanan} berhasil ditambahkan!`);
    return true;
  };

  const updateOrder = async (id: string, updatedOrder: Partial<Order>): Promise<boolean> => {
    // ... Implementasi serupa, ubah camelCase ke snake_case ...
    return true;
  };
  
  const deleteOrder = async (id: string): Promise<boolean> => {
    // ... Implementasi serupa ...
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