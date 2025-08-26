// src/components/profitAnalysis/utils/seasonalAnalysis.ts

import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { BusinessType } from './config/profitConfig';

export interface SeasonalTrend {
  period: string;
  month: number;
  year: number;
  revenue: number;
  cogs: number;
  opex: number;
  profit: number;
  profitMargin: number;
  seasonalIndex: number; // 1.0 = rata-rata, >1.0 = di atas rata-rata
  growthRate: number; // persentase pertumbuhan YoY
}

export interface SeasonalPattern {
  type: 'peak' | 'normal' | 'low';
  months: number[];
  averageMultiplier: number;
  description: string;
  recommendations: string[];
}

export interface StockPlanningRecommendation {
  category: 'inventory' | 'staffing' | 'marketing' | 'pricing';
  priority: 'high' | 'medium' | 'low';
  period: string;
  action: string;
  estimatedImpact: number;
  timeframe: 'immediate' | 'short_term' | 'medium_term';
  kpiToTrack: string[];
}

export interface SeasonalAnalysisResult {
  trends: SeasonalTrend[];
  patterns: SeasonalPattern[];
  stockRecommendations: StockPlanningRecommendation[];
  insights: string[];
  forecastAccuracy: number;
  nextPeakPeriod: {
    startMonth: number;
    endMonth: number;
    expectedGrowth: number;
  };
}

