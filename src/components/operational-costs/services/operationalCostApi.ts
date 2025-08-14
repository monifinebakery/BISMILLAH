// src/components/operational-costs/services/operationalCostApi.ts

import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';
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
      if (filters?.search) {
        query = query.ilike('nama_biaya', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data: data || [] };
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

      return { data };
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

      const { data, error } = await supabase
        .from('operational_costs')
        .insert({
          ...costData,
          user_id: userId, // ✅ Add user_id
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return { data, message: 'Biaya operasional berhasil ditambahkan' };
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

      const { data, error } = await supabase
        .from('operational_costs')
        .update({
          ...costData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId) // ✅ Add user filter
        .select()
        .single();

      if (error) throw error;

      return { data, message: 'Biaya operasional berhasil diperbarui' };
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
          }, 
          error: 'User tidak ditemukan. Silakan login kembali.'
        };
      }

      const { data, error } = await supabase
        .from('operational_costs')
        .select('jumlah_per_bulan, jenis, status')
        .eq('user_id', userId); // ✅ Add user filter

      if (error) throw error;

      const costs = data || [];
      
      const summary: CostSummary = {
        total_biaya_aktif: costs
          .filter(c => c.status === 'aktif')
          .reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0),
        total_biaya_tetap: costs
          .filter(c => c.jenis === 'tetap' && c.status === 'aktif')
          .reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0),
        total_biaya_variabel: costs
          .filter(c => c.jenis === 'variabel' && c.status === 'aktif')
          .reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0),
        jumlah_biaya_aktif: costs.filter(c => c.status === 'aktif').length,
        jumlah_biaya_nonaktif: costs.filter(c => c.status === 'nonaktif').length,
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

      return { data: data || null };
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('allocation_settings')
        .upsert(dataWithUserId, {
          onConflict: 'user_id', // Upsert based on user_id
        })
        .select()
        .single();

      if (error) throw error;

      return { data, message: 'Pengaturan alokasi berhasil disimpan' };
    } catch (error) {
      logger.error('Error upserting allocation settings:', error);
      
      // ✅ Better error handling
      let errorMessage = 'Gagal menyimpan pengaturan alokasi';
      
      if (error.code === '42501') {
        errorMessage = 'Tidak memiliki izin untuk menyimpan pengaturan. Silakan login kembali.';
      } else if (error.code === '23505') {
        errorMessage = 'Pengaturan sudah ada. Mencoba update...';
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