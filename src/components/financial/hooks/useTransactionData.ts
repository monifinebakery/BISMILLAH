import { useState, useMemo, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { logger } from '@/utils/logger';

import {
  deleteFinancialTransaction,
  getFinancialTransactionsPaginated,
  getTransactionsByDateRange,
} from '../services/financialApi';
import type { FinancialTransaction } from '../types/financial';

const transactionQueryKeys = {
  all: ['financial'] as const,
  list: () => [...transactionQueryKeys.all, 'transactions'] as const,
  byRange: (from: Date, to?: Date) =>
    [...transactionQueryKeys.list(), 'range', from.toISOString(), to?.toISOString()] as const,
  paginated: (
    page: number,
    limit: number,
    from?: Date,
    to?: Date,
  ) =>
    [
      ...transactionQueryKeys.list(),
      'paginated',
      page,
      limit,
      from?.toISOString(),
      to?.toISOString(),
    ] as const,
};

interface LegacyTransactionData {
  transactions: FinancialTransaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

interface UseTransactionDataParams {
  dateRange?: { from: Date; to?: Date };
  userId?: string;
  useServerPagination: boolean;
  initialItemsPerPage: number;
  legacyData?: LegacyTransactionData;
  enabled?: boolean;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UseTransactionDataResult {
  transactions: FinancialTransaction[];
  visibleTransactions: FinancialTransaction[];
  paginationInfo: PaginationInfo | null;
  totalItems: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  itemsPerPage: number;
  setItemsPerPage: (value: number) => void;
  currentPage: number;
  handlePageChange: (page: number) => void;
  handleNextPage: () => void;
  handlePreviousPage: () => void;
  isLoading: boolean;
  isRefetching: boolean;
  showInitialLoading: boolean;
  showBackgroundLoading: boolean;
  onRefresh: () => void;
  lastUpdated?: Date;
  deleteTransaction: (id: string) => Promise<boolean>;
  isDeleting: boolean;
  error: unknown;
  hasTransactions: boolean;
}

const MAX_VISIBLE_ROWS = 10;

export const useTransactionData = ({
  dateRange,
  userId,
  useServerPagination,
  initialItemsPerPage,
  legacyData,
  enabled = true,
}: UseTransactionDataParams): UseTransactionDataResult => {
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [currentPage, setCurrentPage] = useState(1);

  const queryClient = useQueryClient();

  const hasLegacyTransactions = Boolean(legacyData?.transactions);
  const shouldFetch = enabled && !hasLegacyTransactions && Boolean(userId);

  const { data, isLoading, error, refetch, dataUpdatedAt, isRefetching } = useQuery({
    queryKey: useServerPagination
      ? transactionQueryKeys.paginated(
          currentPage,
          itemsPerPage,
          dateRange?.from,
          dateRange?.to,
        )
      : dateRange
        ? transactionQueryKeys.byRange(dateRange.from, dateRange.to)
        : transactionQueryKeys.list(),
    queryFn: async () => {
      if (!userId) {
        return useServerPagination
          ? { data: [], total: 0, page: 1, limit: itemsPerPage, totalPages: 0 }
          : [];
      }

      if (useServerPagination) {
        return getFinancialTransactionsPaginated(userId, {
          page: currentPage,
          limit: itemsPerPage,
        });
      }

      if (!dateRange?.from || !dateRange?.to) {
        return [];
      }

      return getTransactionsByDateRange(userId, dateRange.from, dateRange.to);
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: false,
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFinancialTransaction(id),
    onSuccess: success => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: transactionQueryKeys.list() });
        toast.success('Transaksi berhasil dihapus');
      } else {
        toast.error('Gagal menghapus transaksi');
      }
    },
    onError: (mutationError: Error) => {
      logger.error('Failed to delete transaction:', mutationError);
      toast.error(
        `Gagal menghapus transaksi: ${
          mutationError instanceof Error ? mutationError.message : String(mutationError)
        }`,
      );
    },
  });

  const isPaginatedResponse = (value: unknown): value is { data: FinancialTransaction[] } & PaginationInfo => {
    return Boolean(
      value &&
        typeof value === 'object' &&
        'data' in value &&
        'total' in value &&
        'page' in value &&
        'limit' in value &&
        'totalPages' in value,
    );
  };

  const fetchedTransactions = useMemo(() => {
    if (useServerPagination && isPaginatedResponse(data)) {
      return data.data;
    }

    return (data as FinancialTransaction[]) ?? [];
  }, [data, useServerPagination]);

  const paginationInfo = useMemo(() => {
    if (useServerPagination && !hasLegacyTransactions && isPaginatedResponse(data)) {
      const { total, page, limit, totalPages } = data;
      return { total, page, limit, totalPages };
    }

    return null;
  }, [data, hasLegacyTransactions, useServerPagination]);

  const transactions = legacyData?.transactions ?? fetchedTransactions;
  const totalItems = paginationInfo ? paginationInfo.total : transactions.length;
  const totalPages = paginationInfo
    ? paginationInfo.totalPages
    : transactions.length > 0
      ? Math.ceil(transactions.length / itemsPerPage)
      : 0;

  const visibleTransactions = useMemo(() => {
    if (!hasLegacyTransactions && paginationInfo) {
      return fetchedTransactions.slice(0, Math.min(fetchedTransactions.length, MAX_VISIBLE_ROWS));
    }

    const firstItemIndex = (currentPage - 1) * itemsPerPage;
    const sliced = transactions.slice(firstItemIndex, firstItemIndex + itemsPerPage);
    return sliced.slice(0, Math.min(sliced.length, MAX_VISIBLE_ROWS));
  }, [
    currentPage,
    fetchedTransactions,
    hasLegacyTransactions,
    itemsPerPage,
    paginationInfo,
    transactions,
  ]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = paginationInfo
    ? Math.min(currentPage * itemsPerPage, paginationInfo.total)
    : Math.min(currentPage * itemsPerPage, transactions.length);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, useServerPagination]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, Math.max(totalPages, 1)));
  }, [totalPages]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const combinedIsLoading = hasLegacyTransactions
    ? legacyData?.isLoading ?? false
    : shouldFetch
      ? isLoading
      : false;

  const combinedIsRefetching = hasLegacyTransactions
    ? Boolean(legacyData?.isLoading && transactions.length > 0)
    : shouldFetch
      ? isRefetching
      : false;

  const showInitialLoading = combinedIsLoading && transactions.length === 0;
  const showBackgroundLoading = combinedIsRefetching && transactions.length > 0;

  const onRefresh = useCallback(() => {
    if (hasLegacyTransactions) {
      legacyData?.onRefresh?.();
      return;
    }

    void refetch();
  }, [hasLegacyTransactions, legacyData, refetch]);

  return {
    transactions,
    visibleTransactions,
    paginationInfo,
    totalItems,
    totalPages,
    startItem,
    endItem,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    handlePageChange,
    handleNextPage,
    handlePreviousPage,
    isLoading: combinedIsLoading,
    isRefetching: combinedIsRefetching,
    showInitialLoading,
    showBackgroundLoading,
    onRefresh,
    lastUpdated: !hasLegacyTransactions && dataUpdatedAt ? new Date(dataUpdatedAt) : undefined,
    deleteTransaction: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    error: shouldFetch ? error : null,
    hasTransactions: transactions.length > 0,
  };
};
