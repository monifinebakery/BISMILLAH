// src/components/orders/services/orderService.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { orderEvents, emitOrderDeleted } from '../utils/orderEvents';
import { transformOrderFromDB, transformOrderToDB, validateOrderData, toSafeISOString } from '../utils';
import type { Order, OrderItem, CreateOrderData, UpdateOrderData, OrderStatus, NewOrder } from '../types';
import { generateOrderNumber } from '@/utils/formatUtils';
import { to_snake_order } from '../utils';
import { OptimizedQueryBuilder, OPTIMIZED_SELECTS, PaginationOptimizer } from '@/utils/egressOptimization';

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

// ================= SNAKE_CASE WRAPPERS =================
// These wrappers allow consumers to work purely with snake_case

export async function fetchOrdersSnake(userId: string): Promise<any[]> {
  const orders = await fetchOrders(userId);
  return orders.map(to_snake_order);
}

// Get single order by ID
export async function getOrderById(userId: string, orderId: string): Promise<Order | null> {
  try {
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
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - order not found
        return null;
      }
      logger.error('Error fetching order by ID:', error);
      throw error;
    }

    return transformOrderFromDB(data);
  } catch (error) {
    logger.error('Error in getOrderById:', error);
    throw error;
  }
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

    if (!error && data) {
      // ✅ FIXED: Handle new return format from updated stored procedure
      if (typeof data === 'object' && data && data !== null && 'id' in (data as Record<string, any>)) {
        // New format: function returns complete order object
        return transformOrderFromDB(data as any);
      } else {
        // Fallback: if it's still UUID, fetch the order
        const { data: orderData, error: fetchError } = await supabase
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
          .eq('id', data)
          .single();
          
        if (!fetchError && orderData) {
          return transformOrderFromDB(orderData);
        }
      }
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
  
  // ✅ ENSURE: All required fields are present - explicitly set nomor_pesanan
  const insertData = {
    user_id: userId,
    nomor_pesanan: orderNumber, // ✅ CRITICAL: Always ensure this is set
    nama_pelanggan: order.namaPelanggan?.trim() || 'Unknown',
    telepon_pelanggan: order.teleponPelanggan || '',
    email_pelanggan: order.emailPelanggan || '',
    alamat_pengiriman: order.alamatPengiriman || '',
    status: validateStatus(order.status),
    tanggal: toSafeISOString(order.tanggal || new Date()),
    total_pesanan: Number(order.totalPesanan) || 0,
    items: JSON.stringify(Array.isArray(order.items) ? order.items : []),
    subtotal: Number(order.subtotal) || 0,
    pajak: Number(order.pajak) || 0,
    catatan: order.catatan || '',
    // ✅ Don't spread transformedData to avoid overwriting explicit values above
  };
  
  const { data, error } = await supabase
    .from('orders')
    .insert(insertData)
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
    .single();

  if (error) {
    logger.error('Error creating order with direct insert:', error);
    throw error;
  }

  return transformOrderFromDB(data);
}

export async function addOrderSnake(userId: string, orderSnake: any): Promise<any> {
  const camel = from_snake_order(orderSnake);
  const created = await addOrder(userId, camel as any);
  return to_snake_order(created);
}

// Update an order
export async function updateOrder(userId: string, id: string, updatedData: Partial<Order>): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update(transformOrderToDB(updatedData))
    .eq('id', id)
    .eq('user_id', userId)
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
    .single();

  if (error) {
    logger.error('Error updating order:', error);
    throw error;
  }

  return transformOrderFromDB(data);
}

export async function updateOrderSnake(userId: string, id: string, updatedDataSnake: any): Promise<any> {
  const camel = from_snake_order(updatedDataSnake);
  const updated = await updateOrder(userId, id, camel as any);
  return to_snake_order(updated);
}

