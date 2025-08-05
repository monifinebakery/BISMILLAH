// ============================================
// services/promoService.js - Promo CRUD operations with Supabase
// ============================================

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const promoService = {
  // ✅ Get all promos (for useQuery)
  getAll: async (params = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('promos')
        .select('*')
        .eq('user_id', user.id);

      // Apply search filter
      if (params.search) {
        query = query.or(`nama_promo.ilike.%${params.search}%,deskripsi.ilike.%${params.search}%`);
      }

      // Apply filters
      if (params.filters?.status) {
        query = query.eq('status', params.filters.status);
      }
      if (params.filters?.type) {
        query = query.eq('tipe_promo', params.filters.type);
      }
      if (params.filters?.dateRange?.start) {
        query = query.gte('created_at', params.filters.dateRange.start);
      }
      if (params.filters?.dateRange?.end) {
        query = query.lte('created_at', params.filters.dateRange.end);
      }

      // Apply sorting
      const sortBy = params.pagination?.sortBy || 'created_at';
      const sortOrder = params.pagination?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (params.pagination?.page && params.pagination?.pageSize) {
        const from = (params.pagination.page - 1) * params.pagination.pageSize;
        const to = from + params.pagination.pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data to match expected format
      const transformedData = data?.map(promo => ({
        id: promo.id,
        namaPromo: promo.nama_promo,
        tipePromo: promo.tipe_promo,
        status: promo.status,
        deskripsi: promo.deskripsi,
        tanggalMulai: promo.tanggal_mulai,
        tanggalSelesai: promo.tanggal_selesai,
        dataPromo: promo.data_promo,
        calculationResult: promo.calculation_result,
        createdAt: promo.created_at,
        updatedAt: promo.updated_at
      })) || [];

      return transformedData;
    } catch (error) {
      console.error('Error getting promos:', error);
      throw error;
    }
  },

  // ✅ Get promo by ID
  getById: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('promos')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Transform data
      return {
        id: data.id,
        namaPromo: data.nama_promo,
        tipePromo: data.tipe_promo,
        status: data.status,
        deskripsi: data.deskripsi,
        tanggalMulai: data.tanggal_mulai,
        tanggalSelesai: data.tanggal_selesai,
        dataPromo: data.data_promo,
        calculationResult: data.calculation_result,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error getting promo by ID:', error);
      throw error;
    }
  },

  // ✅ Create new promo (for useMutation)
  create: async (promoData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const promoRecord = {
        user_id: user.id,
        nama_promo: promoData.namaPromo,
        tipe_promo: promoData.tipePromo,
        data_promo: promoData.dataPromo || promoData,
        calculation_result: promoData.calculationResult,
        status: promoData.status || 'draft',
        tanggal_mulai: promoData.tanggalMulai || null,
        tanggal_selesai: promoData.tanggalSelesai || null,
        deskripsi: promoData.deskripsi || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('promos')
        .insert(promoRecord)
        .select()
        .single();

      if (error) throw error;

      // Transform response
      return {
        id: data.id,
        namaPromo: data.nama_promo,
        tipePromo: data.tipe_promo,
        status: data.status,
        deskripsi: data.deskripsi,
        tanggalMulai: data.tanggal_mulai,
        tanggalSelesai: data.tanggal_selesai,
        dataPromo: data.data_promo,
        calculationResult: data.calculation_result,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating promo:', error);
      throw error;
    }
  },

  // ✅ Update promo (for useMutation)
  update: async (id, updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Transform updates to database format
      const dbUpdates = {};
      if (updates.namaPromo) dbUpdates.nama_promo = updates.namaPromo;
      if (updates.tipePromo) dbUpdates.tipe_promo = updates.tipePromo;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.deskripsi !== undefined) dbUpdates.deskripsi = updates.deskripsi;
      if (updates.tanggalMulai !== undefined) dbUpdates.tanggal_mulai = updates.tanggalMulai;
      if (updates.tanggalSelesai !== undefined) dbUpdates.tanggal_selesai = updates.tanggalSelesai;
      if (updates.dataPromo) dbUpdates.data_promo = updates.dataPromo;
      if (updates.calculationResult) dbUpdates.calculation_result = updates.calculationResult;
      
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('promos')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Transform response
      return {
        id: data.id,
        namaPromo: data.nama_promo,
        tipePromo: data.tipe_promo,
        status: data.status,
        deskripsi: data.deskripsi,
        tanggalMulai: data.tanggal_mulai,
        tanggalSelesai: data.tanggal_selesai,
        dataPromo: data.data_promo,
        calculationResult: data.calculation_result,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating promo:', error);
      throw error;
    }
  },

  // ✅ Delete promo (for useMutation)
  delete: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('promos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      return { success: true, id };
    } catch (error) {
      console.error('Error deleting promo:', error);
      throw error;
    }
  },

  // ✅ Bulk delete promos (for useMutation)
  bulkDelete: async (ids) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('promos')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;

      return { success: true, deletedIds: ids };
    } catch (error) {
      console.error('Error bulk deleting promos:', error);
      throw error;
    }
  },

  // ✅ Toggle promo status (for useMutation)
  toggleStatus: async ({ id, newStatus }) => {
    try {
      return await promoService.update(id, { status: newStatus });
    } catch (error) {
      console.error('Error toggling promo status:', error);
      throw error;
    }
  },

  // ✅ Duplicate promo (for useMutation)
  duplicate: async (originalPromo) => {
    try {
      const duplicatedData = {
        namaPromo: `${originalPromo.namaPromo} (Copy)`,
        tipePromo: originalPromo.tipePromo,
        status: 'draft',
        deskripsi: originalPromo.deskripsi,
        dataPromo: originalPromo.dataPromo,
        calculationResult: originalPromo.calculationResult,
        tanggalMulai: null, // Reset dates for new promo
        tanggalSelesai: null
      };

      return await promoService.create(duplicatedData);
    } catch (error) {
      console.error('Error duplicating promo:', error);
      throw error;
    }
  }
};

