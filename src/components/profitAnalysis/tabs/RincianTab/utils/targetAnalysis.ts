// src/components/profitAnalysis/tabs/RincianTab/utils/targetAnalysis.ts

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { STATUS_COLORS } from '../constants/colors';

export type TargetStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
export type TargetColor = keyof typeof STATUS_COLORS;

export interface TargetAnalysisResult {
  status: TargetStatus;
  color: TargetColor;
  icon: any;
  message: string;
}

export const getTargetStatus = (actual: number, target: number): TargetAnalysisResult => {
  const difference = actual - target;
  const percentageDiff = target > 0 ? (difference / target) * 100 : 0;
  
  // For cost ratios, lower is better
  if (difference <= 0) {
    if (percentageDiff <= -20) {
      return {
        status: 'excellent',
        color: 'excellent',
        icon: CheckCircle,
        message: 'Sangat baik - jauh di bawah target'
      };
    } else {
      return {
        status: 'good',
        color: 'good',
        icon: CheckCircle,
        message: 'Baik - di bawah target'
      };
    }
  } else {
    if (percentageDiff <= 10) {
      return {
        status: 'fair',
        color: 'fair',
        icon: AlertTriangle,
        message: 'Cukup - sedikit di atas target'
      };
    } else if (percentageDiff <= 25) {
      return {
        status: 'poor',
        color: 'poor',
        icon: AlertTriangle,
        message: 'Rendah - di atas target'
      };
    } else {
      return {
        status: 'critical',
        color: 'critical',
        icon: XCircle,
        message: 'Kritis - jauh di atas target'
      };
    }
  }
};

export const getStatusColors = (colorKey: TargetColor) => {
  return STATUS_COLORS[colorKey] || STATUS_COLORS.fair;
};

export const analyzeCostStructure = (costAnalysis: any) => {
  // Mock implementation for now
  return {
    material: getTargetStatus(costAnalysis?.materialRatio || 0, 40),
    labor: getTargetStatus(costAnalysis?.laborRatio || 0, 20),
    cogs: getTargetStatus(costAnalysis?.cogsRatio || 0, 60),
    opex: getTargetStatus(costAnalysis?.opexRatio || 0, 25),
    overall: {
      healthScore: 75,
      criticalIssues: []
    }
  };
};

export const calculateHealthScore = (costAnalysis: any): number => {
  if (!costAnalysis) return 0;
  
  let score = 100;
  
  // Deduct points for high ratios
  if (costAnalysis.materialRatio > 40) score -= (costAnalysis.materialRatio - 40) * 2;
  if (costAnalysis.laborRatio > 20) score -= (costAnalysis.laborRatio - 20) * 3;
  if (costAnalysis.cogsRatio > 60) score -= (costAnalysis.cogsRatio - 60) * 1.5;
  if (costAnalysis.opexRatio > 25) score -= (costAnalysis.opexRatio - 25) * 2;
  
  return Math.max(0, Math.min(100, score));
};

export const getCriticalIssues = (costAnalysis: any): Array<{name: string, severity: string}> => {
  const issues = [];
  
  if (costAnalysis?.materialRatio > 50) {
    issues.push({ name: 'Material Cost High', severity: 'critical' });
  }
  if (costAnalysis?.laborRatio > 30) {
    issues.push({ name: 'Labor Cost High', severity: 'warning' });
  }
  if (costAnalysis?.opexRatio > 35) {
    issues.push({ name: 'OPEX High', severity: 'critical' });
  }
  
  return issues;
};

export const generateRecommendations = (costAnalysis: any, dataSource: string): Array<{
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}> => {
  const recommendations = [];
  
  if (costAnalysis?.materialRatio > 40) {
    recommendations.push({
      priority: 'high' as const,
      title: 'Optimalisasi Biaya Material',
      description: 'Review supplier dan negosiasi harga untuk mengurangi biaya material'
    });
  }
  
  if (dataSource === 'estimated') {
    recommendations.push({
      priority: 'medium' as const,
      title: 'Tingkatkan Akurasi Data',
      description: 'Implementasikan material usage tracking untuk data yang lebih akurat'
    });
  }
  
  return recommendations;
};