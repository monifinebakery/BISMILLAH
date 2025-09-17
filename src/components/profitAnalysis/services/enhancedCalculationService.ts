// enhancedCalculationService.ts - Improved profit calculation logic
// ================================================================

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { getCurrentUserId } from '@/utils/authHelpers';
import { normalizeDateForDatabase } from '@/utils/dateNormalization';

// ===== TYPES =====
export interface EnhancedProfitCalculation {
  period: string;
  revenue: {
    total: number;
    categories: Array<{
      name: string;
      amount: number;
      percentage: number;
      transactions: number;
    }>;
    growth: number; // vs previous period
  };
  cogs: {
    total: number;
    wacBased: number; // From WAC calculation
    transactionBased: number; // From actual purchases
    effectiveValue: number; // The one we use
    method: 'wac' | 'transaction' | 'estimated';
    breakdown: Array<{
      itemName: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
      percentage: number;
    }>;
    efficiency: number; // 0-100 score
  };
  opex: {
    total: number;
    fixed: number; // Rent, salaries
    variable: number; // Utilities, supplies
    categories: Array<{
      name: string;
      amount: number;
      isFixed: boolean;
      percentage: number;
    }>;
    perDay: number;
  };
  metrics: {
    grossProfit: number;
    grossMargin: number;
    netProfit: number;
    netMargin: number;
    breakEvenPoint: number; // Revenue needed to break even
    profitPerDay: number;
    profitPerTransaction: number;
  };
  health: {
    score: number; // 0-100
    status: 'excellent' | 'good' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  };
  metadata: {
    calculatedAt: string;
    dataQuality: number; // 0-100
    missingData: string[];
    assumptions: string[];
  };
}

// ===== MAIN SERVICE =====
export class EnhancedCalculationService {
  
