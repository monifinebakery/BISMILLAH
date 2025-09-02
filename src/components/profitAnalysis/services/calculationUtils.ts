// ==============================================
// CALCULATION UTILITIES
// Core calculation functions for profit analysis
// ==============================================

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { 
  RealTimeProfitCalculation,
  ProfitApiResponse 
} from '../types/profitAnalysis.types';
import { ProfitAnalysisDateUtils, normalizeDateForDatabase } from '@/utils/unifiedDateHandler';
import { generateDayList, calculateDailyOpEx } from '@/utils/dateNormalization';
import { operationalCostApi } from '@/components/operational-costs/services/operationalCostApi';
import { 
  getCurrentUserId, 
  fetchPemakaianDailyAggregates, 
  getEffectiveUnitPrice 
} from './warehouseHelpers';

/**
 * Hitung nilai HPP baris pemakaian (pakai hpp_value/harga_efektif; fallback ke map)
 */
export function calculatePemakaianValue(p: any, bahanMap: Record<string, any>): number {
  const qty = Number(p.qty_base || 0);
  if (typeof p.hpp_value === 'number') return Number(p.hpp_value);
  if (typeof p.harga_efektif === 'number') return qty * Number(p.harga_efektif);
  
  // ✅ FLEXIBLE ID MATCHING
  const itemId = p.bahan_baku_id || p.bahanBakuId || p.id;
  const bahan = bahanMap[itemId];
  if (!bahan) return 0;
  return qty * getEffectiveUnitPrice(bahan);
}

/**
 * Calculate daily profit analysis for a date range (inclusive)
 * Enhanced with centralized date normalization and improved accuracy
 */
