// src/components/operational-costs/services/operationalCostApi.ts

import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';
// ✅ UPDATED: Import unified date utilities for consistency
import { UnifiedDateHandler, normalizeDateForDatabase } from '@/utils/unifiedDateHandler';
import { safeParseDate, toSafeISOString } from '@/utils/unifiedDateUtils'; // Keep for transition compatibility
import { addFinancialTransaction } from '@/components/financial/services/financialApi';
// 🔄 For cache invalidation - will be used by components
let globalQueryClient: any = null;
export const setQueryClient = (client: any) => {
  globalQueryClient = client;
};

// 🔄 Cache invalidation helper for profit analysis sync
const invalidateRelatedCaches = () => {
  if (globalQueryClient) {
    console.log('🔄 Invalidating caches for operational costs changes...');
    // Invalidate profit analysis and operational costs caches
    globalQueryClient.invalidateQueries({ queryKey: ['profit-analysis'] });
    globalQueryClient.invalidateQueries({ queryKey: ['operational-costs'] });
    globalQueryClient.invalidateQueries({ queryKey: ['financial'] });
    console.log('✅ Cache invalidation completed for profit sync');
  }
};

// 🔄 Helper untuk membuat financial transaction otomatis
const createFinancialTransactionForCost = async (cost: OperationalCost, userId: string) => {
  try {
    console.log('💰 Creating financial transaction for operational cost:', {
      costId: cost.id,
      nama: cost.nama_biaya,
      amount: cost.jumlah_per_bulan,
      status: cost.status
    });
    
    await addFinancialTransaction({
      type: 'expense',
      amount: cost.jumlah_per_bulan,
      description: `Biaya Operasional: ${cost.nama_biaya}`,
      category: 'Biaya Operasional',
      date: safeParseDate(new Date()) || new Date(),
      relatedId: cost.id,
    }, userId);
    
    console.log('✅ Financial transaction created for operational cost');
  } catch (error) {
    logger.error('Error creating financial transaction for operational cost:', error);
    // Don't throw error, just log it so operational cost creation doesn't fail
  }
};
import { 
  OperationalCost, 
  AllocationSettings, 
  CostFormData, 
  AllocationFormData,
  CostSummary,
  CostFilters,
  OverheadCalculation,
  ApiResponse,
  CostListResponse 
} from '../types';

// Helper function to get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    logger.error('Error getting current user:', error);
    return null;
  }
  return user.id;
};

// ================================
// OPERATIONAL COSTS API
// ================================

