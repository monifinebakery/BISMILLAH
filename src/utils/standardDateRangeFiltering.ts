// src/utils/standardDateRangeFiltering.ts
// Standardized date range filtering utilities for consistent data fetching across all modules

import { UnifiedDateHandler } from '@/utils/unifiedDateHandler';
import { logger } from '@/utils/logger';

/**
 * Standard date range filtering configuration
 * This ensures all modules use the same date filtering logic as financial reports
 */
export interface StandardDateRangeConfig {
  startDate: Date;
  endDate: Date;
  dateField?: string; // Which field to filter on (default: 'created_at')
  includeTime?: boolean; // Whether to include time in filtering (default: true)
}

/**
 * Creates standard date range filters for Supabase queries
 * This ensures consistency across all modules
 */
export const createStandardDateRangeFilters = (config: StandardDateRangeConfig) => {
  const { startDate, endDate, dateField = 'created_at', includeTime = true } = config;
  
  const startYMD = UnifiedDateHandler.toDatabaseString(startDate) || '';
  const endYMD = UnifiedDateHandler.toDatabaseString(endDate) || '';
  
  // Include time for more precise filtering
  const startFilter = includeTime ? `${startYMD}T00:00:00.000Z` : startYMD;
  const endFilter = includeTime ? `${endYMD}T23:59:59.999Z` : endYMD;
  
  logger.debug('📅 Creating standard date range filters:', {
    dateField,
    startDate: startFilter,
    endDate: endFilter,
    includeTime
  });
  
  return {
    gteFilter: { field: dateField, value: startFilter },
    lteFilter: { field: dateField, value: endFilter },
    debugInfo: {
      originalStartDate: startDate.toISOString(),
      originalEndDate: endDate.toISOString(),
      processedStartDate: startFilter,
      processedEndDate: endFilter,
      dateField
    }
  };
};

/**
 * Apply standard date range filters to a Supabase query
 */
export const applyStandardDateRangeFilters = (
  query: any,
  config: StandardDateRangeConfig
) => {
  const { gteFilter, lteFilter, debugInfo } = createStandardDateRangeFilters(config);
  
  logger.debug('🔍 Applying standard date range filters:', debugInfo);
  
  // Apply both start and end date filters for consistent range filtering
  return query
    .gte(gteFilter.field, gteFilter.value)
    .lte(lteFilter.field, lteFilter.value);
};

/**
 * Standard date range filtering for any table
 * This is the recommended approach for all modules
 */
export const fetchDataWithStandardDateRange = async (
  supabase: any,
  tableName: string,
  config: StandardDateRangeConfig & {
    userId: string;
    selectFields?: string;
    additionalFilters?: Record<string, any>;
    orderBy?: { field: string; ascending?: boolean };
  }
) => {
  try {
    const {
      userId,
      selectFields = '*',
      additionalFilters = {},
      orderBy = { field: 'created_at', ascending: false }
    } = config;
    
    let query = supabase
      .from(tableName)
      .select(selectFields)
      .eq('user_id', userId);
    
    // Apply standard date range filters
    query = applyStandardDateRangeFilters(query, config);
    
    // Apply additional filters
    Object.entries(additionalFilters).forEach(([field, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(field, value);
      }
    });
    
    // Apply ordering
    query = query.order(orderBy.field, { ascending: orderBy.ascending });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    logger.debug('✅ Standard date range query completed:', {
      tableName,
      userId,
      resultCount: data?.length || 0,
      dateRange: createStandardDateRangeFilters(config).debugInfo
    });
    
    return { data: data || [], error: null };
  } catch (error) {
    logger.error('❌ Standard date range query failed:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Query failed' };
  }
};

/**
 * Validation helper to ensure date range is valid
 */
export const validateDateRange = (startDate: Date, endDate: Date): { 
  isValid: boolean; 
  error?: string; 
} => {
  if (!startDate || !endDate) {
    return { isValid: false, error: 'Start date and end date are required' };
  }
  
  if (startDate > endDate) {
    return { isValid: false, error: 'Start date cannot be after end date' };
  }
  
  const now = new Date();
  if (startDate > now) {
    return { isValid: false, error: 'Start date cannot be in the future' };
  }
  
  // Check if date range is reasonable (not more than 5 years)
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  
  if (startDate < fiveYearsAgo) {
    return { isValid: false, error: 'Date range too far in the past' };
  }
  
  return { isValid: true };
};

/**
 * Create date range for common periods (last 30 days, this month, etc.)
 */
export const createStandardDateRange = (period: string): {
  startDate: Date;
  endDate: Date;
} => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now);
  
  switch (period) {
    case 'last30days':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      break;
    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'thisYear':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'lastYear':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31);
      break;
    default:
      throw new Error(`Unsupported period: ${period}`);
  }
  
  return { startDate, endDate };
};

/**
 * Export constants for common usage
 */
export const STANDARD_DATE_FIELDS = {
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  DATE: 'date',
  TANGGAL: 'tanggal',
  EFFECTIVE_DATE: 'effective_date'
} as const;

export const COMMON_PERIODS = {
  LAST_30_DAYS: 'last30days',
  THIS_MONTH: 'thisMonth', 
  LAST_MONTH: 'lastMonth',
  THIS_YEAR: 'thisYear',
  LAST_YEAR: 'lastYear'
} as const;
