import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { BusinessType } from './config/profitConfig';

export interface ProfitabilityAlert {
  id: string;
  type: 'margin_drop' | 'cost_spike' | 'revenue_drop' | 'efficiency_decline' | 'cash_flow_warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  value: number;
  threshold: number;
  change: number;
  changePercentage: number;
  timestamp: Date;
  category: 'profitability' | 'cost' | 'efficiency' | 'cash_flow';
  actionRequired: boolean;
  recommendations: string[];
}

export interface AlertThresholds {
  marginDrop: {
    warning: number; // percentage drop
    critical: number;
  };
  costSpike: {
    warning: number; // percentage increase
    critical: number;
  };
  revenueDrop: {
    warning: number; // percentage drop
    critical: number;
  };
  efficiencyDecline: {
    warning: number; // percentage decline
    critical: number;
  };
  cashFlowWarning: {
    warning: number; // days of runway
    critical: number;
  };
}

export interface AlertConfiguration {
  enabled: boolean;
  thresholds: AlertThresholds;
  notificationMethods: ('in_app' | 'email' | 'whatsapp')[];
  businessType: BusinessType;
  customThresholds?: Partial<AlertThresholds>;
}

// Default alert thresholds by business type
export const DEFAULT_ALERT_THRESHOLDS: Record<BusinessType, AlertThresholds> = {
  [BusinessType.FNB_CAFE]: {
    marginDrop: { warning: 10, critical: 20 },
    costSpike: { warning: 15, critical: 25 },
    revenueDrop: { warning: 15, critical: 30 },
    efficiencyDecline: { warning: 10, critical: 20 },
    cashFlowWarning: { warning: 30, critical: 15 }
  },
  [BusinessType.FNB_RESTAURANT]: {
    marginDrop: { warning: 8, critical: 15 },
    costSpike: { warning: 12, critical: 20 },
    revenueDrop: { warning: 12, critical: 25 },
    efficiencyDecline: { warning: 8, critical: 15 },
    cashFlowWarning: { warning: 45, critical: 20 }
  },
  [BusinessType.FNB_FASTFOOD]: {
    marginDrop: { warning: 12, critical: 25 },
    costSpike: { warning: 18, critical: 30 },
    revenueDrop: { warning: 18, critical: 35 },
    efficiencyDecline: { warning: 12, critical: 25 },
    cashFlowWarning: { warning: 20, critical: 10 }
  },
  [BusinessType.FNB_STREETFOOD]: {
    marginDrop: { warning: 15, critical: 30 },
    costSpike: { warning: 20, critical: 35 },
    revenueDrop: { warning: 20, critical: 40 },
    efficiencyDecline: { warning: 15, critical: 30 },
    cashFlowWarning: { warning: 15, critical: 7 }
  },
  [BusinessType.FNB_CATERING]: {
    marginDrop: { warning: 8, critical: 15 },
    costSpike: { warning: 12, critical: 20 },
    revenueDrop: { warning: 15, critical: 30 },
    efficiencyDecline: { warning: 10, critical: 20 },
    cashFlowWarning: { warning: 60, critical: 30 }
  },
  [BusinessType.FNB_BAKERY]: {
    marginDrop: { warning: 10, critical: 18 },
    costSpike: { warning: 15, critical: 25 },
    revenueDrop: { warning: 12, critical: 25 },
    efficiencyDecline: { warning: 10, critical: 18 },
    cashFlowWarning: { warning: 45, critical: 20 }
  },
  [BusinessType.DEFAULT]: {
    marginDrop: { warning: 10, critical: 20 },
    costSpike: { warning: 15, critical: 25 },
    revenueDrop: { warning: 15, critical: 30 },
    efficiencyDecline: { warning: 10, critical: 20 },
    cashFlowWarning: { warning: 30, critical: 15 }
  }
};

