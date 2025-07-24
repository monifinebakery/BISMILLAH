// src/components/orders/utils/filterUtils.ts
import { Order, OrderFilters, DateRange } from '../types';
import { parseDate } from './dashboardUtils';

export const filterOrders = (
  orders: Order[], 
  filters: OrderFilters
): Order[] => {
  if (!orders || !Array.isArray(orders)) return [];
  
  const { searchTerm, statusFilter, dateRange } = filters;
  
  try {
    return orders.filter(order => {
      if (!order) return false;
      
      // Search filter
      const matchesSearch = !searchTerm || (
        order.nomorPesanan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.namaPelanggan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.teleponPelanggan?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      // Date filter
      let matchesDate = true;
      if (dateRange?.from && dateRange?.to && order.tanggal) {
        try {
          const orderDate = parseDate(order.tanggal);
          if (orderDate) {
            const rangeFrom = new Date(dateRange.from);
            const rangeTo = new Date(dateRange.to);
            matchesDate = orderDate >= rangeFrom && orderDate <= rangeTo;
          } else {
            matchesDate = false;
          }
        } catch (error) {
          console.warn('Invalid date in order:', order.tanggal);
          matchesDate = false;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  } catch (error) {
    console.error('Error filtering orders:', error);
    return [];
  }
};

export const sortOrders = (
  orders: Order[], 
  sortBy: 'date' | 'orderNumber' | 'customer' | 'status' | 'total' = 'date',
  sortOrder: 'asc' | 'desc' = 'desc'
): Order[] => {
  return [...orders].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        const dateA = parseDate(a.tanggal);
        const dateB = parseDate(b.tanggal);
        if (dateA && dateB) {
          comparison = dateA.getTime() - dateB.getTime();
        }
        break;
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
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
};

export const searchOrders = (orders: Order[], query: string): Order[] => {
  if (!query.trim()) return orders;
  
  const lowercaseQuery = query.toLowerCase();
  
  return orders.filter(order => 
    order.nomorPesanan?.toLowerCase().includes(lowercaseQuery) ||
    order.namaPelanggan?.toLowerCase().includes(lowercaseQuery) ||
    order.telefonPelanggan?.toLowerCase().includes(lowercaseQuery) ||
    order.alamatPelanggan?.toLowerCase().includes(lowercaseQuery) ||
    order.catatanPesanan?.toLowerCase().includes(lowercaseQuery)
  );
};