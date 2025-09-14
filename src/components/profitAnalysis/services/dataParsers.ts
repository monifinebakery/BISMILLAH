// src/components/profitAnalysis/services/dataParsers.ts
// Data parsing utilities untuk profit analysis

import { logger } from '@/utils/logger';

/**
 * Parse transactions JSON from stored function results
 */
export const parseTransactions = (transactionsJson: any): any[] => {
  if (!transactionsJson) return [];
  
  try {
    if (typeof transactionsJson === 'string') {
      const parsed = JSON.parse(transactionsJson);
      return Array.isArray(parsed) ? parsed : [];
    }
    
    if (Array.isArray(transactionsJson)) {
      return transactionsJson;
    }
    
    return [];
  } catch (error) {
    logger.warn('Failed to parse transactions JSON:', error);
    return [];
  }
};

/**
 * Parse COGS transactions JSON from stored function results
 */
export const parseCOGSTransactions = (transactionsJson: any): any[] => {
  if (!transactionsJson) return [];
  
  try {
    if (typeof transactionsJson === 'string') {
      const parsed = JSON.parse(transactionsJson);
      return Array.isArray(parsed) ? parsed : [];
    }
    
    if (Array.isArray(transactionsJson)) {
      return transactionsJson;
    }
    
    return [];
  } catch (error) {
    logger.warn('Failed to parse COGS transactions JSON:', error);
    return [];
  }
};

/**
 * Parse operational expenses JSON from stored function results
 */
export const parseOpExCosts = (costsJson: any): any[] => {
  if (!costsJson) return [];
  
  try {
    if (typeof costsJson === 'string') {
      const parsed = JSON.parse(costsJson);
      return Array.isArray(parsed) ? parsed : [];
    }
    
    if (Array.isArray(costsJson)) {
      return costsJson;
    }
    
    return [];
  } catch (error) {
    logger.warn('Failed to parse operational costs JSON:', error);
    return [];
  }
};

/**
 * Calculate pemakaian value from various data sources
 */
export function calculatePemakaianValue(p: any, bahanMap: Record<string, any>): number {
  const qty = Number(p.quantity || 0);
  if (typeof p.hpp_value === 'number') return Number(p.hpp_value);
  if (typeof p.harga_efektif === 'number') return qty * Number(p.harga_efektif);
  
  const bahan = bahanMap[p.bahan_baku_id];
  if (!bahan) return 0;
  
  // Get effective unit price (WAC priority, fallback to base price)
  const wac = Number(bahan.harga_rata_rata ?? 0);
  const base = Number(bahan.unit_price ?? 0);
  const effectivePrice = wac > 0 ? wac : base;
  
  return qty * effectivePrice;
}
