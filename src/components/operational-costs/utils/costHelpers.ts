// src/components/operational-costs/utils/costHelpers.ts

import { OperationalCost, CostFilters } from '../types';
// 🔧 IMPROVED: Import centralized date utilities for consistency
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';

/**
 * Format currency to Indonesian Rupiah
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(num);
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (currencyString: string): number => {
  return Number(currencyString.replace(/[^0-9.-]+/g, ''));
};

/**
 * Get display label for cost type
 */
export const getJenisLabel = (jenis: 'tetap' | 'variabel'): string => {
  const labels = {
    tetap: 'Tetap',
    variabel: 'Variabel',
  };
  return labels[jenis];
};

/**
 * Get display label for cost status
 */
export const getStatusLabel = (status: 'aktif' | 'nonaktif'): string => {
  const labels = {
    aktif: 'Aktif',
    nonaktif: 'Non Aktif',
  };
  return labels[status];
};

/**
 * Get status badge color
 */
export const getStatusColor = (status: 'aktif' | 'nonaktif'): string => {
  const colors = {
    aktif: 'green',
    nonaktif: 'gray',
  };
  return colors[status];
};

/**
 * Get cost type badge color
 */
export const getJenisColor = (jenis: 'tetap' | 'variabel'): string => {
  const colors = {
    tetap: 'blue',
    variabel: 'orange',
  };
  return colors[jenis];
};

/**
 * Filter costs based on search criteria
 */
export const filterCosts = (costs: OperationalCost[], filters: CostFilters): OperationalCost[] => {
  return costs.filter(cost => {
    if (filters.jenis && cost.jenis !== filters.jenis) return false;
    if (filters.status && cost.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return cost.nama_biaya.toLowerCase().includes(searchLower);
    }
    return true;
  });
};

/**
 * Sort costs by various criteria
 */
export const sortCosts = (
  costs: OperationalCost[], 
  sortBy: 'nama' | 'jumlah' | 'jenis' | 'status' | 'created_at' = 'created_at',
  order: 'asc' | 'desc' = 'desc'
): OperationalCost[] => {
  return [...costs].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'nama':
        comparison = a.nama_biaya.localeCompare(b.nama_biaya);
        break;
      case 'jumlah':
        comparison = Number(a.jumlah_per_bulan) - Number(b.jumlah_per_bulan);
        break;
      case 'jenis':
        comparison = a.jenis.localeCompare(b.jenis);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Group costs by type
 */
export const groupCostsByType = (costs: OperationalCost[]) => {
  return costs.reduce((groups, cost) => {
    const type = cost.jenis;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(cost);
    return groups;
  }, {} as Record<string, OperationalCost[]>);
};

/**
 * Calculate percentage of total
 */
export const calculatePercentage = (value: number, total: number): number => {
  return total > 0 ? (value / total) * 100 : 0;
};

/**
 * Generate cost summary text
 */
export const generateCostSummaryText = (
  totalCosts: number,
  activeCosts: number,
  inactiveCosts: number
): string => {
  const activeText = activeCosts === 1 ? '1 biaya aktif' : `${activeCosts} biaya aktif`;
  const inactiveText = inactiveCosts > 0 ? ` dan ${inactiveCosts} non-aktif` : '';
  
  return `Total ${formatCurrency(totalCosts)} dari ${activeText}${inactiveText}`;
};

/**
 * Validate cost amount
 */
export const validateCostAmount = (amount: number): { isValid: boolean; message?: string } => {
  if (amount <= 0) {
    return { isValid: false, message: 'Jumlah biaya harus lebih besar dari 0' };
  }
  if (amount > 999999999999) {
    return { isValid: false, message: 'Jumlah biaya terlalu besar' };
  }
  return { isValid: true };
};

/**
 * Generate unique cost name suggestion
 */
export const generateUniqueCostName = (baseName: string, existingCosts: OperationalCost[]): string => {
  const existingNames = existingCosts.map(cost => cost.nama_biaya.toLowerCase());
  
  if (!existingNames.includes(baseName.toLowerCase())) {
    return baseName;
  }
  
  let counter = 1;
  let newName = `${baseName} (${counter})`;
  
  while (existingNames.includes(newName.toLowerCase())) {
    counter++;
    newName = `${baseName} (${counter})`;
  }
  
  return newName;
};

/**
 * Calculate cost trend
 */
export const calculateCostTrend = (
  currentCosts: OperationalCost[],
  previousCosts: OperationalCost[]
): {
  trend: 'up' | 'down' | 'stable';
  percentage: number;
  difference: number;
} => {
  const currentTotal = currentCosts
    .filter(c => c.status === 'aktif')
    .reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0);
    
  const previousTotal = previousCosts
    .filter(c => c.status === 'aktif')
    .reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0);
  
  const difference = currentTotal - previousTotal;
  const percentage = previousTotal > 0 ? Math.abs(difference / previousTotal) * 100 : 0;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(percentage) > 1) { // Only consider significant changes (>1%)
    trend = difference > 0 ? 'up' : 'down';
  }
  
  return {
    trend,
    percentage,
    difference,
  };
};

/**
 * Export costs to CSV format
 */
export const exportCostsToCSV = (costs: OperationalCost[]): string => {
  const headers = ['Nama Biaya', 'Jumlah per Bulan', 'Jenis', 'Status', 'Tanggal Dibuat'];
  const rows = costs.map(cost => [
    cost.nama_biaya,
    cost.jumlah_per_bulan.toString(),
    getJenisLabel(cost.jenis),
    getStatusLabel(cost.status),
    new Date(cost.created_at).toLocaleDateString('id-ID'),
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
    
  return csvContent;
};

/**
 * Get allocation method description
 */
export const getAllocationMethodDescription = (method: 'per_unit' | 'persentase'): string => {
  const descriptions = {
    per_unit: 'Overhead dihitung berdasarkan total biaya dibagi estimasi produksi per bulan',
    persentase: 'Overhead dihitung berdasarkan persentase dari biaya material',
  };
  return descriptions[method];
};

/**
 * Format date to Indonesian locale using centralized utility
 */
export const formatDate = (dateString: string): string => {
  return formatDateForDisplay(dateString);
};

/**
 * Format relative time using centralized utility for consistency
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Baru saja';
  if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks} minggu yang lalu`;
  
  // Use centralized date formatting for fallback
  return formatDate(dateString);
};