  /**
   * Calculate comprehensive profit analysis with validation
   */
  static async calculateEnhancedProfit(
    period: string,
    options: {
      useWAC?: boolean;
      includeForecasting?: boolean;
      validateData?: boolean;
    } = {}
  ): Promise<EnhancedProfitCalculation> {
    const {
      useWAC = true,
      includeForecasting = false,
      validateData = true
    } = options;

    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      logger.info('🔄 Starting enhanced profit calculation for:', period);

      // Parse period (format: YYYY-MM)
      const [year, month] = period.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month

      // 1. Calculate Revenue
      const revenue = await this.calculateRevenue(userId, startDate, endDate);
      
      // 2. Calculate COGS
      const cogs = await this.calculateCOGS(
        userId, 
        startDate, 
        endDate, 
        { useWAC, revenue: revenue.total }
      );
      
      // 3. Calculate OpEx
      const opex = await this.calculateOpEx(userId, startDate, endDate);
      
      // 4. Calculate Metrics
      const metrics = this.calculateMetrics(revenue, cogs, opex);
      
      // 5. Assess Health
      const health = this.assessBusinessHealth(revenue, cogs, opex, metrics);
      
      // 6. Generate Metadata
      const metadata = this.generateMetadata(revenue, cogs, opex, validateData);

      const result: EnhancedProfitCalculation = {
        period,
        revenue,
        cogs,
        opex,
        metrics,
        health,
        metadata
      };

      logger.success('✅ Enhanced profit calculation completed', {
        period,
        netProfit: metrics.netProfit,
        healthScore: health.score
      });

      return result;

    } catch (error) {
      logger.error('❌ Error in enhanced profit calculation:', error);
      throw error;
    }
  }

  /**
   * Calculate revenue with categorization
   */
  private static async calculateRevenue(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ) {
    const startYMD = normalizeDateForDatabase(startDate);
    const endYMD = normalizeDateForDatabase(endDate);

    // Fetch income transactions
    const { data: transactions, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'income')
      .gte('date', startYMD)
      .lte('date', endYMD);

    if (error) throw error;

    // Categorize revenue
    const categories = new Map<string, { amount: number; count: number }>();
    let total = 0;

    (transactions || []).forEach(tx => {
      const category = tx.category || 'Uncategorized';
      const amount = Number(tx.amount) || 0;
      
      total += amount;
      
      const existing = categories.get(category) || { amount: 0, count: 0 };
      categories.set(category, {
        amount: existing.amount + amount,
        count: existing.count + 1
      });
    });

    // Calculate growth (vs previous month)
    const prevMonth = new Date(startDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthStart = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
    const prevMonthEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
    
    const { data: prevTransactions } = await supabase
      .from('financial_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'income')
      .gte('date', normalizeDateForDatabase(prevMonthStart))
      .lte('date', normalizeDateForDatabase(prevMonthEnd));

    const prevTotal = (prevTransactions || []).reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0), 
      0
    );
    
    const growth = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

    return {
      total,
      categories: Array.from(categories.entries()).map(([name, data]) => ({
        name,
        amount: data.amount,
        percentage: (data.amount / total) * 100,
        transactions: data.count
      })).sort((a, b) => b.amount - a.amount),
      growth
    };
  }

  /**
   * Calculate COGS with multiple methods
   */
  private static async calculateCOGS(
    userId: string,
    startDate: Date,
    endDate: Date,
    options: { useWAC: boolean; revenue: number }
  ) {
    const startYMD = normalizeDateForDatabase(startDate);
    const endYMD = normalizeDateForDatabase(endDate);

    let wacBased = 0;
    let transactionBased = 0;
    let breakdown: any[] = [];
    let method: 'wac' | 'transaction' | 'estimated' = 'estimated';

    // Try WAC calculation first
    if (options.useWAC) {
      try {
        const { data: pemakaian } = await supabase
          .from('pemakaian_bahan')
          .select(`
            *,
            bahanbaku:bahan_id (
              nama_bahan,
              harga_per_unit,
              satuan
            )
          `)
          .eq('user_id', userId)
          .gte('tanggal_pemakaian', startYMD)
          .lte('tanggal_pemakaian', endYMD);

        if (pemakaian && pemakaian.length > 0) {
          wacBased = pemakaian.reduce((sum, item) => {
            const quantity = Number(item.jumlah) || 0;
            const unitCost = Number(item.bahanbaku?.harga_per_unit) || 0;
            const totalCost = quantity * unitCost;
            
            breakdown.push({
              itemName: item.bahanbaku?.nama_bahan || 'Unknown',
              quantity,
              unitCost,
              totalCost,
              percentage: 0 // Will calculate after
            });
            
            return sum + totalCost;
          }, 0);
          
          method = 'wac';
        }
      } catch (error) {
        logger.warn('WAC calculation failed, falling back to transaction-based', error);
      }
    }

    // Try transaction-based calculation
    try {
      const { data: purchases } = await supabase
        .from('purchases')
        .select('total_amount')
        .eq('user_id', userId)
        .gte('purchase_date', startYMD)
        .lte('purchase_date', endYMD)
        .eq('status', 'completed');

      if (purchases && purchases.length > 0) {
        transactionBased = purchases.reduce(
          (sum, p) => sum + (Number(p.total_amount) || 0), 
          0
        );
        
        if (method === 'estimated') {
          method = 'transaction';
        }
      }
    } catch (error) {
      logger.warn('Transaction-based COGS calculation failed', error);
    }

    // Determine effective COGS
    let effectiveValue = 0;
    if (method === 'wac' && wacBased > 0) {
      effectiveValue = wacBased;
    } else if (transactionBased > 0) {
      effectiveValue = transactionBased;
      method = 'transaction';
    } else {
      // Estimate based on industry standard (35-40% for F&B)
      effectiveValue = options.revenue * 0.35;
      method = 'estimated';
    }

    // Update percentages in breakdown
    if (effectiveValue > 0) {
      breakdown = breakdown.map(item => ({
        ...item,
        percentage: (item.totalCost / effectiveValue) * 100
      }));
    }

    // Calculate efficiency score (lower COGS ratio = better)
    const cogsRatio = (effectiveValue / options.revenue) * 100;
    const efficiency = Math.max(0, Math.min(100, 
      cogsRatio <= 30 ? 100 :
      cogsRatio <= 40 ? 80 :
      cogsRatio <= 50 ? 60 :
      cogsRatio <= 60 ? 40 : 20
    ));

    return {
      total: effectiveValue,
      wacBased,
      transactionBased,
      effectiveValue,
      method,
      breakdown: breakdown.slice(0, 10), // Top 10 items
      efficiency
    };
  }

  /**
   * Calculate operational expenses
   */
  private static async calculateOpEx(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    const { data: costs, error } = await supabase
      .from('operational_costs')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'aktif');

    if (error) throw error;

    let fixed = 0;
    let variable = 0;
    const categories: any[] = [];

    (costs || []).forEach(cost => {
      const amount = Number(cost.jumlah_per_bulan) || 0;
      const isFixed = ['sewa', 'gaji', 'asuransi'].includes(
        cost.kategori?.toLowerCase() || ''
      );

      if (isFixed) {
        fixed += amount;
      } else {
        variable += amount;
      }

      categories.push({
        name: cost.nama_biaya,
        amount,
        isFixed,
        percentage: 0 // Will calculate after
      });
    });

    const total = fixed + variable;
    
    // Update percentages
    categories.forEach(cat => {
      cat.percentage = total > 0 ? (cat.amount / total) * 100 : 0;
    });

    // Calculate per day
    const daysInMonth = endDate.getDate();
    const perDay = total / daysInMonth;

    return {
      total,
      fixed,
      variable,
      categories: categories.sort((a, b) => b.amount - a.amount),
      perDay
    };
  }

  /**
   * Calculate key metrics
   */
  private static calculateMetrics(revenue: any, cogs: any, opex: any) {
    const grossProfit = revenue.total - cogs.effectiveValue;
    const netProfit = grossProfit - opex.total;
    
    const grossMargin = revenue.total > 0 
      ? (grossProfit / revenue.total) * 100 
      : 0;
    
    const netMargin = revenue.total > 0 
      ? (netProfit / revenue.total) * 100 
      : 0;

    // Break-even calculation
    const fixedCosts = opex.fixed;
    const contributionMargin = revenue.total > 0
      ? (grossProfit / revenue.total)
      : 0;
    const breakEvenPoint = contributionMargin > 0
      ? fixedCosts / contributionMargin
      : 0;

    // Daily profit
    const daysInMonth = 30; // Approximate
    const profitPerDay = netProfit / daysInMonth;

    // Per transaction profit
    const totalTransactions = revenue.categories.reduce(
      (sum: number, cat: any) => sum + cat.transactions, 
      0
    );
    const profitPerTransaction = totalTransactions > 0
      ? netProfit / totalTransactions
      : 0;

    return {
      grossProfit,
      grossMargin,
      netProfit,
      netMargin,
      breakEvenPoint,
      profitPerDay,
      profitPerTransaction
    };
  }

  /**
   * Assess business health
   */
  private static assessBusinessHealth(
    revenue: any,
    cogs: any,
    opex: any,
    metrics: any
  ) {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check gross margin (target: 60-70% for F&B)
    if (metrics.grossMargin < 50) {
      score -= 20;
      issues.push('Margin kotor terlalu rendah');
      recommendations.push('Evaluasi harga jual atau negosiasi ulang dengan supplier');
    } else if (metrics.grossMargin < 60) {
      score -= 10;
      issues.push('Margin kotor perlu ditingkatkan');
      recommendations.push('Optimasi porsi atau cari supplier alternatif');
    }

    // Check net margin (target: 15-20% for F&B)
    if (metrics.netMargin < 5) {
      score -= 25;
      issues.push('Margin bersih sangat rendah');
      recommendations.push('Perlu evaluasi menyeluruh struktur biaya');
    } else if (metrics.netMargin < 10) {
      score -= 15;
      issues.push('Margin bersih belum optimal');
      recommendations.push('Kurangi biaya operasional yang tidak perlu');
    }

    // Check COGS efficiency
    if (cogs.efficiency < 50) {
      score -= 15;
      issues.push('Efisiensi bahan baku rendah');
      recommendations.push('Kontrol porsi dan kurangi waste');
    }

    // Check revenue growth
    if (revenue.growth < 0) {
      score -= 10;
      issues.push('Penjualan menurun dibanding bulan lalu');
      recommendations.push('Tingkatkan marketing atau tambah menu baru');
    }

    // Determine status
    let status: 'excellent' | 'good' | 'warning' | 'critical';
    if (score >= 80) status = 'excellent';
    else if (score >= 60) status = 'good';
    else if (score >= 40) status = 'warning';
    else status = 'critical';

    return {
      score: Math.max(0, score),
      status,
      issues,
      recommendations
    };
  }

  /**
   * Generate metadata
   */
  private static generateMetadata(
    revenue: any,
    cogs: any,
    opex: any,
    validateData: boolean
  ) {
    const missingData: string[] = [];
    const assumptions: string[] = [];
    let dataQuality = 100;

    // Check for missing data
    if (revenue.total === 0) {
      missingData.push('Data penjualan tidak ditemukan');
      dataQuality -= 40;
    }

    if (cogs.method === 'estimated') {
      missingData.push('Data HPP menggunakan estimasi');
      assumptions.push('HPP diestimasi 35% dari revenue (standar F&B)');
      dataQuality -= 20;
    } else if (cogs.method === 'transaction') {
      assumptions.push('HPP berdasarkan transaksi pembelian');
      dataQuality -= 10;
    }

    if (opex.total === 0) {
      missingData.push('Data biaya operasional tidak ditemukan');
      dataQuality -= 30;
    }

    // Add general assumptions
    if (cogs.method === 'wac') {
      assumptions.push('HPP menggunakan metode Weighted Average Cost');
    }

    return {
      calculatedAt: new Date().toISOString(),
      dataQuality: Math.max(0, dataQuality),
      missingData,
      assumptions
    };
  }

  /**
   * Calculate daily breakdown for a period
   */
  static async calculateDailyBreakdown(
    period: string,
    days: number = 7
  ): Promise<Array<EnhancedProfitCalculation>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const [year, month] = period.split('-').map(Number);
      const endDate = new Date(year, month - 1, new Date().getDate());
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - days + 1);

      const results: EnhancedProfitCalculation[] = [];
      
      // Calculate for each day
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayPeriod = normalizeDateForDatabase(d);
        const dayResult = await this.calculateEnhancedProfit(dayPeriod, {
          useWAC: true,
          validateData: false // Skip validation for daily
        });
        results.push(dayResult);
      }

      return results;

    } catch (error) {
      logger.error('Error calculating daily breakdown:', error);
      throw error;
    }
  }

  /**
   * Generate forecast based on historical data
   */
  static async generateForecast(
    historicalMonths: number = 3
  ): Promise<{
    nextMonth: EnhancedProfitCalculation;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    try {
      // Implementation for forecasting
      // This would analyze historical data and project future performance
      
      throw new Error('Forecasting not yet implemented');
      
    } catch (error) {
      logger.error('Error generating forecast:', error);
      throw error;
    }
  }
}

// Export default instance
export default new EnhancedCalculationService();