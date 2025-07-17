import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { safeParseDate } from '@/hooks/useSupabaseSync'; // Tambahkan baris ini

export interface OrderItem {
  id: string;
  namaItem: string;
  jumlah: number;
  hargaSatuan: number;
  total: number;
  [key: string]: any;
}

export interface Order {
  id: string; // UUID format
  nomorPesanan: string;
  tanggal: Date;
  namaPelanggan: string;
  emailPelanggan?: string;
  teleponPelanggan: string;
  alamatPelanggan?: string;
  items: OrderItem[];
  subtotal: number;
  pajak: number;
  totalPesanan: number;
  status: string;
  catatan?: string;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('tanggal', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        toast.error('Gagal memuat data pesanan');
        return;
      }

      const formattedOrders = data?.map((item: any) => ({
        id: item.id,
        nomorPesanan: item.nomor_pesanan,
        tanggal: new Date(item.tanggal),
        namaPelanggan: item.nama_pelanggan,
        emailPelanggan: item.email_pelanggan,
        teleponPelanggan: item.telepon_pelanggan,
        alamatPelanggan: item.alamat_pengiriman,
        items: item.items || [],
        subtotal: parseFloat(item.subtotal) || 0, // Ambil langsung dari kolom subtotal
        pajak: parseFloat(item.pajak) || 0, // Ambil langsung dari kolom pajak
        totalPesanan: parseFloat(item.total_pesanan) || 0,
        status: item.status,
        catatan: item.catatan,
      })) || [];

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error in loadOrders:', error);
      toast.error('Gagal memuat data pesanan');
    } finally {
      setLoading(false);
    }
  };

  const addOrder = async (order: Omit<Order, 'id'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menambah pesanan');
        return false;
      }

      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          nomor_pesanan: order.nomorPesanan,
          tanggal: order.tanggal.toISOString(),
          nama_pelanggan: order.namaPelanggan,
          email_pelanggan: order.emailPelanggan,
          telepon_pelanggan: order.teleponPelanggan,
          alamat_pengiriman: order.alamatPelanggan,
          subtotal: order.subtotal,
          pajak: order.pajak,
          items: JSON.parse(JSON.stringify(order.items)),
          total_pesanan: order.totalPesanan,
          status: order.status,
          catatan: order.catatan,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding order:', error);
        toast.error('Gagal menambah pesanan');
        return false;
      }

      await loadOrders();
      toast.success('Pesanan berhasil ditambahkan');
      return true;
    } catch (error) {
      console.error('Error in addOrder:', error);
      toast.error('Gagal menambah pesanan');
      return false;
    }
  };

  const updateOrder = async (id: string, order: Omit<Order, 'id'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Anda harus login untuk mengupdate pesanan');
        return false;
      }
      
      // Get the current order to check if status has changed
      const { data: currentOrder, error: currentOrderError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', id)
        .single();
      
      if (currentOrderError) {
        console.error('Error fetching current order:', currentOrderError);
      }
      
      const oldStatus = currentOrder?.status;
      const newStatus = order.status;

      const { error } = await supabase
        .from('orders')
        .update({
          ...(order.nomorPesanan ? { nomor_pesanan: order.nomorPesanan } : {}),
          ...(order.tanggal ? { tanggal: order.tanggal.toISOString() } : {}),
          ...(order.namaPelanggan ? { nama_pelanggan: order.namaPelanggan } : {}),
          ...(order.emailPelanggan ? { email_pelanggan: order.emailPelanggan } : {}),
          ...(order.teleponPelanggan ? { telepon_pelanggan: order.teleponPelanggan } : {}),
          ...(order.alamatPelanggan ? { alamat_pengiriman: order.alamatPelanggan } : {}),
          ...(order.subtotal !== undefined ? { subtotal: order.subtotal } : {}),
          ...(order.pajak !== undefined ? { pajak: order.pajak } : {}),
          ...(order.items ? { items: JSON.parse(JSON.stringify(order.items)) } : {}),
          ...(order.totalPesanan !== undefined ? { total_pesanan: order.totalPesanan } : {}),
          ...(order.status ? { status: order.status } : {}),
          ...(order.catatan !== undefined ? { catatan: order.catatan } : {})
        })
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating order:', error);
        toast.error('Gagal mengupdate pesanan');
        return false;
      }

      await loadOrders();
      return true;
    } catch (error) {
      console.error('Error in updateOrder:', error);
      toast.error('Gagal mengupdate pesanan');
      return false;
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menghapus pesanan');
        return false;
      }

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deleting order:', error);
        toast.error('Gagal menghapus pesanan');
        return false;
      }

      setOrders(prev => prev.filter(order => order.id !== id));
      toast.success('Pesanan berhasil dihapus');
      return true;
    } catch (error) {
      console.error('Error in deleteOrder:', error);
      toast.error('Gagal menghapus pesanan');
      return false;
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return {
    orders,
    loading,
    loadOrders,
    addOrder,
    updateOrder,
    deleteOrder,
  };
};