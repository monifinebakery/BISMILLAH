// src/components/profitAnalysis/constants/queryKeys.ts
// ==============================================
// Centralized React Query Keys for Profit Analysis Module
// Menggabungkan semua query keys dari hooks dan context untuk konsistensi

import { DateRangeFilter } from '../types/profitAnalysis.types';

/**
 * ✅ CENTRALIZED: All profit analysis query keys in one place
 * Digunakan oleh hooks, context, dan components untuk memastikan konsistensi cache
 */
export const PROFIT_QUERY_KEYS = {
  // Basic analysis queries
  analysis: (period?: string) => ['profit-analysis', 'calculation', period] as const,
  history: (dateRange?: DateRangeFilter) => ['profit-analysis', 'history', dateRange] as const,
  current: () => ['profit-analysis', 'current'] as const,
  realTime: (period: string) => ['profit-analysis', 'realtime', period] as const,
  
  // Advanced analysis queries
  detailed: (period: string) => ['profit-analysis', 'detailed', period] as const,
  breakdown: (period: string) => ['profit-analysis', 'breakdown', period] as const,
  
  // WAC (Weighted Average Cost) queries
  bahanMap: () => ['profit-analysis', 'bahan-map'] as const,
  pemakaian: (start: string, end: string) => ['profit-analysis', 'pemakaian', start, end] as const,
  
  // Date range specific queries
  daily: (from: string, to: string) => ['profit-analysis', 'daily', from, to] as const,
  monthly: (year: number, month: number) => ['profit-analysis', 'monthly', year, month] as const,
  yearly: (year: number) => ['profit-analysis', 'yearly', year] as const,
  
  // Export and reporting queries
  export: (dateRange: DateRangeFilter) => ['profit-analysis', 'export', dateRange] as const,
  
  // F&B specific queries
  fnb: {
    insights: (period: string) => ['profit-analysis', 'fnb', 'insights', period] as const,
    cogsBreakdown: (period: string) => ['profit-analysis', 'fnb', 'cogs-breakdown', period] as const,
    efficiency: (period: string) => ['profit-analysis', 'fnb', 'efficiency', period] as const,
  }
} as const;

/**
 * ✅ HELPER: Query key matchers for invalidation
 * Memudahkan invalidation query dengan pattern matching
 */
export const PROFIT_QUERY_MATCHERS = {
  // Invalidate all profit analysis queries
  all: () => ['profit-analysis'] as const,
  
  // Invalidate all analysis calculations
  allAnalysis: () => ['profit-analysis', 'calculation'] as const,
  
  // Invalidate all real-time queries
  allRealTime: () => ['profit-analysis', 'realtime'] as const,
  
  // Invalidate all WAC related queries
  allWAC: () => ['profit-analysis', 'bahan-map'] as const,
  allPemakaian: () => ['profit-analysis', 'pemakaian'] as const,
  
  // Invalidate by period pattern
  byPeriod: (period: string) => (query: any[]) => {
    return Array.isArray(query) && 
           query[0] === 'profit-analysis' && 
           query.includes(period);
  },
  
  // Invalidate by date range pattern
  byDateRange: (from: Date, to: Date) => (query: any[]) => {
    if (!Array.isArray(query) || query[0] !== 'profit-analysis') return false;
    
    // Check if query contains overlapping date range
    const queryHasDateRange = query.some(key => 
      key && typeof key === 'object' && 
      ('from' in key || 'to' in key)
    );
    
    return queryHasDateRange;
  }
} as const;

/**
 * ✅ TYPE SAFETY: Export types for better TypeScript support
 */
export type ProfitQueryKey = 
  | ReturnType<typeof PROFIT_QUERY_KEYS.analysis>
  | ReturnType<typeof PROFIT_QUERY_KEYS.history>
  | ReturnType<typeof PROFIT_QUERY_KEYS.current>
  | ReturnType<typeof PROFIT_QUERY_KEYS.realTime>
  | ReturnType<typeof PROFIT_QUERY_KEYS.detailed>
  | ReturnType<typeof PROFIT_QUERY_KEYS.breakdown>
  | ReturnType<typeof PROFIT_QUERY_KEYS.bahanMap>
  | ReturnType<typeof PROFIT_QUERY_KEYS.pemakaian>
  | ReturnType<typeof PROFIT_QUERY_KEYS.daily>
  | ReturnType<typeof PROFIT_QUERY_KEYS.monthly>
  | ReturnType<typeof PROFIT_QUERY_KEYS.yearly>
  | ReturnType<typeof PROFIT_QUERY_KEYS.export>;

export type FnbQueryKey = 
  | ReturnType<typeof PROFIT_QUERY_KEYS.fnb.insights>
  | ReturnType<typeof PROFIT_QUERY_KEYS.fnb.cogsBreakdown>
  | ReturnType<typeof PROFIT_QUERY_KEYS.fnb.efficiency>;

/**
 * ✅ UTILITY: Helper functions for query key management
 */
export const queryKeyUtils = {
  /**
   * Get query key for current month analysis
   */
  getCurrentMonth: () => {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return PROFIT_QUERY_KEYS.realTime(period);
  },
  
  /**
   * Get query key for specific date analysis
   */
  getDateAnalysis: (date: Date, mode: 'daily' | 'monthly' | 'yearly' = 'monthly') => {
    if (mode === 'daily') {
      const dateStr = date.toISOString().split('T')[0];
      return PROFIT_QUERY_KEYS.daily(dateStr, dateStr);
    } else if (mode === 'monthly') {
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return PROFIT_QUERY_KEYS.realTime(period);
    } else {
      const year = date.getFullYear();
      return PROFIT_QUERY_KEYS.yearly(year);
    }
  },
  
  /**
   * Check if two query keys are related (same base analysis)
   */
  areRelated: (key1: any[], key2: any[]): boolean => {
    if (!Array.isArray(key1) || !Array.isArray(key2)) return false;
    if (key1[0] !== 'profit-analysis' || key2[0] !== 'profit-analysis') return false;
    
    // Same if they share the same analysis type or period
    return key1[1] === key2[1] || key1[2] === key2[2];
  }
} as const;

// Export default for convenience
export default PROFIT_QUERY_KEYS;