export const operationalCostApi = {
  // Get costs with date range filter for profit analysis
  async getCostsByDateRange(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<ApiResponse<OperationalCost[]>> {
    try {
      const resolvedUserId = userId ?? await getCurrentUserId();
      if (!resolvedUserId) {
        return { data: [], error: 'User tidak ditemukan. Silakan login kembali.' };
      }

      const startYMD = UnifiedDateHandler.toDatabaseString(startDate) || '';
      const endYMD = UnifiedDateHandler.toDatabaseString(endDate) || '';

      console.log('🔍 Fetching operational costs by date range:', {
        startDate: startYMD,
        endDate: endYMD,
        userId: resolvedUserId
      });

      // Get costs that were created/updated within the date range
      // AND are currently active
      const { data, error } = await supabase
        .from('operational_costs')
        .select('*')
        .eq('user_id', resolvedUserId)
        .eq('status', 'aktif') // Only active costs
        .lte('created_at', endYMD + 'T23:59:59.999Z') // Created before or during the period
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Cast the database response to our typed interface
      const typedData: OperationalCost[] = (data || []).map(item => ({
        ...item,
        jenis: item.jenis as 'tetap' | 'variabel',
        status: item.status as 'aktif' | 'nonaktif',
        group: item.group as 'hpp' | 'operasional' || 'operasional', // Default to operasional
        cost_category: item.cost_category as 'fixed' | 'variable' | 'other',
        deskripsi: item.deskripsi || undefined
      }));

      console.log('🔍 Filtered operational costs result:', {
        totalCosts: typedData.length,
        activeCosts: typedData.filter(c => c.status === 'aktif').length,
        dateRange: { startYMD, endYMD },
        costs: typedData.map(c => ({
          nama: c.nama_biaya,
          jumlah: c.jumlah_per_bulan,
          created_at: c.created_at,
          jenis: c.jenis
        }))
      });

      return { data: typedData };
    } catch (error) {
      logger.error('Error fetching costs by date range:', error);
      return { data: [], error: 'Gagal mengambil data biaya operasional berdasarkan tanggal' };
    }
  },

  // Get all costs with filters
  async getCosts(
    filters?: CostFilters,
    userId?: string
  ): Promise<ApiResponse<OperationalCost[]>> {
    try {
      const resolvedUserId = userId ?? await getCurrentUserId();
      if (!resolvedUserId) {
        return { data: [], error: 'User tidak ditemukan. Silakan login kembali.' };
      }

      let query = supabase
        .from('operational_costs')
        .select('*')
        .eq('user_id', resolvedUserId) // ✅ Add user filter
        .order('created_at', { ascending: false });

      if (filters?.jenis) {
        query = query.eq('jenis', filters.jenis);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.group) {
        query = query.eq('group', filters.group);
      }
      if (filters?.search) {
        query = query.ilike('nama_biaya', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Cast the database response to our typed interface
      const typedData: OperationalCost[] = (data || []).map(item => ({
        ...item,
        jenis: item.jenis as 'tetap' | 'variabel',
        status: item.status as 'aktif' | 'nonaktif',
        group: item.group as 'hpp' | 'operasional' || 'operasional', // Default to operasional
        cost_category: item.cost_category as 'fixed' | 'variable' | 'other',
        deskripsi: item.deskripsi || undefined // Convert null to undefined
      }));

      return { data: typedData };
    } catch (error) {
      logger.error('Error fetching costs:', error);
      return { data: [], error: 'Gagal mengambil data biaya operasional' };
    }
  },

  // Get cost by ID
  async getCostById(id: string): Promise<ApiResponse<OperationalCost | null>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { data: null, error: 'User tidak ditemukan. Silakan login kembali.' };
      }

      const { data, error } = await supabase
        .from('operational_costs')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId) // ✅ Add user filter
        .single();

      if (error) throw error;

      // Cast the database response to our typed interface
      const typedData: OperationalCost = {
        ...data,
        jenis: data.jenis as 'tetap' | 'variabel',
        status: data.status as 'aktif' | 'nonaktif',
        group: data.group as 'hpp' | 'operasional' || 'operasional', // Default to operasional
        cost_category: data.cost_category as 'fixed' | 'variable' | 'other',
        deskripsi: data.deskripsi || undefined // Convert null to undefined
      };

      return { data: typedData };
    } catch (error) {
      logger.error('Error fetching cost:', error);
      return { data: null, error: 'Gagal mengambil data biaya' };
    }
  },

  // Create new cost
  async createCost(costData: CostFormData): Promise<ApiResponse<OperationalCost>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { data: {} as OperationalCost, error: 'User tidak ditemukan. Silakan login kembali.' };
      }

      // Remove cost_category as it's a generated column in the database
      const { cost_category, ...insertData } = costData as any;
      
      const { data, error } = await supabase
        .from('operational_costs')
        .insert({
          ...insertData,
          user_id: userId, // ✅ Add user_id
          created_at: UnifiedDateHandler.toDatabaseTimestamp(new Date()),
          updated_at: UnifiedDateHandler.toDatabaseTimestamp(new Date()),
        })
        .select()
        .single();

      if (error) throw error;

      // Cast the database response to our typed interface
      const typedData: OperationalCost = {
        ...data,
        jenis: data.jenis as 'tetap' | 'variabel',
        status: data.status as 'aktif' | 'nonaktif',
        group: data.group as 'hpp' | 'operasional' || 'operasional', // Default to operasional
        cost_category: data.cost_category as 'fixed' | 'variable' | 'other',
        deskripsi: data.deskripsi || undefined // Convert null to undefined
      };

      // 🔄 Invalidate caches for profit analysis sync
      invalidateRelatedCaches();
      
      // 💰 Auto-create financial transaction if cost is active
      if (typedData.status === 'aktif') {
        await createFinancialTransactionForCost(typedData, userId);
      }

      return { data: typedData, message: 'Biaya operasional berhasil ditambahkan' };
    } catch (error) {
      logger.error('Error creating cost:', error);
      return { data: {} as OperationalCost, error: 'Gagal menambahkan biaya operasional' };
    }
  },

  // Update cost
  async updateCost(id: string, costData: Partial<CostFormData>): Promise<ApiResponse<OperationalCost>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { data: {} as OperationalCost, error: 'User tidak ditemukan. Silakan login kembali.' };
      }

      // Remove cost_category as it's a generated column in the database
      const { cost_category, ...updateData } = costData as any;

      const { data, error } = await supabase
        .from('operational_costs')
        .update({
          ...updateData,
          updated_at: UnifiedDateHandler.toDatabaseTimestamp(new Date()),
        })
        .eq('id', id)
        .eq('user_id', userId) // ✅ Add user filter
        .select()
        .single();

      if (error) throw error;

      // Cast the database response to our typed interface
      const typedData: OperationalCost = {
        ...data,
        jenis: data.jenis as 'tetap' | 'variabel',
        status: data.status as 'aktif' | 'nonaktif',
        group: data.group as 'hpp' | 'operasional' || 'operasional', // Default to operasional
        cost_category: data.cost_category as 'fixed' | 'variable' | 'other',
        deskripsi: data.deskripsi || undefined // Convert null to undefined
      };

      // 🔄 Invalidate caches for profit analysis sync
      invalidateRelatedCaches();
      
      // 💰 Handle financial transaction based on status change
      if (typedData.status === 'aktif') {
        // Create or update financial transaction for active cost
        await createFinancialTransactionForCost(typedData, userId);
      } else if (typedData.status === 'nonaktif') {
        // Delete related financial transaction if cost becomes inactive
        try {
          const { data: existingTransactions } = await supabase
            .from('financial_transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('related_id', id)
            .eq('type', 'expense');
            
          if (existingTransactions && existingTransactions.length > 0) {
            await supabase
              .from('financial_transactions')
              .delete()
              .eq('user_id', userId)
              .eq('related_id', id)
              .eq('type', 'expense');
            console.log('🗑️ Deleted financial transaction for inactive operational cost');
          }
        } catch (error) {
          logger.error('Error deleting financial transaction for inactive cost:', error);
        }
      }

      return { data: typedData, message: 'Biaya operasional berhasil diperbarui' };
    } catch (error) {
      logger.error('Error updating cost:', error);
      return { data: {} as OperationalCost, error: 'Gagal memperbarui biaya operasional' };
    }
  },

  // Delete cost
  async deleteCost(id: string): Promise<ApiResponse<boolean>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { data: false, error: 'User tidak ditemukan. Silakan login kembali.' };
      }

      const { error } = await supabase
        .from('operational_costs')
        .delete()
        .eq('id', id)
        .eq('user_id', userId); // ✅ Add user filter

      if (error) throw error;
      
      // 💰 Delete related financial transactions
      try {
        await supabase
          .from('financial_transactions')
          .delete()
          .eq('user_id', userId)
          .eq('related_id', id)
          .eq('type', 'expense');
        console.log('🗑️ Deleted financial transactions for deleted operational cost');
      } catch (error) {
        logger.error('Error deleting financial transactions for deleted cost:', error);
      }

      // 🔄 Invalidate caches for profit analysis sync
      invalidateRelatedCaches();

      return { data: true, message: 'Biaya operasional berhasil dihapus' };
    } catch (error) {
      logger.error('Error deleting cost:', error);
      return { data: false, error: 'Gagal menghapus biaya operasional' };
    }
  },

  // Get cost summary
  async getCostSummary(): Promise<ApiResponse<CostSummary>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { 
          data: {
            total_biaya_aktif: 0,
            total_biaya_tetap: 0,
            total_biaya_variabel: 0,
            jumlah_biaya_aktif: 0,
            jumlah_biaya_nonaktif: 0,
            total_hpp_group: 0,
            total_operasional_group: 0,
            jumlah_hpp_aktif: 0,
            jumlah_operasional_aktif: 0,
          }, 
          error: 'User tidak ditemukan. Silakan login kembali.'
        };
      }

      const { data, error } = await supabase
        .from('operational_costs')
        .select('jumlah_per_bulan, jenis, status, group')
        .eq('user_id', userId); // ✅ Add user filter

      if (error) throw error;

      const costs = data || [];
      
      // Filter costs by status
      const activeCosts = costs.filter(c => c.status === 'aktif');
      const inactiveCosts = costs.filter(c => c.status === 'nonaktif');
      
      // Filter by group
      const hppCosts = activeCosts.filter(c => c.group === 'hpp');
      const operasionalCosts = activeCosts.filter(c => c.group === 'operasional');
      
      const summary: CostSummary = {
        total_biaya_aktif: activeCosts
          .reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0),
        total_biaya_tetap: activeCosts
          .filter(c => c.jenis === 'tetap')
          .reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0),
        total_biaya_variabel: activeCosts
          .filter(c => c.jenis === 'variabel')
          .reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0),
        jumlah_biaya_aktif: activeCosts.length,
        jumlah_biaya_nonaktif: inactiveCosts.length,
        // New dual-mode properties
        total_hpp_group: hppCosts.reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0),
        total_operasional_group: operasionalCosts.reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0),
        jumlah_hpp_aktif: hppCosts.length,
        jumlah_operasional_aktif: operasionalCosts.length,
      };

      return { data: summary };
    } catch (error) {
      logger.error('Error fetching cost summary:', error);
      return { 
        data: {
          total_biaya_aktif: 0,
          total_biaya_tetap: 0,
          total_biaya_variabel: 0,
          jumlah_biaya_aktif: 0,
          jumlah_biaya_nonaktif: 0,
          total_hpp_group: 0,
          total_operasional_group: 0,
          jumlah_hpp_aktif: 0,
          jumlah_operasional_aktif: 0,
        }, 
        error: 'Gagal mengambil ringkasan biaya' 
      };
    }
  },
};

