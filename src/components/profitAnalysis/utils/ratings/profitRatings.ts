// src/components/profitAnalysis/utils/ratings/profitRatings.ts
// Profit rating utilities

import { PROFIT_CONSTANTS, FNB_THRESHOLDS, FNB_LABELS } from '../../constants/profitConstants';

/**
 * Get margin rating based on industry standards
 */
export const getMarginRating = (margin: number, type: 'gross' | 'net'): string => {
  const fnbThresholds = FNB_THRESHOLDS.MARGIN_TARGETS;
  const fallbackThresholds = PROFIT_CONSTANTS.MARGIN_THRESHOLDS;
  
  // Use F&B specific thresholds if available
  if (fnbThresholds) {
    if (type === 'gross') {
      if (margin >= fnbThresholds.gross.excellent) return 'excellent';
      if (margin >= fnbThresholds.gross.good) return 'good';
      if (margin >= fnbThresholds.gross.fair) return 'fair';
      return 'poor';
    } else {
      if (margin >= fnbThresholds.net.excellent) return 'excellent';
      if (margin >= fnbThresholds.net.good) return 'good';
      if (margin >= fnbThresholds.net.fair) return 'fair';
      return 'poor';
    }
  }
  
  // Fallback to general thresholds
  if (type === 'gross') {
    if (margin >= fallbackThresholds.GROSS_MARGIN_EXCELLENT) return 'excellent';
    if (margin >= fallbackThresholds.GROSS_MARGIN_GOOD) return 'good';
    if (margin >= fallbackThresholds.GROSS_MARGIN_FAIR) return 'fair';
    return 'poor';
  } else {
    if (margin >= fallbackThresholds.NET_MARGIN_EXCELLENT) return 'excellent';
    if (margin >= fallbackThresholds.NET_MARGIN_GOOD) return 'good';
    if (margin >= fallbackThresholds.NET_MARGIN_FAIR) return 'fair';
    return 'poor';
  }
};

/**
 * Get COGS efficiency rating
 */
export const getCOGSEfficiencyRating = (cogsRatio: number): string => {
  if (cogsRatio <= FNB_THRESHOLDS.COGS_RATIOS.EXCELLENT) return 'excellent';
  if (cogsRatio <= FNB_THRESHOLDS.COGS_RATIOS.GOOD) return 'good';
  if (cogsRatio <= FNB_THRESHOLDS.COGS_RATIOS.FAIR) return 'fair';
  return 'poor';
};