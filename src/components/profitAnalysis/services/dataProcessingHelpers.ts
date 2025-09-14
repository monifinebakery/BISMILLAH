// ==============================================
// DATA PROCESSING HELPERS
// Functions for parsing data, period generation, and data quality assessment
// ==============================================

import { logger } from '@/utils/logger';
import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { FNB_THRESHOLDS } from '../constants/profitConstants';

/**
 * 🍽️ Parse F&B revenue transactions from JSONB with category mapping
 */
export const parseTransactions = (transactionsJson: any): any[] => {
  try {
    if (!transactionsJson) return [];
    const transactions = Array.isArray(transactionsJson) ? transactionsJson : JSON.parse(transactionsJson);
    
    return transactions.map((t: any) => {
      let category = t.category || 'Uncategorized';
      
      // 🍽️ Map to F&B friendly categories
      const categoryMapping: Record<string, string> = {
        'Penjualan': 'Penjualan Makanan',
        'Sales': 'Penjualan Makanan', 
        'Food Sales': 'Penjualan Makanan',
        'Beverage Sales': 'Penjualan Minuman',
        'Minuman': 'Penjualan Minuman',
        'Catering': 'Paket Catering',
        'Delivery': 'Delivery/Ojol',
        'Event': 'Event & Acara'
      };
      
      category = categoryMapping[category] || category;
      
      return {
        category,
        amount: Number(t.amount) || 0,
        description: t.description || '',
        date: t.date
      };
    });
  } catch (error) {
    logger.warn('Error parsing transactions JSON:', error);
    return [];
  }
};

/**
 * Parse COGS transactions from JSONB
 */
export const parseCOGSTransactions = (transactionsJson: any): any[] => {
  try {
    if (!transactionsJson) return [];
    const transactions = Array.isArray(transactionsJson) ? transactionsJson : JSON.parse(transactionsJson);
    return transactions.map((t: any) => ({
      name: t.description || t.category || 'Material Cost',
      cost: Number(t.amount) || 0,
      category: t.category || 'Direct Material'
    }));
  } catch (error) {
    logger.warn('Error parsing COGS transactions JSON:', error);
    return [];
  }
};

/**
 * 🏪 Parse F&B operational costs from JSONB with friendly names
 */
export const parseOpExCosts = (costsJson: any): any[] => {
  try {
    if (!costsJson) return [];
    const costs = Array.isArray(costsJson) ? costsJson : JSON.parse(costsJson);
    
    return costs.map((c: any) => {
      let friendlyName = c.name || c.nama_biaya;
      
      // 🏪 Map to F&B friendly operational cost names
      const nameMapping: Record<string, string> = {
        'Gaji': 'Gaji Karyawan',
        'Salary': 'Gaji Karyawan',
        'Rent': 'Sewa Tempat', 
        'Sewa': 'Sewa Tempat',
        'Electricity': 'Listrik & Air',
        'Listrik': 'Listrik & Air',
        'Water': 'Listrik & Air',
        'Air': 'Listrik & Air',
        'Marketing': 'Promosi & Iklan',
        'Advertising': 'Promosi & Iklan',
        'Promosi': 'Promosi & Iklan'
      };
      
      // Find mapping
      const mappedName = Object.keys(nameMapping).find(key => 
        friendlyName.toLowerCase().includes(key.toLowerCase())
      );
      
      if (mappedName) {
        friendlyName = nameMapping[mappedName];
      }
      
      return {
        nama_biaya: friendlyName,
        monthly_amount: Number(c.monthly_amount ?? c.amount) || 0,
        jenis: c.type || 'tetap',
        cost_category: c.category || 'general'
      };
    });
  } catch (error) {
    logger.warn('Error parsing OpEx costs JSON:', error);
    return [];
  }
};

/**
 * 🍽️ Assess data quality with F&B specific thresholds
 */
