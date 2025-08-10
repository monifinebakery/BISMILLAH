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
import { orderApi } from '../api/orderApi';

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