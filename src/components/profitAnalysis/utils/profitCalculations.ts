// utils/profitCalculations.ts - Core calculation utilities
// ==============================================

import type { BahanBakuFrontend } from '@/components/warehouse/types';
import type { PemakaianBahan } from '../services/profitAnalysisApi';
import { warehouseUtils } from '@/components/warehouse/services/warehouseUtils';

// ✅ A. Tambah optional harga_efektif di tipe pemakaian
export interface PemakaianBahan {
  bahan_baku_id: string;
  qty_base: number;
  harga_efektif?: number; // dari view (opsional)
}

export function getEffectiveUnitPrice(item: BahanBakuFrontend): number {
  // satu sumber kebenaran: WAC -> harga_satuan -> 0
  return warehouseUtils.getEffectiveUnitPrice(item);
}

// ✅ B. calcHPP gunakan harga_efektif bila tersedia
export function calcHPP(
  pemakaian: PemakaianBahan[],
  bahanMap: Record<string, BahanBakuFrontend>
): { totalHPP: number; breakdown: Array<{ id: string; nama: string; qty: number; price: number; hpp: number }> } {
  let total = 0;
  const breakdown = [];

  // ✅ Versi lengkap blok loop-nya
  for (const row of pemakaian) {
    const bb = bahanMap[row.bahan_baku_id];
    if (!bb) continue;

    // ✅ prefer harga_efektif dari view; fallback ke WAC/harga_satuan
    const price = typeof row?.harga_efektif === 'number'
      ? row.harga_efektif
      : getEffectiveUnitPrice(bb);

    const hpp = Math.round(Number(row.qty_base || 0) * price);

    total += hpp;
    breakdown.push({ 
      id: row.bahan_baku_id, 
      qty: Number(row.qty_base || 0), 
      price, 
      hpp,
      nama: bb.nama || 'Unknown'
    });
  }

  return { totalHPP: Math.round(total), breakdown };
}

export function calculateMargins(revenue: number, cogs: number, opex: number) {
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
}

export function comparePeriods(current: any, previous: any) {
  if (!current || !previous) return { revenueGrowth: 0, profitGrowth: 0, marginChange: 0 };
  
  const currentRevenue = current.revenue_data?.total || 0;
  const previousRevenue = previous.revenue_data?.total || 0;
  const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  
  const currentProfit = (currentRevenue - (current.cogs_data?.total || 0) - (current.opex_data?.total || 0));
  const previousProfit = (previousRevenue - (previous.cogs_data?.total || 0) - (previous.opex_data?.total || 0));
  const profitGrowth = previousProfit !== 0 ? ((currentProfit - previousProfit) / Math.abs(previousProfit)) * 100 : 0;
  
  const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
  const previousMargin = previousRevenue > 0 ? (previousProfit / previousRevenue) * 100 : 0;
  const marginChange = currentMargin - previousMargin;
  
  return { revenueGrowth, profitGrowth, marginChange };
}

export function analyzeCostStructure(costs: any[]) {
  const activeCosts = costs.filter(c => c.status === 'aktif');
  
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
}

export function calculateBreakEvenAnalysis(fixedCosts: number, variableCostPercentage: number, averageSellingPrice?: number) {
  const contributionMarginPercentage = 100 - variableCostPercentage;
  const breakEvenRevenue = contributionMarginPercentage > 0 
    ? (fixedCosts / contributionMarginPercentage) * 100
    : 0;
    
  const breakEvenUnits = averageSellingPrice && averageSellingPrice > 0
    ? breakEvenRevenue / averageSellingPrice
    : 0;
    
  const marginOfSafety = averageSellingPrice && breakEvenUnits > 0
    ? ((averageSellingPrice - breakEvenUnits) / averageSellingPrice) * 100
    : 0;
  
  return {
    breakEvenRevenue,
    breakEvenUnits,
    contributionMarginPercentage,
    marginOfSafety
  };
}

export function validateDataQuality(calculation: any) {
  let score = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  if (calculation.revenue_data?.total <= 0) {
    score -= 30;
    issues.push('Tidak ada data revenue');
    recommendations.push('Tambahkan transaksi pemasukan');
  }
  
  if (calculation.cogs_data?.total <= 0) {
    score -= 20;
    issues.push('Tidak ada data COGS');
    recommendations.push('Tambahkan transaksi pembelian bahan baku');
  }
  
  if (calculation.opex_data?.total <= 0) {
    score -= 20;
    issues.push('Tidak ada data biaya operasional');
    recommendations.push('Konfigurasi biaya operasional');
  }
  
  const revenue = calculation.revenue_data?.total || 0;
  const cogs = calculation.cogs_data?.total || 0;
  const opex = calculation.opex_data?.total || 0;
  
  if (cogs > revenue) {
    score -= 15;
    issues.push('COGS lebih besar dari revenue');
    recommendations.push('Review kategorisasi transaksi');
  }
  
  if (opex > revenue * 0.8) {
    score -= 10;
    issues.push('Biaya operasional terlalu tinggi');
    recommendations.push('Review efisiensi operasional');
  }
  
  return {
    score: Math.max(0, score),
    issues,
    recommendations
  };
}

