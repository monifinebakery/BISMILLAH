// src/components/orders/utils/filterUtils.ts (FIXED VERSION)
import { Order, OrderFilters, DateRange } from '../types/order';
import { isValidDate, isDateInRange } from '@/utils/unifiedDateUtils';
import { parseDate } from '@/utils/unifiedDateUtils';

export const filterOrders = (
  orders: Order[], 
  filters: OrderFilters
): Order[] => {
  if (!orders || !Array.isArray(orders)) {
    console.warn('filterOrders: Invalid orders array provided');
    return [];
  }
  
  const { searchTerm, statusFilter, dateRange } = filters;
  
  try {
    console.log('Filtering orders:', {
      totalOrders: orders.length,
      searchTerm,
      statusFilter,
      dateRange
    });

    return orders.filter(order => {
      if (!order) {
        console.warn('filterOrders: Null order found, skipping');
        return false;
      }
      
      // Search filter - safely handle undefined values
      const matchesSearch = !searchTerm || (
        (order.nomorPesanan && order.nomorPesanan.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.namaPelanggan && order.namaPelanggan.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.teleponPelanggan && order.teleponPelanggan.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      // Date filter with safe handling
      let matchesDate = true;
      if (dateRange?.from && dateRange?.to && order.tanggal) {
        try {
          matchesDate = isDateInRange(order.tanggal, dateRange.from, dateRange.to);
        } catch (error) {
          console.warn('filterOrders: Date filtering error for order:', order.id, error);
          matchesDate = false;
        }
      }
      
      const result = matchesSearch && matchesStatus && matchesDate;
      
      // Debug logging for problematic cases
      if (!result && order.id) {
        console.debug('Order filtered out:', {
          orderId: order.id,
          matchesSearch,
          matchesStatus,
          matchesDate,
          orderDate: order.tanggal,
          dateRange
        });
      }
      
      return result;
    });
  } catch (error) {
    console.error('filterOrders: Error filtering orders:', error);
    return [];
  }
};

export const sortOrders = (
  orders: Order[], 
  sortBy: 'date' | 'orderNumber' | 'customer' | 'status' | 'total' = 'date',
  sortOrder: 'asc' | 'desc' = 'desc'
): Order[] => {
  if (!orders || !Array.isArray(orders)) {
    console.warn('sortOrders: Invalid orders array provided');
    return [];
  }

  try {
    return [...orders].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date': {
          const dateA = parseDate(a.tanggal);
          const dateB = parseDate(b.tanggal);
          
          if (dateA && dateB && isValidDate(dateA) && isValidDate(dateB)) {
            comparison = dateA.getTime() - dateB.getTime();
          } else if (dateA && isValidDate(dateA)) {
            comparison = 1; // A has valid date, B doesn't
          } else if (dateB && isValidDate(dateB)) {
            comparison = -1; // B has valid date, A doesn't
          } else {
            comparison = 0; // Both invalid, keep original order
          }
          break;
        }
        
        case 'orderNumber':
          comparison = (a.nomorPesanan || '').localeCompare(b.nomorPesanan || '');
          break;
          
        case 'customer':
          comparison = (a.namaPelanggan || '').localeCompare(b.namaPelanggan || '');
          break;
          
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
          
        case 'total':
          comparison = (a.totalPesanan || 0) - (b.totalPesanan || 0);
          break;
          
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  } catch (error) {
    console.error('sortOrders: Error sorting orders:', error);
    return orders; // Return original array if sorting fails
  }
};

export const searchOrders = (orders: Order[], query: string): Order[] => {
  if (!orders || !Array.isArray(orders)) {
    console.warn('searchOrders: Invalid orders array provided');
    return [];
  }
  
  if (!query || !query.trim()) {
    return orders;
  }
  
  try {
    const lowercaseQuery = query.toLowerCase().trim();
    
    return orders.filter(order => {
      if (!order) return false;
      
      const searchableFields = [
        order.nomorPesanan,
        order.namaPelanggan,
        order.teleponPelanggan,
        order.emailPelanggan,
        order.alamatPengiriman,
        order.catatan
      ];
      
      return searchableFields.some(field => 
        field && field.toLowerCase().includes(lowercaseQuery)
      );
    });
  } catch (error) {
    console.error('searchOrders: Error searching orders:', error);
    return [];
  }
};

// Additional utility functions for better filtering
export const getOrdersByStatus = (orders: Order[], status: string): Order[] => {
  if (!orders || !Array.isArray(orders)) return [];
  
  try {
    return orders.filter(order => order && order.status === status);
  } catch (error) {
    console.error('getOrdersByStatus: Error filtering by status:', error);
    return [];
  }
};

export const getOrdersByDateRange = (
  orders: Order[], 
  startDate: Date | string | null, 
  endDate: Date | string | null
): Order[] => {
  if (!orders || !Array.isArray(orders)) return [];
  if (!startDate || !endDate) return orders;
  
  try {
    return orders.filter(order => {
      if (!order || !order.tanggal) return false;
      return isDateInRange(order.tanggal, startDate, endDate);
    });
  } catch (error) {
    console.error('getOrdersByDateRange: Error filtering by date range:', error);
    return [];
  }
};

export const getOrderStats = (orders: Order[]) => {
  if (!orders || !Array.isArray(orders)) {
    return {
      total: 0,
      totalValue: 0,
      byStatus: {},
      averageValue: 0
    };
  }
  
  try {
    const stats = {
      total: orders.length,
      totalValue: 0,
      byStatus: {} as Record<string, number>,
      averageValue: 0
    };
    
    orders.forEach(order => {
      if (order) {
        // Count by status
        const status = order.status || 'unknown';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
        
        // Sum total value
        stats.totalValue += order.totalPesanan || 0;
      }
    });
    
    // Calculate average
    stats.averageValue = stats.total > 0 ? stats.totalValue / stats.total : 0;
    
    return stats;
  } catch (error) {
    console.error('getOrderStats: Error calculating stats:', error);
    return {
      total: 0,
      totalValue: 0,
      byStatus: {},
      averageValue: 0
    };
  }
};