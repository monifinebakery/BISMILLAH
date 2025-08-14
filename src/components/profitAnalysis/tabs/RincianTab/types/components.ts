// src/components/profitAnalysis/tabs/RincianTab/types/components.ts

import { ProfitAnalysisResult } from '../../types';

// ===========================================
// ✅ BASE PROPS
// ===========================================

export interface BaseRincianProps {
  profitData: ProfitAnalysisResult;
  isMobile?: boolean;
  className?: string;
}

// ===========================================
// ✅ OVERVIEW COMPONENTS
// ===========================================

export interface CostOverviewProps extends BaseRincianProps {
  calculations?: any;
}

export interface HppSummaryCardProps {
  cogsBreakdown: any;
  costAnalysis: any;
  isMobile?: boolean;
  className?: string;
}

export interface OpexSummaryCardProps {
  opexBreakdown: any;
  profitMarginData: any;
  opexComposition: any;
  isMobile?: boolean;
  className?: string;
}

export interface QuickRatioAnalysisProps {
  costAnalysis: any;
  costStructureAnalysis: any;
  isMobile?: boolean;
  className?: string;
}

// ===========================================
// ✅ COGS DETAIL COMPONENTS
// ===========================================

export interface CogsDetailTabProps extends BaseRincianProps {
  calculations?: any;
  showDetailedBreakdown?: boolean;
}

export interface MaterialCostsCardProps {
  materialCosts: any[];
  totalMaterialCost: number;
  costAnalysis: any;
  isMobile?: boolean;
  className?: string;
}

export interface LaborCostsCardProps {
  directLaborCosts: any[];
  totalDirectLaborCost: number;
  costAnalysis: any;
  isMobile?: boolean;
  className?: string;
}

export interface MaterialUsageAnalyticsProps {
  materialUsageStats: any;
  isMobile?: boolean;
  className?: string;
}

// ===========================================
// ✅ OPEX DETAIL COMPONENTS
// ===========================================

export interface OpexDetailTabProps extends BaseRincianProps {
  calculations?: any;
}

export interface ExpenseCardProps {
  title: string;
  expenses: any[];
  total: number;
  revenue: number;
  colorScheme: 'blue' | 'green' | 'purple';
  icon: any;
  isMobile?: boolean;
}

// ===========================================
// ✅ ANALYSIS COMPONENTS
// ===========================================

export interface AnalysisTabProps extends BaseRincianProps {
  calculations?: any;
  costAnalysis?: any;
  efficiencyMetrics?: any;
  targetAnalysis?: any;
  actionPlan?: any;
}

export interface EfficiencyMetricsCardProps {
  efficiencyMetrics: any;
  isMobile?: boolean;
  className?: string;
}

export interface TargetVsActualCardsProps {
  targetAnalysis: any;
  isMobile?: boolean;
  className?: string;
}

export interface RecommendationsCardProps {
  recommendations: any[];
  isMobile?: boolean;
  className?: string;
}

export interface ActionItemsCardProps {
  actionPlan: any;
  isMobile?: boolean;
  className?: string;
}

// ===========================================
// ✅ UTILITY TYPES
// ===========================================

export interface MetricCardData {
  label: string;
  value: number;
  target: number;
  unit: string;
  status: string;
  color: string;
}

export interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobile?: boolean;
}

export interface DataQualityIndicatorProps {
  profitData: ProfitAnalysisResult;
  className?: string;
}

export type TabKey = 'overview' | 'cogs' | 'opex' | 'analysis';