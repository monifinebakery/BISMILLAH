import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { transformOrderFromDB, transformOrderToDB, toSafeISOString, validateOrderData } from '../utils';
import { generateOrderNumber } from '@/utils/formatUtils'; // ✅ FIXED: Import order number generator
import type { Order, NewOrder, OrderStatus } from '../types';

// ✅ FIXED: Valid status values matching application values
const VALID_ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled', 'completed'];

// ✅ Helper to validate and normalize status
function validateStatus(status?: string): OrderStatus {
  if (!status || !VALID_ORDER_STATUSES.includes(status as OrderStatus)) {
    return 'pending'; // Default fallback
  }
  return status as OrderStatus;
}

// OPTIMIZED: Fetch orders dengan selective fields untuk performa
export async function fetchOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      nomor_pesanan,
      tanggal,
      nama_pelanggan,
      telepon_pelanggan,
      email_pelanggan,
      alamat_pengiriman,
      status,
      total_pesanan,
      catatan,
      items,
      created_at,
      updated_at
    `)
    .eq('user_id', userId)
    .order('tanggal', { ascending: false })
    .limit(100); // PERFORMANCE: Limit untuk mencegah query besar

  if (error) {
    logger.error('Error fetching orders:', error);
    throw error;
  }

  return (data || []).map(transformOrderFromDB);
}

// Fetch orders with pagination for lazy loading
export async function fetchOrdersPaginated(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ orders: Order[]; totalCount: number; totalPages: number }> {
  try {
    // Get total count
    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      logger.error('Error fetching orders count:', countError);
      throw countError;
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const offset = (page - 1) * limit;
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('tanggal', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching paginated orders:', error);
      throw error;
    }

    const orders = (data || []).map(transformOrderFromDB);

    return {
      orders,
      totalCount,
      totalPages
    };
  } catch (error) {
    logger.error('Error in fetchOrdersPaginated:', error);
    throw error;
  }
}

// Create a new order
export async function addOrder(userId: string, order: NewOrder): Promise<Order> {
  const validation = validateOrderData(order);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  // ✅ FIXED: Generate order number if not provided
  const orderNumber = generateOrderNumber();
  
  try {
    // ✅ TRY: Use SQL function if it exists
    const { data, error } = await supabase.rpc('create_new_order', {
      order_data: {
        user_id: userId,
        nomor_pesanan: orderNumber, // ✅ FIXED: Include order number
        tanggal: toSafeISOString(order.tanggal || new Date()),
        status: validateStatus(order.status),
        nama_pelanggan: order.namaPelanggan.trim(),
        telepon_pelanggan: order.teleponPelanggan || '',
        email_pelanggan: order.emailPelanggan || '',
        alamat_pengiriman: order.alamatPengiriman || '',
        items: JSON.stringify(Array.isArray(order.items) ? order.items : []), // ✅ FIXED: Stringify items for JSON
        total_pesanan: Number(order.totalPesanan) || 0,
        catatan: order.catatan || '',
        subtotal: Number(order.subtotal) || 0,
        pajak: Number(order.pajak) || 0,
      } as any // ✅ FIXED: Type assertion for JSON compatibility
    });

    if (!error) {
      const created = Array.isArray(data) ? data[0] : data;
      return transformOrderFromDB(created);
    }
    
    logger.warn('create_new_order function failed, falling back to direct insert:', error);
  } catch (sqlError) {
    logger.warn('create_new_order function not available, using direct insert:', sqlError);
  }

  // ✅ FALLBACK: Direct insert if SQL function doesn't exist or fails
  const orderWithNumber = {
    ...order,
    nomorPesanan: orderNumber // ✅ FIXED: Ensure order number is set
  };
  
  const transformedData = transformOrderToDB(orderWithNumber);
  
  // ✅ ENSURE: All required fields are present
  const insertData = {
    user_id: userId,
    nomor_pesanan: orderNumber,
    nama_pelanggan: order.namaPelanggan?.trim() || 'Unknown',
    telepon_pelanggan: order.teleponPelanggan || '',
    status: validateStatus(order.status),
    tanggal: toSafeISOString(order.tanggal || new Date()),
    total_pesanan: Number(order.totalPesanan) || 0,
    ...transformedData // ✅ SPREAD: Add any additional transformed fields
  };
  
  const { data, error } = await supabase
    .from('orders')
    .insert(insertData)
    .select('*')
    .single();

  if (error) {
    logger.error('Error creating order with direct insert:', error);
    throw error;
  }

  return transformOrderFromDB(data);
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
    logger.error('Error updating order:', error);
    throw error;
  }

  return transformOrderFromDB(data);
}

// Update only status
export async function updateOrderStatus(userId: string, id: string, newStatus: string): Promise<Order> {
  // ✅ FIXED: Validate status before update
  const validatedStatus = validateStatus(newStatus);
  
  const { data, error } = await supabase
    .from('orders')
    .update({ status: validatedStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    logger.error('Error updating order status:', error);
    throw error;
  }

  const transformedOrder = transformOrderFromDB(data);
  
  // ✅ AUTO FINANCIAL SYNC: Sync to financial when order completed
  if (newStatus === 'completed') {
    try {
      const { syncOrderToFinancialTransaction } = await import('@/utils/orderFinancialSync');
      await syncOrderToFinancialTransaction(transformedOrder, userId);
      logger.info('📈 Order financial sync triggered for completed order:', transformedOrder.nomorPesanan);
    } catch (syncError) {
      logger.error('Error in auto financial sync:', syncError);
      // Don't throw - order status update should still succeed
    }
  }

  return transformedOrder;
}

// Delete an order
export async function deleteOrder(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error deleting order:', error);
    throw error;
  }
}

// ULTRA OPTIMIZED: Bulk update dengan batching untuk performa maksimal
export async function bulkUpdateStatus(userId: string, ids: string[], newStatus: string): Promise<void> {
  // ✅ FIXED: Validate status before bulk update
  const validatedStatus = validateStatus(newStatus);
  
  // PERFORMANCE: Batch processing untuk menghindari query terlalu besar
  const BATCH_SIZE = 20;
  const batches = [];
  
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    batches.push(ids.slice(i, i + BATCH_SIZE));
  }
  
  // CONCURRENT: Process batches secara parallel dengan delay minimal
  const promises = batches.map(async (batch, index) => {
    // PERFORMANCE: Stagger requests untuk menghindari rate limiting
    if (index > 0) {
      await new Promise(resolve => setTimeout(resolve, 50 * index));
    }
    
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: validatedStatus, 
        updated_at: new Date().toISOString() 
      })
      .in('id', batch)
      .eq('user_id', userId);

    if (error) {
      logger.error(`Error bulk updating batch ${index + 1}:`, error);
      throw error;
    }
  });
  
  await Promise.all(promises);
}

// ULTRA OPTIMIZED: Bulk delete dengan batching
export async function bulkDeleteOrders(userId: string, ids: string[]): Promise<void> {
  // PERFORMANCE: Batch processing
  const BATCH_SIZE = 25;
  const batches = [];
  
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    batches.push(ids.slice(i, i + BATCH_SIZE));
  }
  
  // CONCURRENT: Process batches secara parallel
  const promises = batches.map(async (batch, index) => {
    // PERFORMANCE: Stagger untuk stability
    if (index > 0) {
      await new Promise(resolve => setTimeout(resolve, 30 * index));
    }
    
    const { error } = await supabase
      .from('orders')
      .delete()
      .in('id', batch)
      .eq('user_id', userId);

    if (error) {
      logger.error(`Error bulk deleting batch ${index + 1}:`, error);
      throw error;
    }
  });
  
  await Promise.all(promises);
}
