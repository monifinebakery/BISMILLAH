// ==============================================
// WAREHOUSE & PEMAKAIAN HELPERS
// Helper functions for warehouse data and material usage
// ==============================================

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { normalizeDateForDatabase } from '@/utils/unifiedDateHandler';
import { getCurrentUserId } from '@/utils/authHelpers';

// Re-export for backward compatibility
export { getCurrentUserId };

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
      .select('id, nama, harga_rata_rata, unit_price, stok, satuan')
      .eq('user_id', user.id);
      
    if (error) throw error;
    
    const map: Record<string, any> = {};
    (items || []).forEach((it: any) => {
      map[it.id] = {
        ...it,
        harga_rata_rata: Number(it.harga_rata_rata ?? it.hargaRataRata ?? 0),
        unit_price: Number(it.unit_price ?? it.harga ?? 0),
      };
    });
    return map;
  } catch (e) {
    logger.error('Failed to fetch bahan map:', e);
    return {};
  }
}

/**
 * Get effective unit price from item (WAC priority, fallback to base price)
 */
export function getEffectiveUnitPrice(item: any): number {
  const wac = Number(item.harga_rata_rata ?? 0);
  const base = Number(item.unit_price ?? 0);
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
      .select('bahan_baku_id, quantity, tanggal, harga_efektif, hpp_value')
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
          // Improved date handling for materialized view data
          let day: string;
          if (typeof row.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
            day = row.date; // Already in YYYY-MM-DD format
          } else {
            day = normalizeDateForDatabase(new Date(row.date));
          }
          
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
          quantity: p.quantity,
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
        const qty = Number(row.quantity || 0);
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
 * Get warehouse data helper (compatibility with existing API)
 */
export const getWarehouseData = async (userId: string) => {
  try {
    // Use direct Supabase query instead of warehouse API
    const { data, error } = await supabase
      .from('bahan_baku')
      .select(`
        id,
        nama,
        harga_satuan,
        harga_rata_rata,
        stok,
        satuan,
        kategori,
        created_at,
        updated_at
      `)
      .eq('user_id', userId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.warn('⚠️ Failed to fetch warehouse data:', error);
    return [];
  }
};