// Alert message templates
const ALERT_MESSAGES = {
  margin_drop: {
    title: 'Margin Keuntungan Menurun',
    message: (change: number, current: number) => 
      `Margin keuntungan turun ${Math.abs(change).toFixed(1)}% menjadi ${current.toFixed(1)}%`,
    recommendations: [
      'Review harga jual produk',
      'Analisis kenaikan biaya bahan baku',
      'Optimasi porsi dan resep',
      'Negosiasi ulang dengan supplier'
    ]
  },
  cost_spike: {
    title: 'Lonjakan Biaya Operasional',
    message: (change: number, current: number) => 
      `Biaya operasional naik ${change.toFixed(1)}% menjadi Rp ${current.toLocaleString('id-ID')}`,
    recommendations: [
      'Identifikasi sumber kenaikan biaya',
      'Review kontrak supplier',
      'Optimasi penggunaan bahan baku',
      'Evaluasi efisiensi operasional'
    ]
  },
  revenue_drop: {
    title: 'Penurunan Pendapatan',
    message: (change: number, current: number) => 
      `Pendapatan turun ${Math.abs(change).toFixed(1)}% menjadi Rp ${current.toLocaleString('id-ID')}`,
    recommendations: [
      'Analisis tren penjualan',
      'Review strategi marketing',
      'Evaluasi menu dan harga',
      'Tingkatkan customer engagement'
    ]
  },
  efficiency_decline: {
    title: 'Penurunan Efisiensi',
    message: (change: number, current: number) => 
      `Efisiensi operasional turun ${Math.abs(change).toFixed(1)}% menjadi ${current.toFixed(1)}%`,
    recommendations: [
      'Review proses operasional',
      'Training ulang staff',
      'Optimasi workflow',
      'Evaluasi penggunaan teknologi'
    ]
  },
  cash_flow_warning: {
    title: 'Peringatan Cash Flow',
    message: (change: number, current: number) => 
      `Cash flow tersisa untuk ${current.toFixed(0)} hari operasional`,
    recommendations: [
      'Percepat penagihan piutang',
      'Tunda pembayaran non-urgent',
      'Review credit terms dengan supplier',
      'Pertimbangkan sumber pendanaan tambahan'
    ]
  }
};

export class ProfitabilityAlertsSystem {
  private config: AlertConfiguration;
  private alertHistory: ProfitabilityAlert[] = [];
  private previousData: RealTimeProfitCalculation | null = null;

  constructor(config: AlertConfiguration) {
    this.config = config;
  }

  // Analyze current data and generate alerts
  analyzeAndGenerateAlerts(
    currentData: RealTimeProfitCalculation,
    historicalData?: RealTimeProfitCalculation[]
  ): ProfitabilityAlert[] {
    if (!this.config.enabled) return [];

    const alerts: ProfitabilityAlert[] = [];
    const thresholds = this.getEffectiveThresholds();

    // Check margin drop
    const marginAlerts = this.checkMarginDrop(currentData, thresholds);
    alerts.push(...marginAlerts);

    // Check cost spike
    const costAlerts = this.checkCostSpike(currentData, thresholds);
    alerts.push(...costAlerts);

    // Check revenue drop
    const revenueAlerts = this.checkRevenueDrop(currentData, thresholds);
    alerts.push(...revenueAlerts);

    // Check efficiency decline
    const efficiencyAlerts = this.checkEfficiencyDecline(currentData, thresholds);
    alerts.push(...efficiencyAlerts);

    // Check cash flow warning
    if (historicalData) {
      const cashFlowAlerts = this.checkCashFlowWarning(currentData, historicalData, thresholds);
      alerts.push(...cashFlowAlerts);
    }

    // Store alerts in history
    this.alertHistory.push(...alerts);
    this.previousData = currentData;

    return alerts;
  }

  private getEffectiveThresholds(): AlertThresholds {
    const defaultThresholds = DEFAULT_ALERT_THRESHOLDS[this.config.businessType];
    if (this.config.customThresholds) {
      return {
        ...defaultThresholds,
        ...this.config.customThresholds
      };
    }
    return defaultThresholds;
  }

