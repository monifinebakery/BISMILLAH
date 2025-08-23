// ==============================================
// FINAL PROFIT ANALYSIS API - Complete Updated Version
// Compatible with Actual Schema + Enhanced Features
// ==============================================

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { 
  RealTimeProfitCalculation,
  ProfitApiResponse,
  DateRangeFilter,
  RevenueBreakdown,
  COGSBreakdown,
  OpExBreakdown,
  FNBCOGSBreakdown,
  FNBAnalysisResult,
  FNBInsight
} from '../types/profitAnalysis.types';

// Import existing APIs with compatibility
import financialApi from '@/components/financial/services/financialApi';
import { warehouseApi } from '@/components/warehouse/services/warehouseApi';
import { operationalCostApi } from '@/components/operational-costs/services/operationalCostApi';

import { calculateRealTimeProfit, calculateMargins, generateExecutiveInsights, getCOGSEfficiencyRating } from '../utils/profitCalculations';
import { transformToFNBCOGSBreakdown, getCurrentPeriod } from '../utils/profitTransformers';
// 🍽️ Import F&B constants
import { FNB_THRESHOLDS, FNB_LABELS } from '../constants/profitConstants';
// 🔧 Import date utilities for accuracy
import { normalizeDateRange, generateDayList, calculateDailyOpEx, normalizeDateForDatabase } from '@/utils/dateNormalization';

/**
 * Get current user ID
 */
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    logger.error('Error getting current user:', error);
    return null;
  }
  return user.id;
};

// ===== WAREHOUSE + PEMAKAIAN HELPERS (export utk dipakai hooks) =====
// Catatan: kolom snake_case mengikuti schema Supabase

/**
 * Ambil semua bahan baku dan buat map by ID (pastikan field harga_rata_rata & harga_satuan ada)
 */
export async function fetchBahanMap(): Promise<Record<string, any>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Use direct Supabase query instead of warehouse API to avoid type issues
    const { data: items, error } = await supabase
      .from('bahan_baku')
      .select('*')
      .eq('user_id', user.id);
      
    if (error) throw error;
    
    const map: Record<string, any> = {};
    (items || []).forEach((it: any) => {
      map[it.id] = {
        ...it,
        harga_rata_rata: Number(it.harga_rata_rata ?? it.hargaRataRata ?? 0),
        harga_satuan: Number(it.harga_satuan ?? it.harga ?? 0),
      };
    });
    return map;
  } catch (e) {
    logger.error('Failed to fetch bahan map:', e);
    return {};
  }
}

export function getEffectiveUnitPrice(item: any): number {
  const wac = Number(item.harga_rata_rata ?? 0);
  const base = Number(item.harga_satuan ?? 0);
  return wac > 0 ? wac : base;
}

/**
 * Ambil pemakaian bahan dari tabel (ikut kolom harga_efektif / hpp_value) untuk user saat ini
 */
export async function fetchPemakaianByPeriode(start: string, end: string): Promise<any[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    // Use type assertion to bypass TypeScript schema validation
    const { data, error } = await (supabase as any)
      .from('pemakaian_bahan')
      .select('bahan_baku_id, qty_base, tanggal, harga_efektif, hpp_value')
      .eq('user_id', user.id)
      .gte('tanggal', start)
      .lte('tanggal', end);
      
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    logger.error('Failed to fetch pemakaian bahan:', e);
    return [];
  }
}

/**
 * Ambil agregat harian HPP dari MV jika tersedia, fallback ke grouping tabel
 * Return Map<YYYY-MM-DD, total_hpp>
 */
/**
 * Enhanced COGS daily aggregation with improved fallback chain
 * Return Map<YYYY-MM-DD, total_hpp>
 */
