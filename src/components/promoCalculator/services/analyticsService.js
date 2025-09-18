import { supabase } from '@/integrations/supabase/client';

export const analyticsService = {
  // ✅ Get promo analytics for date range
  getAnalytics: async (dateRange) => {
    try {
      // Use cached user ID to avoid repeated session checks
      const { getCurrentUserId } = await import('@/utils/authHelpers');
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

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
        .eq('user_id', userId);

      if (error) throw error;

      // Date range helpers
      const start = dateRange?.start ? new Date(dateRange.start) : null;
      const end = dateRange?.end ? new Date(dateRange.end) : null;
      const inRange = (dateStr) => {
        if (!start || !end) return true;
        const d = new Date(dateStr);
        return d >= start && d <= end;
      };

      // Build detailed metrics
      const detailed = promos.map(promo => {
        const calc = promo.calculation_result || {};
        const dataPromo = promo.data_promo || {};
        return {
          id: promo.id,
          namaPromo: promo.nama_promo,
          tipePromo: promo.tipe_promo,
          status: promo.status,
          createdAt: promo.created_at,
          margin: Number(calc.promoMargin || 0),
          profit: Number(calc.profit || 0),
          savings: Number(calc.savings || 0),
          hpp: Number(calc.hpp || 0),
          finalPrice: Number(calc.finalPrice || 0),
          channel: dataPromo.channel || 'lainnya',
          category: dataPromo.kategori || 'lainnya',
        };
      });

      // Calculate analytics from detailed data
      const summary = {
        totalPromos: detailed.length,
        activePromos: detailed.filter(p => p.status === 'aktif').length,
        averageHpp: detailed.length ? detailed.reduce((s, d) => s + (d.hpp || 0), 0) / detailed.length : 0,
        averageMargin: detailed.length ? detailed.reduce((s, d) => s + (d.margin || 0), 0) / detailed.length : 0,
        totalDiscountThisMonth: detailed
          .filter(p => inRange(p.createdAt))
          .reduce((s, d) => s + (d.savings || 0), 0)
      };

      const hppAnalysis = detailed.map(promo => ({
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

      // Raw rows for card rendering
      const promoPerformanceRows = promos.map(p => ({ ...p }));

      // Simplified list for filtering/highlights
      const promoPerformance = detailed.map(item => ({
        id: item.id,
        namaPromo: item.namaPromo,
        tipePromo: item.tipePromo,
        performance: item.margin >= 20 ? 'sangat baik' : item.margin >= 10 ? 'baik' : 'perlu perbaikan',
        usage: Math.floor(Math.random() * 100),
        roi: Math.floor(Math.random() * 200),
        margin: item.margin,
        profit: item.profit,
        channel: item.channel,
        category: item.category
      }));

      const topPromos = [...promoPerformance]
        .sort((a, b) => (b.margin || 0) - (a.margin || 0))
        .slice(0, 3);

      const needsImprovementPromos = [...promoPerformance]
        .sort((a, b) => (a.profit || 0) - (b.profit || 0))
        .slice(0, 3);

      return {
        summary,
        hppAnalysis,
        profitTrend,
        promoPerformance,
        promoPerformanceRows,
        topPromos,
        needsImprovementPromos
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
      const { getCurrentUserId } = await import('@/utils/authHelpers');
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

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
        .eq('user_id', userId)
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
