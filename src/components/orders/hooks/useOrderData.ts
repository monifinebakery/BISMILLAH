// 🎯 RACE CONDITION FIX - Using React Query pattern for better data consistency
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { formatCurrency } from '@/utils/formatUtils';
import type { Order, NewOrder, UseOrderDataReturn } from '../types';
import { transformOrderFromDB, transformOrderToDB, toSafeISOString, validateOrderData, safeParseDate, isValidDate } from '../utils';
import { getStatusText } from '../constants';

// ===== QUERY KEYS =====
export const orderQueryKeys = {
  all: ['orders'] as const,
  lists: () => [...orderQueryKeys.all, 'list'] as const,
  list: (userId?: string) => [...orderQueryKeys.lists(), userId] as const,
  details: () => [...orderQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderQueryKeys.details(), id] as const,
  stats: (userId?: string) => [...orderQueryKeys.all, 'stats', userId] as const,
} as const;

// ===== ORDER API FUNCTIONS =====
const orderApi = {
  async getOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('tanggal', { ascending: false });

    if (error) throw new Error(error.message);

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
  },

  async createOrder(orderData: any): Promise<any> {
    const { data, error } = await supabase.rpc('create_new_order', {
      order_data: orderData,
    });

    if (error) throw new Error(error.message);
    return Array.isArray(data) ? data[0] : data;
  },

  async updateOrder(id: string, updateData: any, userId: string): Promise<any> {
    const dbData = transformOrderToDB(updateData);
    const { data, error } = await supabase
      .from('orders')
      .update(dbData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async completeOrder(id: string): Promise<any> {
    const { error } = await supabase.rpc('complete_order_and_deduct_stock', { 
      order_id: id 
    });
    if (error) throw new Error(error.message);
    return { success: true };
  },

  async deleteOrder(id: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw new Error(error.message);
    return true;
  },

  async bulkUpdateStatus(orderIds: string[], newStatus: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .in('id', orderIds)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return true;
  },

  async bulkDeleteOrders(orderIds: string[], userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .delete()
      .in('id', orderIds)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return true;
  }
};

// ===== CUSTOM HOOKS =====

/**
 * Hook for fetching orders with React Query
 */
const useOrdersQuery = (userId?: string) => {
  return useQuery({
    queryKey: orderQueryKeys.list(userId),
    queryFn: () => orderApi.getOrders(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for order mutations
 */
const useOrderMutations = (
  user: any,
  addActivity: any,
  addFinancialTransaction: any,
  settings: any,
  addNotification: any
) => {
  const queryClient = useQueryClient();

  // Add order mutation
  const addMutation = useMutation({
    mutationFn: async (order: NewOrder) => {
      if (!user) throw new Error('User tidak ditemukan');

      const validation = validateOrderData(order);
      if (!validation.isValid) {
        throw new Error(`Data tidak valid: ${validation.errors.join(', ')}`);
      }

      const orderData = {
        user_id: user.id,
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
      };

      return orderApi.createOrder(orderData);
    },
    onMutate: async (newOrder) => {
      // ✅ Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ 
        queryKey: orderQueryKeys.list(user?.id) 
      });

      // ✅ Snapshot previous value for rollback
      const previousOrders = queryClient.getQueryData(orderQueryKeys.list(user?.id));

      // ✅ Optimistic update
      const optimisticOrder: Order = {
        id: `temp-${Date.now()}`,
        userId: user?.id || '',
        nomorPesanan: `TEMP-${Date.now()}`,
        tanggal: newOrder.tanggal || new Date(),
        status: newOrder.status || 'pending',
        namaPelanggan: newOrder.namaPelanggan,
        teleponPelanggan: newOrder.teleponPelanggan || '',
        emailPelanggan: newOrder.emailPelanggan || '',
        alamatPengiriman: newOrder.alamatPengiriman || '',
        items: newOrder.items || [],
        subtotal: newOrder.subtotal || 0,
        pajak: newOrder.pajak || 0,
        totalPesanan: newOrder.totalPesanan || 0,
        catatan: newOrder.catatan || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(
        orderQueryKeys.list(user?.id),
        (old: Order[] = []) => [optimisticOrder, ...old].sort((a, b) => 
          new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        )
      );

      return { previousOrders };
    },
    onError: (error: any, variables, context) => {
      // ✅ Rollback on error
      if (context?.previousOrders) {
        queryClient.setQueryData(orderQueryKeys.list(user?.id), context.previousOrders);
      }
      
      const errorMessage = error.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal menambahkan pesanan: ${errorMessage}`);
      logger.error('OrderData: Add mutation error:', error);
    },
    onSuccess: (createdOrder, variables) => {
      // ✅ Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.list(user?.id) });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.stats(user?.id) });

      if (addActivity && typeof addActivity === 'function') {
        addActivity({ 
          title: 'Pesanan Baru Dibuat', 
          description: `Pesanan #${createdOrder.nomor_pesanan} dari ${createdOrder.nama_pelanggan} telah dibuat.`,
          type: 'order'
        });
      }

      toast.success(`Pesanan #${createdOrder.nomor_pesanan} baru berhasil ditambahkan!`);

      if (addNotification && typeof addNotification === 'function') {
        addNotification({
          title: '🛍️ Pesanan Baru Dibuat!',
          message: `Pesanan #${createdOrder.nomor_pesanan} dari ${createdOrder.nama_pelanggan} berhasil dibuat dengan total ${formatCurrency(createdOrder.total_pesanan)}`,
          type: 'success',
          icon: 'shopping-cart',
          priority: 2,
          related_type: 'order',
          related_id: createdOrder.id,
          action_url: '/orders',
          is_read: false,
          is_archived: false
        });
      }

      logger.debug('OrderData: Successfully added order:', createdOrder.id);
    }
  });

  // Update order mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updatedData }: { id: string; updatedData: Partial<Order> }) => {
      if (!user) throw new Error('User tidak ditemukan');

      const orders = queryClient.getQueryData(orderQueryKeys.list(user.id)) as Order[] || [];
      const oldOrder = orders.find(o => o.id === id);
      if (!oldOrder) throw new Error('Pesanan tidak ditemukan');

      const oldStatus = oldOrder.status;
      const newStatus = updatedData.status;
      const isCompletingOrder = oldStatus !== 'completed' && newStatus === 'completed';

      if (isCompletingOrder) {
        await orderApi.completeOrder(id);

        // Handle financial transaction
        try {
          const incomeCategory = settings?.financialCategories?.income?.[0] || 'Penjualan Produk';
          if (addFinancialTransaction && typeof addFinancialTransaction === 'function') {
            await addFinancialTransaction({
              type: 'income',
              category: incomeCategory,
              description: `Penjualan dari pesanan #${oldOrder.nomorPesanan}`,
              amount: oldOrder.totalPesanan,
              date: new Date(),
              relatedId: oldOrder.id,
            });
          }
        } catch (financialError) {
          logger.error('OrderData: Error adding financial transaction:', financialError);
        }

        return { ...oldOrder, status: 'completed', updatedAt: new Date() };
      } else {
        return orderApi.updateOrder(id, updatedData, user.id);
      }
    },
    onMutate: async ({ id, updatedData }) => {
      // ✅ Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: orderQueryKeys.list(user?.id) });

      const previousOrders = queryClient.getQueryData(orderQueryKeys.list(user?.id));

      // ✅ Optimistic update
      queryClient.setQueryData(
        orderQueryKeys.list(user?.id),
        (old: Order[] = []) =>
          old.map(order =>
            order.id === id
              ? { ...order, ...updatedData, updatedAt: new Date() }
              : order
          )
      );

      return { previousOrders };
    },
    onError: (error: any, variables, context) => {
      // ✅ Rollback on error
      if (context?.previousOrders) {
        queryClient.setQueryData(orderQueryKeys.list(user?.id), context.previousOrders);
      }
      
      const errorMessage = error.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal memperbarui pesanan: ${errorMessage}`);
      logger.error('OrderData: Update mutation error:', error);
    },
    onSuccess: (updatedOrder, { id, updatedData }) => {
      // ✅ Invalidate queries
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.list(user?.id) });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.stats(user?.id) });

      const orders = queryClient.getQueryData(orderQueryKeys.list(user?.id)) as Order[] || [];
      const oldOrder = orders.find(o => o.id === id);

      if (updatedData.status === 'completed') {
        if (addActivity && typeof addActivity === 'function') {
          addActivity({
            title: 'Pesanan Selesai',
            description: `Pesanan #${oldOrder?.nomorPesanan} lunas, stok diperbarui.`,
            type: 'order',
          });
        }

        toast.success(`Pesanan #${oldOrder?.nomorPesanan} selesai, stok dikurangi, & pemasukan dicatat!`);

        if (addNotification && typeof addNotification === 'function') {
          addNotification({
            title: '🎉 Pesanan Selesai!',
            message: `Pesanan #${oldOrder?.nomorPesanan} telah selesai. Revenue ${formatCurrency(oldOrder?.totalPesanan || 0)} tercatat dan stok diperbarui.`,
            type: 'success',
            icon: 'check-circle',
            priority: 2,
            related_type: 'order',
            related_id: id,
            action_url: '/orders',
            is_read: false,
            is_archived: false
          });
        }
      } else {
        toast.success(`Pesanan #${oldOrder?.nomorPesanan} berhasil diperbarui.`);

        if (updatedData.status && oldOrder?.status !== updatedData.status && addNotification && typeof addNotification === 'function') {
          addNotification({
            title: '📝 Status Pesanan Diubah',
            message: `Pesanan #${oldOrder?.nomorPesanan} dari "${getStatusText(oldOrder?.status || '')}" menjadi "${getStatusText(updatedData.status)}"`,
            type: 'info',
            icon: 'refresh-cw',
            priority: 2,
            related_type: 'order',
            related_id: id,
            action_url: '/orders',
            is_read: false,
            is_archived: false
          });
        }
      }

      logger.debug('OrderData: Successfully updated order:', id);
    }
  });

  // Delete order mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User tidak ditemukan');
      return orderApi.deleteOrder(id, user.id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: orderQueryKeys.list(user?.id) });

      const previousOrders = queryClient.getQueryData(orderQueryKeys.list(user?.id)) as Order[];
      const orderToDelete = previousOrders?.find(o => o.id === id);

      // ✅ Optimistic update
      queryClient.setQueryData(
        orderQueryKeys.list(user?.id),
        (old: Order[] = []) => old.filter(o => o.id !== id)
      );

      return { previousOrders, orderToDelete };
    },
    onError: (error: any, id, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(orderQueryKeys.list(user?.id), context.previousOrders);
      }
      
      const errorMessage = error.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal menghapus pesanan: ${errorMessage}`);
      logger.error('OrderData: Delete mutation error:', error);
    },
    onSuccess: (result, id, context) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.list(user?.id) });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.stats(user?.id) });

      if (addActivity && typeof addActivity === 'function' && context?.orderToDelete) {
        addActivity({ 
          title: 'Pesanan Dihapus', 
          description: `Pesanan #${context.orderToDelete.nomorPesanan} telah dihapus`, 
          type: 'order' 
        });
      }

      toast.success('Pesanan berhasil dihapus.');
      logger.debug('OrderData: Successfully deleted order:', id);
    }
  });

  // Bulk update status mutation
  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ orderIds, newStatus }: { orderIds: string[]; newStatus: string }) => {
      if (!user) throw new Error('User tidak ditemukan');
      return orderApi.bulkUpdateStatus(orderIds, newStatus, user.id);
    },
    onSuccess: (result, { orderIds, newStatus }) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.list(user?.id) });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.stats(user?.id) });
      toast.success(`${orderIds.length} pesanan berhasil diubah statusnya ke ${getStatusText(newStatus)}`);
    },
    onError: (error: any) => {
      toast.error(`Gagal mengubah status: ${error.message || 'Unknown error'}`);
    }
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      if (!user) throw new Error('User tidak ditemukan');
      return orderApi.bulkDeleteOrders(orderIds, user.id);
    },
    onSuccess: (result, orderIds) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.list(user?.id) });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.stats(user?.id) });
      toast.success(`${orderIds.length} pesanan berhasil dihapus`);
    },
    onError: (error: any) => {
      toast.error(`Gagal menghapus pesanan: ${error.message || 'Unknown error'}`);
    }
  });

  return {
    addMutation,
    updateMutation,
    deleteMutation,
    bulkUpdateStatusMutation,
    bulkDeleteMutation
  };
};