export async function calculateProfitAnalysisDaily(
  from: Date,
  to: Date
): Promise<ProfitApiResponse<RealTimeProfitCalculation[]>> {
  try {
    const authUserId = await getCurrentUserId();
    if (!authUserId) return { data: [], success: false, error: 'Not authenticated' };

    // Use centralized date normalization to ensure consistency
    const { startDate, endDate, startYMD, endYMD } = ProfitAnalysisDateUtils.normalizeDateRange(from, to);

    logger.info('📅 Daily profit analysis (IMPROVED):', { 
      startYMD, 
      endYMD, 
      originalFromDate: from.toISOString(),
      originalToDate: to.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      normalizedStart: startDate.toISOString(),
      normalizedEnd: endDate.toISOString()
    });

    // Fetch financial transactions in range with proper date filtering
    // Ensure we get ALL transactions in the date range (inclusive)
    const { data: trx, error: trxErr } = await supabase
      .from('financial_transactions')
      .select('id, user_id, type, category, amount, description, date')
      .eq('user_id', authUserId)
      .gte('date', startYMD)  // >= start date (inclusive)
      .lte('date', endYMD)    // <= end date (inclusive)
      .order('date', { ascending: true });
    if (trxErr) throw trxErr;
    
    logger.info('🔍 Raw transaction data fetched:', {
      totalTransactions: trx?.length || 0,
      dateRange: { startYMD, endYMD },
      sampleDates: (trx || []).slice(0, 3).map(t => ({ id: t.id, date: t.date, type: t.type, amount: t.amount })),
      uniqueDates: [...new Set((trx || []).map(t => t.date))].sort()
    });

    // Group income by day with proper date normalization
    const incomeByDay = new Map<string, number>();
    let totalTransactions = 0;
    const incomeTransactions = (trx || []).filter((t: any) => t.type === 'income');
    
    logger.info('💰 Processing income transactions:', {
      totalTransactions: trx?.length || 0,
      incomeTransactions: incomeTransactions.length,
      sampleIncomeData: incomeTransactions.slice(0, 3).map(t => ({
        date: t.date,
        amount: t.amount,
        description: t.description
      }))
    });
    
    incomeTransactions.forEach((t: any) => {
      if (!t.date) return;
      totalTransactions++;
      
      // Improved date handling - ensure consistent parsing
      let dayKey: string;
      if (typeof t.date === 'string') {
        // If already string format YYYY-MM-DD, use directly
        if (/^\d{4}-\d{2}-\d{2}$/.test(t.date)) {
          dayKey = t.date;
        } else {
          // Parse ISO string or other formats
          dayKey = normalizeDateForDatabase(new Date(t.date));
        }
      } else {
        dayKey = normalizeDateForDatabase(t.date);
      }
      
      const amount = Number(t.amount) || 0;
      
      logger.debug(`📊 Processing transaction: ${t.date} -> ${dayKey}, amount: ${amount}`);
      incomeByDay.set(dayKey, (incomeByDay.get(dayKey) || 0) + amount);
    });
    
    logger.info('💰 Income transactions processed:', { 
      totalTransactions, 
      uniqueDays: incomeByDay.size,
      incomeByDayEntries: Array.from(incomeByDay.entries()).sort(),
      totalRevenue: Array.from(incomeByDay.values()).reduce((sum, val) => sum + val, 0)
    });

    // WAC-based COGS from pemakaian (prefer MV daily aggregates)
    const cogsByDay = await fetchPemakaianDailyAggregates(startYMD, endYMD);
    logger.info('🍽️ COGS data fetched:', { 
      totalDays: cogsByDay.size,
      cogsByDayEntries: Array.from(cogsByDay.entries()).sort(),
      totalCOGS: Array.from(cogsByDay.values()).reduce((sum, val) => sum + val, 0)
    });

    // OpEx daily pro-rata (sum aktif costs per month / daysInMonth for each day)
    // 🎯 FIX: Use date-filtered operational costs for accurate period matching
    const opCostsResult = await operationalCostApi.getCostsByDateRange(startDate, endDate, authUserId);
    const activeCosts = (opCostsResult.data || []).filter((c: any) => c.status === 'aktif');
    const activeMonthly = activeCosts.reduce((s: number, c: any) => s + Number(c.jumlah_per_bulan || 0), 0);
    
    console.log('🔍 Daily OpEx Calculation (IMPROVED):', {
      dateRange: { startYMD, endYMD },
      totalCosts: opCostsResult.data?.length || 0,
      activeCosts: activeCosts.length,
      totalMonthlyOpEx: activeMonthly,
      costsBreakdown: activeCosts.map(c => ({
        nama: c.nama_biaya,
        jumlah: c.jumlah_per_bulan,
        created_at: c.created_at
      }))
    });

    // Build day list using centralized utility
    const days = generateDayList(startDate, endDate);
    
    logger.info('📅 Date range analysis (IMPROVED):', { 
      totalDays: days.length, 
      dateRange: `${days[0]} to ${days[days.length - 1]}`,
      hasRevenue: incomeByDay.size > 0,
      hasCOGS: cogsByDay.size > 0,
      daysList: days,
      revenueDays: Array.from(incomeByDay.keys()).sort(),
      cogsDays: Array.from(cogsByDay.keys()).sort()
    });

    const results: RealTimeProfitCalculation[] = days.map((dayKey) => {
      const revenue = incomeByDay.get(dayKey) || 0;
      const cogs = cogsByDay.get(dayKey) || 0;
      
      // Calculate accurate daily OpEx using centralized utility
      const dateObj = new Date(dayKey + 'T00:00:00');
      const dailyOpex = calculateDailyOpEx(activeMonthly, dateObj);
      
      logger.debug(`📅 Day ${dayKey}: Revenue=${revenue}, COGS=${cogs}, OpEx=${dailyOpex.toFixed(2)} (IMPROVED)`);
      
      return {
        period: dayKey, // Use date as period for daily mode
        revenue_data: { 
          total: revenue, 
          transactions: [] // Simplified for performance
        },
        cogs_data: { 
          total: Math.round(cogs), 
          materials: [] // Simplified for performance
        },
        opex_data: { 
          total: Math.round(dailyOpex), 
          costs: [] // Simplified for performance
        },
        calculated_at: new Date().toISOString(),
      };
    });
    
    const totalRevenue = results.reduce((sum, r) => sum + r.revenue_data.total, 0);
    const totalCOGS = results.reduce((sum, r) => sum + r.cogs_data.total, 0);
    const totalOpEx = results.reduce((sum, r) => sum + r.opex_data.total, 0);
    
    logger.success('✅ Daily profit analysis completed (IMPROVED):', {
      days: results.length,
      totalRevenue,
      totalCOGS,
      totalOpEx,
      netProfit: totalRevenue - totalCOGS - totalOpEx,
      nonZeroRevenueDays: results.filter(r => r.revenue_data.total > 0).length,
      nonZeroCOGSDays: results.filter(r => r.cogs_data.total > 0).length,
      averageDailyOpEx: results.length > 0 ? totalOpEx / results.length : 0,
      resultsSample: results.slice(0, 3).map(r => ({
        period: r.period,
        revenue: r.revenue_data.total,
        cogs: r.cogs_data.total,
        opex: r.opex_data.total
      }))
    });

    return { data: results, success: true };
  } catch (e: any) {
    logger.error('calculateProfitAnalysisDaily error:', e);
    return { data: [], success: false, error: e?.message || 'Failed to calculate daily profit' };
  }
}
