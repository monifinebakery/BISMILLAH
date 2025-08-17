// utils/debugProfitIntegration.ts - Debug utility untuk monitoring integrasi profit analysis

import { logger } from '@/utils/logger';

interface ProfitIntegrationDebugInfo {
  timestamp: Date;
  period: string;
  revenue: number;
  profit: number;
  isFromProfitAnalysis: boolean;
  cogsSource?: 'wac' | 'inventory' | 'estimated';
  margins?: {
    gross: number;
    net: number;
  };
  rawData?: {
    cogs: number;
    opex: number;
    totalHPP: number;
  };
}

/**
 * 🔍 Log integration status for debugging
 */
export function debugProfitIntegration(info: ProfitIntegrationDebugInfo): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  logger.info('🔄 Profit Integration Debug:', {
    period: info.period,
    timestamp: info.timestamp.toISOString(),
    revenue: `Rp ${info.revenue.toLocaleString('id-ID')}`,
    profit: `Rp ${info.profit.toLocaleString('id-ID')}`,
    isFromProfitAnalysis: info.isFromProfitAnalysis,
    cogsSource: info.cogsSource || 'N/A',
    margins: info.margins ? {
      gross: `${info.margins.gross.toFixed(1)}%`,
      net: `${info.margins.net.toFixed(1)}%`
    } : 'N/A',
    rawData: info.rawData
  });
}

/**
 * 📊 Summary of integration health
 */
export function getProfitIntegrationSummary(stats: any): string {
  const isAccurate = stats.isFromProfitAnalysis;
  const source = stats.profitAnalysisSync?.cogsSource;
  
  if (isAccurate) {
    const sourceLabel = source === 'wac' ? 'WAC (Optimal)' :
                       source === 'inventory' ? 'Inventory (Good)' : 'Estimated (Basic)';
    return `✅ Data akurat dari ${sourceLabel}`;
  }
  
  return `⚠️ Menggunakan estimasi 30% margin`;
}

/**
 * 🎯 Suggestions for improving accuracy
 */
export function getAccuracyImprovementSuggestions(stats: any): string[] {
  const suggestions: string[] = [];
  
  if (!stats.isFromProfitAnalysis) {
    suggestions.push('• Pastikan data stok bahan baku sudah lengkap');
    suggestions.push('• Lengkapi riwayat penggunaan bahan baku');
    suggestions.push('• Verifikasi data biaya operasional');
  } else if (stats.profitAnalysisSync?.cogsSource === 'estimated') {
    suggestions.push('• Update harga bahan baku di gudang');
    suggestions.push('• Catat penggunaan bahan baku secara real-time');
  }
  
  return suggestions;
}
