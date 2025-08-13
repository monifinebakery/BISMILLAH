// src/components/profitAnalysis/tabs/PerbandinganTab/utils/statusHelpers.ts

import { StatusResult, MarginThresholds } from '../types';
import { PROFIT_MARGIN_THRESHOLDS } from './constants';

export const getMarginStatus = (margin: number, type: 'gross' | 'net'): StatusResult => {
  const benchmarks: MarginThresholds = PROFIT_MARGIN_THRESHOLDS[type === 'gross' ? 'grossMargin' : 'netMargin'];
  
  if (margin >= benchmarks.excellent) 
    return { status: 'Sangat Baik', color: 'green', description: 'Performa excellent' };
  if (margin >= benchmarks.good) 
    return { status: 'Baik', color: 'blue', description: 'Di atas rata-rata' };
  if (margin >= benchmarks.acceptable) 
    return { status: 'Cukup', color: 'yellow', description: 'Memenuhi minimum' };
  if (margin >= benchmarks.poor) 
    return { status: 'Perlu Perbaikan', color: 'orange', description: 'Di bawah standar' };
  return { status: 'Kritis', color: 'red', description: 'Perlu tindakan segera' };
};

export const getRatioStatus = (current: number, target: number, inverse: boolean = false): StatusResult => {
  const diff = inverse ? target - current : current - target;
  if (diff <= -5) return { status: 'Sangat Efisien', color: 'green', description: 'Rasio sangat baik' };
  if (diff <= 0) return { status: 'Efisien', color: 'blue', description: 'Rasio sesuai target' };
  if (diff <= 5) return { status: 'Cukup', color: 'yellow', description: 'Rasio sedikit di atas target' };
  return { status: 'Perlu Optimasi', color: 'orange', description: 'Rasio melebihi target' };
};

export const getBadgeVariant = (color: StatusResult['color']) => {
  switch (color) {
    case 'green': return 'default';
    case 'blue': return 'secondary';
    case 'yellow': return 'secondary';
    case 'orange': return 'destructive';
    case 'red': return 'destructive';
    default: return 'secondary';
  }
};