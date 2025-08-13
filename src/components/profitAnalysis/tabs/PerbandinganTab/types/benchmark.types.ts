// src/components/profitAnalysis/tabs/PerbandinganTab/types/benchmark.types.ts

export interface MarginThresholds {
  excellent: number;
  good: number;
  acceptable: number;
  poor: number;
}

export interface IndustryBenchmarks {
  grossMargin: MarginThresholds;
  netMargin: MarginThresholds;
}

export interface StatusResult {
  status: string;
  color: 'green' | 'blue' | 'yellow' | 'orange' | 'red';
  description: string;
}

export interface CompetitiveAnalysis {
  yourCompany: ComparisonMetrics;
  industryAverage: ComparisonMetrics;
  topPerformers: ComparisonMetrics;
}

export interface CompetitiveRow {
  key: string;
  yours: number;
  industry: number;
  top: number;
  unit: string;
}