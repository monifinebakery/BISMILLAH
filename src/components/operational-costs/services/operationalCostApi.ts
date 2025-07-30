// src/components/operational-costs/services/operationalCostApi.ts

import { supabase } from '@/lib/supabase';
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

// ================================
// OPERATIONAL COSTS API
// ================================

export const operationalCostApi = {
  // Get all costs with filters
  async getCosts(filters?: CostFilters): Promise<ApiResponse<OperationalCost[]>> {
    try {
      let query = supabase
        .from('operational_costs')
        .select('*')
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
      console.error('Error fetching costs:', error);
      return { data: [], error: 'Gagal mengambil data biaya operasional' };
    }
  },

  // Get cost by ID
  async getCostById(id: string): Promise<ApiResponse<OperationalCost | null>> {
    try {
      const { data, error } = await supabase
        .from('operational_costs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return { data };
    } catch (error) {
      console.error('Error fetching cost:', error);
      return { data: null, error: 'Gagal mengambil data biaya' };
    }
  },

  // Create new cost
  async createCost(costData: CostFormData): Promise<ApiResponse<OperationalCost>> {
    try {
      const { data, error } = await supabase
        .from('operational_costs')
        .insert(costData)
        .select()
        .single();

      if (error) throw error;

      return { data, message: 'Biaya operasional berhasil ditambahkan' };
    } catch (error) {
      console.error('Error creating cost:', error);
      return { data: {} as OperationalCost, error: 'Gagal menambahkan biaya operasional' };
    }
  },

  // Update cost
  async updateCost(id: string, costData: Partial<CostFormData>): Promise<ApiResponse<OperationalCost>> {
    try {
      const { data, error } = await supabase
        .from('operational_costs')
        .update(costData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data, message: 'Biaya operasional berhasil diperbarui' };
    } catch (error) {
      console.error('Error updating cost:', error);
      return { data: {} as OperationalCost, error: 'Gagal memperbarui biaya operasional' };
    }
  },

  // Delete cost
  async deleteCost(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('operational_costs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { data: true, message: 'Biaya operasional berhasil dihapus' };
    } catch (error) {
      console.error('Error deleting cost:', error);
      return { data: false, error: 'Gagal menghapus biaya operasional' };
    }
  },

  // Get cost summary
  async getCostSummary(): Promise<ApiResponse<CostSummary>> {
    try {
      const { data, error } = await supabase
        .from('operational_costs')
        .select('jumlah_per_bulan, jenis, status');

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
      console.error('Error fetching cost summary:', error);
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
      const { data, error } = await supabase
        .from('allocation_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return { data: data || null };
    } catch (error) {
      console.error('Error fetching allocation settings:', error);
      return { data: null, error: 'Gagal mengambil pengaturan alokasi' };
    }
  },

  // Create or update allocation settings
  async upsertSettings(settingsData: AllocationFormData): Promise<ApiResponse<AllocationSettings>> {
    try {
      const { data, error } = await supabase
        .from('allocation_settings')
        .upsert(settingsData)
        .select()
        .single();

      if (error) throw error;

      return { data, message: 'Pengaturan alokasi berhasil disimpan' };
    } catch (error) {
      console.error('Error upserting allocation settings:', error);
      return { data: {} as AllocationSettings, error: 'Gagal menyimpan pengaturan alokasi' };
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
      // Get total costs using database function
      const { data: totalCosts, error: costsError } = await supabase
        .rpc('get_total_costs');

      if (costsError) throw costsError;

      // Get allocation settings
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
        .rpc('calculate_overhead', { p_material_cost: materialCost });

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
      console.error('Error calculating overhead:', error);
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