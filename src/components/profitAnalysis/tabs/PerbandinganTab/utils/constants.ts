// src/components/profitAnalysis/tabs/PerbandinganTab/utils/constants.ts

import { IndustryBenchmarks } from '../types';

export const PROFIT_MARGIN_THRESHOLDS: IndustryBenchmarks = {
  grossMargin: {
    excellent: 30,
    good: 25,
    acceptable: 20,
    poor: 15
  },
  netMargin: {
    excellent: 15,
    good: 12,
    acceptable: 8,
    poor: 5
  }
};

export const INDUSTRY_TARGETS = {
  materialCost: 40,
  laborCost: 15,
  totalCOGS: 70,
  opex: 20
};

export const IMPROVEMENT_RATES = {
  materialOptimization: 0.15,
  laborEfficiency: 0.08,
  cogsReduction: 0.1,
  opexReduction: 0.1,
  dataAccuracyGain: 0.02
};