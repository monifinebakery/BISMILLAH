// ==============================================
// F&B SPECIFIC HELPERS
// Functions for F&B categorization, insights, and recommendations
// ==============================================

import { logger } from '@/utils/logger';
import { 
  FNBCOGSBreakdown,
  FNBAnalysisResult,
  FNBInsight,
  ProfitApiResponse,
  RealTimeProfitCalculation
} from '../types/profitAnalysis.types';
import { FNB_THRESHOLDS } from '../constants/profitConstants';
import { safeCalculateMargins } from '@/utils/profitValidation';
import { 
  fetchBahanMap, 
  fetchPemakaianByPeriode, 
  getEffectiveUnitPrice 
} from './warehouseHelpers';
import { calculatePemakaianValue } from './calculationUtils';

/**
 * 🍽️ Helper: Categorize F&B items
 */
export function categorizeFNBItem(itemName: string): string {
  const name = itemName.toLowerCase();
  
  // Main ingredients
  if (name.includes('beras') || name.includes('daging') || name.includes('ayam') ||
      name.includes('ikan') || name.includes('sayur') || name.includes('tahu') ||
      name.includes('tempe') || name.includes('mie')) {
    return 'Bahan Makanan Utama';
  }
  
  // Spices and seasonings
  if (name.includes('garam') || name.includes('gula') || name.includes('bumbu') ||
      name.includes('kecap') || name.includes('saos') || name.includes('merica') ||
      name.includes('bawang') || name.includes('cabai')) {
    return 'Bumbu & Rempah';
  }
  
  // Beverages
  if (name.includes('air') || name.includes('teh') || name.includes('kopi') ||
      name.includes('jus') || name.includes('sirup') || name.includes('susu')) {
    return 'Minuman & Sirup';
  }
  
  // Packaging
  if (name.includes('kemasan') || name.includes('box') || name.includes('cup') ||
      name.includes('plastik') || name.includes('kertas') || name.includes('styrofoam')) {
    return 'Kemasan & Wadah';
  }
  
  // Gas and fuel
  if (name.includes('gas') || name.includes('lpg') || name.includes('bensin')) {
    return 'Gas & Bahan Bakar';
  }
  
  return 'Lainnya';
}

/**
 * 🍽️ Get F&B COGS breakdown with categories
 */
export async function getFNBCOGSBreakdown(
  period: string,
  effectiveCogs?: number
): Promise<ProfitApiResponse<FNBCOGSBreakdown[]>> {
  try {
    // Try to get from WAC data first
    const bahanMap = await fetchBahanMap();
    const pemakaian = await fetchPemakaianByPeriode(
      period + '-01',
      period + '-31'
    );

    if (bahanMap && Object.keys(bahanMap).length > 0 && pemakaian && pemakaian.length > 0) {
      const fnbBreakdown: FNBCOGSBreakdown[] = pemakaian.map(item => {
        // ✅ FLEXIBLE ID MATCHING
        const itemId = item.bahan_baku_id || item.bahanBakuId || item.id;
        const bahan = bahanMap[itemId];
        
        if (!bahan) return null;

        const qty = Number(item.quantity || 0);
        const unitPrice = getEffectiveUnitPrice(bahan);
        const totalCost = calculatePemakaianValue(item, bahanMap);
        const category = categorizeFNBItem(bahan.nama || '');

        return {
          item_id: itemId,
          item_name: bahan.nama || 'Unknown',
          category,
          quantity_used: qty,
          unit: bahan.satuan || 'unit',
          unit_price: unitPrice,
          total_cost: totalCost,
          percentage: effectiveCogs ? (totalCost / effectiveCogs) * 100 : 0,
          wac_price: unitPrice,
          is_expensive: totalCost > FNB_THRESHOLDS.ALERTS.expensive_item_threshold
        };
      }).filter(Boolean) as FNBCOGSBreakdown[];

      return {
        data: fnbBreakdown,
        success: true,
        message: 'F&B COGS breakdown generated from WAC data'
      };
    }

    // Fallback to basic breakdown
    return {
      data: [],
      success: true,
      message: 'No WAC data available for F&B breakdown'
    };

  } catch (error) {
    logger.error('❌ Error getting F&B COGS breakdown:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to get F&B breakdown',
      success: false
    };
  }
}

/**
 * 🍽️ Generate F&B specific insights and recommendations
 */