export async function fetchPemakaianDailyAggregates(start: string, end: string): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  
  logger.info('🔄 Fetching COGS daily aggregates (IMPROVED):', { start, end });
  
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      logger.warn('❌ No user ID for COGS aggregates');
      return result;
    }

    // ✅ METHOD 1: Try materialized view first (most accurate)
    try {
      // Use type assertion to bypass TypeScript schema validation
      const { data: mvData, error: mvErr } = await (supabase as any)
        .from('pemakaian_bahan_daily_mv')
        .select('date, total_hpp')
        .eq('user_id', userId)
        .gte('date', start)
        .lte('date', end);

      if (!mvErr && Array.isArray(mvData) && mvData.length > 0) {
        logger.info('✅ Using materialized view for COGS (BEST):', {
          rowCount: mvData.length,
          sampleData: mvData.slice(0, 3)
        });
        
        mvData.forEach((row: any) => {
          const day = normalizeDateForDatabase(new Date(row.date));
          const hpp = Number(row.total_hpp) || 0;
          result.set(day, hpp);
          logger.debug(`📅 MV COGS: ${row.date} -> ${day}, HPP: ${hpp}`);
        });
        
        if (result.size > 0) {
          logger.info('✅ Materialized view aggregation successful:', {
            totalDays: result.size,
            totalCOGS: Array.from(result.values()).reduce((sum, val) => sum + val, 0)
          });
          return result;
        }
      }
      
      logger.warn('⚠️ Materialized view returned no data:', mvErr?.message || 'Empty result');
    } catch (mvError) {
      logger.warn('⚠️ Materialized view query failed:', mvError);
    }

    // 🔄 METHOD 2: Table fallback with improved aggregation
    logger.info('🔄 Using table fallback for COGS aggregation (FALLBACK)');
    
    try {
      const pemakaian = await fetchPemakaianByPeriode(start, end);
      
      logger.info('📊 Pemakaian data from table:', {
        rowCount: pemakaian.length,
        dateRange: { start, end },
        sampleData: pemakaian.slice(0, 3).map(p => ({
          tanggal: p.tanggal,
          qty_base: p.qty_base,
          harga_efektif: p.harga_efektif,
          hpp_value: p.hpp_value
        }))
      });
      
      if (pemakaian.length === 0) {
        logger.warn('⚠️ No pemakaian data found for period');
        return result;
      }
      
      pemakaian.forEach((row: any) => {
        if (!row.tanggal) return;
        
        const day = normalizeDateForDatabase(new Date(row.tanggal));
        const qty = Number(row.qty_base || 0);
        const val = typeof row.hpp_value === 'number'
          ? Number(row.hpp_value)
          : typeof row.harga_efektif === 'number'
            ? qty * Number(row.harga_efektif)
            : 0;
        
        if (val > 0) {
          logger.debug(`📅 Table COGS: ${row.tanggal} -> ${day}, Value: ${val}`);
          result.set(day, (result.get(day) || 0) + val);
        }
      });
      
      logger.info('📊 Table fallback aggregation completed:', {
        totalDays: result.size,
        totalCOGS: Array.from(result.values()).reduce((sum, val) => sum + val, 0),
        aggregatedData: Array.from(result.entries()).sort().slice(0, 5) // Show first 5 for debugging
      });
      
    } catch (e) {
      logger.error('❌ Failed to build daily aggregates from table:', e);
    }

    // 🔄 METHOD 3: Final fallback - empty result with warning
    if (result.size === 0) {
      logger.warn('⚠️ All COGS calculation methods failed, returning empty result');
    }

    return result;
  } catch (error) {
    logger.error('❌ Critical error in COGS aggregation:', error);
    return result;
  }
}

/**
 * Hitung nilai HPP baris pemakaian (pakai hpp_value/harga_efektif; fallback ke map)
 */
export function calculatePemakaianValue(p: any, bahanMap: Record<string, any>): number {
  const qty = Number(p.qty_base || 0);
  if (typeof p.hpp_value === 'number') return Number(p.hpp_value);
  if (typeof p.harga_efektif === 'number') return qty * Number(p.harga_efektif);
  const bahan = bahanMap[p.bahan_baku_id];
  if (!bahan) return 0;
  return qty * getEffectiveUnitPrice(bahan);
}

// ===== HELPER FUNCTIONS (PISAHKAN DARI OBJECT LITERAL) =====

/**
 * Calculate daily profit analysis for a date range (inclusive)
 * Enhanced with centralized date normalization and improved accuracy
 */
export async function calculateProfitAnalysisDaily(
  from: Date,
  to: Date
): Promise<ProfitApiResponse<RealTimeProfitCalculation[]>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { data: [], success: false, error: 'Not authenticated' };

    // Use centralized date normalization to ensure consistency
    const { startDate, endDate, startYMD, endYMD } = normalizeDateRange(from, to);

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
    const { data: trx, error: trxErr } = await supabase
      .from('financial_transactions')
      .select('id, user_id, type, category, amount, description, date')
      .eq('user_id', userId)
      .gte('date', startYMD)
      .lte('date', endYMD)
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
      // Use centralized date normalization
      const dayKey = normalizeDateForDatabase(new Date(t.date));
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
    // Use type assertion to bypass TypeScript schema validation
    const { data: costs, error: costErr } = await (supabase as any)
      .from('operational_costs')
      .select('jumlah_per_bulan, jenis, status');
    if (costErr) throw costErr;
    const activeMonthly = (costs || []).filter((c: any) => c.status === 'aktif').reduce((s: number, c: any) => s + Number(c.jumlah_per_bulan || 0), 0);

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

/**
 * 🍽️ Parse F&B revenue transactions from JSONB with category mapping
 */
const parseTransactions = (transactionsJson: any): any[] => {
  try {
    if (!transactionsJson) return [];
    const transactions = Array.isArray(transactionsJson) ? transactionsJson : JSON.parse(transactionsJson);
    
    return transactions.map((t: any) => {
      let category = t.category || 'Uncategorized';
      
      // 🍽️ Map to F&B friendly categories
      const categoryMapping: Record<string, string> = {
        'Penjualan': 'Penjualan Makanan',
        'Sales': 'Penjualan Makanan', 
        'Food Sales': 'Penjualan Makanan',
        'Beverage Sales': 'Penjualan Minuman',
        'Minuman': 'Penjualan Minuman',
        'Catering': 'Paket Catering',
        'Delivery': 'Delivery/Ojol',
        'Event': 'Event & Acara'
      };
      
      category = categoryMapping[category] || category;
      
      return {
        category,
        amount: Number(t.amount) || 0,
        description: t.description || '',
        date: t.date
      };
    });
  } catch (error) {
    logger.warn('Error parsing transactions JSON:', error);
    return [];
  }
};

/**
 * Parse COGS transactions from JSONB
 */
