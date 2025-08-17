// profitCalculations.ts - Core calculation utilities
// ==============================================

import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { PROFIT_CONSTANTS, FNB_THRESHOLDS, FNB_LABELS } from '../constants/profitConstants';
import { warehouseUtils } from '@/components/warehouse/services/warehouseUtils';

// Interfaces matching the actual schema
export interface FinancialTransactionActual {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  category: string | null;
  amount: number | null;
  description: string | null;
  date: string | null; // TIMESTAMPTZ as string
  created_at: string;
  updated_at: string;
  notes: string | null;
  related_id: string | null;
}

export interface BahanBakuActual {
  id: string;
  user_id: string;
  nama: string | null;
  kategori: string | null;
  stok: number | null;
  satuan: string | null;
  minimum: number | null;
  harga_satuan: number | null;
  supplier: string | null;
  tanggal_kadaluwarsa: string | null;
  created_at: string;
  updated_at: string;
  jumlah_beli_kemasan: number | null;
  satuan_kemasan: string | null;
  harga_total_beli_kemasan: number | null;
  isi_per_kemasan: number | null;
  harga_rata_rata: number | null; // ✅ TAMBAH: WAC field
}

export interface OperationalCostActual {
  id: string;
  user_id: string;
  nama_biaya: string;
  jumlah_per_bulan: number;
  jenis: 'tetap' | 'variabel';
  status: 'aktif' | 'nonaktif';
  created_at: string;
  updated_at: string;
  cost_category: string | null;
}

// ✅ TAMBAH: Interface untuk pemakaian bahan (kompatibel dengan view)
export interface PemakaianBahan {
  bahan_baku_id: string;
  qty_base: number;
  tanggal?: string;
  // kolom dari view (opsional)
  harga_efektif?: number | null;
  hpp_value?: number | null;
}

/**
 * ✅ TAMBAH: Get effective unit price using snake_case with fallback
 */
export function getEffectiveUnitPrice(item: BahanBakuActual | any): number {
  // Utamakan snake_case, fallback ke camelCase bila ada
  const wac = Number(item?.harga_rata_rata ?? item?.hargaRataRata ?? 0);
  const base = Number(item?.harga_satuan ?? item?.harga ?? 0);
  return wac > 0 ? wac : base;
}

/**
 * ✅ TAMBAH: Calculate HPP using multiple fallback strategies
 */
export function calcHPP(
  pemakaian: PemakaianBahan[],
  bahanMap: Record<string, BahanBakuActual | any>
): {
  totalHPP: number;
  breakdown: Array<{ id: string; nama: string; qty: number; price: number; hpp: number }>;
} {
  let total = 0;
  const breakdown: Array<{ id: string; nama: string; qty: number; price: number; hpp: number }> = [];

  for (const row of pemakaian || []) {
    const bb = bahanMap[row.bahan_baku_id];
    if (!bb) continue;

    const qty = Number(row.qty_base || 0);

    // 1) kalau view sudah kirim nilai HPP langsung
    if (typeof row.hpp_value === 'number' && !Number.isNaN(row.hpp_value)) {
      const hpp = Math.round(Number(row.hpp_value));
      const price = qty > 0 ? hpp / qty : getEffectiveUnitPrice(bb);
      total += hpp;
      breakdown.push({
        id: row.bahan_baku_id,
        nama: bb.nama || 'Unknown',
        qty,
        price,
        hpp,
      });
      continue;
    }

    // 2) kalau ada harga_efektif (WAC) dari view
    if (typeof row.harga_efektif === 'number' && !Number.isNaN(row.harga_efektif)) {
      const price = Number(row.harga_efektif);
      const hpp = Math.round(qty * price);
      total += hpp;
      breakdown.push({
        id: row.bahan_baku_id,
        nama: bb.nama || 'Unknown',
        qty,
        price,
        hpp,
      });
      continue;
    }

    // 3) fallback: ambil dari map bahan (WAC/harga_satuan)
    const price = getEffectiveUnitPrice(bb);
    const hpp = Math.round(qty * price);
    total += hpp;
    breakdown.push({
      id: row.bahan_baku_id,
      nama: bb.nama || 'Unknown',
      qty,
      price,
      hpp,
    });
  }

  return { totalHPP: Math.round(total), breakdown };
}