// ===== MAIN HOOK =====
export const useOrderData = (
  user: any,
  addActivity: any,
  addFinancialTransaction: any,
  settings: any,
  addNotification: any
): UseOrderDataReturn => {
  
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // ✅ Fetch orders using React Query
  const {
    data: orders = [],
    isLoading,
    error,
    refetch
  } = useOrdersQuery(user?.id);

  // ✅ Get mutations
  const {
    addMutation,
    updateMutation,
    deleteMutation,
    bulkUpdateStatusMutation,
    bulkDeleteMutation
  } = useOrderMutations(user, addActivity, addFinancialTransaction, settings, addNotification);

  // ===== IMPROVED REAL-TIME SUBSCRIPTION =====
  useEffect(() => {
    if (!user?.id || !isMountedRef.current) {
      setIsConnected(false);
      return;
    }

    logger.debug('OrderData: Setting up real-time subscription for user:', user.id);
    
    const setupSubscription = () => {
      // Cleanup existing subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      const channelName = `orders_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const channel = supabase
        .channel(channelName, {
          config: {
            presence: { key: user.id },
            broadcast: { self: false },
            private: true
          },
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          if (!isMountedRef.current) {
            logger.debug('OrderData: Ignoring real-time event - component unmounted');
            return;
          }
          
          logger.debug('OrderData: Real-time event detected:', payload.eventType, payload.new?.id || payload.old?.id);
          
          // ✅ RACE CONDITION FIX: Use invalidateQueries instead of direct state manipulation
          // This ensures the single source of truth is always the database
          queryClient.invalidateQueries({ 
            queryKey: orderQueryKeys.list(user.id) 
          });
          
          queryClient.invalidateQueries({ 
            queryKey: orderQueryKeys.stats(user.id) 
          });

          // ✅ Optional: Trigger background refetch for immediate updates
          queryClient.refetchQueries({ 
            queryKey: orderQueryKeys.list(user.id),
            type: 'active' 
          });
        })
        .subscribe((status, err) => {
          if (!isMountedRef.current) return;
          
          logger.debug('OrderData: Subscription status:', status, err ? { error: err } : '');
          
          switch (status) {
            case 'SUBSCRIBED':
              setIsConnected(true);
              subscriptionRef.current = channel;
              logger.success('OrderData: Successfully subscribed to real-time updates');
              break;
              
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
            case 'CLOSED':
              logger.error('OrderData: Subscription error/timeout/closed:', status, err);
              setIsConnected(false);
              subscriptionRef.current = null;
              
              // ✅ Retry after delay
              setTimeout(() => {
                if (isMountedRef.current) {
                  setupSubscription();
                }
              }, 5000);
              break;
              
            default:
              logger.debug('OrderData: Unknown subscription status:', status);
          }
        });
    };

    setupSubscription();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user?.id, queryClient]);

  // ===== COMPONENT MOUNT/UNMOUNT TRACKING =====
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ===== CONTEXT FUNCTIONS =====
  const addOrder = useCallback(async (order: NewOrder): Promise<boolean> => {
    try {
      await addMutation.mutateAsync(order);
      return true;
    } catch (error) {
      return false;
    }
  }, [addMutation]);

  const updateOrder = useCallback(async (id: string, updatedData: Partial<Order>): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({ id, updatedData });
      return true;
    } catch (error) {
      return false;
    }
  }, [updateMutation]);

  const deleteOrder = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      return false;
    }
  }, [deleteMutation]);

  const bulkUpdateStatus = useCallback(async (orderIds: string[], newStatus: string): Promise<boolean> => {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      toast.error('Tidak ada pesanan yang dipilih');
      return false;
    }

    try {
      await bulkUpdateStatusMutation.mutateAsync({ orderIds, newStatus });
      return true;
    } catch (error) {
      return false;
    }
  }, [bulkUpdateStatusMutation]);

  const bulkDeleteOrders = useCallback(async (orderIds: string[]): Promise<boolean> => {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      toast.error('Tidak ada pesanan yang dipilih');
      return false;
    }

    try {
      await bulkDeleteMutation.mutateAsync(orderIds);
      return true;
    } catch (error) {
      return false;
    }
  }, [bulkDeleteMutation]);

  // ===== UTILITY FUNCTIONS =====
  const getOrderById = useCallback((id: string): Order | undefined => {
    return orders.find(order => order.id === id);
  }, [orders]);

  const getOrdersByStatus = useCallback((status: string): Order[] => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  const getOrdersByDateRange = useCallback((startDate: Date, endDate: Date): Order[] => {
    try {
      if (!isValidDate(startDate) || !isValidDate(endDate)) {
        logger.error('OrderData: Invalid dates for getOrdersByDateRange:', { startDate, endDate });
        return [];
      }
      
      return orders.filter(order => {
        try {
          const orderDate = safeParseDate(order.tanggal);
          if (!orderDate) return false;
          return orderDate >= startDate && orderDate <= endDate;
        } catch (error) {
          logger.error('OrderData: Error processing order date:', error, order);
          return false;
        }
      });
    } catch (error) {
      logger.error('OrderData: Error in getOrdersByDateRange:', error);
      return [];
    }
  }, [orders]);

  const refreshData = useCallback(async () => {
    logger.debug('OrderData: Manual refresh requested');
    await refetch();
  }, [refetch]);

  // ===== RETURN =====
  return {
    orders,
    loading: isLoading || addMutation.isPending || updateMutation.isPending || 
             deleteMutation.isPending || bulkUpdateStatusMutation.isPending || bulkDeleteMutation.isPending,
    isConnected,
    addOrder,
    updateOrder,
    deleteOrder,
    refreshData,
    getOrderById,
    getOrdersByStatus,
    getOrdersByDateRange,
    bulkUpdateStatus,
    bulkDeleteOrders,
  };
};