// src/components/profitAnalysis/utils/filters/dataFilters.ts
// Data filtering utilities with improved accuracy

import { FinancialTransactionActual } from '../../types/profitAnalysis.types';
import { normalizeDateRange, isDateInRange, parseDatabaseDate } from '@/utils/dateNormalization';

/**
 * Filter transactions by custom date range with proper timezone handling
 * Uses centralized date normalization to ensure accuracy
 */
export const filterTransactionsByDateRange = (
  transactions: FinancialTransactionActual[],
  startDate: Date,
  endDate: Date
): FinancialTransactionActual[] => {
  if (!startDate || !endDate) return transactions;
  
  // Use centralized date normalization
  const { startDate: normalizedStart, endDate: normalizedEnd } = normalizeDateRange(startDate, endDate);
  
  return transactions.filter(t => {
    if (!t.date) return false;
    
    // Use centralized date range checking
    return isDateInRange(t.date, normalizedStart, normalizedEnd);
  });
};

/**
 * Filter transactions by period with improved timezone handling
 */
export const filterTransactionsByPeriod = (
  transactions: FinancialTransactionActual[],
  period: string
): FinancialTransactionActual[] => {
  if (!period || period === 'all') return transactions;
  
  const now = new Date();
  let startDate: Date;
  let endDate: Date;
  
  switch (period) {
    case 'today':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
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
      // Handle custom monthly periods like '2024-01'
      if (/^\d{4}-\d{2}$/.test(period)) {
        const [year, month] = period.split('-').map(Number);
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0);
        endDate.setHours(23, 59, 59, 999);
      } else {
        return transactions;
      }
      break;
  }
  
  // Use centralized date filtering
  return filterTransactionsByDateRange(transactions, startDate, endDate);
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
    !m.nama || m.stok === undefined || m.unit_price === undefined
  );
  
  if (incompleteMaterials.length > 0) {
    issues.push(`Ada ${incompleteMaterials.length} bahan baku yang tidak lengkap`);
    score -= Math.min(15, incompleteMaterials.length);
  }
  
  // Check operational cost data completeness
  const incompleteCosts = operationalCosts.filter(c => 
    !c.nama_biaya || c.monthly_amount === undefined
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