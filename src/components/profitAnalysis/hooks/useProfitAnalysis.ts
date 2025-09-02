// useProfitAnalysis.ts - Fixed Dependencies & React Error #310 with WAC Integration
// ==============================================

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { normalizeDateRange } from '@/utils/dateNormalization';
import { supabase } from '@/integrations/supabase/client';

import { 
  ProfitAnalysis, 
  RealTimeProfitCalculation, 
  DateRangeFilter,
  ProfitApiResponse,
  FNBCOGSBreakdown,
  FNBLabels
} from '../types/profitAnalysis.types';
// ✅ IMPORT PROFIT ANALYSIS SERVICES & WAC HELPERS
import profitAnalysisApi, {
  calculateProfitAnalysisDaily,
  fetchBahanMap,
  fetchPemakaianByPeriode,
  calculatePemakaianValue,
} from '../services/profitAnalysisApi';

// Helper function untuk get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user.id;
};
import { calcHPP } from '../utils/profitCalculations';
// 🍽️ Import F&B constants
import { FNB_LABELS } from '../constants/profitConstants';
// ✅ ADD: Import centralized utilities
import { getEffectiveCogs, shouldUseWAC } from '@/utils/cogsCalculation';
import { safeCalculateMargins, monitorDataQuality } from '@/utils/profitValidation';
import { getCurrentPeriod } from '../utils/profitTransformers';
// ✅ ADD: Import WAC validation utilities
import { 
  validateWACConsistency, 
  performComprehensiveValidation,
  calculateDataQualityMetrics,
  type WACValidationResult,
  type DataQualityMetrics
} from '@/utils/profitAnalysisConsistency';


// Query Keys
export const PROFIT_QUERY_KEYS = {
  analysis: (period?: string) => ['profit-analysis', 'calculation', period],
  history: (dateRange?: DateRangeFilter) => ['profit-analysis', 'history', dateRange],
  current: () => ['profit-analysis', 'current'],
  realTime: (period: string) => ['profit-analysis', 'realtime', period],
  // ✅ ADD WAC QUERY KEYS
  bahanMap: () => ['profit-analysis', 'bahan-map'],
  pemakaian: (start: string, end: string) => ['profit-analysis', 'pemakaian', start, end],
} as const;

export interface UseProfitAnalysisOptions {
  autoCalculate?: boolean;
  defaultPeriod?: string;
  enableRealTime?: boolean;
  // ✅ ADD WAC OPTIONS
  enableWAC?: boolean;
  // 🆕 Mode harian/bulanan/tahunan dan rentang tanggal
  mode?: 'daily' | 'monthly' | 'yearly';
  dateRange?: { from: Date; to: Date };
}

export interface UseProfitAnalysisReturn {
  // State
  currentAnalysis: RealTimeProfitCalculation | null;
  profitHistory: RealTimeProfitCalculation[];
  loading: boolean;
  error: string | null;
  
  // Current period management
  currentPeriod: string;
  setCurrentPeriod: (period: string) => void;
  
  // Actions
  calculateProfit: (period?: string) => Promise<boolean>;
  loadProfitHistory: (dateRange?: DateRangeFilter) => Promise<void>;
  refreshAnalysis: () => Promise<void>;
  
  // ✅ ADD WAC ACTIONS
  refreshWACData: () => Promise<void>;
  
  // 🍽️ Enhanced computed values with F&B metrics
  profitMetrics: {
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
    revenue: number;
    cogs: number;           // Effective COGS (WAC or API fallback)
    opex: number;
    // WAC specific metrics
    totalHPP: number;
    hppBreakdown: FNBCOGSBreakdown[];
  };
  
  // ✅ ADD: WAC Validation properties
  wacValidation: WACValidationResult | null;
  dataQualityMetrics: DataQualityMetrics | null;
  validationScore: number; // 0-100 overall data quality score
  
  // Utilities
  getProfitByPeriod: (period: string) => RealTimeProfitCalculation | undefined;
  isDataStale: boolean;
  lastCalculated: Date | null;
  
