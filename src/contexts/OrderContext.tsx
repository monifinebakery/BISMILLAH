// src/contexts/OrderContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, NewOrder } from '@/types/order'; // Pastikan path ke tipe data Anda benar
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';
import { toSafeISOString, safeParseDate } from '@/utils/dateUtils';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';

// --- INTERFACE & CONTEXT ---
interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<NewOrder, 'id' | 'tanggal' | 'createdAt' | 'updatedAt' | 'nomorPesanan' | 'status'>) => Promise<boolean>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// --- CONSTANTS ---
const STORAGE_KEY = 'hpp_app_orders';

// --- PROVIDER COMPONENT ---
export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- LOCAL STATE ---
  const [orders, setOrders] = useState<Order[]>([]);
  
  // --- DEPENDENCY HOOKS ---
  const { session } = useAuth();
  const { addActivity } = useActivity();

  // --- LOAD & SAVE EFFECTS ---
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // Logika parsing kompleks dari AppDataContext asli
        const parsed = JSON.parse(stored).map((item: any) => {
            const parsedTanggal = safeParseDate(item.tanggal);
            const parsedCreatedAt = safeParseDate(item.createdAt || item.created_at);
            const parsedUpdatedAt = safeParseDate(item.updatedAt || item.updated_at);
            return {
              ...item,
              tanggal: (parsedTanggal instanceof Date && !isNaN(parsedTanggal.getTime())) ? parsedTanggal : new Date(),
              createdAt: (parsedCreatedAt instanceof Date && !isNaN(parsedCreatedAt.getTime())) ? parsedCreatedAt : null,
              updatedAt: (parsedUpdatedAt instanceof Date && !isNaN(parsedUpdatedAt.getTime())) ? parsedUpdatedAt : null,
              items: item.items ? item.items.map((orderItem: any) => ({
                ...orderItem,
                id: orderItem.id || generateUUID(),
              })) : [],
            };
        });
        setOrders(parsed);
      }
    } catch (error) {
      console.error("Gagal memuat pesanan dari localStorage:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  // --- FUNCTIONS ---
  const addOrder = async (order: Omit<NewOrder, 'id' | 'tanggal' | 'createdAt' | 'updatedAt' | 'nomorPesanan' | 'status'>): Promise<boolean> => {
    if (!session) {
        toast.error('Anda harus login untuk membuat pesanan');
        return false;
    }
    
    // Logika untuk membuat nomor pesanan baru
    const nextOrderNumber = `ORD-${String(Math.max(0, ...orders.map(o => parseInt(o.nomorPesanan.replace('ORD-', '')) || 0)) + 1).padStart(3, '0')}`;

    const newOrder: Order = {
      ...order,
      id: generateUUID(),
      tanggal: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      nomorPesanan: nextOrderNumber,
      status: 'pending',
    };

    // ... Logika insert ke Supabase ...
    
    setOrders(prev => [...prev, newOrder]);
    addActivity({
      title: 'Pesanan Baru',
      description: `Pesanan ${newOrder.nomorPesanan} dari ${newOrder.namaPelanggan}`,
      type: 'order', // Tipe bisa disesuaikan, mungkin 'order' lebih cocok
      value: null,
    });
    toast.success(`Pesanan ${newOrder.nomorPesanan} berhasil ditambahkan!`);
    return true;
  };

  const updateOrder = async (id: string, updatedOrder: Partial<Order>): Promise<boolean> => {
    if (!session) {
        toast.error('Anda harus login untuk memperbarui pesanan');
        return false;
    }
    // ... Implementasi lengkap sama seperti di AppDataContext asli ...
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updatedOrder, updatedAt: new Date() } : o));
    toast.success(`Pesanan berhasil diperbarui!`);
    return true;
  };
  
  const deleteOrder = async (id: string): Promise<boolean> => {
    if (!session) {
        toast.error('Anda harus login untuk menghapus pesanan');
        return false;
    }
    const order = orders.find(o => o.id === id);
    // ... Logika delete dari Supabase ...

    setOrders(prev => prev.filter(o => o.id !== id));
    if (order) {
        addActivity({
            title: 'Pesanan Dihapus',
            description: `Pesanan ${order.nomorPesanan} telah dihapus`,
            type: 'purchase',
            value: null,
        });
        toast.success(`Pesanan ${order.nomorPesanan} berhasil dihapus!`);
    }
    return true;
  };
  
  const updateOrderStatus = async (id: string, status: Order['status']) => {
    await updateOrder(id, { status });
  };

  const value: OrderContextType = {
    orders,
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