export async function generateFNBInsights(
  period: string,
  calculation: RealTimeProfitCalculation,
  effectiveCogs?: number,
  hppBreakdown?: FNBCOGSBreakdown[]
): Promise<FNBAnalysisResult> {
  const revenue = calculation.revenue_data.total;
  const cogs = effectiveCogs || calculation.cogs_data.total;
  const opex = calculation.opex_data.total;
  // ✅ IMPROVED: Use centralized calculation for consistency
  const margins = safeCalculateMargins(revenue, cogs, opex);
  
  // Generate F&B specific insights
  const insights: FNBInsight[] = [];
  const alerts: FNBInsight[] = [];
  const opportunities: FNBInsight[] = [];
  const seasonalTips: FNBInsight[] = [];

  // Cost control insights
  const cogsRatio = revenue > 0 ? cogs / revenue : 0;
  if (cogsRatio > FNB_THRESHOLDS.ALERTS.high_ingredient_cost) {
    alerts.push({
      id: 'high-ingredient-cost',
      type: 'alert',
      title: '🥘 Modal bahan baku terlalu mahal',
      description: `${(cogsRatio * 100).toFixed(1)}% dari omset (ideal <60%)`,
      impact: 'high',
      category: 'cost_control',
      actionable: true,
      action: {
        label: 'Analisis Supplier',
        type: 'internal',
        data: { cogsRatio, threshold: FNB_THRESHOLDS.ALERTS.high_ingredient_cost }
      },
      value: cogs - (revenue * FNB_THRESHOLDS.ALERTS.high_ingredient_cost),
      icon: '🥘'
    });
  }

  // Revenue opportunities
  if (revenue > 0 && revenue < FNB_THRESHOLDS.ALERTS.low_revenue) {
    opportunities.push({
      id: 'boost-revenue',
      type: 'opportunity',
      title: '📈 Potensi naikkan omset',
      description: 'Omset masih bisa ditingkatkan untuk warung yang sehat',
      impact: 'medium',
      category: 'revenue_boost',
      actionable: true,
      action: {
        label: 'Tips Marketing',
        type: 'external',
        data: { currentRevenue: revenue, targetRevenue: FNB_THRESHOLDS.ALERTS.low_revenue }
      },
      value: FNB_THRESHOLDS.ALERTS.low_revenue - revenue,
      icon: '📈'
    });
  }

  // Expensive items analysis
  if (hppBreakdown && hppBreakdown.length > 0) {
    const expensiveItems = hppBreakdown.filter(item => 
      item.is_expensive || item.percentage > 15
    );

    if (expensiveItems.length > 0) {
      alerts.push({
        id: 'expensive-ingredients',
        type: 'alert',
        title: `🚨 ${expensiveItems.length} bahan termahal`,
        description: `Bahan: ${expensiveItems.map(i => i.item_name).slice(0, 3).join(', ')}`,
        impact: 'medium',
        category: 'cost_control',
        actionable: true,
        action: {
          label: 'Lihat Detail',
          type: 'internal',
          data: expensiveItems
        },
        value: expensiveItems.reduce((sum, item) => sum + item.total_cost, 0),
        icon: '🔍'
      });
    }
  }

  // Seasonal tips (basic examples)
  const currentMonth = new Date().getMonth() + 1;
  if (currentMonth >= 3 && currentMonth <= 5) { // Ramadan season
    seasonalTips.push({
      id: 'ramadan-opportunity',
      type: 'seasonal',
      title: '🌙 Musim Ramadan',
      description: 'Siapkan menu takjil dan sahur untuk boost omset',
      impact: 'high',
      category: 'seasonal',
      actionable: true,
      action: {
        label: 'Menu Ramadan',
        type: 'external'
      },
      icon: '🌙'
    });
  }

  // Margin analysis insights
  if (margins.netMargin >= 18) {
    insights.push({
      id: 'excellent-margin',
      type: 'suggestion',
      title: '🎉 Margin sangat sehat!',
      description: `Untung bersih ${margins.netMargin.toFixed(1)}% - siap untuk ekspansi`,
      impact: 'low',
      category: 'efficiency',
      actionable: false,
      icon: '✅'
    });

    opportunities.push({
      id: 'expansion-ready',
      type: 'opportunity',
      title: '🚀 Siap Expand',
      description: 'Warung sudah sehat, pertimbangkan buka cabang',
      impact: 'high',
      category: 'revenue_boost',
      actionable: true,
      action: {
        label: 'Tips Ekspansi',
        type: 'external'
      },
      icon: '🏪'
    });
  }

  const result: FNBAnalysisResult = {
    period,
    insights,
    alerts,
    opportunities,
    seasonal_tips: seasonalTips,
    summary: {
      total_insights: insights.length + alerts.length + opportunities.length + seasonalTips.length,
      high_priority_count: [...alerts, ...opportunities, ...seasonalTips].filter(i => i.impact === 'high').length,
      potential_savings: alerts.reduce((sum, alert) => sum + (alert.value || 0), 0),
      potential_revenue_boost: opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0)
    }
  };

  return result;
}