// ================================
// ALLOCATION SETTINGS API
// ================================

export const allocationApi = {
  // Get allocation settings
  async getSettings(): Promise<ApiResponse<AllocationSettings | null>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { data: null, error: 'User tidak ditemukan. Silakan login kembali.' };
      }

      const { data, error } = await supabase
        .from('allocation_settings')
        .select('*')
        .eq('user_id', userId) // ✅ Add user filter
        .maybeSingle(); // Use maybeSingle instead of single to handle no data case

      if (error) throw error;

      // Cast the database response to our typed interface
      const typedData: AllocationSettings | null = data ? {
        id: (data as any).id || 'temp-id', // Handle missing ID from DB response
        ...data,
        metode: data.metode as 'per_unit' | 'persentase'
      } : null;

      return { data: typedData };
    } catch (error) {
      logger.error('Error fetching allocation settings:', error);
      return { data: null, error: 'Gagal mengambil pengaturan alokasi' };
    }
  },

  // Create or update allocation settings
  async upsertSettings(settingsData: AllocationFormData): Promise<ApiResponse<AllocationSettings>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { data: {} as AllocationSettings, error: 'User tidak ditemukan. Silakan login kembali.' };
      }

      // ✅ FIXED: Add user_id and timestamps
      const dataWithUserId = {
        ...settingsData,
        user_id: userId,
        created_at: toSafeISOString(safeParseDate(new Date()) || new Date()) || new Date().toISOString(),
         updated_at: toSafeISOString(safeParseDate(new Date()) || new Date()) || new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('allocation_settings')
        .upsert(dataWithUserId, {
          onConflict: 'user_id', // Upsert based on user_id
        })
        .select()
        .single();

      if (error) throw error;

      // Cast the database response to our typed interface
      const typedData: AllocationSettings = {
        id: (data as any).id || 'temp-id', // Handle missing ID from DB response
        ...data,
        metode: data.metode as 'per_unit' | 'persentase'
      };

      return { data: typedData, message: 'Pengaturan alokasi berhasil disimpan' };
    } catch (error) {
      logger.error('Error upserting allocation settings:', error);
      
      // ✅ Better error handling with proper typing
      let errorMessage = 'Gagal menyimpan pengaturan alokasi';
      
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any;
        if (dbError.code === '42501') {
          errorMessage = 'Tidak memiliki izin untuk menyimpan pengaturan. Silakan login kembali.';
        } else if (dbError.code === '23505') {
          errorMessage = 'Pengaturan sudah ada. Mencoba update...';
        }
      }

      return { data: {} as AllocationSettings, error: errorMessage };
    }
  },

  // Delete allocation settings
  async deleteSettings(): Promise<ApiResponse<boolean>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { data: false, error: 'User tidak ditemukan. Silakan login kembali.' };
      }

      const { error } = await supabase
        .from('allocation_settings')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return { data: true, message: 'Pengaturan alokasi berhasil dihapus' };
    } catch (error) {
      logger.error('Error deleting allocation settings:', error);
      return { data: false, error: 'Gagal menghapus pengaturan alokasi' };
    }
  },
};

