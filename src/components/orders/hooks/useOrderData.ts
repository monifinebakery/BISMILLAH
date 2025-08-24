// src/components/orders/hooks/useOrderData.ts
// ✅ STANDARDIZED: Data hooks with query keys pattern following other modules

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Services and types
import * as orderService from '../services/orderService';
import type { Order, NewOrder, OrderStatus } from '../types';

// ✅ STANDARDIZED: Query keys pattern consistent with other modules
export const orderQueryKeys = {
  all: ['orders'] as const,
  lists: () => [...orderQueryKeys.all, 'list'] as const,
  list: (userId?: string) => [...orderQueryKeys.lists(), userId] as const,
  details: () => [...orderQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderQueryKeys.details(), id] as const,
  stats: (userId?: string) => [...orderQueryKeys.all, 'stats', userId] as const,
  search: (query: string) => [...orderQueryKeys.all, 'search', query] as const,
  byStatus: (status: string, userId?: string) => [...orderQueryKeys.all, 'status', status, userId] as const,
} as const;

/**
 * Hook for fetching orders data
 */
export const useOrderData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: orderQueryKeys.list(user?.id),
    queryFn: () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return orderService.fetchOrders(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for order operations (add, update, delete)
 */
export const useOrderOperations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Add order mutation
  const addOrderMutation = useMutation({
    mutationFn: (order: NewOrder) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return orderService.addOrder(user.id, order);
    },
    onMutate: async (newOrder) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: orderQueryKeys.list(user?.id) 
      });

      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData(
        orderQueryKeys.list(user?.id)
      );

      // Optimistic update
      const optimisticOrder: Order = {
        id: `temp-${Date.now()}`,
        userId: user?.id || '',
        nomorPesanan: `ORD-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        tanggal: newOrder.tanggal || new Date(),
        status: newOrder.status || 'pending',
        subtotal: newOrder.subtotal || 0,
        pajak: newOrder.pajak || 0,
        totalPesanan: newOrder.totalPesanan || 0,
        ...newOrder,
      };

      queryClient.setQueryData(
        orderQueryKeys.list(user?.id),
        (old: Order[] = []) => [optimisticOrder, ...old]
      );

      return { previousOrders };
    },
    onError: (err, newOrder, context) => {
      // Rollback on error
      if (context?.previousOrders) {
        queryClient.setQueryData(
          orderQueryKeys.list(user?.id),
          context.previousOrders
        );
      }
      toast.error(`Gagal menambah pesanan: ${err.message}`);
    },
    onSuccess: (newOrder) => {
      // Replace optimistic update with real data
      queryClient.setQueryData(
        orderQueryKeys.list(user?.id),
        (old: Order[] = []) => {
          return old.map(order => 
            order.id.startsWith('temp-') && order.nomorPesanan?.startsWith('ORD-')
              ? newOrder
              : order
          );
        }
      );
      toast.success('Pesanan berhasil ditambahkan');
    },
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Order> }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return orderService.updateOrder(user.id, id, data);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ 
        queryKey: orderQueryKeys.list(user?.id) 
      });

      const previousOrders = queryClient.getQueryData(
        orderQueryKeys.list(user?.id)
      );

      // Optimistic update
      queryClient.setQueryData(
        orderQueryKeys.list(user?.id),
        (old: Order[] = []) => old.map(order => 
          order.id === id ? { ...order, ...data, updatedAt: new Date() } : order
        )
      );

      return { previousOrders };
    },
    onError: (err, variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(
          orderQueryKeys.list(user?.id),
          context.previousOrders
        );
      }
      toast.error(`Gagal memperbarui pesanan: ${err.message}`);
    },
    onSuccess: () => {
      toast.success('Pesanan berhasil diperbarui');
    },
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return orderService.updateOrderStatus(user.id, id, status);
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ 
        queryKey: orderQueryKeys.list(user?.id) 
      });

      const previousOrders = queryClient.getQueryData(
        orderQueryKeys.list(user?.id)
      );

      // Optimistic update
      queryClient.setQueryData(
        orderQueryKeys.list(user?.id),
        (old: Order[] = []) => old.map(order => 
          order.id === id ? { ...order, status, updatedAt: new Date() } : order
        )
      );

      return { previousOrders };
    },
    onError: (err, variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(
          orderQueryKeys.list(user?.id),
          context.previousOrders
        );
      }
      toast.error(`Gagal mengubah status: ${err.message}`);
    },
    onSuccess: (_, { status }) => {
      toast.success(`Status berhasil diubah ke ${status}`);
    },
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return orderService.deleteOrder(user.id, id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ 
        queryKey: orderQueryKeys.list(user?.id) 
      });

      const previousOrders = queryClient.getQueryData(
        orderQueryKeys.list(user?.id)
      );

      // Optimistic update
      queryClient.setQueryData(
        orderQueryKeys.list(user?.id),
        (old: Order[] = []) => old.filter(order => order.id !== id)
      );

      return { previousOrders };
    },
    onError: (err, id, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(
          orderQueryKeys.list(user?.id),
          context.previousOrders
        );
      }
      toast.error(`Gagal menghapus pesanan: ${err.message}`);
    },
    onSuccess: () => {
      toast.success('Pesanan berhasil dihapus');
    },
  });

  return {
    addOrder: addOrderMutation.mutateAsync,
    updateOrder: ({ id, data }: { id: string; data: Partial<Order> }) => 
      updateOrderMutation.mutateAsync({ id, data }),
    updateOrderStatus: ({ id, status }: { id: string; status: OrderStatus }) => 
      updateStatusMutation.mutateAsync({ id, status }),
    deleteOrder: deleteOrderMutation.mutateAsync,
    isLoading: 
      addOrderMutation.isPending || 
      updateOrderMutation.isPending || 
      updateStatusMutation.isPending || 
      deleteOrderMutation.isPending,
  };
};

/**
 * Hook for order statistics
 */
export const useOrderStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: orderQueryKeys.stats(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const orders = await orderService.fetchOrders(user.id);
      
      // Calculate statistics
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPesanan || 0), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      const statusCounts = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayOrders = orders.filter(o => new Date(o.tanggal) >= startOfToday).length;

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        statusCounts,
        todayOrders,
      };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook for React Query utility functions
 */
export const useOrderQuery = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidateOrders = () => {
    queryClient.invalidateQueries({
      queryKey: orderQueryKeys.list(user?.id)
    });
  };

  const invalidateOrderStats = () => {
    queryClient.invalidateQueries({
      queryKey: orderQueryKeys.stats(user?.id)
    });
  };

  const prefetchOrders = () => {
    if (user?.id) {
      queryClient.prefetchQuery({
        queryKey: orderQueryKeys.list(user.id),
        queryFn: () => orderService.fetchOrders(user.id),
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  const getOrdersFromCache = (): Order[] | undefined => {
    return queryClient.getQueryData(orderQueryKeys.list(user?.id));
  };

  return {
    invalidateOrders,
    invalidateOrderStats,
    prefetchOrders,
    getOrdersFromCache,
  };
};