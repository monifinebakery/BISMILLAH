// 🎯 Service untuk CRUD operations promo

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const promoService = {
  // Create new promo
  createPromo: async (promoData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const promoRecord = {
        user_id: user.id,
        nama_promo: promoData.data.namaPromo,
        tipe_promo: promoData.type,
        data_promo: promoData.data,
        calculation_result: promoData.calculation,
        status: promoData.data.status || 'aktif',
        tanggal_mulai: promoData.data.tanggalMulai || null,
        tanggal_selesai: promoData.data.tanggalSelesai || null,
        deskripsi: promoData.data.deskripsi || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('promos')
        .insert(promoRecord)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating promo:', error);
      throw error;
    }
  },

  // Get all promos for user
  getPromos: async (options = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('promos')
        .select('*')
        .eq('user_id', user.id);

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.type) {
        query = query.eq('tipe_promo', options.type);
      }

      // Apply sorting
      const sortBy = options.sortBy || 'created_at';
      const sortOrder = options.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (options.page && options.pageSize) {
        const from = (options.page - 1) * options.pageSize;
        const to = from + options.pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await supabase
        .from('promos')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      if (error) throw error;

      return { data, count };
    } catch (error) {
      console.error('Error getting promos:', error);
      throw error;
    }
  },

  // Update promo
  updatePromo: async (id, updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('promos')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating promo:', error);
      throw error;
    }
  },

  // Delete promo
  deletePromo: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('promos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting promo:', error);
      throw error;
    }
  },

  // Bulk delete promos
  bulkDeletePromos: async (ids) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('promos')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error bulk deleting promos:', error);
      throw error;
    }
  },

  // Toggle promo status
  toggleStatus: async (id, newStatus) => {
    try {
      return await promoService.updatePromo(id, { status: newStatus });
    } catch (error) {
      console.error('Error toggling promo status:', error);
      throw error;
    }
  }
};