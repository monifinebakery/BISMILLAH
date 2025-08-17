// src/components/orders/api/orderApi.ts - API Layer untuk Order Operations
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Order, OrderDB, NewOrder, OrderStatus } from '../types';
import { transformOrderFromDB, transformOrderToDB } from '../utils';

/**
 * Order API - Centralized API operations untuk orders
 */
export const orderApi = {
  /**
   * Fetch all orders untuk user tertentu
   */
  async getOrders(userId: string): Promise<Order[]> {
    try {
      logger.debug('OrderAPI: Fetching orders for user:', userId);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('OrderAPI: Error fetching orders:', error);
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }

      if (!data) {
        logger.debug('OrderAPI: No orders found for user:', userId);
        return [];
      }

      const transformedOrders = data
        .map((item: OrderDB) => {
          try {
            return transformOrderFromDB(item);
          } catch (transformError) {
            logger.error('OrderAPI: Error transforming order:', transformError, item);
            return null;
          }
        })
        .filter(Boolean) as Order[];

      logger.debug('OrderAPI: Successfully fetched orders:', transformedOrders.length);
      return transformedOrders;
    } catch (error) {
      logger.error('OrderAPI: getOrders failed:', error);
      throw error;
    }
  },

  /**
   * Get single order by ID
   */
  async getOrderById(orderId: string, userId: string): Promise<Order | null> {
    try {
      logger.debug('OrderAPI: Fetching order by ID:', orderId);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        logger.error('OrderAPI: Error fetching order by ID:', error);
        throw new Error(`Failed to fetch order: ${error.message}`);
      }

      return transformOrderFromDB(data);
    } catch (error) {
      logger.error('OrderAPI: getOrderById failed:', error);
      throw error;
    }
  },

  /**
   * Create new order menggunakan stored procedure
   */
  async createOrder(orderData: any): Promise<OrderDB> {
    try {
      logger.debug('OrderAPI: Creating new order:', orderData);
      
      const { data, error } = await supabase.rpc('create_new_order', {
        order_data: orderData,
      });

      if (error) {
        logger.error('OrderAPI: Error creating order:', error);
        throw new Error(`Failed to create order: ${error.message}`);
      }

      const result = Array.isArray(data) ? data[0] : data;
      logger.debug('OrderAPI: Successfully created order:', result?.id);
      
      return result;
    } catch (error) {
      logger.error('OrderAPI: createOrder failed:', error);
      throw error;
    }
  },

  /**
   * Update existing order
   */
  async updateOrder(id: string, updateData: Partial<Order>, userId: string): Promise<OrderDB> {
    try {
      logger.debug('OrderAPI: Updating order:', id, updateData);
      
      const dbData = transformOrderToDB(updateData);
      const { data, error } = await supabase
        .from('orders')
        .update(dbData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        logger.error('OrderAPI: Error updating order:', error);
        throw new Error(`Failed to update order: ${error.message}`);
      }

      logger.debug('OrderAPI: Successfully updated order:', id);
      return data;
    } catch (error) {
      logger.error('OrderAPI: updateOrder failed:', error);
      throw error;
    }
  },

  /**
   * Check if order can be completed (stock validation)
   */
  async canCompleteOrder(orderId: string): Promise<{
    canComplete: boolean;
    totalIngredients: number;
    availableIngredients: number;
    insufficientStock: any[];
  }> {
    try {
      logger.debug('OrderAPI: Checking if order can be completed:', orderId);
      
      const { data, error } = await supabase.rpc('can_complete_order', {
        order_id: orderId
      });
      
      if (error) {
        logger.error('OrderAPI: Error checking order completion:', error);
        throw new Error(`Failed to check order completion: ${error.message}`);
      }
      
      logger.debug('OrderAPI: Order completion check result:', data);
      return {
        canComplete: data?.can_complete || false,
        totalIngredients: data?.total_ingredients || 0,
        availableIngredients: data?.available_ingredients || 0,
        insufficientStock: data?.insufficient_stock || []
      };
    } catch (error) {
      logger.error('OrderAPI: canCompleteOrder failed:', error);
      throw error;
    }
  },

  /**
   * Complete order dan deduct stock menggunakan stored procedure
   */
  async completeOrder(orderId: string): Promise<{
    success: boolean;
    message?: string;
    orderNumber?: string;
    totalAmount?: number;
    stockItemsUpdated?: number;
    error?: string;
    details?: string[];
  }> {
    try {
      logger.debug('OrderAPI: Completing order:', orderId);
      
      const { data, error } = await supabase.rpc('complete_order_and_deduct_stock', { 
        order_id: orderId 
      });
      
      if (error) {
        logger.error('OrderAPI: Error completing order:', error);
        throw new Error(`Failed to complete order: ${error.message}`);
      }
      
      // Parse the JSON response from stored procedure
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      logger.debug('OrderAPI: Order completion result:', result);
      
      if (!result.success) {
        logger.warn('OrderAPI: Order completion failed:', result.error);
        return {
          success: false,
          error: result.error,
          details: result.details || []
        };
      }

      logger.debug('OrderAPI: Successfully completed order:', orderId);
      return {
        success: true,
        message: result.message,
        orderNumber: result.order_number,
        totalAmount: result.total_amount,
        stockItemsUpdated: result.stock_items_updated
      };
    } catch (error) {
      logger.error('OrderAPI: completeOrder failed:', error);
      throw error;
    }
  },

  /**
   * Reverse order completion (restore stock)
   */
  async reverseOrderCompletion(orderId: string): Promise<{
    success: boolean;
    message?: string;
    stockItemsRestored?: number;
    error?: string;
  }> {
    try {
      logger.debug('OrderAPI: Reversing order completion:', orderId);
      
      const { data, error } = await supabase.rpc('reverse_order_completion', {
        order_id: orderId
      });
      
      if (error) {
        logger.error('OrderAPI: Error reversing order completion:', error);
        throw new Error(`Failed to reverse order completion: ${error.message}`);
      }
      
      // Parse the JSON response from stored procedure
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      logger.debug('OrderAPI: Order reversal result:', result);
      
      return {
        success: result.success,
        message: result.message,
        stockItemsRestored: result.stock_items_restored,
        error: result.error
      };
    } catch (error) {
      logger.error('OrderAPI: reverseOrderCompletion failed:', error);
      throw error;
    }
  },

  /**
   * Delete order
   */
  async deleteOrder(id: string, userId: string): Promise<boolean> {
    try {
      logger.debug('OrderAPI: Deleting order:', id);
      
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) {
        logger.error('OrderAPI: Error deleting order:', error);
        throw new Error(`Failed to delete order: ${error.message}`);
      }

      logger.debug('OrderAPI: Successfully deleted order:', id);
      return true;
    } catch (error) {
      logger.error('OrderAPI: deleteOrder failed:', error);
      throw error;
    }
  },

  /**
   * Bulk update status untuk multiple orders
   */
  async bulkUpdateStatus(orderIds: string[], newStatus: OrderStatus, userId: string): Promise<boolean> {
    try {
      logger.debug('OrderAPI: Bulk updating status:', orderIds.length, 'orders to', newStatus);
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .in('id', orderIds)
        .eq('user_id', userId);

      if (error) {
        logger.error('OrderAPI: Error bulk updating status:', error);
        throw new Error(`Failed to bulk update status: ${error.message}`);
      }

      logger.debug('OrderAPI: Successfully bulk updated status for', orderIds.length, 'orders');
      return true;
    } catch (error) {
      logger.error('OrderAPI: bulkUpdateStatus failed:', error);
      throw error;
    }
  },

  /**
   * Bulk delete multiple orders
   */
  async bulkDeleteOrders(orderIds: string[], userId: string): Promise<boolean> {
    try {
      logger.debug('OrderAPI: Bulk deleting orders:', orderIds.length, 'orders');
      
      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds)
        .eq('user_id', userId);

      if (error) {
        logger.error('OrderAPI: Error bulk deleting orders:', error);
        throw new Error(`Failed to bulk delete orders: ${error.message}`);
      }

      logger.debug('OrderAPI: Successfully bulk deleted', orderIds.length, 'orders');
      return true;
    } catch (error) {
      logger.error('OrderAPI: bulkDeleteOrders failed:', error);
      throw error;
    }
  },

  /**
   * Get order statistics
   */
  async getOrderStats(userId: string): Promise<any> {
    try {
      logger.debug('OrderAPI: Fetching order statistics for user:', userId);
      
      const { data, error } = await supabase.rpc('get_order_statistics', {
        user_id: userId
      });

      if (error) {
        logger.error('OrderAPI: Error fetching order stats:', error);
        throw new Error(`Failed to fetch order statistics: ${error.message}`);
      }

      logger.debug('OrderAPI: Successfully fetched order statistics');
      return data;
    } catch (error) {
      logger.error('OrderAPI: getOrderStats failed:', error);
      throw error;
    }
  },

  /**
   * Search orders dengan filters
   */
  async searchOrders(userId: string, filters: {
    searchTerm?: string;
    status?: OrderStatus;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Order[]> {
    try {
      logger.debug('OrderAPI: Searching orders with filters:', filters);
      
      let query = supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId);

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters.searchTerm) {
        query = query.or(`nama_pelanggan.ilike.%${filters.searchTerm}%,telepon_pelanggan.ilike.%${filters.searchTerm}%,email_pelanggan.ilike.%${filters.searchTerm}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('OrderAPI: Error searching orders:', error);
        throw new Error(`Failed to search orders: ${error.message}`);
      }

      const transformedOrders = (data || [])
        .map((item: OrderDB) => {
          try {
            return transformOrderFromDB(item);
          } catch (transformError) {
            logger.error('OrderAPI: Error transforming search result:', transformError, item);
            return null;
          }
        })
        .filter(Boolean) as Order[];

      logger.debug('OrderAPI: Successfully searched orders:', transformedOrders.length, 'results');
      return transformedOrders;
    } catch (error) {
      logger.error('OrderAPI: searchOrders failed:', error);
      throw error;
    }
  }
};

export default orderApi;