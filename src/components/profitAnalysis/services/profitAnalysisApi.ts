// services/profitAnalysisApi.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { 
  RealTimeProfitCalculation,
  ProfitApiResponse,
  DateRangeFilter,
  RevenueBreakdown,
  COGSBreakdown,
  OpExBreakdown
} from '../types/profitAnalysis.types';

// Import existing APIs with compatibility
import financialApi from '@/components/financial/services/financialApi';
import { warehouseApi } from '@/components/warehouse/services/warehouseApi';
import { operationalCostApi } from '@/components/operational-costs/services/operationalCostApi';

import { calculateRealTimeProfit, calculateMargins } from '../utils/profitCalculations';

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

// ✅ Utils kecil untuk mencoba query dengan aman
async function tryQuery<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn(); } catch { return null; }
}

/**
 * ✅ Ambil pemakaian bahan antara start..end dengan fallback berlapis:
 * 1) VIEW public.pemakaian_bahan_view
 * 2) Tabel datar public.pemakaian_bahan (jika ada)
 * 3) Join header+detail (pemakaian + pemakaian_detail) kalau ada
 * 4) RPC get_pemakaian_bahan(start, end) kalau tersedia
 * Return: Array<{ bahan_baku_id, qty_base, tanggal, harga_efektif, hpp_value }>
 */
export async function fetchPemakaianByPeriode(start: string, end: string): Promise<any[]> {
  // ✅ BONUS: pastikan end tanggal adalah last day bulan tersebut
  const endDate = new Date(end);
  const lastDayOfMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
  const formattedEnd = [
    lastDayOfMonth.getFullYear(),
    String(lastDayOfMonth.getMonth() + 1).padStart(2, '0'),
    String(lastDayOfMonth.getDate()).padStart(2, '0'),
  ].join('-');

  // 1) VIEW
  const v1 = await tryQuery(async () => {
    const { data, error } = await supabase
      .from('pemakaian_bahan_view')
      // ✅ A. Perbaiki SELECT view pemakaian (pakai kolom baru)
      .select('bahan_baku_id, qty_base, tanggal, harga_efektif, hpp_value')
      .gte('tanggal', start)
      .lte('tanggal', formattedEnd);
    if (error) throw error;
    return data ?? [];
  });
  if (v1 && v1.length >= 0) return v1;

  // 2) Tabel datar (mis. hasil ETL) bernama pemakaian_bahan
  const v2 = await tryQuery(async () => {
    const { data, error } = await supabase
      .from('pemakaian_bahan')
      // ✅ A. Perbaiki SELECT view pemakaian (pakai kolom baru)
      .select('bahan_baku_id, qty_base, tanggal, harga_efektif, hpp_value')
      .gte('tanggal', start)
      .lte('tanggal', formattedEnd);
    if (error) throw error;
    return data ?? [];
  });
  if (v2 && v2.length >= 0) return v2;

  // 3) Join header+detail (nama umum)
  const v3 = await tryQuery(async () => {
    // ambil header dulu
    const { data: headers, error: e1 } = await supabase
      .from('pemakaian')
      .select('id,tanggal')
      .gte('tanggal', start)
      .lte('tanggal', formattedEnd);
    if (e1) throw e1;
    if (!headers?.length) return [];

    const headerIds = headers.map(h => h.id);
    const { data: details, error: e2 } = await supabase
      .from('pemakaian_detail')
      .select('pemakaian_id,bahan_baku_id,qty_base,harga_efektif,hpp_value');
    if (e2) throw e2;

    const headerMap = new Map(headers.map(h => [h.id, h.tanggal]));
    return (details ?? [])
      .filter(d => headerMap.has(d.pemakaian_id))
      .map(d => ({
        bahan_baku_id: d.bahan_baku_id,
        qty_base: d.qty_base,
        tanggal: headerMap.get(d.pemakaian_id),
        harga_efektif: d.harga_efektif,
        hpp_value: d.hpp_value
      }));
  });
  if (v3 && v3.length >= 0) return v3;

  // 4) RPC bila ada
  const v4 = await tryQuery(async () => {
    const { data, error } = await supabase
      .rpc('get_pemakaian_bahan', { p_start: start, p_end: formattedEnd });
    if (error) throw error;
    // pastikan shape seragam
    return (data ?? []).map((r: any) => ({
      bahan_baku_id: r.bahan_baku_id ?? r.bahan ?? r.id_bahan,
      qty_base: Number(r.qty_base ?? r.qty ?? r.quantity ?? 0),
      tanggal: r.tanggal ?? r.date,
      harga_efektif: r.harga_efektif,
      hpp_value: r.hpp_value
    }));
  });
  if (v4 && v4.length >= 0) return v4;

  // gagal total
  logger.error('Failed to fetch pemakaian bahan from any source', { start, end: formattedEnd });
  return [];
}