// Update only status
export async function updateOrderStatus(userId: string, id: string, newStatus: string): Promise<Order> {
  // ✅ PARAMETER VALIDATION: Ensure all parameters are strings
  const userIdStr = String(userId);
  const orderIdStr = String(id);
  const statusStr = String(newStatus);
  
  logger.debug('orderService: updateOrderStatus called with:', {
    userId: userIdStr,
    orderId: orderIdStr,
    newStatus: statusStr,
    originalTypes: {
      userId: typeof userId,
      id: typeof id, 
      newStatus: typeof newStatus
    }
  });
  
  // ✅ FIXED: Validate status before update
  const validatedStatus = validateStatus(statusStr);
  
  const { data, error } = await supabase
    .from('orders')
    .update({ status: validatedStatus, updated_at: new Date().toISOString() })
    .eq('id', orderIdStr)
    .eq('user_id', userIdStr)
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
    .single();

  if (error) {
    logger.error('Error updating order status:', error);
    throw error;
  }

  const transformedOrder = transformOrderFromDB(data);
  
  // ✅ AUTO FINANCIAL SYNC: Sync to financial when order completed
  // Use the actual updated status from the database, not the input parameter
  if (transformedOrder.status === 'completed') {
    try {
      logger.info('📈 Triggering financial sync for completed order:', transformedOrder.nomorPesanan);
      const { syncOrderToFinancialTransaction } = await import('@/utils/orderFinancialSync');
      const syncResult = await syncOrderToFinancialTransaction(transformedOrder, userIdStr);
      
      if (syncResult) {
        logger.success('✅ Financial sync completed for order:', transformedOrder.nomorPesanan);
      } else {
        logger.warn('⚠️ Financial sync failed (non-critical):', transformedOrder.nomorPesanan);
      }
    } catch (syncError) {
      logger.error(`Error in auto financial sync for order ${transformedOrder.nomorPesanan}:`, syncError);
      // Don't throw - order status update should still succeed
    }

    // ✅ MATERIAL USAGE SYNC: Record pemakaian_bahan from recipes when order is completed
    try {
      const { syncOrderMaterialUsage } = await import('@/utils/orderMaterialUsage');
      const ok = await syncOrderMaterialUsage(transformedOrder as any, userIdStr);
      if (ok) {
        logger.success('✅ Material usage recorded for order:', transformedOrder.nomorPesanan);
      } else {
        logger.warn('⚠️ Material usage recording failed (non-critical):', transformedOrder.nomorPesanan);
      }
    } catch (usageError) {
      logger.error(`Error recording material usage for order ${transformedOrder.nomorPesanan}:`, usageError);
    }
  } else {
    logger.debug('Order status is not completed, skipping financial sync:', {
      orderId: transformedOrder.id,
      status: transformedOrder.status,
      orderNumber: transformedOrder.nomorPesanan
    });
  }

  return transformedOrder;
}

export async function updateOrderStatusSnake(userId: string, id: string, newStatus: string): Promise<any> {
  const updated = await updateOrderStatus(userId, id, newStatus);
  return to_snake_order(updated);
}

// Delete an order
export async function deleteOrder(userId: string, id: string): Promise<void> {
  // ✅ STEP 1: Get order data before deletion for financial cleanup
  const { data: orderData, error: fetchError } = await supabase
    .from('orders')
    .select('id, nomor_pesanan, total_pesanan, status')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError) {
    logger.error('Error fetching order for deletion:', fetchError);
    throw fetchError;
  }

  if (!orderData) {
    logger.warn('Order not found for deletion:', id);
    return;
  }

  logger.info('🗑️ Deleting order and cleaning up financial transactions:', {
    orderId: id,
    orderNumber: orderData.nomor_pesanan,
    status: orderData.status
  });

  // ✅ STEP 2: Delete related financial transactions first
  try {
    const { error: financialError } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('user_id', userId)
      .eq('type', 'income')
      .eq('description', `Pesanan ${orderData.nomor_pesanan}`);

    if (financialError) {
      logger.warn('Error deleting related financial transaction:', financialError);
      // Don't throw - continue with order deletion even if financial cleanup fails
    } else {
      logger.success('✅ Deleted related financial transaction for order:', orderData.nomor_pesanan);
    }
  } catch (cleanupError) {
    logger.warn('Financial cleanup failed (non-critical):', cleanupError);
  }

  // ✅ STEP 3: Delete the order itself
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error deleting order:', error);
    throw error;
  }

  logger.success('✅ Successfully deleted order and cleaned up financial data:', orderData.nomor_pesanan);
  
  // ✅ STEP 4: Emit event for immediate UI updates and financial report synchronization
  try {
    emitOrderDeleted(id);
    logger.debug('✅ Order deletion event emitted for real-time updates');
  } catch (eventError) {
    logger.warn('Could not emit order deletion event (non-critical):', eventError);
  }
}

export async function deleteOrderSnake(userId: string, id: string): Promise<void> {
  return deleteOrder(userId, id);
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

// ULTRA OPTIMIZED: Bulk delete dengan batching and financial cleanup
// ================= OPTIMIZED FUNCTIONS FOR REDUCED EGRESS =================

// OPTIMIZED: Fetch orders with caching and selective fields
export async function fetchOrdersOptimized(userId: string): Promise<Order[]> {
  try {
    const data = await new OptimizedQueryBuilder('orders', 'orders_list')
      .select(OPTIMIZED_SELECTS.orders.list)
      .eq('user_id', userId)
      .order('tanggal', { ascending: false })
      .limit(50) // Reduced from unlimited
      .execute();

    return (data || []).map(transformOrderFromDB);
  } catch (error) {
    logger.error('Error fetching optimized orders:', error);
    throw error;
  }
}

// OPTIMIZED: Fetch orders with pagination
export async function fetchOrdersPaginatedOptimized(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ orders: Order[]; totalCount: number; totalPages: number }> {
  try {
    const result = await PaginationOptimizer.fetchWithPagination<Order>(
      'orders',
      userId,
      {
        page,
        limit: Math.min(limit, 25), // Cap at 25 items per page
        selectFields: OPTIMIZED_SELECTS.orders.list,
        orderBy: 'tanggal',
        cachePrefix: 'orders_paginated'
      }
    );

    return {
      orders: (result.data || []).map(transformOrderFromDB),
      totalCount: result.totalCount,
      totalPages: Math.ceil(result.totalCount / limit)
    };
  } catch (error) {
    logger.error('Error fetching paginated optimized orders:', error);
    throw error;
  }
}