  private checkMarginDrop(
    currentData: RealTimeProfitCalculation,
    thresholds: AlertThresholds
  ): ProfitabilityAlert[] {
    if (!this.previousData) return [];

    const currentNetProfit = currentData.revenue_data.total - currentData.cogs_data.total - currentData.opex_data.total;
    const previousNetProfit = this.previousData.revenue_data.total - this.previousData.cogs_data.total - this.previousData.opex_data.total;
    const currentMargin = (currentNetProfit / currentData.revenue_data.total) * 100;
    const previousMargin = (previousNetProfit / this.previousData.revenue_data.total) * 100;
    const change = currentMargin - previousMargin;
    const changePercentage = (change / previousMargin) * 100;

    if (Math.abs(changePercentage) >= thresholds.marginDrop.warning && change < 0) {
      const severity = Math.abs(changePercentage) >= thresholds.marginDrop.critical ? 'critical' : 'high';
      const template = ALERT_MESSAGES.margin_drop;
      
      return [{
        id: `margin_drop_${Date.now()}`,
        type: 'margin_drop',
        severity,
        title: template.title,
        message: template.message(changePercentage, currentMargin),
        value: currentMargin,
        threshold: previousMargin,
        change,
        changePercentage,
        timestamp: new Date(),
        category: 'profitability',
        actionRequired: severity === 'critical',
        recommendations: template.recommendations
      }];
    }

    return [];
  }

  private checkCostSpike(
    currentData: RealTimeProfitCalculation,
    thresholds: AlertThresholds
  ): ProfitabilityAlert[] {
    if (!this.previousData) return [];

    const currentCost = currentData.cogs_data.total + currentData.opex_data.total;
    const previousCost = this.previousData.cogs_data.total + this.previousData.opex_data.total;
    const change = currentCost - previousCost;
    const changePercentage = (change / previousCost) * 100;

    if (changePercentage >= thresholds.costSpike.warning) {
      const severity = changePercentage >= thresholds.costSpike.critical ? 'critical' : 'high';
      const template = ALERT_MESSAGES.cost_spike;
      
      return [{
        id: `cost_spike_${Date.now()}`,
        type: 'cost_spike',
        severity,
        title: template.title,
        message: template.message(changePercentage, currentCost),
        value: currentCost,
        threshold: previousCost,
        change,
        changePercentage,
        timestamp: new Date(),
        category: 'cost',
        actionRequired: severity === 'critical',
        recommendations: template.recommendations
      }];
    }

    return [];
  }

  private checkRevenueDrop(
    currentData: RealTimeProfitCalculation,
    thresholds: AlertThresholds
  ): ProfitabilityAlert[] {
    if (!this.previousData) return [];

    const currentRevenue = currentData.revenue_data.total;
    const previousRevenue = this.previousData.revenue_data.total;
    const change = currentRevenue - previousRevenue;
    const changePercentage = (change / previousRevenue) * 100;

    if (Math.abs(changePercentage) >= thresholds.revenueDrop.warning && change < 0) {
      const severity = Math.abs(changePercentage) >= thresholds.revenueDrop.critical ? 'critical' : 'high';
      const template = ALERT_MESSAGES.revenue_drop;
      
      return [{
        id: `revenue_drop_${Date.now()}`,
        type: 'revenue_drop',
        severity,
        title: template.title,
        message: template.message(changePercentage, currentRevenue),
        value: currentRevenue,
        threshold: previousRevenue,
        change,
        changePercentage,
        timestamp: new Date(),
        category: 'profitability',
        actionRequired: severity === 'critical',
        recommendations: template.recommendations
      }];
    }

    return [];
  }

  private checkEfficiencyDecline(
    currentData: RealTimeProfitCalculation,
    thresholds: AlertThresholds
  ): ProfitabilityAlert[] {
    if (!this.previousData) return [];

    // Calculate efficiency as revenue per cost
    const currentEfficiency = currentData.revenue_data.total / (currentData.cogs_data.total + currentData.opex_data.total);
    const previousEfficiency = this.previousData.revenue_data.total / (this.previousData.cogs_data.total + this.previousData.opex_data.total);
    const change = currentEfficiency - previousEfficiency;
    const changePercentage = (change / previousEfficiency) * 100;

    if (Math.abs(changePercentage) >= thresholds.efficiencyDecline.warning && change < 0) {
      const severity = Math.abs(changePercentage) >= thresholds.efficiencyDecline.critical ? 'critical' : 'high';
      const template = ALERT_MESSAGES.efficiency_decline;
      
      return [{
        id: `efficiency_decline_${Date.now()}`,
        type: 'efficiency_decline',
        severity,
        title: template.title,
        message: template.message(changePercentage, currentEfficiency),
        value: currentEfficiency,
        threshold: previousEfficiency,
        change,
        changePercentage,
        timestamp: new Date(),
        category: 'efficiency',
        actionRequired: severity === 'critical',
        recommendations: template.recommendations
      }];
    }

    return [];
  }