/**
 * ✅ NEW: Calculate total inventory value (modal bahan baku tersimpan)
 * Menghitung modal bahan baku berdasarkan stok yang tersedia di warehouse
 */
export function calculateInventoryValue(
  materials: BahanBakuActual[]
): {
  totalValue: number;
  breakdown: Array<{ id: string; nama: string; stok: number; price: number; value: number }>;
  summary: {
    totalItems: number;
    itemsWithStock: number;
    averagePrice: number;
  };
} {
  let totalValue = 0;
  const breakdown: Array<{ id: string; nama: string; stok: number; price: number; value: number }> = [];
  let totalQuantity = 0;
  let totalPriceSum = 0;
  let itemsWithStock = 0;

  for (const material of materials || []) {
    const stok = Number(material.stok) || 0;
    const price = getEffectiveUnitPrice(material);
    const value = stok * price;

    if (stok > 0) {
      itemsWithStock++;
      totalQuantity += stok;
      totalPriceSum += price;
    }

    totalValue += value;
    breakdown.push({
      id: material.id,
      nama: material.nama || 'Unknown',
      stok,
      price,
      value: Math.round(value)
    });
  }

  return {
    totalValue: Math.round(totalValue),
    breakdown,
    summary: {
      totalItems: materials.length,
      itemsWithStock,
      averagePrice: itemsWithStock > 0 ? Math.round(totalPriceSum / itemsWithStock) : 0
    }
  };
}

/**
 * Calculate real-time profit analysis with actual schema
 */
export const calculateRealTimeProfit = (
  period: string,
  transactions: FinancialTransactionActual[],
  materials: BahanBakuActual[],
  operationalCosts: OperationalCostActual[]
): RealTimeProfitCalculation => {
  const periodTransactions = filterTransactionsByPeriod(transactions, period);

  const revenueTransactions = periodTransactions.filter(t => t.type === 'income');
  const totalRevenue = revenueTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  
  // ✅ IMPROVED: Calculate COGS using current stock value (modal tersimpan di gudang)
  // Menggunakan total nilai stok yang tersedia di warehouse
  const totalCOGS = materials.reduce((sum, m) => {
    const stok = Number(m.stok) || 0;
    const effectivePrice = getEffectiveUnitPrice(m);
    return sum + (stok * effectivePrice);
  }, 0);

  // Create material breakdown for modal bahan baku saat ini
  const materialBreakdown = materials
    .filter(m => Number(m.stok) > 0) // Hanya yang ada stoknya
    .map(m => {
      const stok = Number(m.stok) || 0;
      const price = getEffectiveUnitPrice(m);
      const hpp = stok * price;
      return {
        id: m.id,
        nama: m.nama || 'Unknown',
        qty: stok,
        price,
        hpp: Math.round(hpp)
      };
    });

  const activeCosts = operationalCosts.filter(c => c.status === 'aktif');
  const totalOpEx = activeCosts.reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0);

  const enhancedRevenueTransactions = revenueTransactions.map(t => ({
    category: t.category || 'Uncategorized',
    amount: Number(t.amount) || 0,
    description: t.description || '',
    date: t.date,
    id: t.id
  }));

  const enhancedCOGSTransactions = materialBreakdown.map(item => ({
    name: item.nama,
    cost: item.hpp,
    unit_price: item.price,
    quantity: item.qty,
    category: 'Direct Material'
  }));

  const enhancedOpExCosts = activeCosts.map(c => ({
    nama_biaya: c.nama_biaya,
    jumlah_per_bulan: Number(c.jumlah_per_bulan),
    jenis: c.jenis,
    cost_category: c.cost_category || 'general',
    id: c.id
  }));
  
  return {
    period,
    revenue_data: {
      total: totalRevenue,
      transactions: enhancedRevenueTransactions
    },
    cogs_data: {
      total: totalCOGS,
      materials: enhancedCOGSTransactions
    },
    opex_data: {
      total: totalOpEx,
      costs: enhancedOpExCosts
    },
    calculated_at: new Date().toISOString()
  };
};

