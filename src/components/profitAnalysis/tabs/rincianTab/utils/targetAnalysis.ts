// src/components/profitAnalysis/tabs/rincianTab/utils/targetAnalysis.ts

import { CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { COST_TARGETS } from '../constants/targets';
import { STATUS_COLORS } from '../constants/colors';

export type TargetStatus = 'on-target' | 'above-target' | 'below-target';
export type TargetColor = 'green' | 'blue' | 'red';

export interface TargetAnalysisResult {
  status: TargetStatus;
  color: TargetColor;
  icon: typeof CheckCircle;
  variance: number;
  variancePercent: number;
  message: string;
}

/**
 * Analyze target status based on actual vs target values
 */
export const getTargetStatus = (
  actual: number, 
  target: number, 
  isPercentage: boolean = true
): TargetAnalysisResult => {
  const diff = actual - target;
  const threshold = isPercentage ? COST_TARGETS.PERCENTAGE_THRESHOLD : target * COST_TARGETS.RATIO_THRESHOLD;
  
  let status: TargetStatus;
  let color: TargetColor;
  let icon: typeof CheckCircle;
  let message: string;
  
  if (Math.abs(diff) <= threshold) {
    status = 'on-target';
    color = 'green';
    icon = CheckCircle;
    message = 'Dalam target yang optimal';
  } else if (diff > threshold) {
    status = 'above-target';
    color = 'red';
    icon = TrendingUp;
    message = 'Melebihi target, perlu optimisasi';
  } else {
    status = 'below-target';
    color = 'blue';
    icon = TrendingDown;
    message = 'Di bawah target';
  }

  const variancePercent = target !== 0 ? (diff / target) * 100 : 0;

  return {
    status,
    color,
    icon,
    variance: diff,
    variancePercent,
    message
  };
};

/**
 * Get status colors based on target analysis
 */
export const getStatusColors = (color: TargetColor) => {
  switch (color) {
    case 'green':
      return STATUS_COLORS.GREEN;
    case 'blue':
      return STATUS_COLORS.BLUE;
    case 'red':
      return STATUS_COLORS.RED;
    default:
      return STATUS_COLORS.GRAY;
  }
};

/**
 * Analyze cost structure health
 */
export const analyzeCostStructure = (costAnalysis: {
  materialRatio: number;
  laborRatio: number;
  cogsRatio: number;
  opexRatio: number;
}) => {
  const materialStatus = getTargetStatus(costAnalysis.materialRatio, COST_TARGETS.MATERIAL_RATIO_TARGET);
  const laborStatus = getTargetStatus(costAnalysis.laborRatio, COST_TARGETS.LABOR_RATIO_TARGET);
  const cogsStatus = getTargetStatus(costAnalysis.cogsRatio, COST_TARGETS.COGS_RATIO_TARGET);
  const opexStatus = getTargetStatus(costAnalysis.opexRatio, COST_TARGETS.OPEX_RATIO_TARGET);

  return {
    material: materialStatus,
    labor: laborStatus,
    cogs: cogsStatus,
    opex: opexStatus,
    overall: {
      healthScore: calculateHealthScore([materialStatus, laborStatus, cogsStatus, opexStatus]),
      criticalIssues: getCriticalIssues([
        { name: 'Material', status: materialStatus, actual: costAnalysis.materialRatio },
        { name: 'Labor', status: laborStatus, actual: costAnalysis.laborRatio },
        { name: 'COGS', status: cogsStatus, actual: costAnalysis.cogsRatio },
        { name: 'OPEX', status: opexStatus, actual: costAnalysis.opexRatio }
      ])
    }
  };
};

/**
 * Calculate overall health score (0-100)
 */
export const calculateHealthScore = (statuses: TargetAnalysisResult[]): number => {
  const scores = statuses.map(status => {
    switch (status.status) {
      case 'on-target': return 100;
      case 'below-target': return 75;
      case 'above-target': return Math.max(0, 50 - Math.abs(status.variancePercent));
      default: return 0;
    }
  });
  
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
};

/**
 * Get critical issues that need immediate attention
 */
export const getCriticalIssues = (analyses: Array<{
  name: string;
  status: TargetAnalysisResult;
  actual: number;
}>): Array<{
  name: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  priority: number;
}> => {
  const issues = analyses
    .filter(analysis => analysis.status.status !== 'on-target')
    .map(analysis => {
      let severity: 'critical' | 'warning' | 'info';
      let priority: number;
      
      if (Math.abs(analysis.status.variancePercent) > 20) {
        severity = 'critical';
        priority = 1;
      } else if (Math.abs(analysis.status.variancePercent) > 10) {
        severity = 'warning';
        priority = 2;
      } else {
        severity = 'info';
        priority = 3;
      }

      return {
        name: analysis.name,
        severity,
        message: `${analysis.name}: ${analysis.actual.toFixed(1)}% (${analysis.status.variancePercent > 0 ? '+' : ''}${analysis.status.variancePercent.toFixed(1)}%)`,
        priority
      };
    })
    .sort((a, b) => a.priority - b.priority);

  return issues;
};

/**
 * Generate recommendations based on target analysis
 */
export const generateRecommendations = (
  costAnalysis: {
    materialRatio: number;
    laborRatio: number;
    cogsRatio: number;
    opexRatio: number;
  },
  dataSource: string
): Array<{
  type: 'material' | 'labor' | 'opex' | 'data' | 'general';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
}> => {
  const recommendations = [];

  // Material optimization
  if (costAnalysis.materialRatio > COST_TARGETS.MATERIAL_RATIO_TARGET + 5) {
    recommendations.push({
      type: 'material' as const,
      priority: 'high' as const,
      title: 'Optimisasi Material Cost',
      description: 'Review kontrak supplier dan implementasi bulk purchasing untuk material utama',
      impact: `Potensi penghematan ${(costAnalysis.materialRatio - COST_TARGETS.MATERIAL_RATIO_TARGET).toFixed(1)}% dari revenue`
    });
  }

  // Labor efficiency
  if (costAnalysis.laborRatio > COST_TARGETS.LABOR_RATIO_TARGET + 3) {
    recommendations.push({
      type: 'labor' as const,
      priority: 'high' as const,
      title: 'Peningkatan Efisiensi Tenaga Kerja',
      description: 'Evaluasi produktivitas dan implementasi otomasi untuk proses repetitif',
      impact: `Target penghematan ${(costAnalysis.laborRatio - COST_TARGETS.LABOR_RATIO_TARGET).toFixed(1)}% dari revenue`
    });
  }

  // OPEX control
  if (costAnalysis.opexRatio > COST_TARGETS.OPEX_RATIO_TARGET + 3) {
    recommendations.push({
      type: 'opex' as const,
      priority: 'medium' as const,
      title: 'Kontrol Biaya Operasional',
      description: 'Review dan eliminasi biaya operasional yang tidak memberikan value added',
      impact: `Target pengurangan ${(costAnalysis.opexRatio - COST_TARGETS.OPEX_RATIO_TARGET).toFixed(1)}% dari revenue`
    });
  }

  // Data quality improvement
  if (dataSource !== 'actual') {
    recommendations.push({
      type: 'data' as const,
      priority: 'medium' as const,
      title: 'Upgrade Kualitas Data',
      description: 'Implementasi material usage tracking dan cost recording yang lebih akurat',
      impact: 'Meningkatkan akurasi analisis dan decision making hingga 25%'
    });
  }

  // General optimization if overall performance is good
  if (costAnalysis.cogsRatio <= COST_TARGETS.COGS_RATIO_TARGET && costAnalysis.opexRatio <= COST_TARGETS.OPEX_RATIO_TARGET) {
    recommendations.push({
      type: 'general' as const,
      priority: 'low' as const,
      title: 'Optimisasi Lanjutan',
      description: 'Focus pada continuous improvement dan benchmarking dengan industry best practices',
      impact: 'Potensi peningkatan margin 1-3% melalui fine-tuning processes'
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};