// ============================================
// services/recipeService.js - Recipe operations with Supabase
// ============================================

export const recipeService = {
  // ✅ Get all recipes (for useQuery)
  getAll: async (params = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id);

      // Apply search filter
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }

      // Apply filters
      if (params.category) {
        query = query.eq('category', params.category);
      }
      if (params.active !== undefined) {
        query = query.eq('is_active', params.active);
      }

      // Apply sorting
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match expected format
      const transformedData = data?.map(recipe => ({
        id: recipe.id,
        namaResep: recipe.name,
        name: recipe.name, // Alias for compatibility
        hpp: recipe.hpp_per_porsi || recipe.cost_per_portion,
        hppPerPorsi: recipe.hpp_per_porsi,
        harga: recipe.harga_jual_porsi || recipe.selling_price,
        hargaJual: recipe.harga_jual_porsi,
        hargaJualPorsi: recipe.harga_jual_porsi,
        category: recipe.category,
        isActive: recipe.is_active,
        createdAt: recipe.created_at,
        updatedAt: recipe.updated_at
      })) || [];

      return transformedData;
    } catch (error) {
      console.error('Error getting recipes:', error);
      throw error;
    }
  },

  // ✅ Get recipe by ID
  getById: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        namaResep: data.name,
        name: data.name,
        hpp: data.hpp_per_porsi,
        hppPerPorsi: data.hpp_per_porsi,
        harga: data.harga_jual_porsi,
        hargaJual: data.harga_jual_porsi,
        hargaJualPorsi: data.harga_jual_porsi,
        category: data.category,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error getting recipe by ID:', error);
      throw error;
    }
  },

  // ✅ Create new recipe
  create: async (recipeData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          name: recipeData.name || recipeData.namaResep,
          hpp_per_porsi: recipeData.hpp || recipeData.hppPerPorsi,
          harga_jual_porsi: recipeData.harga || recipeData.hargaJualPorsi,
          category: recipeData.category,
          is_active: recipeData.isActive !== undefined ? recipeData.isActive : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        namaResep: data.name,
        name: data.name,
        hpp: data.hpp_per_porsi,
        harga: data.harga_jual_porsi,
        category: data.category,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  },

  // ✅ Update recipe
  update: async (id, recipeData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updates = {
        updated_at: new Date().toISOString()
      };

      if (recipeData.name || recipeData.namaResep) {
        updates.name = recipeData.name || recipeData.namaResep;
      }
      if (recipeData.hpp || recipeData.hppPerPorsi) {
        updates.hpp_per_porsi = recipeData.hpp || recipeData.hppPerPorsi;
      }
      if (recipeData.harga || recipeData.hargaJualPorsi) {
        updates.harga_jual_porsi = recipeData.harga || recipeData.hargaJualPorsi;
      }
      if (recipeData.category) {
        updates.category = recipeData.category;
      }
      if (recipeData.isActive !== undefined) {
        updates.is_active = recipeData.isActive;
      }

      const { data, error } = await supabase
        .from('recipes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        namaResep: data.name,
        name: data.name,
        hpp: data.hpp_per_porsi,
        harga: data.harga_jual_porsi,
        category: data.category,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  },

  // ✅ Delete recipe
  delete: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      return { success: true, id };
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  }
};