/**
 * Calculate profit margins with validation
 */
export const calculateMargins = (revenue: number, cogs: number, opex: number) => {
  const validRevenue = Math.max(0, Number(revenue) || 0);
  const validCOGS = Math.max(0, Number(cogs) || 0);
  const validOpEx = Math.max(0, Number(opex) || 0);
  
  const grossProfit = validRevenue - validCOGS;
  const netProfit = grossProfit - validOpEx;
  
  const grossMargin = validRevenue > 0 ? (grossProfit / validRevenue) * 100 : 0;
  const netMargin = validRevenue > 0 ? (netProfit / validRevenue) * 100 : 0;
  
  return {
    grossProfit,
    netProfit,
    grossMargin,
    netMargin,
    cogsPercentage: validRevenue > 0 ? (validCOGS / validRevenue) * 100 : 0,
    opexPercentage: validRevenue > 0 ? (validOpEx / validRevenue) * 100 : 0,
    totalCostPercentage: validRevenue > 0 ? ((validCOGS + validOpEx) / validRevenue) * 100 : 0
  };
};

/**
 * Filter transactions by period with timezone handling
 */
export const filterTransactionsByPeriod = (
  transactions: FinancialTransactionActual[], 
  period: string
): FinancialTransactionActual[] => {
  return transactions.filter(t => {
    if (!t.date) return false;
    
    try {
      const transactionDate = new Date(t.date);
      const transactionPeriod = transactionDate.toISOString().slice(0, 7);
      return transactionPeriod === period;
    } catch (error) {
      console.warn('Invalid date format:', t.date);
      return false;
    }
  });
};

/**
 * 🍽️ Get F&B specific margin rating with industry-appropriate thresholds
 */
export const getMarginRating = (margin: number, type: 'gross' | 'net'): string => {
  // Use F&B specific thresholds which are more realistic for food industry
  const fnbThresholds = FNB_THRESHOLDS.MARGIN_TARGETS;
  const fallbackThresholds = PROFIT_CONSTANTS.MARGIN_THRESHOLDS;
  
  const targetThreshold = fnbThresholds.EXCELLENT[type] ?? fallbackThresholds.EXCELLENT[type];
  const goodThreshold = fnbThresholds.GOOD[type] ?? fallbackThresholds.GOOD[type];
  const fairThreshold = fnbThresholds.FAIR[type] ?? fallbackThresholds.FAIR[type];
  const poorThreshold = fnbThresholds.POOR[type] ?? fallbackThresholds.POOR[type];
  
  // Convert decimal to percentage if needed
  const marginPercent = margin > 1 ? margin : margin * 100;
  
  if (marginPercent >= targetThreshold * 100) return 'excellent';
  if (marginPercent >= goodThreshold * 100) return 'good';  
  if (marginPercent >= fairThreshold * 100) return 'fair';
  return 'poor';
};

/**
 * 🍽️ Get F&B specific COGS efficiency rating
 */
export const getCOGSEfficiencyRating = (cogsRatio: number): string => {
  if (cogsRatio <= FNB_THRESHOLDS.COGS_RATIOS.EXCELLENT) return 'excellent';
  if (cogsRatio <= FNB_THRESHOLDS.COGS_RATIOS.GOOD) return 'good';
  if (cogsRatio <= FNB_THRESHOLDS.COGS_RATIOS.FAIR) return 'fair';
  return 'poor';
};

/**
 * Extract material name from transaction description
 */
