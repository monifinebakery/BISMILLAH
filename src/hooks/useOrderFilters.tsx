// src/hooks/useOrdersFilters.tsx
// 🎛️ ORDERS FILTERS HOOK - Manages all filtering logic

import { useState, useMemo } from 'react';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import type { Order } from '@/types/order';

export interface FilterState {
  searchTerm: string;
  dateRange: DateRange | undefined;
  statusFilter: string;
}

export interface UseOrdersFiltersReturn {
  // Filter States
  searchTerm: string;
  dateRange: DateRange | undefined;
  statusFilter: string;
  
  // Filter Actions
  setSearchTerm: (term: string) => void;
  setDateRange: (range: DateRange | undefined) => void;
  setStatusFilter: (status: string) => void;
  clearFilters: () => void;
  
  // Computed Values
  filteredOrders: Order[];
  activeFiltersCount: number;
  hasActiveFilters: boolean;
  filterSummary: {
    searchTerm?: string;
    statusLabel?: string;
    dateRangeText?: string;
  };
}

interface OrdersFiltersOptions {
  defaultDateRange?: DateRange;
  debounceSearch?: number;
  includeArchived?: boolean;
}

export const useOrdersFilters = (
  orders: Order[] = [],
  options: OrdersFiltersOptions = {}
): UseOrdersFiltersReturn => {
  
  const {
    defaultDateRange = {
      from: startOfDay(subDays(new Date(), 30)),
      to: endOfDay(new Date())
    },
    debounceSearch = 0,
    includeArchived = false
  } = options;

  // 🎯 Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 🔍 Filtered Orders Logic
  const filteredOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];

    try {
      const rangeFrom = dateRange?.from ? new Date(dateRange.from) : null;
      const rangeTo = dateRange?.to ? new Date(dateRange.to) : null;

      return orders.filter(order => {
        if (!order) return false;

        // 🔎 Search Filter - Check multiple fields
        const matchesSearch = !searchTerm.trim() || (
          order.nomorPesanan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.namaPelanggan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.teleponPelanggan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.alamatPelanggan?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // 📊 Status Filter
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        // 🗂️ Archive Filter
        const matchesArchive = includeArchived || !order.isArchived;

        // 📅 Date Filter
        let matchesDate = true;
        if (rangeFrom && rangeTo && order.tanggal) {
          try {
            const orderDate = new Date(order.tanggal);
            if (!isNaN(orderDate.getTime())) {
              matchesDate = orderDate >= rangeFrom && orderDate <= rangeTo;
            } else {
              console.warn('Invalid date in order:', order.tanggal);
              matchesDate = false;
            }
          } catch (error) {
            console.warn('Error parsing order date:', order.tanggal, error);
            matchesDate = false;
          }
        }

        return matchesSearch && matchesStatus && matchesDate && matchesArchive;
      });
    } catch (error) {
      console.error('Error filtering orders:', error);
      return [];
    }
  }, [orders, searchTerm, statusFilter, dateRange, includeArchived]);

  // 📊 Active Filters Count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (statusFilter !== 'all') count++;
    if (dateRange?.from || dateRange?.to) count++;
    return count;
  }, [searchTerm, statusFilter, dateRange]);

  // 🏷️ Has Active Filters
  const hasActiveFilters = activeFiltersCount > 0;

  // 📋 Filter Summary for Display
  const filterSummary = useMemo(() => {
    const summary: {
      searchTerm?: string;
      statusLabel?: string;
      dateRangeText?: string;
    } = {};

    if (searchTerm.trim()) {
      summary.searchTerm = searchTerm;
    }

    if (statusFilter !== 'all') {
      // Map status keys to readable labels
      const statusLabels: Record<string, string> = {
        'pending': 'Menunggu',
        'confirmed': 'Dikonfirmasi', 
        'processing': 'Diproses',
        'shipped': 'Dikirim',
        'delivered': 'Terkirim',
        'completed': 'Selesai',
        'cancelled': 'Dibatalkan',
        'refunded': 'Dikembalikan'
      };
      summary.statusLabel = statusLabels[statusFilter] || statusFilter;
    }

    if (dateRange?.from || dateRange?.to) {
      try {
        if (dateRange.from && dateRange.to) {
          const fromDate = new Date(dateRange.from);
          const toDate = new Date(dateRange.to);
          if (fromDate.toDateString() === toDate.toDateString()) {
            summary.dateRangeText = fromDate.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
          } else {
            summary.dateRangeText = `${fromDate.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short'
            })} - ${toDate.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}`;
          }
        } else if (dateRange.from) {
          summary.dateRangeText = `Dari ${new Date(dateRange.from).toLocaleDateString('id-ID')}`;
        } else if (dateRange.to) {
          summary.dateRangeText = `Sampai ${new Date(dateRange.to).toLocaleDateString('id-ID')}`;
        }
      } catch (error) {
        console.warn('Error formatting date range:', error);
        summary.dateRangeText = 'Rentang tanggal';
      }
    }

    return summary;
  }, [searchTerm, statusFilter, dateRange]);

  // 🧹 Clear All Filters
  const clearFilters = () => {
    setSearchTerm('');
    setDateRange(undefined);
    setStatusFilter('all');
  };

  // 🔧 Enhanced Actions with Validation
  const handleSetSearchTerm = (term: string) => {
    setSearchTerm(term || '');
  };

  const handleSetDateRange = (range: DateRange | undefined) => {
    try {
      setDateRange(range);
    } catch (error) {
      console.error('Error setting date range:', error);
    }
  };

  const handleSetStatusFilter = (status: string) => {
    setStatusFilter(status || 'all');
  };

  return {
    // States
    searchTerm,
    dateRange,
    statusFilter,
    
    // Actions
    setSearchTerm: handleSetSearchTerm,
    setDateRange: handleSetDateRange,
    setStatusFilter: handleSetStatusFilter,
    clearFilters,
    
    // Computed
    filteredOrders,
    activeFiltersCount,
    hasActiveFilters,
    filterSummary,
  };
};

// 🎯 Helper function to get filter statistics
export const getFilterStatistics = (orders: Order[], filteredOrders: Order[]) => {
  const totalOrders = orders.length;
  const filteredCount = filteredOrders.length;
  const filterEffectiveness = totalOrders > 0 ? (filteredCount / totalOrders) * 100 : 0;
  
  return {
    totalOrders,
    filteredCount,
    hiddenCount: totalOrders - filteredCount,
    filterEffectiveness: Math.round(filterEffectiveness)
  };
};

export default useOrdersFilters;