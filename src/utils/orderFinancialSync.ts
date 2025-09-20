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

    // Create financial income transaction with conflict handling
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

    // Use insert with conflict handling to prevent race conditions
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violations (race condition when same transaction created twice)
      if (error.code === '23505') { // Unique violation
        logger.debug('Financial transaction already exists for order:', order.nomorPesanan);
        return true;
      }
      
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

  // Process orders in smaller batches to reduce contention
  const batchSize = 10;
  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = orders.slice(i, i + batchSize);
    const batchPromises = batch.map(order => syncOrderToFinancialTransaction(order, userId));
    
    try {
      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          success++;
        } else if (result.status === 'rejected') {
          logger.error('Error in bulk sync for order:', result.reason);
        }
      });
    } catch (error) {
      logger.error('Error processing batch:', error);
    }
    
    // Add a small delay between batches to reduce database load
    if (i + batchSize < orders.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
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

    // Process in smaller batches to reduce contention
    const batchSize = 20;
    for (let i = 0; i < completedOrders.length; i += batchSize) {
      const batch = completedOrders.slice(i, i + batchSize);
      
      // Get existing financial transactions for this batch
      const orderNumbers = batch.map(o => `Pesanan ${o.nomor_pesanan}`);
      const { data: existingTransactions, error: transError } = await supabase
        .from('financial_transactions')
        .select('description')
        .eq('user_id', userId)
        .eq('type', 'income')
        .in('description', orderNumbers);

      if (transError) {
        logger.error('Error fetching existing transactions:', transError);
        continue;
      }

      const existingDescriptions = new Set(
        (existingTransactions || []).map(t => t.description)
      );

      // Find orders without financial transactions
      const missingOrders = batch.filter(order => 
        !existingDescriptions.has(`Pesanan ${order.nomor_pesanan}`)
      );

      if (missingOrders.length === 0) {
        logger.info(`✅ All orders in batch ${Math.floor(i/batchSize) + 1} already have financial transactions`);
        continue;
      }

      logger.info(`📈 Found ${missingOrders.length} orders without financial sync in batch ${Math.floor(i/batchSize) + 1}`);

      // Create missing transactions for this batch
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
        continue;
      }

      logger.success(`✅ Created ${data?.length || 0} financial transactions for missing orders in batch ${Math.floor(i/batchSize) + 1}`);
      
      // Add a small delay between batches to reduce database load
      if (i + batchSize < completedOrders.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

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