export const extractMaterialName = (description: string): string => {
  if (!description) return 'Unknown Material';
  
  const patterns = [
    /(?:beli|pembelian|bahan)\s+(.+)/i,
    /(.+?)(?:\s+(?:kg|gram|liter|ml|pcs|dus|pak))/i,
    /material\s+(.+)/i,
    /(.+?)(?:\s+untuk)/i
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return description.split(' ').slice(0, 3).join(' ') || 'Material';
};

/**
 * Calculate inventory-based COGS
 */
export const calculateInventoryBasedCOGS = (
  materials: BahanBakuActual[],
  usageData?: { materialId: string; quantityUsed: number }[]
): { totalCOGS: number; breakdown: any[] } => {
  if (!usageData || usageData.length === 0) {
    const totalInventoryValue = materials.reduce((sum, m) => {
      const stock = Number(m.stok) || 0;
      // ✅ UPDATE: Use effective unit price (WAC)
      const price = getEffectiveUnitPrice(m);
      return sum + (stock * price);
    }, 0);
    
    return {
      totalCOGS: totalInventoryValue * 0.1,
      breakdown: materials.map(m => ({
        material_name: m.nama || 'Unknown',
        estimated_usage: (Number(m.stok) || 0) * 0.1,
        unit_price: getEffectiveUnitPrice(m),
        total_cost: ((Number(m.stok) || 0) * 0.1) * getEffectiveUnitPrice(m),
        percentage: 0
      }))
    };
  }
  
  const breakdown = usageData.map(usage => {
    const material = materials.find(m => m.id === usage.materialId);
    if (!material) return null;
    
    // ✅ UPDATE: Use effective unit price (WAC)
    const unitPrice = getEffectiveUnitPrice(material);
    const totalCost = usage.quantityUsed * unitPrice;
    
    return {
      material_name: material.nama || 'Unknown',
      quantity_used: usage.quantityUsed,
      unit_price: unitPrice,
      total_cost: totalCost,
      percentage: 0
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);
  
  const totalCOGS = breakdown.reduce((sum, item) => sum + (item.total_cost || 0), 0);
  
  breakdown.forEach(item => {
    if (totalCOGS > 0) {
      item.percentage = (item.total_cost / totalCOGS) * 100;
    }
  });
  
  return { totalCOGS, breakdown };
};

/**
 * Analyze cost structure
 */
export const analyzeCostStructure = (
  operationalCosts: OperationalCostActual[]
): {
  fixedCosts: number;
  variableCosts: number;
  totalCosts: number;
  fixedCostRatio: number;
  variableCostRatio: number;
  costsByCategory: Record<string, number>;
} => {
  const activeCosts = operationalCosts.filter(c => c.status === 'aktif');
  
  const fixedCosts = activeCosts
    .filter(c => c.jenis === 'tetap')
    .reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0);
    
  const variableCosts = activeCosts
    .filter(c => c.jenis === 'variabel')
    .reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0);
    
  const totalCosts = fixedCosts + variableCosts;
  
  const costsByCategory = activeCosts.reduce((acc, cost) => {
    const category = cost.cost_category || 'general';
    acc[category] = (acc[category] || 0) + Number(cost.jumlah_per_bulan);
    return acc;
  }, {} as Record<string, number>);
  
  return {
    fixedCosts,
    variableCosts,
    totalCosts,
    fixedCostRatio: totalCosts > 0 ? (fixedCosts / totalCosts) * 100 : 0,
    variableCostRatio: totalCosts > 0 ? (variableCosts / totalCosts) * 100 : 0,
    costsByCategory
  };
};

/**
 * Calculate break-even analysis
 */
export const calculateBreakEvenAnalysis = (
  fixedCosts: number,
  variableCostPercentage: number,
  averageSellingPrice?: number,
  targetUnits?: number
): {
  breakEvenRevenue: number;
  breakEvenUnits: number;
  contributionMarginPercentage: number;
  marginOfSafety: number;
} => {
  const contributionMarginPercentage = 100 - variableCostPercentage;
  const breakEvenRevenue = contributionMarginPercentage > 0 
    ? (fixedCosts / contributionMarginPercentage) * 100
    : 0;
    
  const breakEvenUnits = averageSellingPrice && averageSellingPrice > 0
    ? breakEvenRevenue / averageSellingPrice
    : 0;
    
  const marginOfSafety = targetUnits && breakEvenUnits > 0
    ? ((targetUnits - breakEvenUnits) / targetUnits) * 100
    : 0;
  
  return {
    breakEvenRevenue,
    breakEvenUnits,
    contributionMarginPercentage,
    marginOfSafety
  };
};

/**
 * Compare periods for trend analysis
 */
export const comparePeriods = (
  currentPeriod: RealTimeProfitCalculation,
  previousPeriod: RealTimeProfitCalculation | null
): {
  revenueGrowth: number;
  profitGrowth: number;
  marginChange: number;
  trend: 'improving' | 'declining' | 'stable';
  insights: string[];
} => {
  if (!previousPeriod) {
    return {
      revenueGrowth: 0,
      profitGrowth: 0,
      marginChange: 0,
      trend: 'stable',
      insights: ['Tidak ada data periode sebelumnya untuk perbandingan']
    };
  }
  
  const currentRevenue = currentPeriod.revenue_data.total;
  const previousRevenue = previousPeriod.revenue_data.total;
  const revenueGrowth = previousRevenue > 0 
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
    : 0;

  const currentProfit = currentRevenue - currentPeriod.cogs_data.total - currentPeriod.opex_data.total;
  const previousProfit = previousRevenue - previousPeriod.cogs_data.total - previousPeriod.opex_data.total;
  const profitGrowth = previousProfit !== 0 
    ? ((currentProfit - previousProfit) / Math.abs(previousProfit)) * 100 
    : 0;

  const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
  const previousMargin = previousRevenue > 0 ? (previousProfit / previousRevenue) * 100 : 0;
  const marginChange = currentMargin - previousMargin;

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (profitGrowth > 5) trend = 'improving';
  else if (profitGrowth < -5) trend = 'declining';

  const insights: string[] = [];
  
  if (revenueGrowth > 10) insights.push('Revenue mengalami pertumbuhan yang kuat');
  else if (revenueGrowth < -10) insights.push('Revenue mengalami penurunan signifikan');
  
  if (marginChange > 2) insights.push('Margin profit meningkat');
  else if (marginChange < -2) insights.push('Margin profit menurun');
  
  if (trend === 'improving') insights.push('Tren profit menunjukkan perbaikan');
  else if (trend === 'declining') insights.push('Tren profit memerlukan perhatian');

  return {
    revenueGrowth,
    profitGrowth,
    marginChange,
    trend,
    insights
  };
};

/**
 * Validate data quality
 */
export const validateDataQuality = (
  calculation: RealTimeProfitCalculation
): {
  score: number;
  issues: string[];
  recommendations: string[];
} => {
  let score = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  if (calculation.revenue_data.total <= 0) {
    score -= 30;
    issues.push('Tidak ada data revenue');
    recommendations.push('Tambahkan transaksi pemasukan');
  } else if (calculation.revenue_data.transactions.length === 0) {
    score -= 10;
    issues.push('Data revenue tidak memiliki breakdown detail');
    recommendations.push('Pastikan transaksi memiliki kategori yang jelas');
  }
  
  if (calculation.cogs_data.total <= 0) {
    score -= 20;
    issues.push('Tidak ada data COGS');
    recommendations.push('Tambahkan transaksi pembelian bahan baku');
  }
  
  if (calculation.opex_data.total <= 0) {
    score -= 20;
    issues.push('Tidak ada data biaya operasional');
    recommendations.push('Konfigurasi biaya operasional di menu operational costs');
  }
  
  const revenue = calculation.revenue_data.total;
  const cogs = calculation.cogs_data.total;
  const opex = calculation.opex_data.total;
  
  if (cogs > revenue) {
    score -= 15;
    issues.push('COGS lebih besar dari revenue (tidak wajar)');
    recommendations.push('Review kategorisasi transaksi expense');
  }
  
  if (opex > revenue * 0.8) {
    score -= 10;
    issues.push('Biaya operasional terlalu tinggi (>80% revenue)');
    recommendations.push('Review efisiensi biaya operasional');
  }
  
  const netProfit = revenue - cogs - opex;
  if (netProfit < 0 && Math.abs(netProfit) > revenue * 0.2) {
    score -= 10;
    issues.push('Kerugian signifikan (>20% revenue)');
    recommendations.push('Fokus pada optimasi biaya dan peningkatan revenue');
  }
  
  return {
    score: Math.max(0, score),
    issues,
    recommendations
  };
};

/**
 * 🍽️ Generate F&B specific executive insights with UMKM friendly language
 */
export const generateExecutiveInsights = (
  calculation: RealTimeProfitCalculation,
  previousCalculation?: RealTimeProfitCalculation
): {
  keyHighlights: string[];
  criticalIssues: string[];
  opportunities: string[];
  recommendedActions: string[];
} => {
  const revenue = calculation.revenue_data.total;
  const cogs = calculation.cogs_data.total;
  const opex = calculation.opex_data.total;
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - opex;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  
  const keyHighlights: string[] = [];
  const criticalIssues: string[] = [];
  const opportunities: string[] = [];
  const recommendedActions: string[] = [];
  
  // 🍽️ F&B specific revenue analysis
  if (revenue > 0) {
    keyHighlights.push(`💰 Omset: ${formatCurrency(revenue)}`);
    
    // Check if revenue meets F&B threshold
    if (revenue < FNB_THRESHOLDS.ALERTS.low_revenue) {
      opportunities.push(`🎯 Omset bisa ditingkatkan (saat ini ${formatCurrency(revenue)})`);
      recommendedActions.push('🚀 Fokus promosi menu favorit dan ekspansi jam buka');
    }
  } else {
    criticalIssues.push('❌ Tidak ada omset dalam periode ini');
    recommendedActions.push('🏃‍♂️ Segera buka warung dan fokus pada marketing');
  }
  
  // 🍽️ F&B specific gross margin analysis with friendlier language
  if (grossMargin >= 65) {
    keyHighlights.push(`📈 Untung kotor sangat baik: ${grossMargin.toFixed(1)}%`);
  } else if (grossMargin >= 55) {
    keyHighlights.push(`✅ Untung kotor sehat: ${grossMargin.toFixed(1)}%`);
  } else if (grossMargin >= 45) {
    opportunities.push(`📊 Untung kotor bisa ditingkatkan dari ${grossMargin.toFixed(1)}%`);
    recommendedActions.push('🥘 Cek harga bahan baku dengan supplier, pertimbangkan naikkan harga menu');
  } else {
    criticalIssues.push(`⚠️ Untung kotor terlalu kecil: ${grossMargin.toFixed(1)}%`);
    recommendedActions.push('🚨 Urgent: negosiasi supplier atau naikkan harga jual');
  }
  
  // 🍽️ F&B specific net margin analysis with UMKM friendly language
  if (netMargin >= 25) {
    keyHighlights.push(`💎 Untung bersih luar biasa: ${netMargin.toFixed(1)}%`);
  } else if (netMargin >= 18) {
    keyHighlights.push(`🎉 Untung bersih sangat baik: ${netMargin.toFixed(1)}%`);
  } else if (netMargin >= 12) {
    keyHighlights.push(`👍 Untung bersih sehat: ${netMargin.toFixed(1)}%`);
  } else if (netMargin >= 5) {
    opportunities.push(`📈 Untung bersih bisa ditingkatkan dari ${netMargin.toFixed(1)}%`);
    recommendedActions.push('🏪 Cek biaya bulanan: listrik, sewa, gaji - mana yang bisa dihemat');
  } else if (netMargin < 0) {
    criticalIssues.push(`📉 Warung rugi: ${netMargin.toFixed(1)}%`);
    recommendedActions.push('🚨 Plan darurat: kurangi biaya, tingkatkan penjualan segera');
  } else {
    criticalIssues.push(`⚠️ Untung bersih sangat kecil: ${netMargin.toFixed(1)}%`);
    recommendedActions.push('🔍 Review semua biaya dan strategi harga menu');
  }
  
  const cogsPercentage = revenue > 0 ? (cogs / revenue) * 100 : 0;
  const opexPercentage = revenue > 0 ? (opex / revenue) * 100 : 0;
  
  // 🍽️ F&B specific cost structure analysis
  if (cogsPercentage > FNB_THRESHOLDS.ALERTS.high_ingredient_cost * 100) {
    criticalIssues.push(`🥘 Modal bahan baku terlalu mahal: ${cogsPercentage.toFixed(1)}% dari omset`);
    recommendedActions.push('🔍 Cari supplier lebih murah, review porsi menu yang boros bahan');
  } else if (cogsPercentage > 45) {
    opportunities.push(`🥘 Modal bahan bisa dihemat: ${cogsPercentage.toFixed(1)}% dari omset (ideal <45%)`);
    recommendedActions.push('📊 Analisis menu mana yang paling boros bahan');
  } else {
    keyHighlights.push(`✅ Modal bahan baku efisien: ${cogsPercentage.toFixed(1)}% dari omset`);
  }
  
  if (opexPercentage > 30) {
    criticalIssues.push(`🏪 Biaya bulanan tetap tinggi: ${opexPercentage.toFixed(1)}% dari omset`);
    recommendedActions.push('💡 Cek biaya listrik, sewa, gaji - mana yang bisa dinegosiasi');
  } else if (opexPercentage > 20) {
    opportunities.push(`🏪 Biaya bulanan bisa dioptimalkan: ${opexPercentage.toFixed(1)}% dari omset`);
    recommendedActions.push('📋 Review kontrak sewa dan efisiensi operasional');
  }
  
  if (previousCalculation) {
    const comparison = comparePeriods(calculation, previousCalculation);
    
    // 🍽️ F&B specific growth analysis with friendly language
    if (comparison.revenueGrowth > 15) {
      keyHighlights.push(`🚀 Omset tumbuh pesat: +${comparison.revenueGrowth.toFixed(1)}% dari bulan lalu`);
    } else if (comparison.revenueGrowth > 5) {
      keyHighlights.push(`📈 Omset naik: +${comparison.revenueGrowth.toFixed(1)}% dari bulan lalu`);
    } else if (comparison.revenueGrowth < -10) {
      criticalIssues.push(`📉 Omset turun drastis: ${comparison.revenueGrowth.toFixed(1)}% dari bulan lalu`);
      recommendedActions.push('🔍 Cek kenapa omset turun: ada pesaing baru? menu kurang laris?');
    }
    
    if (comparison.trend === 'improving') {
      keyHighlights.push('📊 Tren untung-rugi semakin membaik');
    } else if (comparison.trend === 'declining') {
      criticalIssues.push('📉 Tren untung-rugi menurun');
      recommendedActions.push('🧐 Cari tahu kenapa untung berkurang: bahan mahal? pelanggan berkurang?');
    }
  }
  
  // 🍽️ F&B specific business health assessment
  if (netProfit > 0 && grossMargin > 55 && netMargin > 18) {
    opportunities.push('🎉 Warung sangat sehat, siap expand atau buka cabang');
    recommendedActions.push('💰 Pertimbangkan investasi peralatan atau lokasi baru');
  } else if (netProfit > 0 && grossMargin > 45 && netMargin > 12) {
    opportunities.push('👍 Warung sehat, fokus tingkatkan efisiensi');
    recommendedActions.push('🎯 Optimalkan menu terlaris dan kurangi yang tidak laku');
  } else if (netProfit > 0) {
    opportunities.push('✅ Warung sudah untung, tapi masih bisa ditingkatkan');
    recommendedActions.push('📊 Analisis menu mana yang paling menguntungkan');
  }
  
  const dataQuality = validateDataQuality(calculation);
  if (dataQuality.score < 70) {
    opportunities.push('📝 Tingkatkan pencatatan untuk analisis yang lebih akurat');
    recommendedActions.push('✏️ Catat semua pemasukan dan pengeluaran dengan lengkap');
  }
  
  return {
    keyHighlights,
    criticalIssues,
    opportunities,
    recommendedActions
  };
};

/**
 * Format currency for Indonesian Rupiah
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format percentage with proper rounding
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};