import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export const promoService = {
  // ✅ Get all promos (for useQuery)
  getAll: async (params = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('promos')
        .select(`
          id,
          user_id,
          nama_promo,
          tipe_promo,
          status,
          data_promo,
          calculation_result,
          tanggal_mulai,
          tanggal_selesai,
          deskripsi,
          created_at,
          updated_at
        `)
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
      logger.error('Error getting promos:', error);
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
        .select(`
          id,
          user_id,
          nama_promo,
          tipe_promo,
          status,
          data_promo,
          calculation_result,
          tanggal_mulai,
          tanggal_selesai,
          deskripsi,
          created_at,
          updated_at
        `)
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
      logger.error('Error getting promo by ID:', error);
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
      logger.error('Error creating promo:', error);
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
      logger.error('Error updating promo:', error);
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
      logger.error('Error deleting promo:', error);
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
      logger.error('Error bulk deleting promos:', error);
      throw error;
    }
  },

  // ✅ Toggle promo status (for useMutation)
  toggleStatus: async ({ id, newStatus }) => {
    try {
      return await promoService.update(id, { status: newStatus });
    } catch (error) {
      logger.error('Error toggling promo status:', error);
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
      logger.error('Error duplicating promo:', error);
      throw error;
    }
  }
};