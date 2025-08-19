import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { transformOrderFromDB, transformOrderToDB, toSafeISOString, validateOrderData } from '../utils';
import type { Order, NewOrder } from '../types';

// Fetch all orders for a user
export async function fetchOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('tanggal', { ascending: false });

  if (error) {
    logger.error('orderService', 'Error fetching orders:', error);
    throw error;
  }

  return (data || []).map(transformOrderFromDB);
}

// Create a new order
export async function addOrder(userId: string, order: NewOrder): Promise<Order> {
  const validation = validateOrderData(order);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  const { data, error } = await supabase.rpc('create_new_order', {
    order_data: {
      user_id: userId,
      tanggal: toSafeISOString(order.tanggal || new Date()),
      status: order.status || 'pending',
      nama_pelanggan: order.namaPelanggan.trim(),
      telepon_pelanggan: order.teleponPelanggan || '',
      email_pelanggan: order.emailPelanggan || '',
      alamat_pengiriman: order.alamatPengiriman || '',
      items: Array.isArray(order.items) ? order.items : [],
      total_pesanan: Number(order.totalPesanan) || 0,
      catatan: order.catatan || '',
      subtotal: Number(order.subtotal) || 0,
      pajak: Number(order.pajak) || 0,
    }
  });

  if (error) {
    logger.error('orderService', 'Error creating order:', error);
    throw error;
  }

  const created = Array.isArray(data) ? data[0] : data;
  return transformOrderFromDB(created);
}

// Update an order
export async function updateOrder(userId: string, id: string, updatedData: Partial<Order>): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update(transformOrderToDB(updatedData))
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    logger.error('orderService', 'Error updating order:', error);
    throw error;
  }

  return transformOrderFromDB(data);
}

// Update only status
export async function updateOrderStatus(userId: string, id: string, newStatus: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    logger.error('orderService', 'Error updating order status:', error);
    throw error;
  }

  return transformOrderFromDB(data);
}

// Delete an order
export async function deleteOrder(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('orderService', 'Error deleting order:', error);
    throw error;
  }
}

// Bulk status update
export async function bulkUpdateStatus(userId: string, ids: string[], newStatus: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .in('id', ids)
    .eq('user_id', userId);

  if (error) {
    logger.error('orderService', 'Error bulk updating status:', error);
    throw error;
  }
}

// Bulk delete
export async function bulkDeleteOrders(userId: string, ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .delete()
    .in('id', ids)
    .eq('user_id', userId);

  if (error) {
    logger.error('orderService', 'Error bulk deleting orders:', error);
    throw error;
  }
}