// Pola musiman untuk berbagai jenis bisnis F&B
const SEASONAL_PATTERNS: Record<BusinessType, SeasonalPattern[]> = {
  [BusinessType.FNB_RESTAURANT]: [
    {
      type: 'peak',
      months: [12, 1, 6, 7], // Desember, Januari, Juni, Juli
      averageMultiplier: 1.3,
      description: 'Musim liburan dan libur sekolah',
      recommendations: [
        'Tingkatkan stok bahan baku utama 30-40%',
        'Tambah staff part-time untuk periode peak',
        'Lakukan promosi paket keluarga',
        'Siapkan menu spesial musiman'
      ]
    },
    {
      type: 'low',
      months: [2, 3, 9, 10], // Februari, Maret, September, Oktober
      averageMultiplier: 0.8,
      description: 'Periode setelah liburan dan awal tahun ajaran',
      recommendations: [
        'Kurangi stok bahan mudah rusak',
        'Fokus pada menu dengan margin tinggi',
        'Lakukan promosi untuk menarik pelanggan',
        'Evaluasi dan optimasi operasional'
      ]
    },
    {
      type: 'normal',
      months: [4, 5, 8, 11], // April, Mei, Agustus, November
      averageMultiplier: 1.0,
      description: 'Periode normal dengan penjualan stabil',
      recommendations: [
        'Pertahankan stok normal',
        'Fokus pada customer retention',
        'Lakukan inovasi menu',
        'Training staff untuk service excellence'
      ]
    }
  ],
  [BusinessType.FNB_CAFE]: [
    {
      type: 'peak',
      months: [6, 7, 12], // Juni, Juli, Desember
      averageMultiplier: 1.25,
      description: 'Liburan sekolah dan akhir tahun',
      recommendations: [
        'Tingkatkan stok kopi dan bahan minuman',
        'Siapkan area outdoor jika memungkinkan',
        'Promosi minuman dingin dan dessert',
        'Extend jam operasional'
      ]
    },
    {
      type: 'low',
      months: [2, 3, 9], // Februari, Maret, September
      averageMultiplier: 0.85,
      description: 'Periode sepi setelah liburan',
      recommendations: [
        'Fokus pada minuman hangat',
        'Promosi loyalty program',
        'Kerjasama dengan office catering',
        'Optimasi cost structure'
      ]
    },
    {
      type: 'normal',
      months: [1, 4, 5, 8, 10, 11], // Sisanya
      averageMultiplier: 1.0,
      description: 'Periode normal dengan traffic reguler',
      recommendations: [
        'Maintain quality consistency',
        'Develop seasonal menu',
        'Focus on customer experience',
        'Monitor competitor activities'
      ]
    }
  ],
  [BusinessType.FNB_CATERING]: [
    {
      type: 'peak',
      months: [6, 7, 11, 12], // Juni, Juli, November, Desember
      averageMultiplier: 1.5,
      description: 'Wedding season dan corporate events',
      recommendations: [
        'Book venue dan equipment lebih awal',
        'Tingkatkan kapasitas produksi',
        'Siapkan menu paket premium',
        'Koordinasi dengan vendor partner'
      ]
    },
    {
      type: 'low',
      months: [1, 2, 3, 9], // Januari-Maret, September
      averageMultiplier: 0.7,
      description: 'Periode sepi event',
      recommendations: [
        'Fokus pada corporate lunch catering',
        'Develop menu ekonomis',
        'Maintenance equipment',
        'Training team untuk skill upgrade'
      ]
    },
    {
      type: 'normal',
      months: [4, 5, 8, 10], // April, Mei, Agustus, Oktober
      averageMultiplier: 1.0,
      description: 'Periode normal dengan event reguler',
      recommendations: [
        'Maintain service quality',
        'Build relationship dengan client',
        'Develop new menu offerings',
        'Optimize delivery logistics'
      ]
    }
  ],
  [BusinessType.FNB_BAKERY]: [
    {
      type: 'peak',
      months: [12, 1, 6, 7], // Desember, Januari, Juni, Juli
      averageMultiplier: 1.4,
      description: 'Liburan dan celebration season',
      recommendations: [
        'Tingkatkan produksi cake dan pastry',
        'Siapkan pre-order system',
        'Stock bahan untuk custom orders',
        'Extend production hours'
      ]
    },
    {
      type: 'low',
      months: [2, 3, 9, 10], // Februari, Maret, September, Oktober
      averageMultiplier: 0.8,
      description: 'Periode normal setelah celebration',
      recommendations: [
        'Fokus pada daily bread dan pastry',
        'Promosi breakfast packages',
        'Optimize production schedule',
        'Reduce waste dengan better forecasting'
      ]
    },
    {
      type: 'normal',
      months: [4, 5, 8, 11], // April, Mei, Agustus, November
      averageMultiplier: 1.0,
      description: 'Periode stabil dengan demand reguler',
      recommendations: [
        'Maintain product quality',
        'Develop seasonal flavors',
        'Focus on customer loyalty',
        'Optimize ingredient sourcing'
      ]
    }
  ],
  [BusinessType.FNB_FASTFOOD]: [
    {
      type: 'peak',
      months: [6, 7, 12], // Juni, Juli, Desember
      averageMultiplier: 1.2,
      description: 'Liburan sekolah dan akhir tahun',
      recommendations: [
        'Tingkatkan stok frozen items',
        'Siapkan promo family packages',
        'Extend delivery coverage',
        'Increase marketing budget'
      ]
    },
    {
      type: 'low',
      months: [2, 3, 9], // Februari, Maret, September
      averageMultiplier: 0.9,
      description: 'Periode setelah liburan',
      recommendations: [
        'Fokus pada value meals',
        'Promosi delivery dan takeaway',
        'Optimize operational efficiency',
        'Review menu pricing'
      ]
    },
    {
      type: 'normal',
      months: [1, 4, 5, 8, 10, 11], // Sisanya
      averageMultiplier: 1.0,
      description: 'Periode normal dengan traffic konsisten',
      recommendations: [
        'Maintain service speed',
        'Focus on customer satisfaction',
        'Monitor food cost ratio',
        'Develop loyalty programs'
      ]
    }
  ],
  [BusinessType.FNB_STREETFOOD]: [
    {
      type: 'peak',
      months: [6, 7, 12], // Juni, Juli, Desember
      averageMultiplier: 1.3,
      description: 'Liburan dan cuaca yang mendukung',
      recommendations: [
        'Tingkatkan stok bahan baku',
        'Extend jam operasional',
        'Siapkan menu seasonal',
        'Improve food presentation'
      ]
    },
    {
      type: 'low',
      months: [1, 2, 11], // Januari, Februari, November (musim hujan)
      averageMultiplier: 0.7,
      description: 'Musim hujan dan cuaca tidak mendukung',
      recommendations: [
        'Fokus pada covered area',
        'Develop comfort food menu',
        'Promosi delivery jika memungkinkan',
        'Optimize cost structure'
      ]
    },
    {
      type: 'normal',
      months: [3, 4, 5, 8, 9, 10], // Sisanya
      averageMultiplier: 1.0,
      description: 'Periode normal dengan cuaca stabil',
      recommendations: [
        'Maintain food quality',
        'Build customer base',
        'Experiment dengan menu baru',
        'Focus on hygiene standards'
      ]
    }
  ],
  [BusinessType.DEFAULT]: [
    {
      type: 'peak',
      months: [12, 1, 6, 7],
      averageMultiplier: 1.25,
      description: 'Periode liburan umum',
      recommendations: [
        'Tingkatkan stok secara umum',
        'Siapkan promosi khusus',
        'Optimize staffing',
        'Monitor cash flow'
      ]
    },
    {
      type: 'low',
      months: [2, 3, 9, 10],
      averageMultiplier: 0.85,
      description: 'Periode setelah liburan',
      recommendations: [
        'Optimize inventory levels',
        'Focus on cost control',
        'Develop retention strategies',
        'Review operational efficiency'
      ]
    },
    {
      type: 'normal',
      months: [4, 5, 8, 11],
      averageMultiplier: 1.0,
      description: 'Periode normal',
      recommendations: [
        'Maintain steady operations',
        'Focus on quality',
        'Plan for peak seasons',
        'Monitor market trends'
      ]
    }
  ]
};