export const assessDataQuality = (calculation: RealTimeProfitCalculation): {
  score: number;
  issues: string[];
  recommendations: string[];
} => {
  let score = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check revenue data with F&B context
  if (calculation.revenue_data.total <= 0) {
    score -= 30;
    issues.push('💰 Tidak ada data omset');
    recommendations.push('🏋️ Catat semua penjualan makanan dan minuman');
  }
  
  // Check COGS data
  if (calculation.cogs_data.total <= 0) {
    score -= 20;
    issues.push('🥘 Tidak ada data modal bahan baku');
    recommendations.push('📝 Catat pembelian semua bahan: sayur, daging, bumbu, dll');
  }
  
  // Check OpEx data
  if (calculation.opex_data.total <= 0) {
    score -= 20;
    issues.push('🏪 Tidak ada data biaya bulanan tetap');
    recommendations.push('⚙️ Set biaya rutin: sewa, listrik, gaji karyawan');
  }
  
  // F&B business logic validation
  const revenue = calculation.revenue_data.total;
  const cogs = calculation.cogs_data.total;
  const opex = calculation.opex_data.total;
  const cogsRatio = revenue > 0 ? cogs / revenue : 0;
  
  // Use F&B specific thresholds
  if (cogs > revenue) {
    score -= 15;
    issues.push('⚠️ Modal bahan baku lebih besar dari omset (tidak wajar)');
    recommendations.push('🔍 Cek pencatatan: apakah ada yang salah kategori?');
  }
  
  if (cogsRatio > FNB_THRESHOLDS.ALERTS.high_ingredient_cost) {
    score -= 10;
    issues.push(`🥘 Modal bahan baku terlalu tinggi (${(cogsRatio * 100).toFixed(1)}% dari omset)`);
    recommendations.push('📊 Review supplier dan porsi menu');
  }
  
  if (opex > revenue * 0.3) { // F&B specific: OpEx shouldn't exceed 30% of revenue
    score -= 10;
    issues.push('🏪 Biaya bulanan tetap terlalu tinggi untuk warung F&B');
    recommendations.push('💰 Cari cara hemat listrik, sewa, atau gaji');
  }
  
  // Low revenue warning for F&B
  if (revenue > 0 && revenue < FNB_THRESHOLDS.ALERTS.low_revenue) {
    score -= 5;
    issues.push('📋 Omset masih di bawah rata-rata warung yang sehat');
    recommendations.push('🚀 Fokus promosi dan tambah jam buka');
  }
  
  return {
    score: Math.max(0, score),
    issues,
    recommendations
  };
};

/**
 * Generate period strings based on date range
 */
export const generatePeriods = (from: Date, to: Date, periodType: 'monthly' | 'quarterly' | 'yearly'): string[] => {
  const periods: string[] = [];
  const current = new Date(from);
  const end = new Date(to);

  while (current <= end) {
    if (periodType === 'monthly') {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      periods.push(`${year}-${month}`); // YYYY-MM
      current.setMonth(current.getMonth() + 1);
    } else if (periodType === 'quarterly') {
      const quarter = Math.floor(current.getMonth() / 3) + 1;
      periods.push(`${current.getFullYear()}-Q${quarter}`);
      current.setMonth(current.getMonth() + 3);
    } else if (periodType === 'yearly') {
      periods.push(current.getFullYear().toString());
      current.setFullYear(current.getFullYear() + 1);
    }
  }

  return periods;
};

/**
 * Convert a period string (e.g., 2024-05, 2024-Q1, 2024) into a date range
 */
export const getDateRangeFromPeriod = (period: string): { from: Date; to: Date } => {
  if (period.includes('-Q')) {
    const [yearStr, quarterStr] = period.split('-Q');
    const year = Number(yearStr);
    const quarter = Number(quarterStr);
    const startMonth = (quarter - 1) * 3;
    const from = new Date(year, startMonth, 1);
    const to = new Date(year, startMonth + 3, 0);
    return { from, to };
  }

  if (period.length === 7) {
    const [yearStr, monthStr] = period.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1;
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0);
    return { from, to };
  }

  const year = Number(period);
  const from = new Date(year, 0, 1);
  const to = new Date(year, 11, 31);
  return { from, to };
};