  private checkCashFlowWarning(
    currentData: RealTimeProfitCalculation,
    historicalData: RealTimeProfitCalculation[],
    thresholds: AlertThresholds
  ): ProfitabilityAlert[] {
    // Calculate average daily burn rate from historical data
    const dailyBurnRate = this.calculateDailyBurnRate(historicalData);
    const currentNetProfit = currentData.revenue_data.total - currentData.cogs_data.total - currentData.opex_data.total;
    const currentCash = currentNetProfit; // Simplified - should be actual cash balance
    const daysOfRunway = currentCash / dailyBurnRate;

    if (daysOfRunway <= thresholds.cashFlowWarning.warning) {
      const severity = daysOfRunway <= thresholds.cashFlowWarning.critical ? 'critical' : 'high';
      const template = ALERT_MESSAGES.cash_flow_warning;
      
      return [{
        id: `cash_flow_warning_${Date.now()}`,
        type: 'cash_flow_warning',
        severity,
        title: template.title,
        message: template.message(0, daysOfRunway),
        value: daysOfRunway,
        threshold: thresholds.cashFlowWarning.warning,
        change: 0,
        changePercentage: 0,
        timestamp: new Date(),
        category: 'cash_flow',
        actionRequired: severity === 'critical',
        recommendations: template.recommendations
      }];
    }

    return [];
  }

  private calculateDailyBurnRate(historicalData: RealTimeProfitCalculation[]): number {
    if (historicalData.length === 0) return 0;

    const totalCosts = historicalData.reduce((sum, data) => 
      sum + data.cogs_data.total + data.opex_data.total, 0
    );
    
    return totalCosts / historicalData.length;
  }

  // Get recent alerts
  getRecentAlerts(hours: number = 24): ProfitabilityAlert[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alertHistory.filter(alert => alert.timestamp >= cutoffTime);
  }

  // Get alerts by severity
  getAlertsBySeverity(severity: ProfitabilityAlert['severity']): ProfitabilityAlert[] {
    return this.alertHistory.filter(alert => alert.severity === severity);
  }

  // Get alerts by category
  getAlertsByCategory(category: ProfitabilityAlert['category']): ProfitabilityAlert[] {
    return this.alertHistory.filter(alert => alert.category === category);
  }

  // Clear alert history
  clearAlertHistory(): void {
    this.alertHistory = [];
  }

  // Update configuration
  updateConfiguration(config: Partial<AlertConfiguration>): void {
    this.config = { ...this.config, ...config };
  }
}

// Utility functions
export const getAlertIcon = (type: ProfitabilityAlert['type']): string => {
  const icons = {
    margin_drop: '📉',
    cost_spike: '💸',
    revenue_drop: '📊',
    efficiency_decline: '⚡',
    cash_flow_warning: '💰'
  };
  return icons[type] || '⚠️';
};

export const getAlertColor = (severity: ProfitabilityAlert['severity']): string => {
  const colors = {
    low: 'text-blue-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600'
  };
  return colors[severity];
};

export const getAlertBgColor = (severity: ProfitabilityAlert['severity']): string => {
  const colors = {
    low: 'bg-blue-50 border-blue-200',
    medium: 'bg-yellow-50 border-yellow-200',
    high: 'bg-orange-50 border-orange-200',
    critical: 'bg-red-50 border-red-200'
  };
  return colors[severity];
};

export const formatAlertMessage = (alert: ProfitabilityAlert): string => {
  return `${getAlertIcon(alert.type)} ${alert.title}: ${alert.message}`;
};

export const shouldShowNotification = (alert: ProfitabilityAlert): boolean => {
  return alert.severity === 'critical' || alert.actionRequired;
};