// ✅ B. Perbaiki util WAC → pakai snake_case sesuai skema
export function getEffectiveUnitPrice(item: any): number {
  // skema kamu: harga_rata_rata, harga_rata2, harga_satuan
  const wac = Number(item?.harga_rata_rata ?? item?.harga_rata2 ?? 0);
  const base = Number(item?.harga_satuan ?? 0);
  return wac > 0 ? wac : base;
}

// ✅ C. Hitung nilai HPP pemakaian → prioritaskan harga_efektif dari view
export function calculatePemakaianValue(
  pemakaian: any,
  bahanMap: Record<string, any>
): number {
  // 1) kalau view sudah kirim harga_efektif, pakai ini
  if (typeof pemakaian?.harga_efektif === 'number') {
    return Number(pemakaian?.qty_base || 0) * pemakaian.harga_efektif;
  }
  // 2) fallback: ambil harga efektif dari map bahan (WAC/harga_satuan)
  const bahan = bahanMap?.[pemakaian?.bahan_baku_id];
  if (!bahan) return 0;
  const hargaEfektif = getEffectiveUnitPrice(bahan);
  return Number(pemakaian?.qty_base || 0) * hargaEfektif;
}

// Helper functions (pisahkan dari object literal)
const parseTransactions = (transactionsJson: any): any[] => {
  try {
    if (!transactionsJson) return [];
    const transactions = Array.isArray(transactionsJson) ? transactionsJson : JSON.parse(transactionsJson);
    return transactions.map((t: any) => ({
      category: t.category || 'Uncategorized',
      amount: Number(t.amount) || 0,
      description: t.description || '',
      date: t.date
    }));
  } catch (error) {
    logger.warn('Error parsing transactions JSON:', error);
    return [];
  }
};

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

const parseOpExCosts = (costsJson: any): any[] => {
  try {
    if (!costsJson) return [];
    const costs = Array.isArray(costsJson) ? costsJson : JSON.parse(costsJson);
    return costs.map((c: any) => ({
      nama_biaya: c.name || c.nama_biaya,
      jumlah_per_bulan: Number(c.amount) || 0,
      jenis: c.type || 'tetap',
      cost_category: c.category || 'general'
    }));
  } catch (error) {
    logger.warn('Error parsing OpEx costs JSON:', error);
    return [];
  }
};

const assessDataQuality = (calculation: RealTimeProfitCalculation): {
  score: number;
  issues: string[];
  recommendations: string[];
} => {
  let score = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check revenue data
  if (calculation.revenue_data.total <= 0) {
    score -= 30;
    issues.push('Tidak ada data revenue');
    recommendations.push('Tambahkan transaksi pemasukan');
  }
  
  // Check COGS data
  if (calculation.cogs_data.total <= 0) {
    score -= 20;
    issues.push('Tidak ada data COGS');
    recommendations.push('Tambahkan transaksi pembelian bahan baku');
  }
  
  // Check OpEx data
  if (calculation.opex_data.total <= 0) {
    score -= 20;
    issues.push('Tidak ada data biaya operasional');
    recommendations.push('Konfigurasi biaya operasional');
  }
  
  // Business logic validation
  const revenue = calculation.revenue_data.total;
  const cogs = calculation.cogs_data.total;
  const opex = calculation.opex_data.total;
  
  if (cogs > revenue) {
    score -= 15;
    issues.push('COGS lebih besar dari revenue');
    recommendations.push('Review kategorisasi transaksi');
  }
  
  if (opex > revenue * 0.8) {
    score -= 10;
    issues.push('Biaya operasional terlalu tinggi');
    recommendations.push('Review efisiensi operasional');
  }
  
  return {
    score: Math.max(0, score),
    issues,
    recommendations
  };
};

