// src/components/orders/hooks/useOrderStats.ts - Hook for calculating order statistics

import { useMemo } from 'react';
import { logger } from '@/utils/logger';
import type { Order } from '../types';

interface OrderStatsData {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  todayOrders: number;
  averageOrderValue: number;
  // Breakdown by status
  statusBreakdown: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    completed: number;
    cancelled: number;
  };
  // Trend data untuk perbandingan (optional untuk future enhancement)
  trends?: {
    totalOrders?: TrendData;
    totalRevenue?: TrendData;
    pendingOrders?: TrendData;
    completedOrders?: TrendData;
  };
}

interface TrendData {
  type: 'up' | 'down' | 'flat';
  percentage: number;
  previousValue?: number;
  period?: string;
}

export const useOrderStats = (orders: Order[]): {
  stats: OrderStatsData;
  isCalculating: boolean;
} => {
  const stats = useMemo(() => {
    try {
      if (!Array.isArray(orders)) {
        logger.warn('useOrderStats: orders is not an array:', orders);
        return getEmptyStats();
      }

      if (orders.length === 0) {
        logger.debug('useOrderStats: No orders found, returning empty stats');
        return getEmptyStats();
      }

      logger.debug('useOrderStats: Calculating stats for orders:', orders.length);

      // Get today's date for filtering today's orders
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Calculate basic metrics
      const totalOrders = orders.length;
      
      // Calculate total revenue dari semua orders (regardless of status)
      const totalRevenue = orders.reduce((sum, order: any) => {
        const orderTotal = Number(order.total_pesanan ?? order.totalPesanan ?? order.total_amount) || 0;
        return sum + orderTotal;
      }, 0);

      // Status breakdown
      const statusBreakdown = {
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        completed: 0,
        cancelled: 0
      };

      orders.forEach(order => {
        if (order.status && statusBreakdown.hasOwnProperty(order.status)) {
          statusBreakdown[order.status as keyof typeof statusBreakdown]++;
        }
      });

      // Calculate pending and completed orders
      const pendingOrders = statusBreakdown.pending + statusBreakdown.confirmed + statusBreakdown.processing + statusBreakdown.shipped;
      const completedOrders = statusBreakdown.completed;

      // Calculate today's orders
      const todayOrders = orders.filter(order => {
        try {
          const orderDate = new Date(order.tanggal);
          return orderDate >= todayStart && orderDate <= todayEnd;
        } catch (error) {
          logger.warn('useOrderStats: Invalid order date:', order.tanggal);
          return false;
        }
      }).length;

      // Calculate average order value (AOV)
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const calculatedStats: OrderStatsData = {
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders,
        todayOrders,
        averageOrderValue,
        statusBreakdown
      };

      logger.success('useOrderStats: Stats calculated successfully:', {
        totalOrders: calculatedStats.totalOrders,
        totalRevenue: calculatedStats.totalRevenue,
        pendingOrders: calculatedStats.pendingOrders,
        completedOrders: calculatedStats.completedOrders,
        todayOrders: calculatedStats.todayOrders,
        averageOrderValue: calculatedStats.averageOrderValue
      });

      return calculatedStats;

    } catch (error) {
      logger.error('useOrderStats: Error calculating stats:', error);
      return getEmptyStats();
    }
  }, [orders]);

  // Check if we're still calculating (for loading state)
  const isCalculating = useMemo(() => {
    return !orders || orders.length === 0;
  }, [orders]);

  return {
    stats,
    isCalculating
  };
};

// Helper function untuk empty stats
function getEmptyStats(): OrderStatsData {
  return {
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    todayOrders: 0,
    averageOrderValue: 0,
    statusBreakdown: {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      completed: 0,
      cancelled: 0
    }
  };
}

export default useOrderStats;
