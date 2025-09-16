// src/components/operational-costs/services/appSettingsApi.ts
// 🏗️ App Settings API for Global Cost Per Unit Storage (Revision 6)

import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';
import { normalizeDateForDatabase } from '@/utils/dateNormalization';
import { getCurrentUserId } from '@/utils/authHelpers';
import { AppSettings, AppSettingsFormData, ApiResponse } from '../types/operationalCost.types';

// ================================
// APP SETTINGS API
// ================================

export const appSettingsApi = {
  
  /**
   * Get app settings for current user
   */
  async getSettings(): Promise<ApiResponse<AppSettings | null>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { data: null, error: 'User tidak ditemukan. Silakan login kembali.' };
      }

      const { data, error } = await supabase
        .from('app_settings')
        .select(`
          id,
          user_id,
          target_output_monthly,
          overhead_per_pcs,
          operasional_per_pcs,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      // Transform to typed interface if data exists
      if (data) {
        const typedData: AppSettings = {
          id: data.id,
          user_id: data.user_id,
          target_output_monthly: Number(data.target_output_monthly) || 1000,
          overhead_per_pcs: Number(data.overhead_per_pcs) || 0,
          operasional_per_pcs: Number(data.operasional_per_pcs) || 0,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        return { data: typedData };
      }

      return { data: null }; // No settings found
    } catch (error) {
      logger.error('Error fetching app settings:', error);
      return { data: null, error: 'Gagal mengambil pengaturan aplikasi' };
    }
  },

  /**
   * Create or update app settings (upsert)
   */
  async upsertSettings(settingsData: AppSettingsFormData): Promise<ApiResponse<AppSettings>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { 
          data: {} as AppSettings, 
          error: 'User tidak ditemukan. Silakan login kembali.' 
        };
      }

      // Validate inputs
      if (settingsData.target_output_monthly <= 0) {
        return { 
          data: {} as AppSettings,
          error: 'Target produksi bulanan harus lebih dari 0'
        };
      }

      const payload = {
        user_id: userId,
        target_output_monthly: Number(settingsData.target_output_monthly),
        overhead_per_pcs: Number(settingsData.overhead_per_pcs) || 0,
        operasional_per_pcs: Number(settingsData.operasional_per_pcs) || 0,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('app_settings')
        .upsert(payload, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;

      // Transform to typed interface
      const typedData: AppSettings = {
        id: data.id,
        user_id: data.user_id,
        target_output_monthly: Number(data.target_output_monthly),
        overhead_per_pcs: Number(data.overhead_per_pcs),
        operasional_per_pcs: Number(data.operasional_per_pcs),
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      logger.success('App settings saved successfully:', typedData);
      return { 
        data: typedData, 
        message: 'Pengaturan aplikasi berhasil disimpan' 
      };
    } catch (error) {
      logger.error('Error upserting app settings:', error);
      
      let errorMessage = 'Gagal menyimpan pengaturan aplikasi';
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any;
        if (dbError.code === '42501') {
          errorMessage = 'Tidak memiliki izin untuk menyimpan pengaturan. Silakan login kembali.';
        }
      }

      return { data: {} as AppSettings, error: errorMessage };
    }
  },

  /**
   * Update only cost per unit values (used by calculator)
   */
  async updateCostPerUnit(
    overheadPerPcs: number,
    operasionalPerPcs: number,
    targetOutput?: number
  ): Promise<ApiResponse<AppSettings>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { 
          data: {} as AppSettings, 
          error: 'User tidak ditemukan. Silakan login kembali.' 
        };
      }

      // Get current settings to preserve target_output_monthly if not provided
      const currentSettings = await this.getSettings();
      const currentTargetOutput = currentSettings.data?.target_output_monthly || 1000;

      const updateData = {
        overhead_per_pcs: Number(overheadPerPcs) || 0,
        operasional_per_pcs: Number(operasionalPerPcs) || 0,
        target_output_monthly: targetOutput || currentTargetOutput,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: userId,
          ...updateData,
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;

      const typedData: AppSettings = {
        id: data.id,
        user_id: data.user_id,
        target_output_monthly: Number(data.target_output_monthly),
        overhead_per_pcs: Number(data.overhead_per_pcs),
        operasional_per_pcs: Number(data.operasional_per_pcs),
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return { 
        data: typedData, 
        message: 'Biaya per pcs berhasil diperbarui' 
      };
    } catch (error) {
      logger.error('Error updating cost per unit:', error);
      return { 
        data: {} as AppSettings, 
        error: 'Gagal memperbarui biaya per pcs' 
      };
    }
  },

  /**
   * Get current overhead per pcs (for HPP calculation)
   */
  async getCurrentOverheadPerPcs(): Promise<number> {
    try {
      const settings = await this.getSettings();
      return settings.data?.overhead_per_pcs || 0;
    } catch (error) {
      logger.error('Error getting current overhead per pcs:', error);
      return 0;
    }
  },

  /**
   * Get current operational cost per pcs (for BEP analysis)
   */
  async getCurrentOperasionalPerPcs(): Promise<number> {
    try {
      const settings = await this.getSettings();
      return settings.data?.operasional_per_pcs || 0;
    } catch (error) {
      logger.error('Error getting current operational per pcs:', error);
      return 0;
    }
  },

  /**
   * Delete app settings (reset to defaults)
   */
  async deleteSettings(): Promise<ApiResponse<boolean>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { data: false, error: 'User tidak ditemukan. Silakan login kembali.' };
      }

      const { error } = await supabase
        .from('app_settings')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return { 
        data: true, 
        message: 'Pengaturan aplikasi berhasil dihapus (direset ke default)' 
      };
    } catch (error) {
      logger.error('Error deleting app settings:', error);
      return { data: false, error: 'Gagal menghapus pengaturan aplikasi' };
    }
  },

  /**
   * Calculate overhead using database function calculate_overhead_detailed
   * This function calls the Supabase RPC function that auto-syncs with production target
   */
  async calculateOverhead(materialCost: number = 0): Promise<ApiResponse<any>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { 
          data: null, 
          error: 'User tidak ditemukan. Silakan login kembali.' 
        };
      }

      logger.info('🔄 Calling calculate_overhead_detailed RPC', {
        materialCost,
        userId
      });

      // Call the database function that auto-syncs with production target
      const { data, error } = await supabase
        .rpc('calculate_overhead_detailed', {
          p_material_cost: materialCost,
          p_user_id: userId
        });

      if (error) {
        logger.error('❌ Error calling calculate_overhead_detailed:', error);
        throw error;
      }

      // The RPC returns a table, so we need to get the first row
      const result = Array.isArray(data) ? data[0] : data;
      
      if (!result) {
        logger.warn('⚠️ No result from calculate_overhead_detailed');
        return {
          data: {
            overhead_per_unit: 0,
            total_costs: 0,
            allocation_method: 'per_unit',
            basis_value: 1000,
            production_target: 1000,
            calculation_notes: 'No operational costs found or invalid settings'
          }
        };
      }

      logger.success('✅ Overhead calculation result:', result);
      
      return { 
        data: {
          overhead_per_unit: Number(result.overhead_per_unit) || 0,
          total_costs: Number(result.total_costs) || 0,
          allocation_method: result.allocation_method || 'per_unit',
          basis_value: Number(result.basis_value) || 1000,
          production_target: Number(result.production_target) || 1000,
          calculation_notes: result.calculation_notes || 'Auto-calculated from current settings'
        }
      };
    } catch (error) {
      logger.error('❌ Error calculating overhead:', error);
      return { 
        data: null, 
        error: 'Gagal menghitung overhead. Pastikan Anda memiliki biaya operasional dan pengaturan yang valid.' 
      };
    }
  },

  /**
   * Calculate and update both cost groups simultaneously
   */
  async calculateAndUpdateCosts(
    hppCosts: number,
    operasionalCosts: number,
    targetOutput: number
  ): Promise<ApiResponse<AppSettings>> {
    try {
      if (targetOutput <= 0) {
        return {
          data: {} as AppSettings,
          error: 'Target produksi harus lebih dari 0 pcs'
        };
      }

      const overheadPerPcs = Math.round(hppCosts / targetOutput);
      const operasionalPerPcs = Math.round(operasionalCosts / targetOutput);

      return await this.updateCostPerUnit(
        overheadPerPcs,
        operasionalPerPcs,
        targetOutput
      );
    } catch (error) {
      logger.error('Error calculating and updating costs:', error);
      return {
        data: {} as AppSettings,
        error: 'Gagal menghitung dan memperbarui biaya per pcs'
      };
    }
  }
};

export default appSettingsApi;