const parseCOGSTransactions = (transactionsJson: any): any[] => {
  try {
    if (!transactionsJson) return [];
    const transactions = Array.isArray(transactionsJson) ? transactionsJson : JSON.parse(transactionsJson);
    return transactions.map((t: any) => ({
      name: t.description || t.category || 'Material Cost',
      cost: Number(t.amount) || 0,
      category: t.category || 'Direct Material'
    }));
  } catch (error) {
    logger.warn('Error parsing COGS transactions JSON:', error);
    return [];
  }
};

/**
 * 🏪 Parse F&B operational costs from JSONB with friendly names
 */
const parseOpExCosts = (costsJson: any): any[] => {
  try {
    if (!costsJson) return [];
    const costs = Array.isArray(costsJson) ? costsJson : JSON.parse(costsJson);
    
    return costs.map((c: any) => {
      let friendlyName = c.name || c.nama_biaya;
      
      // 🏪 Map to F&B friendly operational cost names
      const nameMapping: Record<string, string> = {
        'Gaji': 'Gaji Karyawan',
        'Salary': 'Gaji Karyawan',
        'Rent': 'Sewa Tempat', 
        'Sewa': 'Sewa Tempat',
        'Electricity': 'Listrik & Air',
        'Listrik': 'Listrik & Air',
        'Water': 'Listrik & Air',
        'Air': 'Listrik & Air',
        'Marketing': 'Promosi & Iklan',
        'Advertising': 'Promosi & Iklan',
        'Promosi': 'Promosi & Iklan'
      };
      
      // Find mapping
      const mappedName = Object.keys(nameMapping).find(key => 
        friendlyName.toLowerCase().includes(key.toLowerCase())
      );
      
      if (mappedName) {
        friendlyName = nameMapping[mappedName];
      }
      
      return {
        nama_biaya: friendlyName,
        jumlah_per_bulan: Number(c.amount) || 0,
        jenis: c.type || 'tetap',
        cost_category: c.category || 'general'
      };
    });
  } catch (error) {
    logger.warn('Error parsing OpEx costs JSON:', error);
    return [];
  }
};

/**
 * 🍽️ Assess data quality with F&B specific thresholds
 */
const assessDataQuality = (calculation: RealTimeProfitCalculation): {
  score: number;
  issues: string[];
  recommendations: string[];
} => {
  let score = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check revenue data with F&B context
  if (calculation.revenue_data.total <= 0) {
    score -= 30;
    issues.push('💰 Tidak ada data omset');
    recommendations.push('🏋️ Catat semua penjualan makanan dan minuman');
  }
  
  // Check COGS data
  if (calculation.cogs_data.total <= 0) {
    score -= 20;
    issues.push('🥘 Tidak ada data modal bahan baku');
    recommendations.push('📝 Catat pembelian semua bahan: sayur, daging, bumbu, dll');
  }
  
  // Check OpEx data
  if (calculation.opex_data.total <= 0) {
    score -= 20;
    issues.push('🏪 Tidak ada data biaya bulanan tetap');
    recommendations.push('⚙️ Set biaya rutin: sewa, listrik, gaji karyawan');
  }
  
  // F&B business logic validation
  const revenue = calculation.revenue_data.total;
  const cogs = calculation.cogs_data.total;
  const opex = calculation.opex_data.total;
  const cogsRatio = revenue > 0 ? cogs / revenue : 0;
  
  // Use F&B specific thresholds
  if (cogs > revenue) {
    score -= 15;
    issues.push('⚠️ Modal bahan baku lebih besar dari omset (tidak wajar)');
    recommendations.push('🔍 Cek pencatatan: apakah ada yang salah kategori?');
  }
  
  if (cogsRatio > FNB_THRESHOLDS.ALERTS.high_ingredient_cost) {
    score -= 10;
    issues.push(`🥘 Modal bahan baku terlalu tinggi (${(cogsRatio * 100).toFixed(1)}% dari omset)`);
    recommendations.push('📊 Review supplier dan porsi menu');
  }
  
  if (opex > revenue * 0.3) { // F&B specific: OpEx shouldn't exceed 30% of revenue
    score -= 10;
    issues.push('🏪 Biaya bulanan tetap terlalu tinggi untuk warung F&B');
    recommendations.push('💰 Cari cara hemat listrik, sewa, atau gaji');
  }
  
  // Low revenue warning for F&B
  if (revenue > 0 && revenue < FNB_THRESHOLDS.ALERTS.low_revenue) {
    score -= 5;
    issues.push('📋 Omset masih di bawah rata-rata warung yang sehat');
    recommendations.push('🚀 Fokus promosi dan tambah jam buka');
  }
  
  return {
    score: Math.max(0, score),
    issues,
    recommendations
  };
};

/**
 * Generate period strings based on date range
 */
const generatePeriods = (from: Date, to: Date, periodType: 'monthly' | 'quarterly' | 'yearly'): string[] => {
  const periods: string[] = [];
  const current = new Date(from);
  const end = new Date(to);

  while (current <= end) {
    if (periodType === 'monthly') {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      periods.push(`${year}-${month}`); // YYYY-MM
      current.setMonth(current.getMonth() + 1);
    } else if (periodType === 'quarterly') {
      const quarter = Math.floor(current.getMonth() / 3) + 1;
      periods.push(`${current.getFullYear()}-Q${quarter}`);
      current.setMonth(current.getMonth() + 3);
    } else if (periodType === 'yearly') {
      periods.push(current.getFullYear().toString());
      current.setFullYear(current.getFullYear() + 1);
    }
  }

  return periods;
};

