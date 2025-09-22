// src/utils/egressOptimization.ts
// 🚀 EGRESS OPTIMIZATION UTILITIES

import { supabase } from '@/integrations/supabase/client';

// 1. FIELD-SELECTIVE QUERIES
export const OPTIMIZED_SELECTS = {
  orders: {
    list: 'id, nomor_pesanan, tanggal, nama_pelanggan, status, total_pesanan, created_at',
    detail: 'id, nomor_pesanan, tanggal, nama_pelanggan, telepon_pelanggan, email_pelanggan, alamat_pengiriman, status, total_pesanan, catatan, items, created_at, updated_at',
    minimal: 'id, nomor_pesanan, status, total_pesanan',
    full: 'id, user_id, nomor_pesanan, tanggal, status, nama_pelanggan, telepon_pelanggan, email_pelanggan, alamat_pengiriman, items, total_pesanan, catatan, created_at, updated_at'
  },
  purchases: {
    list: 'id, supplier, tanggal, total_nilai, items, status, created_at',
    detail: 'id, supplier, tanggal, total_nilai, items, status, metode_perhitungan, catatan, created_at, updated_at',
    minimal: 'id, supplier, total_nilai, status'
  },
  warehouse: {
    list: 'id, nama, stok, minimum, satuan, harga_satuan, harga_rata_rata, supplier',
    detail: 'id, nama, kategori, stok, minimum, satuan, harga_satuan, harga_rata_rata, supplier, tanggal_kadaluwarsa, created_at, updated_at',
    stock_check: 'id, nama, stok, minimum'
  },
  recipes: {
    list: 'id, nama_resep, kategori_resep, harga_jual_porsi, hpp_per_porsi',
    detail: 'id, nama_resep, jumlah_porsi, kategori_resep, deskripsi, bahan_resep, total_hpp, hpp_per_porsi, harga_jual_porsi',
    ingredients: 'id, bahan_resep'
  },
  financial: {
    list: 'id, type, category, amount, description, date, created_at',
    detail: 'id, user_id, type, category, amount, description, date, related_id, created_at, updated_at',
    minimal: 'id, user_id, related_id, type, amount, category, date',
    summary: 'id, type, amount, category, date'
  },
  profitAnalysis: {
    summary: 'id, total_revenue, total_costs, gross_profit, net_profit, profit_margin, date_range',
    detailed: 'id, revenue_breakdown, cost_breakdown, profit_analysis, recommendations, created_at'
  },
  assets: {
    list: 'id, nama, kategori, nilai_perolehan, nilai_sekarang, tanggal_perolehan, status, created_at',
    detail: 'id, nama, kategori, nilai_perolehan, nilai_sekarang, tanggal_perolehan, tanggal_penyusutan, status, deskripsi, created_at, updated_at',
    minimal: 'id, nama, nilai_sekarang, status'
  }
} as const;

// 2. CACHING LAYER
class SupabaseCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const supabaseCache = new SupabaseCache();

// 3. OPTIMIZED QUERY BUILDER
export class OptimizedQueryBuilder {
  private query: any;
  private cacheKey?: string;
  private useCache = true;

  constructor(table: string, cachePrefix: string) {
    this.query = (supabase as any).from(table);
    this.cacheKey = `${cachePrefix}:${table}`;
  }

  select(fields: string) {
    this.query = this.query.select(fields);
    this.cacheKey += `:select=${fields.replace(/\s+/g, '')}`;
    return this;
  }

  eq(column: string, value: any) {
    this.query = this.query.eq(column, value);
    this.cacheKey += `:eq_${column}=${value}`;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.query = this.query.order(column, options);
    return this;
  }

  limit(count: number) {
    this.query = this.query.limit(count);
    this.cacheKey += `:limit=${count}`;
    return this;
  }

  range(from: number, to: number) {
    this.query = this.query.range(from, to);
    this.cacheKey += `:range=${from}-${to}`;
    return this;
  }

  disableCache() {
    this.useCache = false;
    return this;
  }

  async execute() {
    // Try cache first
    if (this.useCache && this.cacheKey) {
      const cached = supabaseCache.get(this.cacheKey);
      if (cached) {
        console.log('📦 Using cached data for:', this.cacheKey);
        return cached;
      }
    }

    const { data, error } = await this.query;

    if (error) throw error;

    // Cache the result
    if (this.useCache && this.cacheKey && data) {
      supabaseCache.set(this.cacheKey, data, 30000); // 30s TTL
    }

    return data;
  }
}

// 4. PAGINATION OPTIMIZER
export class PaginationOptimizer {
  static async fetchWithPagination<T>(
    table: string,
    userId: string,
    options: {
      page: number;
      limit: number;
      selectFields: string;
      orderBy?: string;
      cachePrefix: string;
    }
  ): Promise<{ data: T[]; totalCount: number; hasMore: boolean }> {
    const { page, limit, selectFields, orderBy = 'created_at', cachePrefix } = options;
    const offset = (page - 1) * limit;

    // Get total count first
    const { count: totalCount, error: countError } = await (supabase as any)
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    // Get paginated data
    const data = await new OptimizedQueryBuilder(table, `${cachePrefix}_data_${page}`)
      .select(selectFields)
      .eq('user_id', userId)
      .order(orderBy, { ascending: false })
      .range(offset, offset + limit - 1)
      .execute();

    const hasMore = offset + limit < (totalCount || 0);

    return {
      data: data || [],
      totalCount: totalCount || 0,
      hasMore
    };
  }
}