// Fungsi untuk menganalisis tren musiman dari data historis
export function analyzeSeasonalTrends(
  historicalData: RealTimeProfitCalculation[],
  businessType: BusinessType = BusinessType.FNB_RESTAURANT
): SeasonalTrend[] {
  if (historicalData.length === 0) {
    return [];
  }

  const trends: SeasonalTrend[] = [];
  const monthlyData: Record<string, RealTimeProfitCalculation[]> = {};

  // Group data by month-year
  historicalData.forEach(data => {
    const date = new Date(data.calculated_at);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = [];
    }
    monthlyData[monthYear].push(data);
  });

  // Calculate monthly aggregates
  Object.entries(monthlyData).forEach(([monthYear, dataPoints]) => {
    const [year, month] = monthYear.split('-').map(Number);
    
    const totalRevenue = dataPoints.reduce((sum, d) => sum + d.revenue_data.total, 0);
    const totalCogs = dataPoints.reduce((sum, d) => sum + d.cogs_data.total, 0);
    const totalOpex = dataPoints.reduce((sum, d) => sum + d.opex_data.total, 0);
    const profit = totalRevenue - totalCogs - totalOpex;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    trends.push({
      period: monthYear,
      month,
      year,
      revenue: totalRevenue,
      cogs: totalCogs,
      opex: totalOpex,
      profit,
      profitMargin,
      seasonalIndex: 1.0, // Will be calculated later
      growthRate: 0 // Will be calculated later
    });
  });

  // Calculate seasonal indices and growth rates
  const averageRevenue = trends.reduce((sum, t) => sum + t.revenue, 0) / trends.length;
  
  trends.forEach(trend => {
    trend.seasonalIndex = averageRevenue > 0 ? trend.revenue / averageRevenue : 1.0;
    
    // Calculate YoY growth rate
    const previousYear = trends.find(t => 
      t.month === trend.month && t.year === trend.year - 1
    );
    
    if (previousYear && previousYear.revenue > 0) {
      trend.growthRate = ((trend.revenue - previousYear.revenue) / previousYear.revenue) * 100;
    }
  });

  return trends.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
}