// ================================
// CALCULATION API
// ================================

export const calculationApi = {
  // Calculate overhead
  async calculateOverhead(materialCost: number = 0): Promise<ApiResponse<OverheadCalculation>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return {
          data: {
            total_costs: 0,
            overhead_per_unit: 0,
            metode: 'per_unit',
            nilai_basis: 1000,
          },
          error: 'User tidak ditemukan. Silakan login kembali.'
        };
      }

      // Get total costs for current user
      const { data: totalCosts, error: costsError } = await supabase
        .rpc('get_total_costs', { p_user_id: userId }); // ✅ Pass user_id to function

      if (costsError) throw costsError;

      // Get allocation settings for current user
      const { data: settings } = await allocationApi.getSettings();

      if (!settings) {
        return {
          data: {
            total_costs: totalCosts || 0,
            overhead_per_unit: 0,
            metode: 'per_unit',
            nilai_basis: 1000,
          },
          error: 'Pengaturan alokasi belum dikonfigurasi'
        };
      }

      // Calculate overhead using database function
      const { data: overhead, error: calcError } = await supabase
        .rpc('calculate_overhead', { 
          p_material_cost: materialCost,
          p_user_id: userId // ✅ Pass user_id to function
        });

      if (calcError) throw calcError;

      return {
        data: {
          total_costs: totalCosts || 0,
          overhead_per_unit: overhead || 0,
          metode: settings.metode,
          nilai_basis: settings.nilai,
          material_cost: materialCost,
        }
      };
    } catch (error) {
      logger.error('Error calculating overhead:', error);
      return {
        data: {
          total_costs: 0,
          overhead_per_unit: 0,
          metode: 'per_unit',
          nilai_basis: 1000,
        },
        error: 'Gagal menghitung overhead'
      };
    }
  },
};