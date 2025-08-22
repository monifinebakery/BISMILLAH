// src/components/profitAnalysis/utils/filters/dataFilters.ts
// Data filtering utilities

import { FinancialTransactionActual } from '../../types/profitAnalysis.types';

/**
 * Filter transactions by custom date range
 */
export const filterTransactionsByDateRange = (
  transactions: FinancialTransactionActual[],
  startDate: Date,
  endDate: Date
): FinancialTransactionActual[] => {
  if (!startDate || !endDate) return transactions;
  
  // Ensure we're comparing dates correctly by normalizing to start/end of day
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return transactions.filter(t => {
    if (!t.date) return false;
    const transactionDate = new Date(t.date);
    return transactionDate >= start && transactionDate <= end;
  });
};

/**
 * Filter transactions by period with timezone handling
 */
export const filterTransactionsByPeriod = (
  transactions: FinancialTransactionActual[],
  period: string
): FinancialTransactionActual[] => {
  if (!period || period === 'all') return transactions;
  
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now);
  
  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'week':
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      startDate = startOfWeek;
      endDate.setDate(startOfWeek.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      // Handle custom date ranges if needed
      return transactions;
  }
  
  return transactions.filter(t => {
    if (!t.date) return false;
    const transactionDate = new Date(t.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
};

/**
 * Extract material name from description
 */
export const extractMaterialName = (description: string): string => {
  if (!description) return 'Unknown Material';
  
  // Remove common prefixes/suffixes and extract core name
  const cleanDesc = description
    .replace(/^Pembelian\s+/i, '')
    .replace(/\s+dari\s+.+$/i, '')
    .replace(/\s+\(.+?\)/g, '')
    .trim();
    
  return cleanDesc || description;
};

/**
 * Validate data quality
 */
export const validateDataQuality = (
  transactions: any[],
  materials: any[],
  operationalCosts: any[]
): { score: number; issues: string[] } => {
  const issues: string[] = [];
  let score = 100;
  
  // Check transaction data completeness
  const incompleteTransactions = transactions.filter(t => 
    !t.amount || !t.type || !t.date
  );
  
  if (incompleteTransactions.length > 0) {
    issues.push(`Ada ${incompleteTransactions.length} transaksi yang tidak lengkap`);
    score -= Math.min(20, incompleteTransactions.length);
  }
  
  // Check material data completeness
  const incompleteMaterials = materials.filter(m => 
    !m.nama || m.stok === undefined || m.harga_satuan === undefined
  );
  
  if (incompleteMaterials.length > 0) {
    issues.push(`Ada ${incompleteMaterials.length} bahan baku yang tidak lengkap`);
    score -= Math.min(15, incompleteMaterials.length);
  }
  
  // Check operational cost data completeness
  const incompleteCosts = operationalCosts.filter(c => 
    !c.nama_biaya || c.jumlah_per_bulan === undefined
  );
  
  if (incompleteCosts.length > 0) {
    issues.push(`Ada ${incompleteCosts.length} biaya operasional yang tidak lengkap`);
    score -= Math.min(10, incompleteCosts.length);
  }
  
  return {
    score: Math.max(0, score),
    issues
  };
};