  // 🍽️ F&B specific utilities
  bahanMap: Record<string, unknown>;
  pemakaian: unknown[];
  labels: FNBLabels;
}

export const useProfitAnalysis = (
  options: UseProfitAnalysisOptions = {}
): UseProfitAnalysisReturn => {
  const {
    autoCalculate = true,
    defaultPeriod = getCurrentPeriod(), // Safe default
    enableRealTime = true,
    // ✅ ADD WAC OPTION DEFAULT
    enableWAC = true,
    mode = 'monthly',
    dateRange
  } = options;

  const queryClient = useQueryClient();
  
  // Local state
  const [currentPeriod, setCurrentPeriodState] = useState(defaultPeriod);
  const [profitHistory, setProfitHistory] = useState<RealTimeProfitCalculation[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ ADD: WAC Validation state
  const [wacValidation, setWacValidation] = useState<WACValidationResult | null>(null);
  const [dataQualityMetrics, setDataQualityMetrics] = useState<DataQualityMetrics | null>(null);
  const [validationScore, setValidationScore] = useState<number>(0);

  // ✅ MAIN QUERY: Current analysis (supports harian, bulanan, tahunan)
  const currentAnalysisKey =
    mode === 'daily' && dateRange
      ? ['profit-analysis', 'daily', dateRange.from.toISOString(), dateRange.to.toISOString()]
      : ['profit-analysis', 'realtime', mode, currentPeriod];

  const currentAnalysisQuery = useQuery({
    queryKey: currentAnalysisKey,
    queryFn: async () => {
      try {
        if (mode === 'daily' && dateRange) {
          const from = dateRange.from;
          const to = dateRange.to;
          logger.info('🔄 Fetching daily profit analysis:', { from, to });
          
          // 🚨 TEMPORARY FIX: Instead of daily calculation, aggregate all data in range
          // to match financial reports behavior
          logger.info('🔄 Using range aggregation instead of daily breakdown (consistency fix)');
          
          try {
            // Use the same approach as financial reports: get all transactions in range
            const authUserId = await getCurrentUserId();
            if (!authUserId) throw new Error('Not authenticated');
            
            // Get all transactions in date range (same query as financial reports)
            const { data: transactions } = await supabase
              .from('financial_transactions')
              .select('id, type, category, amount, description, date')
              .eq('user_id', authUserId)
              .gte('date', from.toISOString().split('T')[0])
              .lte('date', to.toISOString().split('T')[0])
              .order('date', { ascending: true });
              
            logger.info('📋 Total transactions in range:', { count: transactions?.length || 0 });
            
            // Filter income transactions (same as profit analysis logic)
            const incomeTransactions = (transactions || []).filter(t => t.type === 'income');
            const totalRevenue = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            
            logger.info('💰 Income analysis:', { 
              incomeCount: incomeTransactions.length, 
              totalRevenue,
              sampleTransactions: incomeTransactions.slice(0, 3)
            });
            
            // Create aggregated analysis for the entire range
            const aggregatedAnalysis: RealTimeProfitCalculation = {
              period: `${from.toISOString().split('T')[0]}_to_${to.toISOString().split('T')[0]}`,
              revenue_data: {
                total: totalRevenue,
                transactions: incomeTransactions.map(t => ({
                  category: t.category || 'Uncategorized',
                  amount: t.amount || 0,
                  description: t.description || '',
                  date: t.date
                }))
              },
              cogs_data: {
                total: 0, // Will be calculated by WAC if available
                materials: []
              },
              opex_data: {
                total: 0, // Will be calculated by operational costs
                costs: []
              },
              calculated_at: new Date().toISOString()
            };
            
            // Set empty history for range mode
            setProfitHistory([]);
            
            logger.success('✅ Range aggregation completed:', {
              period: aggregatedAnalysis.period,
              revenue: aggregatedAnalysis.revenue_data.total,
              transactionCount: incomeTransactions.length
            });
            
            return aggregatedAnalysis;
            
          } catch (rangeError) {
            logger.error('❌ Range aggregation failed, falling back to daily:', rangeError);
            
            // Fallback to original daily calculation if range aggregation fails
            const daily = await calculateProfitAnalysisDaily(from, to);
            if (!daily.success) throw new Error(daily.error || 'Failed daily analysis');
            
            // Aggregate all days into single result for UI consistency
            const totalRevenue = (daily.data || []).reduce((sum, d) => sum + d.revenue_data.total, 0);
            const totalCogs = (daily.data || []).reduce((sum, d) => sum + d.cogs_data.total, 0);
            const totalOpex = (daily.data || []).reduce((sum, d) => sum + d.opex_data.total, 0);
            
            const aggregated: RealTimeProfitCalculation = {
              period: `${from.toISOString().split('T')[0]}_to_${to.toISOString().split('T')[0]}`,
              revenue_data: { total: totalRevenue, transactions: [] },
              cogs_data: { total: totalCogs, materials: [] },
              opex_data: { total: totalOpex, costs: [] },
              calculated_at: new Date().toISOString()
            };
            
            setProfitHistory(daily.data || []);
            return aggregated;
          }
        }

        if (mode === 'yearly') {
          logger.info('🔄 Fetching yearly profit analysis:', { period: currentPeriod });
          const response = await profitAnalysisApi.calculateProfitAnalysis(currentPeriod, 'yearly');
          if (response.error) {
            throw new Error(response.error);
          }
          return response.data;
        }

        logger.info('🔄 Fetching profit analysis for period:', currentPeriod);
        const response = await profitAnalysisApi.calculateProfitAnalysis(currentPeriod);
        if (response.error) {
          throw new Error(response.error);
        }
        logger.success('✅ Profit analysis completed:', {
          period: currentPeriod,
          revenue: response.data?.revenue_data?.total || 0,
          calculatedAt: response.data?.calculated_at,
        });
        return response.data;
      } catch (err) {
        logger.error('❌ Query error:', err);
        throw err;
      }
    },
    enabled: (mode === 'daily' && dateRange) ? Boolean(autoCalculate) : Boolean(currentPeriod && autoCalculate),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: enableRealTime,
    retry: 2,
    meta: {
      onError: (err: Error) => {
        // Bersihkan data agar UI menampilkan keadaan kosong
        setProfitHistory([]);
        queryClient.setQueryData(currentAnalysisKey, null);
        setError(err instanceof Error ? err.message : 'Gagal memuat analisis profit');
      }
    }
  });

  // ✅ WAC QUERIES: Bahan map and pemakaian data
  const bahanMapQuery = useQuery({
    queryKey: PROFIT_QUERY_KEYS.bahanMap(),
    queryFn: fetchBahanMap,
    enabled: enableWAC,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const pemakaianQuery = useQuery({
    queryKey: mode === 'daily' && dateRange 
      ? PROFIT_QUERY_KEYS.pemakaian(dateRange.from.toISOString().split('T')[0], dateRange.to.toISOString().split('T')[0])
      : PROFIT_QUERY_KEYS.pemakaian(currentPeriod, currentPeriod),
    queryFn: async () => {
      if (mode === 'daily' && dateRange) {
        // For daily mode, use the selected date range
        const start = dateRange.from.toISOString().split('T')[0];
        const end = dateRange.to.toISOString().split('T')[0];
        return fetchPemakaianByPeriode(start, end);
      } else {
        // For monthly mode, use the current period
        const start = currentPeriod + '-01';
        const end = new Date(new Date(currentPeriod + '-01').getFullYear(), 
                            new Date(currentPeriod + '-01').getMonth() + 1, 0)
                    .toISOString().split('T')[0];
        return fetchPemakaianByPeriode(start, end);
      }
    },
    enabled: enableWAC && Boolean((mode === 'daily' && dateRange) || (mode !== 'daily' && currentPeriod)),
    staleTime: 60 * 1000, // 1 minute
  });

  // ✅ MUTATION: Manual calculation
  const calculateProfitMutation = useMutation({
    mutationFn: async (period: string) => {
      const response = await profitAnalysisApi.calculateProfitAnalysis(period);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data, period) => {
      logger.info('✅ Manual profit calculation successful:', { period });
      toast.success(`Analisis profit untuk ${period} berhasil dihitung`);
      
      // Update query cache
      queryClient.setQueryData(PROFIT_QUERY_KEYS.realTime(period), data);
      queryClient.invalidateQueries({ queryKey: PROFIT_QUERY_KEYS.current() });
    },
    onError: (error: Error) => {
      logger.error('❌ Manual profit calculation error:', error);
      setError(error.message);
      toast.error(`Gagal menghitung profit: ${error.message}`);
    },
  });

  // ✅ FIX #1: Extract primitive values first to avoid nested object references
  const currentData = currentAnalysisQuery.data;
  const revenue = (currentData && 'revenue_data' in currentData) ? currentData.revenue_data?.total ?? 0 : 0;
  const cogs = (currentData && 'cogs_data' in currentData) ? currentData.cogs_data?.total ?? 0 : 0;
  const opex = (currentData && 'opex_data' in currentData) ? currentData.opex_data?.total ?? 0 : 0;
  const calculatedAt = (currentData && 'calculated_at' in currentData) ? currentData.calculated_at ?? null : null;

  // ✅ WAC CALCULATION
  const { totalHPP, hppBreakdown } = useMemo(() => {
    if (bahanMapQuery.data && pemakaianQuery.data && Array.isArray(pemakaianQuery.data)) {
      try {
        const res = calcHPP(pemakaianQuery.data, bahanMapQuery.data);
        return {
          totalHPP: res.totalHPP,
          hppBreakdown: res.breakdown
        };
      } catch (err) {
        logger.error('Error calculating HPP:', err);
        return {
          totalHPP: 0,
          hppBreakdown: []
        };
      }
    }
    return {
      totalHPP: 0,
      hppBreakdown: []
    };
  }, [bahanMapQuery.data, pemakaianQuery.data]);

  // 🍽️ F&B LABELS - User-friendly terminology
  const labels: FNBLabels = useMemo(() => {
    const hasWAC = totalHPP > 0;
    
    return {
      // Revenue labels
      revenueLabel: FNB_LABELS.revenue.title,
      revenueHint: FNB_LABELS.revenue.hint,
      
      // COGS labels (Modal Bahan Baku)
      cogsLabel: hasWAC ? FNB_LABELS.wac.title : FNB_LABELS.cogs.title,
      cogsHint: hasWAC ? FNB_LABELS.wac.hint : FNB_LABELS.cogs.hint,
      
      // OPEX labels
      opexLabel: FNB_LABELS.opex.title,
      opexHint: FNB_LABELS.opex.hint,
      
      // Profit labels
      grossProfitLabel: FNB_LABELS.grossProfit.title,
      grossProfitHint: FNB_LABELS.grossProfit.hint,
      netProfitLabel: FNB_LABELS.netProfit.title,
      netProfitHint: FNB_LABELS.netProfit.hint,
      
      // WAC specific (backward compatibility)
      hppLabel: hasWAC ? FNB_LABELS.wac.short : FNB_LABELS.cogs.short,
      hppHint: hasWAC ? FNB_LABELS.wac.hint : FNB_LABELS.cogs.hint,
      wacActiveLabel: hasWAC ? 'WAC Aktif' : undefined
    };
  }, [totalHPP]);

  // ✅ FIX #2: Use extracted primitive values in useMemo dependencies
  const profitMetrics = useMemo(() => {
    if (!currentData) {
      return {
        grossProfit: 0,
        netProfit: 0,
        grossMargin: 0,
        netMargin: 0,
        revenue: 0,
        cogs: 0,
        opex: 0,
        // WAC metrics
        totalHPP: 0,
        hppBreakdown: [] as FNBCOGSBreakdown[]
      };
    }

    try {
      // ✅ IMPROVED: Use centralized COGS calculation
      const cogsResult = getEffectiveCogs(
        currentData,
        totalHPP,
        revenue,
        { preferWAC: shouldUseWAC(totalHPP) }
      );
      
      // ✅ IMPROVED: Use safe margin calculation
      const margins = safeCalculateMargins(revenue, cogsResult.value, opex);
      
      // ✅ ADD: Monitor data quality
      monitorDataQuality({
        revenue,
        cogs: cogsResult.value,
        opex
      }, currentData.period);
      
      // Log COGS calculation warnings
      if (cogsResult.warnings.length > 0) {
        logger.warn('Profit metrics COGS warnings:', cogsResult.warnings);
      }
      
      if (!margins.isValid) {
        logger.warn('Profit metrics validation failed:', margins.errors);
      }

      return {
        grossProfit: margins.grossProfit,
        netProfit: margins.netProfit,
        grossMargin: margins.grossMargin,
        netMargin: margins.netMargin,
        revenue,
        cogs: cogsResult.value,
        opex,
        // WAC metrics with F&B breakdown
        totalHPP,
        hppBreakdown: hppBreakdown.map((item): FNBCOGSBreakdown => ({
          item_id: item.id,
          item_name: item.nama,
          category: 'Bahan Makanan Utama', // Default category, could be enhanced
          quantity_used: item.qty,
          unit: 'unit', // Default unit, could be enhanced
          unit_price: item.price,
          total_cost: item.hpp,
          percentage: totalHPP > 0 ? (item.hpp / totalHPP) * 100 : 0,
          wac_price: item.price,
          is_expensive: item.hpp > 100000 // > 100k considered expensive
        }))
      };
    } catch (err) {
      logger.error('Error calculating profit metrics:', err);
      return {
        grossProfit: 0,
        netProfit: 0,
        grossMargin: 0,
        netMargin: 0,
        revenue: 0,
        cogs: 0,
        opex: 0,
        // WAC metrics on error
        totalHPP: 0,
        hppBreakdown: [] as FNBCOGSBreakdown[]
      };
    }
  }, [revenue, cogs, opex, currentData, totalHPP, hppBreakdown]); // ✅ Sekarang menggunakan primitive value dan data WAC

  // ✅ ADD: WAC Validation Effect
  useEffect(() => {
    if (!enableWAC || !currentData) {
      setWacValidation(null);
      setDataQualityMetrics(null);
      setValidationScore(0);
      return;
    }

    try {
      // Run WAC validation
      const validation = validateWACConsistency(
        currentData as RealTimeProfitCalculation,
        totalHPP,
        revenue
      );
      setWacValidation(validation);

      // Calculate data quality metrics
      const qualityMetrics = calculateDataQualityMetrics(
        currentData as RealTimeProfitCalculation,
        totalHPP
      );
      setDataQualityMetrics(qualityMetrics);

      // Run comprehensive validation for overall score
      const comprehensiveResult = performComprehensiveValidation(
        currentData as RealTimeProfitCalculation,
        profitMetrics,
        totalHPP,
        revenue
      );
      setValidationScore(comprehensiveResult.overallScore);

      // Log validation results
      if (!validation.isValid) {
        logger.warn('WAC validation issues detected:', {
          issues: validation.issues,
          severity: validation.severity,
          period: (currentData && 'period' in currentData) ? currentData.period : 'unknown'
        });
      }

      if (qualityMetrics.dataConsistency < 80) {
        logger.warn('Low data consistency detected:', {
          consistency: qualityMetrics.dataConsistency,
          wacAvailable: qualityMetrics.wacAvailability,
          apiCogsAvailable: qualityMetrics.apiCogsAvailability
        });
      }

    } catch (error) {
      logger.error('Error in WAC validation:', error);
      setWacValidation({
        isValid: false,
        wacValue: totalHPP,
        apiCogsValue: 0,
        variance: 0,
        variancePercentage: 0,
        severity: 'high',
        issues: ['Validation error occurred'],
        recommendations: ['Check data integrity and try again']
      });
      setValidationScore(0);
    }
  }, [enableWAC, currentData, totalHPP, revenue, profitMetrics]);

  // ✅ ACTIONS
  const calculateProfit = useCallback(
    async (period?: string): Promise<boolean> => {
      const targetPeriod = period || currentPeriod;

      try {
        setError(null);
        if (mode === 'daily') {
          // Use centralized date utilities for consistency
          const now = new Date();
          const from =
            dateRange?.from ?? new Date(now.getFullYear(), now.getMonth(), 1);
          const to = dateRange?.to ?? now;
          const res = await calculateProfitAnalysisDaily(from, to);
          if (!res.success) throw new Error(res.error || 'Failed daily calculate');
          setProfitHistory(res.data || []);
          return true;
        }

        if (mode === 'yearly') {
          const res = await profitAnalysisApi.calculateProfitAnalysis(targetPeriod, 'yearly');
          if (res.error) throw new Error(res.error);
          queryClient.setQueryData(
            ['profit-analysis', 'realtime', 'yearly', targetPeriod],
            res.data
          );
          return true;
        }

        await calculateProfitMutation.mutateAsync(targetPeriod);
        return true;
      } catch (error) {
        logger.error('❌ Calculate profit failed:', error);
        return false;
      }
    },
    [currentPeriod, calculateProfitMutation, mode, dateRange, queryClient]
  );

  const loadProfitHistory = useCallback(async (dateRange?: DateRangeFilter) => {
    try {
      setError(null);
      logger.info('🔄 Loading profit history:', dateRange);
      // Bersihkan data sebelumnya agar tidak menampilkan data lama
      setProfitHistory([]);

      // Use centralized date utilities for consistency
      const now = new Date();
      const defaultDateRange = {
        from: new Date(now.getFullYear(), 0, 1),
        to: now,
        period_type: 'monthly' as const
      };
      
      const response = await profitAnalysisApi.getProfitHistory(
        dateRange || defaultDateRange
      );

      if (response.error) {
        throw new Error(response.error);
      }

      setProfitHistory(response.data || []);
      logger.success(`✅ Profit history loaded: ${(response.data || []).length} periods`);
      
    } catch (error) {
      logger.error('❌ Load profit history failed:', error);
      // Pastikan state dikosongkan saat gagal
      setProfitHistory([]);
      setError(error instanceof Error ? error.message : 'Gagal memuat riwayat profit');
      toast.error('Gagal memuat riwayat profit');
    }
  }, []); // No dependencies needed

  // Muat ulang riwayat profit saat rentang tanggal berubah
  useEffect(() => {

    // Abaikan pemanggilan saat mode harian karena data sudah dimuat oleh query utama
    if (!dateRange?.from || !dateRange?.to || mode === 'daily') return;

    loadProfitHistory({
      from: dateRange.from,
      to: dateRange.to,
      period_type: mode === 'yearly' ? 'yearly' : 'monthly'
    });
  }, [dateRange?.from, dateRange?.to, loadProfitHistory, mode]);

  // Sinkronkan currentPeriod dengan rentang tanggal agar ringkasan mengikuti detail
  useEffect(() => {
    if (!dateRange?.from || mode === 'daily') return;

    const newPeriod =
      mode === 'yearly'
        ? String(dateRange.from.getFullYear())
        : `${dateRange.from.getFullYear()}-${String(dateRange.from.getMonth() + 1).padStart(2, '0')}`;

    setCurrentPeriodState(newPeriod);
  }, [dateRange?.from, mode]);

  const refreshAnalysis = useCallback(async () => {
    logger.info('🔄 Refreshing profit analysis');
    try {
      await currentAnalysisQuery.refetch();
    } catch (error) {
      logger.error('❌ Refresh failed:', error);
    }
  }, [currentAnalysisQuery]);

  // ✅ WAC ACTION: Refresh WAC data
  const refreshWACData = useCallback(async () => {
    logger.info('🔄 Refreshing WAC data');
    try {
      await Promise.all([
        bahanMapQuery.refetch(),
        pemakaianQuery.refetch()
      ]);
    } catch (error) {
      logger.error('❌ Refresh WAC failed:', error);
    }
  }, [bahanMapQuery, pemakaianQuery]);

  // ✅ UTILITIES
  const getProfitByPeriod = useCallback((period: string) => {
    return profitHistory.find(p => p.period === period);
  }, [profitHistory]);

  const setCurrentPeriod = useCallback((period: string) => {
    logger.info('📅 Changing current period:', period);
    setCurrentPeriodState(period);
  }, []);

  // ✅ FIX #3: Use primitive calculatedAt value
  const isDataStale = useMemo(() => {
    if (!calculatedAt) return true;
    
    try {
      const calculatedAtDate = new Date(calculatedAt);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return calculatedAtDate < fiveMinutesAgo;
    } catch (err) {
      logger.error('Error checking data freshness:', err);
      return true;
    }
  }, [calculatedAt]); // ✅ Menggunakan nilai primitif string

  // ✅ FIX #4: Memoize the Date object creation to avoid re-creation on every render
  const lastCalculated = useMemo(() => {
    if (!calculatedAt) return null;
    
    try {
      return new Date(calculatedAt);
    } catch (err) {
      logger.error('Error parsing calculated_at:', err);
      return null;
    }
  }, [calculatedAt]); // ✅ Menggunakan nilai primitif string

  // ✅ AUTO-LOAD HISTORY on mount
  useEffect(() => {
    if (!autoCalculate) return;
    if (mode === 'daily') {
      // Profit history already set by daily fetch; no need to load trend
      return;
    }
    loadProfitHistory();
  }, [autoCalculate, loadProfitHistory, mode]);

  // ✅ IMPROVED: Auto-refresh WAC data with smarter intervals
  useEffect(() => {
    if (!enableWAC) return;
    
    // More frequent refresh during business hours (9 AM - 6 PM)
    const getRefreshInterval = () => {
      const now = new Date();
      const hour = now.getHours();
      const isBusinessHours = hour >= 9 && hour <= 18;
      
      // 2 minutes during business hours, 10 minutes otherwise
      return isBusinessHours ? 2 * 60 * 1000 : 10 * 60 * 1000;
    };
    
    const scheduleNextRefresh = () => {
      const interval = getRefreshInterval();
      return setTimeout(() => {
        refreshWACData();
        scheduleNextRefresh(); // Schedule next refresh
      }, interval);
    };
    
    const timeoutId = scheduleNextRefresh();
    
    return () => clearTimeout(timeoutId);
  }, [enableWAC, refreshWACData]);
  
  // ✅ NEW: Listen for purchase completion events to trigger immediate WAC refresh
  useEffect(() => {
    if (!enableWAC) return;
    
    const handlePurchaseCompletion = (event: CustomEvent) => {
      logger.info('🔄 Purchase completed, refreshing WAC data immediately');
      refreshWACData();
    };
    
    // Listen for custom purchase completion events
    window.addEventListener('purchase:completed', handlePurchaseCompletion as EventListener);
    window.addEventListener('purchase:status:changed', handlePurchaseCompletion as EventListener);
    
    return () => {
      window.removeEventListener('purchase:completed', handlePurchaseCompletion as EventListener);
      window.removeEventListener('purchase:status:changed', handlePurchaseCompletion as EventListener);
    };
  }, [enableWAC, refreshWACData]);

  return {
    // State
    currentAnalysis: (currentData && 'period' in currentData) ? currentData as RealTimeProfitCalculation : null,
    profitHistory,
    loading: currentAnalysisQuery.isLoading || calculateProfitMutation.isPending || 
             bahanMapQuery.isLoading || pemakaianQuery.isLoading,
    error: error || currentAnalysisQuery.error?.message || 
           bahanMapQuery.error?.message || pemakaianQuery.error?.message || null,
    
    // Period management
    currentPeriod,
    setCurrentPeriod,
    
    // Actions
    calculateProfit,
    loadProfitHistory,
    refreshAnalysis,
    // ✅ INCLUDE WAC ACTION
    refreshWACData,
    
    // Computed values
    profitMetrics,
    
    // ✅ ADD: WAC Validation properties
    wacValidation,
    dataQualityMetrics,
    validationScore,
    
    // Utilities
    getProfitByPeriod,
    isDataStale,
    lastCalculated,
    
    // ✅ INCLUDE WAC UTILITIES
    bahanMap: bahanMapQuery.data ?? {},
    pemakaian: Array.isArray(pemakaianQuery.data) ? pemakaianQuery.data : [],
    labels
  };
};
