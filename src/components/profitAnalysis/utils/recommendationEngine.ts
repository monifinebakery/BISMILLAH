// src/components/profitAnalysis/utils/recommendationEngine.ts

import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { BusinessType } from './config/profitConfig';
import { EfficiencyMetrics, getBenchmarkForBusinessType } from './efficiencyMetrics';

// ==============================================
// TYPES
// ==============================================

export interface Recommendation {
  id: string;
  category: 'pricing' | 'cost_reduction' | 'efficiency' | 'revenue' | 'inventory' | 'operations';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: {
    type: 'revenue_increase' | 'cost_reduction' | 'margin_improvement';
    estimatedValue: number; // dalam rupiah atau persentase
    timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  };
  actionSteps: string[];
  kpiToTrack: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  investmentRequired: 'none' | 'low' | 'medium' | 'high';
}

export interface RecommendationAnalysis {
  totalRecommendations: number;
  highPriorityCount: number;
  estimatedTotalImpact: number;
  quickWins: Recommendation[];
  strategicInitiatives: Recommendation[];
  categories: {
    [key in Recommendation['category']]: number;
  };
}

interface AnalysisContext {
  revenue: number;
  cogs: number;
  opex: number;
  grossMargin: number;
  netMargin: number;
  cogsRatio: number;
  opexRatio: number;
  businessType: BusinessType;
  benchmark: any;
}

// ==============================================
// RECOMMENDATION GENERATORS
// ==============================================

class RecommendationEngine {
  private generatePricingRecommendations(context: AnalysisContext): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Rekomendasi peningkatan harga jika margin terlalu rendah
    if (context.netMargin < context.benchmark.optimalNetMargin.min) {
      const priceIncrease = Math.min(15, (context.benchmark.optimalNetMargin.min - context.netMargin) * 1.2);
      const estimatedImpact = context.revenue * (priceIncrease / 100);
      
      recommendations.push({
        id: 'price_optimization',
        category: 'pricing',
        priority: context.netMargin < 5 ? 'high' : 'medium',
        title: 'Optimasi Strategi Harga',
        description: `Margin keuntungan Anda (${context.netMargin.toFixed(1)}%) di bawah standar industri. Pertimbangkan peningkatan harga ${priceIncrease.toFixed(1)}% secara bertahap.`,
        impact: {
          type: 'revenue_increase',
          estimatedValue: estimatedImpact,
          timeframe: 'short_term'
        },
        actionSteps: [
          'Analisis harga kompetitor di area sekitar',
          'Uji coba peningkatan harga pada menu dengan margin rendah',
          'Implementasi peningkatan harga secara bertahap (2-3% per bulan)',
          'Monitor respons pelanggan dan volume penjualan',
          'Sesuaikan strategi berdasarkan feedback pasar'
        ],
        kpiToTrack: ['Revenue per customer', 'Customer retention rate', 'Average order value'],
        difficulty: 'medium',
        investmentRequired: 'none'
      });
    }
    
    // Rekomendasi bundling dan upselling
    if (context.revenue > 0) {
      const avgOrderValue = context.revenue / 30; // Estimasi AOV per hari
      if (avgOrderValue < 50000) {
        recommendations.push({
          id: 'upselling_strategy',
          category: 'pricing',
          priority: 'medium',
          title: 'Strategi Upselling & Cross-selling',
          description: 'Tingkatkan nilai rata-rata pesanan melalui paket bundling dan rekomendasi menu.',
          impact: {
            type: 'revenue_increase',
            estimatedValue: context.revenue * 0.15,
            timeframe: 'short_term'
          },
          actionSteps: [
            'Buat paket menu dengan harga menarik',
            'Latih staff untuk menawarkan add-on dan upgrade',
            'Implementasi sistem poin reward untuk pembelian lebih besar',
            'Buat menu "Chef Recommendation" dengan margin tinggi'
          ],
          kpiToTrack: ['Average order value', 'Items per transaction', 'Upselling conversion rate'],
          difficulty: 'easy',
          investmentRequired: 'low'
        });
      }
    }
    
