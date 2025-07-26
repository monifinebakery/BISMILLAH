// 🎯 Service untuk analytics calculations

import { supabase } from '@/integrations/supabase/client';

export const analyticsService = {
  getAnalyticsData: async (dateRange) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get promos data
      let query = supabase
        .from('promos')
        .select('*')
        .eq('user_id', user.id);

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end + 'T23:59:59');
      }

      const { data: promos, error } = await query;
      if (error) throw error;

      // Calculate analytics
      const analytics = {
        summary: calculateSummary(promos),
        hppAnalysis: calculateHppAnalysis(promos),
        profitTrend: calculateProfitTrend(promos),
        promoPerformance: promos || []
      };

      return analytics;
    } catch (error) {
      console.error('Error getting analytics data:', error);
      throw error;
    }
  }
};

const calculateSummary = (promos) => {
  if (!promos || promos.length === 0) {
    return {
      totalPromos: 0,
      activePromos: 0,
      averageHpp: 0,
      averageMargin: 0
    };
  }

  const activePromos = promos.filter(p => p.status === 'aktif').length;
  const totalHpp = promos.reduce((sum, p) => sum + (p.calculation_result?.promoHpp || 0), 0);
  const totalMargin = promos.reduce((sum, p) => sum + (p.calculation_result?.promoMargin || 0), 0);

  return {
    totalPromos: promos.length,
    activePromos,
    averageHpp: totalHpp / promos.length,
    averageMargin: totalMargin / promos.length
  };
};

const calculateHppAnalysis = (promos) => {
  if (!promos || promos.length === 0) return [];

  return promos.map(promo => ({
    name: promo.nama_promo.length > 20 
      ? promo.nama_promo.substring(0, 20) + '...' 
      : promo.nama_promo,
    hpp: promo.calculation_result?.promoHpp || 0,
    hargaJual: promo.calculation_result?.promoPrice || 0
  })).slice(0, 10); // Limit to top 10
};

const calculateProfitTrend = (promos) => {
  if (!promos || promos.length === 0) return [];

  // Group by date
  const dateGroups = {};
  promos.forEach(promo => {
    const date = new Date(promo.created_at).toISOString().split('T')[0];
    if (!dateGroups[date]) {
      dateGroups[date] = { normalMargin: [], promoMargin: [] };
    }
    dateGroups[date].normalMargin.push(promo.calculation_result?.normalMargin || 0);
    dateGroups[date].promoMargin.push(promo.calculation_result?.promoMargin || 0);
  });

  // Calculate averages per date
  return Object.entries(dateGroups)
    .map(([date, margins]) => ({
      date: new Date(date).toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: '2-digit' 
      }),
      normalMargin: margins.normalMargin.reduce((a, b) => a + b, 0) / margins.normalMargin.length,
      promoMargin: margins.promoMargin.reduce((a, b) => a + b, 0) / margins.promoMargin.length
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-14); // Last 14 days
};};