// Fungsi untuk mendapatkan pola musiman berdasarkan jenis bisnis
export function getSeasonalPatterns(businessType: BusinessType): SeasonalPattern[] {
  return SEASONAL_PATTERNS[businessType] || SEASONAL_PATTERNS[BusinessType.DEFAULT];
}

// Fungsi untuk generate rekomendasi perencanaan stok
export function generateStockPlanningRecommendations(
  trends: SeasonalTrend[],
  patterns: SeasonalPattern[],
  businessType: BusinessType,
  currentMonth: number = new Date().getMonth() + 1
): StockPlanningRecommendation[] {
  const recommendations: StockPlanningRecommendation[] = [];
  const currentPattern = patterns.find(p => p.months.includes(currentMonth));
  const nextMonths = [currentMonth + 1, currentMonth + 2, currentMonth + 3].map(m => m > 12 ? m - 12 : m);
  
  // Rekomendasi berdasarkan pola saat ini
  if (currentPattern) {
    if (currentPattern.type === 'peak') {
      recommendations.push({
        category: 'inventory',
        priority: 'high',
        period: 'Bulan ini',
        action: `Tingkatkan stok ${Math.round((currentPattern.averageMultiplier - 1) * 100)}% dari normal`,
        estimatedImpact: 15,
        timeframe: 'immediate',
        kpiToTrack: ['inventory_turnover', 'stockout_rate', 'revenue_growth']
      });
      
      recommendations.push({
        category: 'staffing',
        priority: 'high',
        period: 'Bulan ini',
        action: 'Tambah staff part-time atau extend jam kerja existing staff',
        estimatedImpact: 10,
        timeframe: 'immediate',
        kpiToTrack: ['service_time', 'customer_satisfaction', 'labor_cost_ratio']
      });
    } else if (currentPattern.type === 'low') {
      recommendations.push({
        category: 'inventory',
        priority: 'medium',
        period: 'Bulan ini',
        action: 'Kurangi stok bahan mudah rusak, fokus pada item dengan shelf life panjang',
        estimatedImpact: 8,
        timeframe: 'immediate',
        kpiToTrack: ['waste_percentage', 'inventory_cost', 'cash_flow']
      });
      
      recommendations.push({
        category: 'marketing',
        priority: 'high',
        period: 'Bulan ini',
        action: 'Lakukan promosi agresif untuk meningkatkan traffic',
        estimatedImpact: 12,
        timeframe: 'immediate',
        kpiToTrack: ['customer_acquisition', 'average_transaction', 'promotion_roi']
      });
    }
  }
  
  // Rekomendasi untuk bulan-bulan mendatang
  nextMonths.forEach((month, index) => {
    const futurePattern = patterns.find(p => p.months.includes(month));
    if (futurePattern) {
      const timeframe = index === 0 ? 'immediate' : index === 1 ? 'short_term' : 'medium_term';
      const period = `${index + 1} bulan ke depan`;
      
      if (futurePattern.type === 'peak') {
        recommendations.push({
          category: 'inventory',
          priority: 'medium',
          period,
          action: `Persiapkan stok untuk peak season (${Math.round((futurePattern.averageMultiplier - 1) * 100)}% increase)`,
          estimatedImpact: 20,
          timeframe,
          kpiToTrack: ['inventory_preparation', 'supplier_reliability', 'cost_optimization']
        });
      }
    }
  });
  
  // Rekomendasi berdasarkan tren historis
  if (trends.length > 0) {
    const recentTrends = trends.slice(-6); // 6 bulan terakhir
    const averageGrowth = recentTrends.reduce((sum, t) => sum + t.growthRate, 0) / recentTrends.length;
    
    if (averageGrowth > 10) {
      recommendations.push({
        category: 'inventory',
        priority: 'high',
        period: '3 bulan ke depan',
        action: `Tingkatkan kapasitas stok mengikuti tren pertumbuhan ${averageGrowth.toFixed(1)}%`,
        estimatedImpact: 25,
        timeframe: 'medium_term',
        kpiToTrack: ['growth_sustainability', 'capacity_utilization', 'market_share']
      });
    } else if (averageGrowth < -5) {
      recommendations.push({
        category: 'pricing',
        priority: 'high',
        period: '2 bulan ke depan',
        action: 'Review pricing strategy dan cost structure untuk menghadapi declining trend',
        estimatedImpact: 15,
        timeframe: 'short_term',
        kpiToTrack: ['profit_margin', 'price_elasticity', 'competitive_position']
      });
    }
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// Fungsi untuk generate insights dari analisis musiman
export function generateSeasonalInsights(
  trends: SeasonalTrend[],
  patterns: SeasonalPattern[],
  businessType: BusinessType
): string[] {
  const insights: string[] = [];
  
  if (trends.length === 0) {
    insights.push('Data historis tidak cukup untuk analisis tren musiman yang akurat.');
    return insights;
  }
  
  // Analisis pola musiman
  const peakPattern = patterns.find(p => p.type === 'peak');
  const lowPattern = patterns.find(p => p.type === 'low');
  
  if (peakPattern && lowPattern) {
    const peakMonths = peakPattern.months.map(m => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      return monthNames[m - 1];
    }).join(', ');
    
    insights.push(`Periode peak season biasanya terjadi pada bulan ${peakMonths} dengan peningkatan revenue hingga ${Math.round((peakPattern.averageMultiplier - 1) * 100)}%.`);
  }
  
  // Analisis tren pertumbuhan
  const recentTrends = trends.slice(-12); // 12 bulan terakhir
  if (recentTrends.length >= 6) {
    const averageGrowth = recentTrends.reduce((sum, t) => sum + t.growthRate, 0) / recentTrends.length;
    
    if (averageGrowth > 5) {
      insights.push(`Bisnis menunjukkan tren pertumbuhan positif dengan rata-rata ${averageGrowth.toFixed(1)}% per bulan.`);
    } else if (averageGrowth < -2) {
      insights.push(`Terdapat tren penurunan dengan rata-rata ${Math.abs(averageGrowth).toFixed(1)}% per bulan yang perlu perhatian khusus.`);
    } else {
      insights.push('Bisnis menunjukkan tren yang stabil dengan fluktuasi minimal.');
    }
  }
  
  // Analisis volatilitas
  const seasonalIndices = trends.map(t => t.seasonalIndex);
  const avgIndex = seasonalIndices.reduce((sum, idx) => sum + idx, 0) / seasonalIndices.length;
  const variance = seasonalIndices.reduce((sum, idx) => sum + Math.pow(idx - avgIndex, 2), 0) / seasonalIndices.length;
  const volatility = Math.sqrt(variance);
  
  if (volatility > 0.3) {
    insights.push('Bisnis memiliki volatilitas musiman yang tinggi, perencanaan cash flow dan inventory perlu ekstra hati-hati.');
  } else if (volatility < 0.1) {
    insights.push('Pola penjualan relatif stabil sepanjang tahun, memudahkan perencanaan operasional.');
  }
  
  // Analisis profitabilitas musiman
  const profitMargins = trends.map(t => t.profitMargin);
  const maxMargin = Math.max(...profitMargins);
  const minMargin = Math.min(...profitMargins);
  const marginDiff = maxMargin - minMargin;
  
  if (marginDiff > 10) {
    insights.push(`Margin profit bervariasi signifikan (${marginDiff.toFixed(1)}%) antar musim, optimasi cost structure bisa meningkatkan konsistensi.`);
  }
  
  return insights;
}

// Fungsi untuk prediksi periode peak berikutnya
export function predictNextPeakPeriod(
  trends: SeasonalTrend[],
  patterns: SeasonalPattern[],
  currentMonth: number = new Date().getMonth() + 1
): { startMonth: number; endMonth: number; expectedGrowth: number } {
  const peakPattern = patterns.find(p => p.type === 'peak');
  
  if (!peakPattern) {
    return {
      startMonth: currentMonth,
      endMonth: currentMonth,
      expectedGrowth: 0
    };
  }
  
  // Cari peak period berikutnya
  const nextPeakMonths = peakPattern.months.filter(m => m > currentMonth);
  let startMonth: number;
  let endMonth: number;
  
  if (nextPeakMonths.length > 0) {
    startMonth = Math.min(...nextPeakMonths);
    endMonth = Math.max(...nextPeakMonths.filter(m => m <= startMonth + 2));
  } else {
    // Peak period di tahun berikutnya
    startMonth = Math.min(...peakPattern.months);
    endMonth = Math.max(...peakPattern.months.filter(m => m <= startMonth + 2));
  }
  
  // Estimasi pertumbuhan berdasarkan data historis
  let expectedGrowth = (peakPattern.averageMultiplier - 1) * 100;
  
  if (trends.length > 0) {
    const peakTrends = trends.filter(t => peakPattern.months.includes(t.month));
    if (peakTrends.length > 0) {
      const avgPeakGrowth = peakTrends.reduce((sum, t) => sum + t.growthRate, 0) / peakTrends.length;
      expectedGrowth = Math.max(expectedGrowth, avgPeakGrowth);
    }
  }
  
  return {
    startMonth,
    endMonth,
    expectedGrowth: Math.round(expectedGrowth)
  };
}

// Fungsi utama untuk melakukan analisis musiman lengkap
export function performSeasonalAnalysis(
  historicalData: RealTimeProfitCalculation[],
  businessType: BusinessType = BusinessType.FNB_RESTAURANT,
  currentMonth: number = new Date().getMonth() + 1
): SeasonalAnalysisResult {
  const trends = analyzeSeasonalTrends(historicalData, businessType);
  const patterns = getSeasonalPatterns(businessType);
  const stockRecommendations = generateStockPlanningRecommendations(trends, patterns, businessType, currentMonth);
  const insights = generateSeasonalInsights(trends, patterns, businessType);
  const nextPeakPeriod = predictNextPeakPeriod(trends, patterns, currentMonth);
  
  // Calculate forecast accuracy (simplified)
  let forecastAccuracy = 75; // Default accuracy
  if (trends.length >= 12) {
    const recentTrends = trends.slice(-12);
    const predictions = recentTrends.map(trend => {
      const pattern = patterns.find(p => p.months.includes(trend.month));
      return pattern ? pattern.averageMultiplier : 1.0;
    });
    
    const actualIndices = recentTrends.map(t => t.seasonalIndex);
    const errors = predictions.map((pred, idx) => Math.abs(pred - actualIndices[idx]));
    const avgError = errors.reduce((sum, err) => sum + err, 0) / errors.length;
    
    forecastAccuracy = Math.max(50, Math.min(95, 100 - (avgError * 100)));
  }
  
  return {
    trends,
    patterns,
    stockRecommendations,
    insights,
    forecastAccuracy,
    nextPeakPeriod
  };
}

// Utility function untuk format periode
export function formatPeriod(month: number, year?: number): string {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const monthName = monthNames[month - 1] || 'Unknown';
  return year ? `${monthName} ${year}` : monthName;
}

// Utility function untuk mendapatkan warna berdasarkan tipe pattern
export function getPatternColor(type: SeasonalPattern['type']): string {
  switch (type) {
    case 'peak': return 'text-green-600';
    case 'low': return 'text-red-600';
    case 'normal': return 'text-blue-600';
    default: return 'text-gray-600';
  }
}

// Utility function untuk mendapatkan icon berdasarkan kategori rekomendasi
export function getRecommendationIcon(category: StockPlanningRecommendation['category']): string {
  switch (category) {
    case 'inventory': return '📦';
    case 'staffing': return '👥';
    case 'marketing': return '📢';
    case 'pricing': return '💰';
    default: return '📋';
  }
}