const generatePeriods = (from: Date, to: Date, periodType: 'monthly' | 'quarterly' | 'yearly'): string[] => {
  const periods: string[] = [];
  const current = new Date(from);
  const end = new Date(to);

  while (current <= end) {
    if (periodType === 'monthly') {
      periods.push(current.toISOString().slice(0, 7)); // YYYY-MM
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

// Fallback functions
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

const getWarehouseData = async (userId: string) => {
  try {
    const service = await warehouseApi.createService('crud', { userId });
    return await service.fetchBahanBaku();
  } catch (error) {
    logger.warn('⚠️ Failed to fetch warehouse data:', error);
    return [];
  }
};

// Main API object
export const profitAnalysisApi = {
  createService: async (serviceName: string, config: ServiceConfig) => {
    switch (serviceName) {
      case 'crud':
        return new CrudService(config);
      case 'subscription':
        return new SubscriptionService(config);
      case 'cache':
        return new CacheService(config);
      case 'alert':
        return new AlertService(config);
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  },
  
  // Export transformation helpers for use in other parts of the app
  fetchPemakaianByPeriode,
  getEffectiveUnitPrice,
  calculatePemakaianValue,
  parseTransactions,
  parseCOGSTransactions,
  parseOpExCosts,
  assessDataQuality,
  generatePeriods,
  getDateRangeFromPeriod
};

interface ServiceConfig {
  userId?: string;
  onError?: (error: string) => void;
  enableDebugLogs?: boolean;
}

/**
 * CRUD Service - Real-time updates (Enhanced for package fields)
 */
class CrudService {
  constructor(private config: ServiceConfig) {}

  async fetchBahanBaku(): Promise<BahanBakuFrontend[]> {
    try {
      let query = supabase.from('bahan_baku').select(`
        id, user_id, nama, kategori, stok, satuan, minimum, harga_satuan, supplier,
        tanggal_kadaluwarsa, created_at, updated_at, jumlah_beli_kemasan,
        isi_per_kemasan, satuan_kemasan, harga_total_beli_kemasan,
        harga_rata_rata, harga_rata2
      `);
      
      // Filter by user_id if provided
      if (this.config.userId) {
        query = query.eq('user_id', this.config.userId);
      }

      const { data, error } = await query.order('nama', { ascending: true });
      
      if (error) throw error;
      
      // Transform database format to frontend format
      const transformedData = (data || []).map(transformToFrontend);
      
      return transformedData;
    } catch (error: any) {
      this.handleError('Fetch failed', error);
      return [];
    }
  }

  async addBahanBaku(bahan: Omit<BahanBakuFrontend, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      // Transform frontend data to database format
      const dbData = transformToDatabase(bahan, this.config.userId);

      const { error } = await supabase
        .from('bahan_baku')
        .insert(dbData);

      if (error) throw error;
      return true;
    } catch (error: any) {
      this.handleError('Add failed', error);
      return false;
    }
  }

  async updateBahanBaku(id: string, updates: Partial<BahanBakuFrontend>): Promise<boolean> {
    try {
      logger.info('warehouseApi.updateBahanBaku called', { id, updates });
      
      // Transform frontend updates to database format
      const dbUpdates = transformToDatabase(updates);
      
      // Remove user_id from updates to avoid changing ownership
      delete (dbUpdates as any).user_id;

      logger.debug('Updating item with ', { id, dbUpdates });

      let query = supabase
        .from('bahan_baku')
        .update(dbUpdates)
        .eq('id', id);

      // Add user_id filter if available for security
      if (this.config.userId) {
        query = query.eq('user_id', this.config.userId);
      }

      const { error, data } = await query;
      if (error) {
        logger.error('Update failed in Supabase:', { error, id, updates: dbUpdates });
        throw error;
      }
      
      logger.info('Update successful in Supabase:', { id, updates: dbUpdates, result: data });
      return true;
    } catch (error: any) {
      this.handleError('Update failed', error);
      return false;
    }
  }

  async deleteBahanBaku(id: string): Promise<boolean> {
    try {
      let query = supabase
        .from('bahan_baku')
        .delete()
        .eq('id', id);

      // Add user_id filter if available
      if (this.config.userId) {
        query = query.eq('user_id', this.config.userId);
      }

      const { error } = await query;
      if (error) throw error;
      return true;
    } catch (error: any) {
      this.handleError('Delete failed', error);
      return false;
    }
  }

  async bulkDeleteBahanBaku(ids: string[]): Promise<boolean> {
    try {
      let query = supabase
        .from('bahan_baku')
        .delete()
        .in('id', ids);

      // Add user_id filter if available
      if (this.config.userId) {
        query = query.eq('user_id', this.config.userId);
      }

      const { error } = await query;
      if (error) throw error;
      return true;
    } catch (error: any) {
      this.handleError('Bulk delete failed', error);
      return false;
    }
  }

  private handleError(message: string, error: any) {
    const errorMsg = `${message}: ${error.message || error}`;
    logger.error('CrudService:', errorMsg);
    this.config.onError?.(errorMsg);
  }
}

/**
 * Subscription Service - Real-time updates (Enhanced for package fields)
 */
class SubscriptionService {
  private subscription: any = null;

  constructor(private config: ServiceConfig) {}

  setupSubscription() {
    if (!this.config.userId) return;

    try {
      this.subscription = supabase
        .channel('bahan_baku_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bahan_baku',
          filter: this.config.userId ? `user_id=eq.${this.config.userId}` : undefined
        }, (payload) => {
          logger.debug('Subscription update:', payload);
          // Transform and handle real-time updates here
          if (payload.new) {
            const transformedData = transformToFrontend(payload.new as any);
            // Handle the transformed data
          }
        })
        .subscribe((status) => {
          logger.debug('Subscription status:', status);
        });
    } catch (error) {
      logger.warn('Subscription setup failed, continuing without real-time updates:', error);
    }
  }

  cleanupSubscription() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
  }
}

/**
 * Cache Service - Simple in-memory caching (Enhanced)
 */
class CacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor(private config: ServiceConfig) {}

  set(key: string, data: any, ttlMinutes: number = 5) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    const valid = entries.filter((it) => Date.now() - it.timestamp <= it.ttl);
    const expired = entries.length - valid.length;

    return {
      total: entries.length,
      valid: valid.length,
      expired,
      hitRate: entries.length ? valid.length / entries.length : 1
    };
  }
}

/**
 * Alert Service - Real-time notifications (Enhanced for package fields)
 */
class AlertService {
  constructor(private config: ServiceConfig) {}

  processLowStockAlert(items: BahanBakuFrontend[]) {
    const lowStockItems = items.filter(item => Number(item.stok) <= Number(item.minimum));
    if (lowStockItems.length > 0) {
      logger.warn(`Low stock alert: ${lowStockItems.length} items`);
    }
    return lowStockItems;
  }

  processExpiryAlert(items: BahanBakuFrontend[]) {
    const expiringItems = items.filter(item => {
      if (!item.expiry) return false;
      const expiryDate = new Date(item.expiry);
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + 7); // 7 days warning
      return expiryDate <= threshold && expiryDate > new Date();
    });

    if (expiringItems.length > 0) {
      logger.warn(`Expiry alert: ${expiringItems.length} items expiring soon`);
    }
    return expiringItems;
  }
}

// Export transformation helpers for use in other parts of the app
export { transformToFrontend, transformToDatabase };