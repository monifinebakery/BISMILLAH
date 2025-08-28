import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Order } from '@/components/orders/types';

/**
 * Automatically create financial income transaction when order is completed
 * This ensures order revenue is tracked in profit analysis
 */
export async function syncOrderToFinancialTransaction(
  order: Order,
  userId: string
): Promise<boolean> {
  try {
    // Only sync completed orders
    if (order.status !== 'completed') {
      logger.debug('Order not completed, skipping financial sync:', order.id);
      return true;
    }

    // Check if financial transaction already exists for this order
    const { data: existing, error: checkError } = await supabase
      .from('financial_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'income')
      .eq('description', `Pesanan ${order.nomorPesanan}`)
      .limit(1);

    if (checkError) {
      logger.error('Error checking existing financial transaction:', checkError);
      return false;
    }

    if (existing && existing.length > 0) {
      logger.debug('Financial transaction already exists for order:', order.nomorPesanan);
      return true;
    }

    // Create financial income transaction
    const transactionData = {
      user_id: userId,
      type: 'income',
      category: 'Penjualan',
      amount: order.totalPesanan,
      description: `Pesanan ${order.nomorPesanan}`,
      date: new Date(order.tanggal).toISOString().split('T')[0], // YYYY-MM-DD format
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('financial_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      logger.error('Error creating financial transaction for order:', error, {
        orderId: order.id,
        orderNumber: order.nomorPesanan,
        amount: order.totalPesanan
      });
      return false;
    }

    logger.success('✅ Financial transaction created for order:', {
      orderId: order.id,
      orderNumber: order.nomorPesanan,
      amount: order.totalPesanan,
      transactionId: data.id,
      date: transactionData.date
    });

    return true;
  } catch (error) {
    logger.error('Critical error in order financial sync:', error);
    return false;
  }
}

/**
 * Bulk sync multiple orders to financial transactions
 * Useful for import operations
 */
export async function bulkSyncOrdersToFinancial(
  orders: Order[],
  userId: string
): Promise<{ success: number; total: number }> {
  let success = 0;
  const total = orders.length;

  logger.info(`📈 Starting bulk financial sync for ${total} orders`);

  for (const order of orders) {
    try {
      const synced = await syncOrderToFinancialTransaction(order, userId);
      if (synced) success++;
    } catch (error) {
      logger.error('Error in bulk sync for order:', order.id, error);
    }
  }

  logger.info(`📈 Bulk financial sync completed: ${success}/${total} orders synced`);
  return { success, total };
}

/**
 * Sync completed orders that haven't been synced to financial transactions
 * Can be used as a maintenance function
 */
export async function syncMissingOrderTransactions(userId: string): Promise<void> {
  try {
    logger.info('🔄 Checking for orders missing financial sync...');

    // Get all completed orders
    const { data: completedOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, nomor_pesanan, total_pesanan, tanggal, status')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (ordersError) {
      logger.error('Error fetching completed orders:', ordersError);
      return;
    }

    if (!completedOrders || completedOrders.length === 0) {
      logger.info('No completed orders found');
      return;
    }

    // Get existing financial transactions for orders
    const orderNumbers = completedOrders.map(o => `Pesanan ${o.nomor_pesanan}`);
    const { data: existingTransactions, error: transError } = await supabase
      .from('financial_transactions')
      .select('description')
      .eq('user_id', userId)
      .eq('type', 'income')
      .in('description', orderNumbers);

    if (transError) {
      logger.error('Error fetching existing transactions:', transError);
      return;
    }

    const existingDescriptions = new Set(
      (existingTransactions || []).map(t => t.description)
    );

    // Find orders without financial transactions
    const missingOrders = completedOrders.filter(order => 
      !existingDescriptions.has(`Pesanan ${order.nomor_pesanan}`)
    );

    if (missingOrders.length === 0) {
      logger.info('✅ All completed orders already have financial transactions');
      return;
    }

    logger.info(`📈 Found ${missingOrders.length} orders without financial sync`);

    // Bulk create missing transactions
    const transactionData = missingOrders.map(order => ({
      user_id: userId,
      type: 'income',
      category: 'Penjualan',
      amount: order.total_pesanan,
      description: `Pesanan ${order.nomor_pesanan}`,
      date: new Date(order.tanggal).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('financial_transactions')
      .insert(transactionData)
      .select();

    if (error) {
      logger.error('Error bulk creating financial transactions:', error);
      return;
    }

    logger.success(`✅ Created ${data?.length || 0} financial transactions for missing orders`);

  } catch (error) {
    logger.error('Critical error in sync missing orders:', error);
  }
}

/**
 * Remove financial transaction when order is cancelled or deleted
 */
export async function removeSyncedOrderTransaction(
  orderNumber: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('user_id', userId)
      .eq('type', 'income')
      .eq('description', `Pesanan ${orderNumber}`);

    if (error) {
      logger.error('Error removing synced financial transaction:', error);
      return false;
    }

    logger.info('✅ Removed financial transaction for order:', orderNumber);
    return true;
  } catch (error) {
    logger.error('Critical error removing synced transaction:', error);
    return false;
  }
}