// ============================================
// services/analyticsService.js - Analytics operations with Supabase
// ============================================

export const analyticsService = {
  // ✅ Get promo analytics for date range
  getAnalytics: async (dateRange) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // This would be a more complex query in a real app
      // For now, we'll simulate analytics data
      const { data: promos, error } = await supabase
        .from('promos')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Calculate analytics from promo data
      const summary = {
        totalPromos: promos.length,
        activePromos: promos.filter(p => p.status === 'aktif').length,
        averageHpp: 0,
        averageMargin: 0
      };

      const hppAnalysis = promos.map(promo => ({
        name: promo.nama_promo,
        hpp: promo.calculation_result?.hpp || 0,
        harga: promo.calculation_result?.finalPrice || 0,
        margin: promo.calculation_result?.promoMargin || 0
      }));

      const profitTrend = promos.map((promo, index) => ({
        date: promo.created_at,
        profit: promo.calculation_result?.profit || 0,
        margin: promo.calculation_result?.promoMargin || 0
      }));

      const promoPerformance = promos.map(promo => ({
        id: promo.id,
        namaPromo: promo.nama_promo,
        tipePromo: promo.tipe_promo,
        performance: 'baik', // This would be calculated based on actual usage data
        usage: Math.floor(Math.random() * 100), // Simulated
        roi: Math.floor(Math.random() * 200) // Simulated
      }));

      return {
        summary,
        hppAnalysis,
        profitTrend,
        promoPerformance
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  },

  // ✅ Get HPP analysis data
  getHppAnalysis: async (dateRange) => {
    // This would typically be a specialized query
    const analytics = await analyticsService.getAnalytics(dateRange);
    return analytics.hppAnalysis;
  },

  // ✅ Get profit analysis data
  getProfitAnalysis: async (dateRange) => {
    // This would typically be a specialized query
    const analytics = await analyticsService.getAnalytics(dateRange);
    return analytics.profitTrend;
  },

  // ✅ Get promo performance data
  getPromoPerformance: async (promoId, dateRange = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('promos')
        .select('*')
        .eq('id', promoId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Simulate performance data - in real app this would come from usage tracking
      return {
        id: data.id,
        namaPromo: data.nama_promo,
        tipePromo: data.tipe_promo,
        performance: 'baik',
        usage: Math.floor(Math.random() * 100),
        roi: Math.floor(Math.random() * 200),
        totalRevenue: Math.floor(Math.random() * 1000000),
        totalSavings: Math.floor(Math.random() * 500000)
      };
    } catch (error) {
      console.error('Error getting promo performance:', error);
      throw error;
    }
  }
};

// ============================================
// Service exports and utilities
// ============================================

export { promoService } from './promoService';
export { recipeService } from './recipeService';
export { analyticsService } from './analyticsService';

// Service configuration
export const serviceConfig = {
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
  supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Error utilities
export const serviceUtils = {
  isAuthError: (error) => {
    return error.message.includes('not authenticated') || error.message.includes('User not found');
  },

  isNetworkError: (error) => {
    return error.name === 'TypeError' && error.message.includes('fetch');
  },

  formatErrorMessage: (error) => {
    if (serviceUtils.isAuthError(error)) {
      return 'Sesi login telah berakhir. Silakan login kembali.';
    }
    if (serviceUtils.isNetworkError(error)) {
      return 'Koneksi internet bermasalah. Silakan coba lagi.';
    }
    return error.message || 'Terjadi kesalahan tidak dikenal.';
  }
};