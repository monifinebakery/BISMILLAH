// 🎯 FULLY FIXED - useOrderData with race condition prevention and improved error handling
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { formatCurrency } from '@/utils/formatUtils';
import type { Order, NewOrder, OrderItem, OrderStatus } from '../types';
import { transformOrderFromDB, transformOrderToDB, toSafeISOString, validateOrderData, safeParseDate, isValidDate } from '../utils';
import { getStatusText } from '../constants';

// ===== IMPROVED QUERY KEYS =====
export const orderQueryKeys = {
  all: ['orders'] as const,
  lists: () => [...orderQueryKeys.all, 'list'] as const,
  list: (userId: string) => [...orderQueryKeys.lists(), { userId }] as const,
  details: () => [...orderQueryKeys.all, 'detail'] as const,
  detail: (id: string, userId: string) => [...orderQueryKeys.details(), { id, userId }] as const,
  stats: () => [...orderQueryKeys.all, 'stats'] as const,
  stat: (userId: string) => [...orderQueryKeys.stats(), { userId }] as const,
  // Mutation locks untuk prevent race conditions
  mutationLocks: () => ['orders', 'mutations'] as const,
  mutationLock: (type: string, id?: string) => [...orderQueryKeys.mutationLocks(), { type, id }] as const,
} as const;

// ===== ORDER API FUNCTIONS =====
const orderApi = {
  async getOrders(userId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('tanggal', { ascending: false });

      if (error) {
        logger.error('OrderAPI: Error fetching orders:', error);
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }

      if (!data) return [];

      return data
        .map(item => {
          try {
            return transformOrderFromDB(item);
          } catch (transformError) {
            logger.error('OrderAPI: Error transforming order:', transformError, item);
            return null;
          }
        })
        .filter(Boolean) as Order[];
    } catch (error) {
      logger.error('OrderAPI: getOrders failed:', error);
      throw error;
    }
  },

  async createOrder(orderData: any): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('create_new_order', {
        order_data: orderData,
      });

      if (error) {
        logger.error('OrderAPI: Error creating order:', error);
        throw new Error(`Failed to create order: ${error.message}`);
      }

      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      logger.error('OrderAPI: createOrder failed:', error);
      throw error;
    }
  },

  async updateOrder(id: string, updateData: any, userId: string): Promise<any> {
    try {
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

      return data;
    } catch (error) {
      logger.error('OrderAPI: updateOrder failed:', error);
      throw error;
    }
  },

  async completeOrder(id: string): Promise<any> {
    try {
      const { error } = await supabase.rpc('complete_order_and_deduct_stock', { 
        order_id: id 
      });
      
      if (error) {
        logger.error('OrderAPI: Error completing order:', error);
        throw new Error(`Failed to complete order: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      logger.error('OrderAPI: completeOrder failed:', error);
      throw error;
    }
  },

  async deleteOrder(id: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) {
        logger.error('OrderAPI: Error deleting order:', error);
        throw new Error(`Failed to delete order: ${error.message}`);
      }

      return true;
    } catch (error) {
      logger.error('OrderAPI: deleteOrder failed:', error);
      throw error;
    }
  },

  async bulkUpdateStatus(orderIds: string[], newStatus: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .in('id', orderIds)
        .eq('user_id', userId);

      if (error) {
        logger.error('OrderAPI: Error bulk updating status:', error);
        throw new Error(`Failed to bulk update status: ${error.message}`);
      }

      return true;
    } catch (error) {
      logger.error('OrderAPI: bulkUpdateStatus failed:', error);
      throw error;
    }
  },

  async bulkDeleteOrders(orderIds: string[], userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds)
        .eq('user_id', userId);

      if (error) {
        logger.error('OrderAPI: Error bulk deleting orders:', error);
        throw new Error(`Failed to bulk delete orders: ${error.message}`);
      }

      return true;
    } catch (error) {
      logger.error('OrderAPI: bulkDeleteOrders failed:', error);
      throw error;
    }
  }
};

// ===== QUERY OPTIONS =====
const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  retry: (failureCount: number, error: any) => {
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }
    return failureCount < 3;
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
}