export function generateExecutiveInsights(calculation: any) {
  const revenue = calculation.revenue_data?.total || 0;
  const cogs = calculation.cogs_data?.total || 0;
  const opex = calculation.opex_data?.total || 0;
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - opex;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  
  const keyHighlights: string[] = [];
  const criticalIssues: string[] = [];
  const opportunities: string[] = [];
  const recommendations: string[] = [];
  
  if (revenue > 0) {
    keyHighlights.push(`Revenue: ${formatCurrency(revenue)}`);
  } else {
    criticalIssues.push('Tidak ada revenue dalam periode ini');
    recommendations.push('Fokus pada aktivitas penjualan dan marketing');
  }
  
  if (grossMargin >= 50) {
    keyHighlights.push(`Gross margin sangat baik: ${grossMargin.toFixed(1)}%`);
  } else if (grossMargin >= 30) {
    keyHighlights.push(`Gross margin sehat: ${grossMargin.toFixed(1)}%`);
  } else if (grossMargin >= 15) {
    opportunities.push(`Gross margin dapat ditingkatkan dari ${grossMargin.toFixed(1)}%`);
    recommendations.push('Review harga jual dan efisiensi produksi');
  } else {
    criticalIssues.push(`Gross margin rendah: ${grossMargin.toFixed(1)}%`);
    recommendations.push('Urgent: optimasi COGS dan review pricing strategy');
  }
  
  if (netMargin >= 20) {
    keyHighlights.push(`Net margin excellent: ${netMargin.toFixed(1)}%`);
  } else if (netMargin >= 10) {
    keyHighlights.push(`Net margin baik: ${netMargin.toFixed(1)}%`);
  } else if (netMargin >= 5) {
    opportunities.push(`Net margin dapat ditingkatkan dari ${netMargin.toFixed(1)}%`);
    recommendations.push('Optimasi biaya operasional');
  } else if (netMargin < 0) {
    criticalIssues.push(`Bisnis mengalami kerugian: ${netMargin.toFixed(1)}%`);
    recommendations.push('Action plan recovery: reduce costs, increase sales');
  } else {
    criticalIssues.push(`Net margin sangat rendah: ${netMargin.toFixed(1)}%`);
    recommendations.push('Review struktur biaya dan strategi pricing');
  }
  
  const cogsPercentage = revenue > 0 ? (cogs / revenue) * 100 : 0;
  const opexPercentage = revenue > 0 ? (opex / revenue) * 100 : 0;
  
  if (cogsPercentage > 70) {
    criticalIssues.push(`COGS terlalu tinggi: ${cogsPercentage.toFixed(1)}% dari revenue`);
    recommendations.push('Review supplier dan proses produksi');
  } else if (cogsPercentage > 50) {
    opportunities.push(`COGS dapat dioptimasi: ${cogsPercentage.toFixed(1)}% dari revenue`);
  }
  
  if (opexPercentage > 40) {
    criticalIssues.push(`Biaya operasional tinggi: ${opexPercentage.toFixed(1)}% dari revenue`);
    recommendations.push('Audit dan streamline operasional expenses');
  } else if (opexPercentage > 25) {
    opportunities.push(`Efisiensi operasional dapat ditingkatkan: ${opexPercentage.toFixed(1)}%`);
  }
  
  return {
    keyHighlights,
    criticalIssues,
    opportunities,
    recommendations
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
}

export function formatStockLevel(current: number, minimum: number): {
  level: 'high' | 'medium' | 'low' | 'out';
  percentage: number;
  color: string;
} {
  if (current === 0) {
    return { level: 'out', percentage: 0, color: 'red' };
  }

  const percentage = (current / (minimum * 2)) * 100;

  if (current <= minimum) {
    return { level: 'low', percentage, color: 'red' };
  } else if (current <= minimum * 1.5) {
    return { level: 'medium', percentage, color: 'yellow' };
  } else {
    return { level: 'high', percentage, color: 'green' };
  }
}

export function calculateRollingAverages(history: any[], windowSize: number = 3) {
  if (!history || history.length === 0) {
    return { revenueAverage: 0, profitAverage: 0, marginAverage: 0, volatility: 0 };
  }

  const recent = history.slice(-windowSize);
  const revenueSum = recent.reduce((sum, h) => sum + (h.revenue_data?.total || 0), 0);
  const profitSum = recent.reduce((sum, h) => {
    const revenue = h.revenue_data?.total || 0;
    const cogs = h.cogs_data?.total || 0;
    const opex = h.opex_data?.total || 0;
    return sum + (revenue - cogs - opex);
  }, 0);

  const revenueAverage = revenueSum / recent.length;
  const profitAverage = profitSum / recent.length;
  
  const margins = recent.map(h => {
    const revenue = h.revenue_data?.total || 0;
    const cogs = h.cogs_data?.total || 0;
    const opex = h.opex_data?.total || 0;
    const profit = revenue - cogs - opex;
    return revenue > 0 ? (profit / revenue) * 100 : 0;
  });
  
  const marginAverage = margins.reduce((sum, m) => sum + m, 0) / margins.length;
  
  // Calculate volatility (standard deviation of margins)
  const variance = margins.reduce((sum, m) => sum + Math.pow(m - marginAverage, 2), 0) / margins.length;
  const volatility = Math.sqrt(variance);

  return { revenueAverage, profitAverage, marginAverage, volatility };
}

export function validateDataIntegrity(data: any) {
  const issues: string[] = [];
  
  if (!data || typeof data !== 'object') {
    issues.push('Data tidak valid');
    return { isValid: false, issues };
  }
  
  if (data.revenue_data && typeof data.revenue_data.total !== 'number') {
    issues.push('Revenue data tidak valid');
  }
  
  if (data.cogs_data && typeof data.cogs_data.total !== 'number') {
    issues.push('COGS data tidak valid');
  }
  
  if (data.opex_data && typeof data.opex_data.total !== 'number') {
    issues.push('OPEX data tidak valid');
  }
  
  return { isValid: issues.length === 0, issues };
}

export function generatePeriodOptions(startYear: number, endYear: number) {
  const periods = [];
  const now = new Date();
  
  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      if (year === endYear && month > now.getMonth() + 1) break;
      
      const period = `${year}-${month.toString().padStart(2, '0')}`;
      const label = `${new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
      
      periods.push({ value: period, label });
    }
  }
  
  return periods.reverse();
}

export function getCurrentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

export function getShortPeriodLabel(period: string) {
  if (!period) return 'Unknown';
  
  const [year, month] = period.split('-');
  if (!year || !month) return period;
  
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  
  const monthIndex = parseInt(month) - 1;
  if (monthIndex < 0 || monthIndex >= monthNames.length) return period;
  
  return `${monthNames[monthIndex]} ${year}`;
}

export function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function getGrowthStatus(value: number): { status: 'positive' | 'negative' | 'neutral'; icon: string } {
  if (value > 0) return { status: 'positive', icon: '↑' };
  if (value < 0) return { status: 'negative', icon: '↓' };
  return { status: 'neutral', icon: '→' };
}

export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function validateFinancialData(data: any) {
  const errors: string[] = [];
  
  if (!data.revenue_data?.total || data.revenue_data.total <= 0) {
    errors.push('Revenue harus lebih besar dari 0');
  }
  
  if (!data.cogs_data?.total || data.cogs_data.total < 0) {
    errors.push('COGS tidak boleh negatif');
  }
  
  if (!data.opex_data?.total || data.opex_data.total < 0) {
    errors.push('OPEX tidak boleh negatif');
  }
  
  const revenue = data.revenue_data?.total || 0;
  const cogs = data.cogs_data?.total || 0;
  const opex = data.opex_data?.total || 0;
  
  if (cogs > revenue * 1.5) {
    errors.push('COGS terlalu tinggi dibanding revenue');
  }
  
  if (opex > revenue * 2) {
    errors.push('OPEX terlalu tinggi dibanding revenue');
  }
  
  return { isValid: errors.length === 0, errors };
}

export function generateFinancialReport(data: any) {
  const revenue = data.revenue_data?.total || 0;
  const cogs = data.cogs_data?.total || 0;
  const opex = data.opex_data?.total || 0;
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - opex;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  
  return {
    summary: {
      revenue,
      cogs,
      opex,
      grossProfit,
      netProfit,
      grossMargin,
      netMargin
    },
    breakdown: {
      revenue: data.revenue_data?.transactions || [],
      cogs: data.cogs_data?.materials || [],
      opex: data.opex_data?.costs || []
    },
    metrics: {
      profitability: netProfit > 0 ? 'profitable' : 'loss',
      efficiency: grossMargin > 30 ? 'efficient' : 'inefficient',
      sustainability: netMargin > 10 ? 'sustainable' : 'unsustainable'
    }
  };
}