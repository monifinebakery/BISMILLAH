import { supabase } from '@/integrations/supabase/client';

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
        .select(`
          id,
          user_id,
          nama_promo,
          tipe_promo,
          status,
          data_promo,
          calculation_result,
          created_at,
          updated_at
        `)
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
        .select(`
          id,
          user_id,
          nama_promo,
          tipe_promo,
          status,
          data_promo,
          calculation_result,
          created_at,
          updated_at
        `)
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