/**
 * Convert a period string (e.g., 2024-05, 2024-Q1, 2024) into a date range
 */
const getDateRangeFromPeriod = (period: string): { from: Date; to: Date } => {
  if (period.includes('-Q')) {
    const [yearStr, quarterStr] = period.split('-Q');
    const year = Number(yearStr);
    const quarter = Number(quarterStr);
    const startMonth = (quarter - 1) * 3;
    const from = new Date(year, startMonth, 1);
    const to = new Date(year, startMonth + 3, 0);
    return { from, to };
  }

  if (period.length === 7) {
    const [yearStr, monthStr] = period.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1;
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0);
    return { from, to };
  }

  const year = Number(period);
  const from = new Date(year, 0, 1);
  const to = new Date(year, 11, 31);
  return { from, to };
};

// ===== FALLBACK FUNCTIONS =====

/**
 * Fallback revenue breakdown using direct API calls
 */
const getRevenueBreakdownFallback = async (
  userId: string,
  period: string
): Promise<ProfitApiResponse<RevenueBreakdown[]>> => {
  try {
    const { from, to } = getDateRangeFromPeriod(period);
    const transactions = await financialApi.getTransactionsByDateRange(userId, from, to);
    const incomeTransactions = transactions.filter(t => t.type === 'income');

    const totalRevenue = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Group by category
    const categoryGroups = incomeTransactions.reduce((groups, transaction) => {
      const category = transaction.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = { total: 0, count: 0 };
      }
      groups[category].total += transaction.amount || 0;
      groups[category].count += 1;
      return groups;
    }, {} as Record<string, { total: number; count: number }>);

    const breakdown: RevenueBreakdown[] = Object.entries(categoryGroups).map(([category, data]) => ({
      category,
      amount: data.total,
      percentage: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0,
      transaction_count: data.count
    }));

    return {
      data: breakdown,
      success: true
    };

  } catch (error) {
    logger.error('❌ Error in revenue breakdown fallback:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Gagal mengambil breakdown revenue',
      success: false
    };
  }
};

/**
 * Get warehouse data helper (compatibility with existing API)
 */
const getWarehouseData = async (userId: string) => {
  try {
    // Use direct Supabase query instead of warehouse API
    const { data, error } = await supabase
      .from('bahan_baku')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.warn('⚠️ Failed to fetch warehouse data:', error);
    return [];
  }
};

// ===== MAIN API OBJECT =====

/**
 * Enhanced Profit Analysis API - Hybrid Approach (Stored Functions + API Integration)
 */
