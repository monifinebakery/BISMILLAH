// src/components/invoice/hooks/useInvoiceQuery.tsx
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { invoiceQueryKeys, invoiceApi } from '../api';
import type { OrderData } from '../types';

export const useOrderQuery = (orderId?: string) => {
  return useQuery({
    queryKey: invoiceQueryKeys.order(orderId || ''),
    queryFn: () => {
      if (!orderId) throw new Error('Order ID is required');
      
      // Use mock data for development - replace with real API call
      // return invoiceApi.getOrderById(orderId);
      return invoiceApi.getMockOrderById(orderId);
    },
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404 errors
      if (error?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useInvoiceQueryUtils = () => {
  const queryClient = useQueryClient();

  const invalidateOrder = useCallback((orderId: string) => {
    queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.order(orderId) });
  }, [queryClient]);

  const prefetchOrder = useCallback((orderId: string) => {
    queryClient.prefetchQuery({
      queryKey: invoiceQueryKeys.order(orderId),
      queryFn: () => invoiceApi.getMockOrderById(orderId), // Replace with real API
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  const getOrderFromCache = useCallback((orderId: string): OrderData | undefined => {
    return queryClient.getQueryData(invoiceQueryKeys.order(orderId));
  }, [queryClient]);

  return {
    invalidateOrder,
    prefetchOrder,
    getOrderFromCache,
  };
};