    return recommendations;
  }
  
  private generateCostReductionRecommendations(context: AnalysisContext): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Rekomendasi optimasi COGS jika terlalu tinggi
    if (context.cogsRatio > context.benchmark.optimalCogsRatio.max) {
      const targetReduction = (context.cogsRatio - context.benchmark.optimalCogsRatio.max) / 100;
      const estimatedSavings = context.revenue * targetReduction;
      
      recommendations.push({
        id: 'cogs_optimization',
        category: 'cost_reduction',
        priority: 'high',
        title: 'Optimasi Biaya Bahan Baku (COGS)',
        description: `Rasio COGS Anda (${context.cogsRatio.toFixed(1)}%) melebihi standar industri. Target pengurangan ${(targetReduction * 100).toFixed(1)}%.`,
        impact: {
          type: 'cost_reduction',
          estimatedValue: estimatedSavings,
          timeframe: 'medium_term'
        },
        actionSteps: [
          'Audit supplier dan negosiasi ulang kontrak',
          'Implementasi sistem kontrol porsi yang ketat',
          'Optimasi resep untuk mengurangi waste',
          'Cari supplier alternatif dengan harga lebih kompetitif',
          'Implementasi sistem inventory management yang lebih baik'
        ],
        kpiToTrack: ['COGS ratio', 'Food waste percentage', 'Supplier cost per unit'],
        difficulty: 'medium',
        investmentRequired: 'low'
      });
    }
    
    // Rekomendasi optimasi biaya operasional
    if (context.opexRatio > context.benchmark.optimalOpexRatio.max) {
      const targetReduction = (context.opexRatio - context.benchmark.optimalOpexRatio.max) / 100;
      const estimatedSavings = context.revenue * targetReduction;
      
      recommendations.push({
        id: 'opex_optimization',
        category: 'cost_reduction',
        priority: 'medium',
        title: 'Optimasi Biaya Operasional',
        description: `Biaya operasional (${context.opexRatio.toFixed(1)}%) perlu dioptimasi untuk meningkatkan profitabilitas.`,
        impact: {
          type: 'cost_reduction',
          estimatedValue: estimatedSavings,
          timeframe: 'medium_term'
        },
        actionSteps: [
          'Review dan renegosiasi kontrak sewa',
          'Optimasi jadwal kerja staff untuk mengurangi overtime',
          'Implementasi teknologi untuk efisiensi operasional',
          'Audit penggunaan utilitas (listrik, air, gas)',
          'Evaluasi kebutuhan staff dan produktivitas'
        ],
        kpiToTrack: ['Operating expense ratio', 'Labor cost per hour', 'Utility cost per revenue'],
        difficulty: 'hard',
        investmentRequired: 'medium'
      });
    }
    
    return recommendations;
  }
  
  private generateEfficiencyRecommendations(context: AnalysisContext): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Rekomendasi peningkatan efisiensi operasional
    recommendations.push({
      id: 'operational_efficiency',
      category: 'efficiency',
      priority: 'medium',
      title: 'Peningkatan Efisiensi Operasional',
      description: 'Implementasi sistem dan proses untuk meningkatkan efisiensi operasional harian.',
      impact: {
        type: 'margin_improvement',
        estimatedValue: context.revenue * 0.05, // 5% improvement
        timeframe: 'medium_term'
      },
      actionSteps: [
        'Implementasi POS system yang terintegrasi',
        'Standardisasi proses operasional (SOP)',
        'Training staff untuk meningkatkan produktivitas',
        'Optimasi layout dapur dan area kerja',
        'Implementasi sistem monitoring real-time'
      ],
      kpiToTrack: ['Order processing time', 'Staff productivity', 'Customer satisfaction score'],
      difficulty: 'medium',
      investmentRequired: 'medium'
    });
    
    // Rekomendasi manajemen inventory
    recommendations.push({
      id: 'inventory_management',
      category: 'inventory',
      priority: 'medium',
      title: 'Optimasi Manajemen Inventory',
      description: 'Implementasi sistem inventory management untuk mengurangi waste dan meningkatkan cash flow.',
      impact: {
        type: 'cost_reduction',
        estimatedValue: context.cogs * 0.1, // 10% reduction in waste
        timeframe: 'short_term'
      },
      actionSteps: [
        'Implementasi sistem FIFO (First In, First Out)',
        'Setup automatic reorder points',
        'Daily inventory tracking dan reporting',
        'Supplier relationship management',
        'Waste tracking dan analysis'
      ],
      kpiToTrack: ['Inventory turnover', 'Waste percentage', 'Stockout frequency'],
      difficulty: 'easy',
      investmentRequired: 'low'
    });
    
    return recommendations;
  }
  
  private generateRevenueRecommendations(context: AnalysisContext): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Rekomendasi peningkatan revenue
    recommendations.push({
      id: 'revenue_diversification',
      category: 'revenue',
      priority: 'medium',
      title: 'Diversifikasi Sumber Revenue',
      description: 'Eksplorasi sumber pendapatan baru untuk meningkatkan stabilitas bisnis.',
      impact: {
        type: 'revenue_increase',
        estimatedValue: context.revenue * 0.2, // 20% additional revenue
        timeframe: 'long_term'
      },
      actionSteps: [
        'Implementasi layanan delivery dan takeaway',
        'Pengembangan produk retail (frozen food, sauce)',
        'Kerjasama dengan platform online food delivery',
        'Event catering dan private dining',
        'Membership program dan loyalty rewards'
      ],
      kpiToTrack: ['Revenue per channel', 'Customer acquisition cost', 'Customer lifetime value'],
      difficulty: 'hard',
      investmentRequired: 'high'
    });
    
    return recommendations;
  }
  
  public generateRecommendations(
    analysis: RealTimeProfitCalculation,
    businessType: BusinessType = BusinessType.FNB_RESTAURANT
  ): Recommendation[] {
    const revenue = analysis.revenue_data?.total || 0;
    const cogs = analysis.cogs_data?.total || 0;
    const opex = analysis.opex_data?.total || 0;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - opex;
    
    const context: AnalysisContext = {
      revenue,
      cogs,
      opex,
      grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      netMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
      cogsRatio: revenue > 0 ? (cogs / revenue) * 100 : 0,
      opexRatio: revenue > 0 ? (opex / revenue) * 100 : 0,
      businessType,
      benchmark: getBenchmarkForBusinessType(businessType)
    };
    
    const allRecommendations = [
      ...this.generatePricingRecommendations(context),
      ...this.generateCostReductionRecommendations(context),
      ...this.generateEfficiencyRecommendations(context),
      ...this.generateRevenueRecommendations(context)
    ];
    
    // Sort by priority and impact
    return allRecommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return b.impact.estimatedValue - a.impact.estimatedValue;
    });
  }
  
  public analyzeRecommendations(recommendations: Recommendation[]): RecommendationAnalysis {
    const quickWins = recommendations.filter(r => 
      r.difficulty === 'easy' && 
      r.investmentRequired === 'none' || r.investmentRequired === 'low'
    );
    
    const strategicInitiatives = recommendations.filter(r => 
      r.difficulty === 'hard' || 
      r.investmentRequired === 'high'
    );
    
    const categories = recommendations.reduce((acc, rec) => {
      acc[rec.category] = (acc[rec.category] || 0) + 1;
      return acc;
    }, {} as RecommendationAnalysis['categories']);
    
    const estimatedTotalImpact = recommendations.reduce((total, rec) => {
      return total + rec.impact.estimatedValue;
    }, 0);
    
    return {
      totalRecommendations: recommendations.length,
      highPriorityCount: recommendations.filter(r => r.priority === 'high').length,
      estimatedTotalImpact,
      quickWins: quickWins.slice(0, 3),
      strategicInitiatives: strategicInitiatives.slice(0, 3),
      categories
    };
  }
}

// ==============================================
// EXPORTS
// ==============================================

export const recommendationEngine = new RecommendationEngine();

export function generateBusinessRecommendations(
  analysis: RealTimeProfitCalculation,
  businessType: BusinessType = BusinessType.FNB_RESTAURANT
): Recommendation[] {
  return recommendationEngine.generateRecommendations(analysis, businessType);
}

export function analyzeRecommendationImpact(
  recommendations: Recommendation[]
): RecommendationAnalysis {
  return recommendationEngine.analyzeRecommendations(recommendations);
}

export function getQuickWinRecommendations(
  recommendations: Recommendation[]
): Recommendation[] {
  return recommendations
    .filter(r => 
      r.difficulty === 'easy' && 
      (r.investmentRequired === 'none' || r.investmentRequired === 'low') &&
      r.impact.timeframe === 'immediate' || r.impact.timeframe === 'short_term'
    )
    .slice(0, 5);
}

export function getHighImpactRecommendations(
  recommendations: Recommendation[]
): Recommendation[] {
  return recommendations
    .filter(r => r.priority === 'high')
    .sort((a, b) => b.impact.estimatedValue - a.impact.estimatedValue)
    .slice(0, 3);
}