export const profitAnalysisApi = {
  
  /**
   * ✅ PRIMARY METHOD: Calculate real-time profit using stored function (faster)
   * Falls back to API integration if stored function fails
   */
  async calculateProfitAnalysis(
    period: string, 
    periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ): Promise<ProfitApiResponse<RealTimeProfitCalculation>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { 
          data: {} as RealTimeProfitCalculation, 
          error: 'User tidak ditemukan. Silakan login kembali.',
          success: false 
        };
      }

      logger.info('🔄 Calculating profit analysis for period:', period);
      
      // ✅ TRY METHOD 1: Use stored function (fastest, most accurate)
      try {
        // Use type assertion to bypass TypeScript RPC validation
        const { data: profitData, error: profitError } = await (supabase as any)
          .rpc('calculate_realtime_profit', {
            p_user_id: userId,
            p_period: period
          });

        if (!profitError && profitData && profitData.length > 0) {
          const result = profitData[0];
          
          const calculation: RealTimeProfitCalculation = {
            period,
            revenue_data: {
              total: Number(result.total_revenue) || 0,
              transactions: parseTransactions(result.revenue_transactions)
            },
            cogs_data: {
              total: Number(result.total_cogs) || 0,
              materials: parseCOGSTransactions(result.cogs_transactions)
            },
            opex_data: {
              total: Number(result.total_opex) || 0,
              costs: parseOpExCosts(result.opex_costs)
            },
            calculated_at: new Date().toISOString()
          };

          logger.success('✅ Stored function calculation completed:', {
            period,
            revenue: calculation.revenue_data.total,
            cogs: calculation.cogs_data.total,
            opex: calculation.opex_data.total
          });

          return {
            data: calculation,
            success: true,
            message: 'Analisis profit berhasil dihitung (stored function)'
          };
        }
      } catch (storedFunctionError) {
        logger.warn('⚠️ Stored function failed, falling back to API integration:', storedFunctionError);
      }

      // ✅ FALLBACK METHOD 2: Use API integration (compatibility)
      logger.info('🔄 Using API integration fallback');
      
        const { from, to } = getDateRangeFromPeriod(period);

        const [
          transactions,
          materials,
          operationalCosts
        ] = await Promise.all([
          financialApi.getTransactionsByDateRange(userId, from, to),
          getWarehouseData(userId),
          operationalCostApi.getCosts(undefined, userId)
        ]);

      // Handle potential errors from data sources
      if (!Array.isArray(transactions)) {
        throw new Error('Failed to fetch financial transactions');
      }

      const materialsData = Array.isArray(materials) ? materials.map(m => ({
        id: m.id,
        nama: m.nama,
        stok: m.stok,
        harga_satuan: m.harga_satuan,
        status: 'aktif' as const, // Default to active
        user_id: userId
      })) : [];
      const costsData = operationalCosts.data || [];
      
      // Convert transactions to expected format
      const transactionsActual = transactions.map(t => ({
        id: t.id,
        type: t.type,
        category: t.category || undefined,
        amount: t.amount,
        date: typeof t.date === 'string' ? t.date : (t.date?.toISOString() || new Date().toISOString()),
        description: t.description || undefined,
        user_id: userId // Add missing user_id field
      }));
      
      // 🔍 DEBUG: Enhanced logging for profit analysis transaction processing
      const cogsTransactions = transactionsActual.filter(t => 
        t.type === 'expense' && t.category === 'Pembelian Bahan Baku'
      );
      
      console.log('🔍 Profit Analysis Transaction Debug:', {
        period,
        totalTransactions: transactionsActual.length,
        cogsTransactionCount: cogsTransactions.length,
        cogsTransactions: cogsTransactions.map(t => ({
          id: t.id,
          category: t.category,
          amount: t.amount,
          description: t.description,
          date: t.date
        })),
        allTransactionCategories: [...new Set(transactionsActual.map(t => t.category))],
        dateRange: { from: from.toISOString(), to: to.toISOString() }
      });

      // Calculate profit analysis using utility function
      const calculation = calculateRealTimeProfit(
        period,
        transactionsActual,
        materialsData,
        costsData
      );

      logger.success('✅ API integration calculation completed:', {
        period,
        revenue: calculation.revenue_data.total,
        cogs: calculation.cogs_data.total,
        opex: calculation.opex_data.total
      });

      return {
        data: calculation,
        success: true,
        message: 'Analisis profit berhasil dihitung (API integration)'
      };

    } catch (error) {
      logger.error('❌ Error calculating profit analysis:', error);
      return {
        data: {} as RealTimeProfitCalculation,
        error: error instanceof Error ? error.message : 'Gagal menghitung analisis profit',
        success: false
      };
    }
  },

  /**
   * ✅ Get detailed revenue breakdown using stored function
   */
  async getRevenueBreakdown(
    userId: string, 
    period: string
  ): Promise<ProfitApiResponse<RevenueBreakdown[]>> {
    try {
      // Use type assertion to bypass TypeScript RPC validation
      const { data, error } = await (supabase as any)
        .rpc('get_revenue_breakdown', {
          p_user_id: userId,
          p_period: period
        });

      if (error) {
        // Fallback to manual calculation
        logger.warn('Revenue breakdown function failed, using fallback');
        return getRevenueBreakdownFallback(userId, period);
      }

      const breakdown: RevenueBreakdown[] = (data || []).map((item: any) => ({
        category: item.category || 'Uncategorized',
        amount: Number(item.amount) || 0,
        percentage: Number(item.percentage) || 0,
        transaction_count: Number(item.transaction_count) || 0
      }));

      return {
        data: breakdown,
        success: true
      };

    } catch (error) {
      logger.error('❌ Error getting revenue breakdown:', error);
      return getRevenueBreakdownFallback(userId, period);
    }
  },

  /**
   * ✅ Get operational expenses breakdown using stored function
   */
  async getOpExBreakdown(
    userId: string
  ): Promise<ProfitApiResponse<OpExBreakdown[]>> {
    try {
      // Use type assertion to bypass TypeScript RPC validation
      const { data, error } = await (supabase as any)
        .rpc('get_opex_breakdown', {
          p_user_id: userId
        });

      if (error) {
        // Fallback to direct API call
        logger.warn('OpEx breakdown function failed, using fallback');
        const opexResult = await operationalCostApi.getCosts(undefined, userId);
        const activeCosts = (opexResult.data || []).filter(c => c.status === 'aktif');
        const totalOpEx = activeCosts.reduce((sum, c) => sum + (c.jumlah_per_bulan || 0), 0);

        const breakdown: OpExBreakdown[] = activeCosts.map(cost => ({
          cost_name: cost.nama_biaya,
          amount: Number(cost.jumlah_per_bulan) || 0,
          type: cost.jenis as 'tetap' | 'variabel',
          percentage: totalOpEx > 0 ? ((cost.jumlah_per_bulan || 0) / totalOpEx) * 100 : 0
        }));

        return {
          data: breakdown,
          success: true
        };
      }

      const breakdown: OpExBreakdown[] = (data || []).map((item: any) => ({
        cost_name: item.nama_biaya,
        amount: Number(item.jumlah_per_bulan) || 0,
        type: item.jenis as 'tetap' | 'variabel',
        percentage: Number(item.percentage) || 0
      }));

      return {
        data: breakdown,
        success: true
      };

    } catch (error) {
      logger.error('❌ Error getting OpEx breakdown:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Gagal mengambil breakdown OpEx',
        success: false
      };
    }
  },

  /**
   * ✅ Enhanced profit history with hybrid approach
   */
  async getProfitHistory(
    dateRange: DateRangeFilter
  ): Promise<ProfitApiResponse<RealTimeProfitCalculation[]>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { 
          data: [], 
          error: 'User tidak ditemukan. Silakan login kembali.',
          success: false 
        };
      }

      // Generate periods based on date range
      const periods = generatePeriods(dateRange.from, dateRange.to, dateRange.period_type);
      
      if (periods.length === 0) {
        return {
          data: [],
          success: true,
          message: 'No periods in date range'
        };
      }

      // ✅ TRY METHOD 1: Use stored function for batch (efficient)
      try {
        const startPeriod = periods[0];
        const endPeriod = periods[periods.length - 1];

        // Use type assertion to bypass TypeScript RPC validation
        const { data: trendData, error: trendError } = await (supabase as any)
          .rpc('get_profit_trend', {
            p_user_id: userId,
            p_start_period: startPeriod,
            p_end_period: endPeriod
          });

        if (!trendError && trendData && trendData.length > 0) {
          const calculations: RealTimeProfitCalculation[] = trendData.map((item: any) => ({
            period: item.period,
            revenue_data: {
              total: Number(item.total_revenue) || 0,
              transactions: [] // Simplified for trend data
            },
            cogs_data: {
              total: Number(item.total_cogs) || 0,
              materials: []
            },
            opex_data: {
              total: Number(item.total_opex) || 0,
              costs: []
            },
            calculated_at: new Date().toISOString()
          }));

          logger.success('✅ Profit history loaded via stored function:', { 
            periodCount: calculations.length, 
            label: 'periods' 
          });

          return {
            data: calculations,
            success: true,
            message: `${calculations.length} periode berhasil dihitung (stored function)`
          };
        }
      } catch (storedFunctionError) {
        logger.warn('⚠️ Stored function batch failed, using individual calculations');
      }

      // ✅ FALLBACK METHOD 2: Individual calculations
      logger.info('🔄 Using individual calculation fallback');
      
      const calculations: RealTimeProfitCalculation[] = [];
      const errors: string[] = [];
      
      // Process in smaller chunks to avoid overwhelming the system
      const chunkSize = 3;
      for (let i = 0; i < periods.length; i += chunkSize) {
        const chunk = periods.slice(i, i + chunkSize);
        
        const chunkPromises = chunk.map(async (period) => {
          try {
            const result = await this.calculateProfitAnalysis(period, dateRange.period_type);
            if (result.success && result.data) {
              return result.data;
            } else {
              errors.push(`${period}: ${result.error || 'Unknown error'}`);
              return null;
            }
          } catch (error) {
            errors.push(`${period}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        chunkResults.forEach(result => {
          if (result) calculations.push(result);
        });

        // Small delay between chunks
        if (i + chunkSize < periods.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      logger.success('✅ Profit history completed:', {
        requested: periods.length,
        successful: calculations.length,
        errors: errors.length
      });

      return {
        data: calculations,
        success: true,
        message: `${calculations.length}/${periods.length} periode berhasil dihitung`,
        ...(errors.length > 0 && { 
          error: `Some calculations failed: ${errors.slice(0, 2).join('; ')}${errors.length > 2 ? '...' : ''}` 
        })
      };

    } catch (error) {
      logger.error('❌ Error getting profit history:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Gagal mengambil riwayat profit',
        success: false
      };
    }
  },

  /**
   * ✅ Calculate detailed profit analysis with all breakdowns
   */
  async calculateDetailedProfitAnalysis(
    period: string
  ): Promise<ProfitApiResponse<RealTimeProfitCalculation & {
    revenueBreakdown: RevenueBreakdown[];
    opexBreakdown: OpExBreakdown[];
    dataQuality: {
      score: number;
      issues: string[];
      recommendations: string[];
    };
  }>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { 
          data: {} as any, 
          error: 'User tidak ditemukan. Silakan login kembali.',
          success: false 
        };
      }

      // Run all calculations in parallel
      const [
        basicCalc,
        revenueBreakdown,
        opexBreakdown
      ] = await Promise.all([
        this.calculateProfitAnalysis(period),
        this.getRevenueBreakdown(userId, period),
        this.getOpExBreakdown(userId)
      ]);

      if (!basicCalc.success) {
        return basicCalc as any;
      }

      // Calculate data quality
      const dataQuality = assessDataQuality(basicCalc.data);

      const detailedAnalysis = {
        ...basicCalc.data,
        revenueBreakdown: revenueBreakdown.data || [],
        opexBreakdown: opexBreakdown.data || [],
        dataQuality
      };

      return {
        data: detailedAnalysis,
        success: true,
        message: 'Detailed profit analysis completed'
      };

    } catch (error) {
      logger.error('❌ Error in detailed profit analysis:', error);
      return {
        data: {} as any,
        error: error instanceof Error ? error.message : 'Gagal menghitung analisis detail',
        success: false
      };
    }
  },

  /**
   * ✅ Export profit data to CSV
   */
  async exportProfitData(
    dateRange: DateRangeFilter,
    includeBreakdowns: boolean = true
  ): Promise<ProfitApiResponse<{
    csvData: string;
    filename: string;
    recordCount: number;
  }>> {
    try {
      const historyResult = await this.getProfitHistory(dateRange);
      if (!historyResult.success) {
        return historyResult as any;
      }

      const calculations = historyResult.data;
      if (calculations.length === 0) {
        return {
          data: {
            csvData: 'No data available for the selected period',
            filename: 'profit-analysis-no-data.csv',
            recordCount: 0
          },
          success: true,
          message: 'No data to export'
        };
      }

      // Generate CSV headers
      const headers = [
        'Period',
        'Revenue',
        'COGS',
        'OpEx',
        'Gross Profit',
        'Net Profit',
        'Gross Margin %',
        'Net Margin %'
      ];

      // Generate CSV rows
      const rows = calculations.map(calc => {
        const revenue = calc.revenue_data.total;
        const cogs = calc.cogs_data.total;
        const opex = calc.opex_data.total;
        const grossProfit = revenue - cogs;
        const netProfit = grossProfit - opex;
        const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
        const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        return [
          calc.period,
          revenue.toFixed(2),
          cogs.toFixed(2),
          opex.toFixed(2),
          grossProfit.toFixed(2),
          netProfit.toFixed(2),
          grossMargin.toFixed(2),
          netMargin.toFixed(2)
        ];
      });

      // Generate CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Generate filename
      const startPeriod = calculations[0]?.period || 'unknown';
      const endPeriod = calculations[calculations.length - 1]?.period || 'unknown';
      const filename = `profit-analysis-${startPeriod}-to-${endPeriod}.csv`;

      return {
        data: {
          csvData: csvContent,
          filename,
          recordCount: calculations.length
        },
        success: true,
        message: `Export completed with ${calculations.length} records`
      };

    } catch (error) {
      logger.error('❌ Error exporting profit data:', error);
      return {
        data: {
          csvData: '',
          filename: 'error.csv',
          recordCount: 0
        },
        error: error instanceof Error ? error.message : 'Gagal export data',
        success: false
      };
    }
  },

  /**
   * ✅ Get current month profit analysis
   */
  async getCurrentMonthProfit(): Promise<ProfitApiResponse<RealTimeProfitCalculation>> {
    const currentPeriod = getCurrentPeriod();
    return this.calculateProfitAnalysis(currentPeriod, 'monthly');
  },

  /**
   * 🍽️ NEW: Generate F&B specific insights and recommendations
   */
  async generateFNBInsights(
    period: string,
    effectiveCogs?: number,
    hppBreakdown?: FNBCOGSBreakdown[]
  ): Promise<ProfitApiResponse<FNBAnalysisResult>> {
    try {
      const profitResult = await this.calculateProfitAnalysis(period);
      if (!profitResult.success) {
        return {
          data: {} as FNBAnalysisResult,
          error: profitResult.error || 'Failed to get profit data',
          success: false
        };
      }

      const calculation = profitResult.data;
      const revenue = calculation.revenue_data.total;
      const cogs = effectiveCogs || calculation.cogs_data.total;
      const opex = calculation.opex_data.total;
      const margins = calculateMargins(revenue, cogs, opex);
      
      // Generate basic insights - use null for optional parameters
      const executiveInsights = null; // Simplified for this implementation

      // Generate F&B specific insights
      const insights: FNBInsight[] = [];
      const alerts: FNBInsight[] = [];
      const opportunities: FNBInsight[] = [];
      const seasonalTips: FNBInsight[] = [];

      // Cost control insights
      const cogsRatio = revenue > 0 ? cogs / revenue : 0;
      if (cogsRatio > FNB_THRESHOLDS.ALERTS.high_ingredient_cost) {
        alerts.push({
          id: 'high-ingredient-cost',
          type: 'alert',
          title: '🥘 Modal bahan baku terlalu mahal',
          description: `${(cogsRatio * 100).toFixed(1)}% dari omset (ideal <60%)`,
          impact: 'high',
          category: 'cost_control',
          actionable: true,
          action: {
            label: 'Analisis Supplier',
            type: 'internal',
            data: { cogsRatio, threshold: FNB_THRESHOLDS.ALERTS.high_ingredient_cost }
          },
          value: cogs - (revenue * FNB_THRESHOLDS.ALERTS.high_ingredient_cost),
          icon: '🥘'
        });
      }

      // Revenue opportunities
      if (revenue > 0 && revenue < FNB_THRESHOLDS.ALERTS.low_revenue) {
        opportunities.push({
          id: 'boost-revenue',
          type: 'opportunity',
          title: '📈 Potensi naikkan omset',
          description: 'Omset masih bisa ditingkatkan untuk warung yang sehat',
          impact: 'medium',
          category: 'revenue_boost',
          actionable: true,
          action: {
            label: 'Tips Marketing',
            type: 'external',
            data: { currentRevenue: revenue, targetRevenue: FNB_THRESHOLDS.ALERTS.low_revenue }
          },
          value: FNB_THRESHOLDS.ALERTS.low_revenue - revenue,
          icon: '📈'
        });
      }

      // Expensive items analysis
      if (hppBreakdown && hppBreakdown.length > 0) {
        const expensiveItems = hppBreakdown.filter(item => 
          item.is_expensive || item.percentage > 15
        );

        if (expensiveItems.length > 0) {
          alerts.push({
            id: 'expensive-ingredients',
            type: 'alert',
            title: `🚨 ${expensiveItems.length} bahan termahal`,
            description: `Bahan: ${expensiveItems.map(i => i.item_name).slice(0, 3).join(', ')}`,
            impact: 'medium',
            category: 'cost_control',
            actionable: true,
            action: {
              label: 'Lihat Detail',
              type: 'internal',
              data: expensiveItems
            },
            value: expensiveItems.reduce((sum, item) => sum + item.total_cost, 0),
            icon: '🔍'
          });
        }
      }

      // Seasonal tips (basic examples)
      const currentMonth = new Date().getMonth() + 1;
      if (currentMonth >= 3 && currentMonth <= 5) { // Ramadan season
        seasonalTips.push({
          id: 'ramadan-opportunity',
          type: 'seasonal',
          title: '🌙 Musim Ramadan',
          description: 'Siapkan menu takjil dan sahur untuk boost omset',
          impact: 'high',
          category: 'seasonal',
          actionable: true,
          action: {
            label: 'Menu Ramadan',
            type: 'external'
          },
          icon: '🌙'
        });
      }

      // Margin analysis insights
      if (margins.netMargin >= 18) {
        insights.push({
          id: 'excellent-margin',
          type: 'suggestion',
          title: '🎉 Margin sangat sehat!',
          description: `Untung bersih ${margins.netMargin.toFixed(1)}% - siap untuk ekspansi`,
          impact: 'low',
          category: 'efficiency',
          actionable: false,
          icon: '✅'
        });

        opportunities.push({
          id: 'expansion-ready',
          type: 'opportunity',
          title: '🚀 Siap Expand',
          description: 'Warung sudah sehat, pertimbangkan buka cabang',
          impact: 'high',
          category: 'revenue_boost',
          actionable: true,
          action: {
            label: 'Tips Ekspansi',
            type: 'external'
          },
          icon: '🏪'
        });
      }

      const result: FNBAnalysisResult = {
        period,
        insights,
        alerts,
        opportunities,
        seasonal_tips: seasonalTips,
        summary: {
          total_insights: insights.length + alerts.length + opportunities.length + seasonalTips.length,
          high_priority_count: [...alerts, ...opportunities, ...seasonalTips].filter(i => i.impact === 'high').length,
          potential_savings: alerts.reduce((sum, alert) => sum + (alert.value || 0), 0),
          potential_revenue_boost: opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0)
        }
      };

      return {
        data: result,
        success: true,
        message: `Generated ${result.summary.total_insights} F&B insights`
      };

    } catch (error) {
      logger.error('❌ Error generating F&B insights:', error);
      return {
        data: {} as FNBAnalysisResult,
        error: error instanceof Error ? error.message : 'Failed to generate insights',
        success: false
      };
    }
  },

  /**
   * 🍽️ NEW: Get F&B COGS breakdown with categories
   */
  async getFNBCOGSBreakdown(
    period: string,
    effectiveCogs?: number
  ): Promise<ProfitApiResponse<FNBCOGSBreakdown[]>> {
    try {
      // Try to get from WAC data first
      const bahanMap = await fetchBahanMap();
      const pemakaian = await fetchPemakaianByPeriode(
        period + '-01',
        period + '-31'
      );

      if (bahanMap && Object.keys(bahanMap).length > 0 && pemakaian && pemakaian.length > 0) {
        const fnbBreakdown: FNBCOGSBreakdown[] = pemakaian.map(item => {
          const bahan = bahanMap[item.bahan_baku_id];
          if (!bahan) return null;

          const qty = Number(item.qty_base || 0);
          const unitPrice = getEffectiveUnitPrice(bahan);
          const totalCost = calculatePemakaianValue(item, bahanMap);
          const category = profitAnalysisApi.categorizeFNBItem(bahan.nama || '');

          return {
            item_id: item.bahan_baku_id,
            item_name: bahan.nama || 'Unknown',
            category,
            quantity_used: qty,
            unit: bahan.satuan || 'unit',
            unit_price: unitPrice,
            total_cost: totalCost,
            percentage: effectiveCogs ? (totalCost / effectiveCogs) * 100 : 0,
            wac_price: unitPrice,
            is_expensive: totalCost > FNB_THRESHOLDS.ALERTS.expensive_item_threshold
          };
        }).filter(Boolean) as FNBCOGSBreakdown[];

        return {
          data: fnbBreakdown,
          success: true,
          message: 'F&B COGS breakdown generated from WAC data'
        };
      }

      // Fallback to basic breakdown
      return {
        data: [],
        success: true,
        message: 'No WAC data available for F&B breakdown'
      };

    } catch (error) {
      logger.error('❌ Error getting F&B COGS breakdown:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Failed to get F&B breakdown',
        success: false
      };
    }
  },

  /**
   * 🍽️ Helper: Categorize F&B items
   */
  categorizeFNBItem(itemName: string): string {
    const name = itemName.toLowerCase();
    
    // Main ingredients
    if (name.includes('beras') || name.includes('daging') || name.includes('ayam') ||
        name.includes('ikan') || name.includes('sayur') || name.includes('tahu') ||
        name.includes('tempe') || name.includes('mie')) {
      return 'Bahan Makanan Utama';
    }
    
    // Spices and seasonings
    if (name.includes('garam') || name.includes('gula') || name.includes('bumbu') ||
        name.includes('kecap') || name.includes('saos') || name.includes('merica') ||
        name.includes('bawang') || name.includes('cabai')) {
      return 'Bumbu & Rempah';
    }
    
    // Beverages
    if (name.includes('air') || name.includes('teh') || name.includes('kopi') ||
        name.includes('jus') || name.includes('sirup') || name.includes('susu')) {
      return 'Minuman & Sirup';
    }
    
    // Packaging
    if (name.includes('kemasan') || name.includes('box') || name.includes('cup') ||
        name.includes('plastik') || name.includes('kertas') || name.includes('styrofoam')) {
      return 'Kemasan & Wadah';
    }
    
    // Gas and fuel
    if (name.includes('gas') || name.includes('lpg') || name.includes('bensin')) {
      return 'Gas & Bahan Bakar';
    }
    
    return 'Lainnya';
  }
};

export default profitAnalysisApi;
