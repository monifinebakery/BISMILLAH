// src/components/profitAnalysis/tabs/rincianTab/types/components.ts

import { ProfitAnalysisResult } from '../../types';
import { RincianCalculations } from './calculations';

/**
 * Base props for rincian components
 */
export interface BaseRincianProps {
  profitData: ProfitAnalysisResult;
  calculations: RincianCalculations;
  isMobile?: boolean;
  className?: string;
}

/**
 * Tab navigation props
 */
export interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobile?: boolean;
}

/**
 * Data quality indicator props
 */
export interface DataQualityIndicatorProps {
  profitData: ProfitAnalysisResult;
  dataQuality: RincianCalculations['dataQuality'];
  showDetailedBreakdown: boolean;
  onToggleDetailed: () => void;
  isMobile?: boolean;
  className?: string;
}

/**
 * Cost overview props
 */
export interface CostOverviewProps extends BaseRincianProps {}

/**
 * Quick ratio analysis props
 */
export interface QuickRatioAnalysisProps {
  costAnalysis: RincianCalculations['costAnalysis'];
  costStructureAnalysis: RincianCalculations['costStructureAnalysis'];
  isMobile?: boolean;
  className?: string;
}

/**
 * HPP summary card props
 */
export interface HppSummaryCardProps {
  cogsBreakdown: ProfitAnalysisResult['cogsBreakdown'];
  costAnalysis: RincianCalculations['costAnalysis'];
  isMobile?: boolean;
}

/**
 * OPEX summary card props
 */
export interface OpexSummaryCardProps {
  opexBreakdown: ProfitAnalysisResult['opexBreakdown'];
  profitMarginData: ProfitAnalysisResult['profitMarginData'];
  opexComposition: RincianCalculations['opexComposition'];
  isMobile?: boolean;
}

/**
 * COGS detail tab props
 */
export interface CogsDetailTabProps extends BaseRincianProps {
  showDetailedBreakdown: boolean;
}

/**
 * Material costs card props
 */
export interface MaterialCostsCardProps {
  materialCosts: ProfitAnalysisResult['cogsBreakdown']['materialCosts'];
  totalMaterialCost: number;
  costAnalysis: RincianCalculations['costAnalysis'];
  isMobile?: boolean;
}

/**
 * Labor costs card props
 */
export interface LaborCostsCardProps {
  directLaborCosts: ProfitAnalysisResult['cogsBreakdown']['directLaborCosts'];
  totalDirectLaborCost: number;
  costAnalysis: RincianCalculations['costAnalysis'];
  isMobile?: boolean;
}

/**
 * Material usage analytics props
 */
export interface MaterialUsageAnalyticsProps {
  materialUsageStats: RincianCalculations['materialUsageStats'];
  isMobile?: boolean;
}

/**
 * OPEX detail tab props
 */
export interface OpexDetailTabProps extends BaseRincianProps {}

/**
 * Expense card props (for admin/selling/general)
 */
export interface ExpenseCardProps {
  title: string;
  expenses: any[];
  total: number;
  revenue: number;
  colorScheme: 'blue' | 'green' | 'purple';
  icon: React.ComponentType<any>;
  isMobile?: boolean;
}

/**
 * Analysis tab props
 */
export interface AnalysisTabProps extends BaseRincianProps {}

/**
 * Efficiency metrics card props
 */
export interface EfficiencyMetricsCardProps {
  efficiencyMetrics: RincianCalculations['efficiencyMetrics'];
  costAnalysis: RincianCalculations['costAnalysis'];
  isMobile?: boolean;
}

/**
 * Target vs actual cards props
 */
export interface TargetVsActualCardsProps {
  costStructureAnalysis: RincianCalculations['costStructureAnalysis'];
  profitMarginData: ProfitAnalysisResult['profitMarginData'];
  opexBreakdown: ProfitAnalysisResult['opexBreakdown'];
  costAnalysis: RincianCalculations['costAnalysis'];
  isMobile?: boolean;
}

/**
 * Recommendations card props
 */
export interface RecommendationsCardProps {
  recommendations: RincianCalculations['recommendations'];
  costStructureAnalysis: RincianCalculations['costStructureAnalysis'];
  dataSource: string;
  isMobile?: boolean;
}

/**
 * Action items card props
 */
export interface ActionItemsCardProps {
  profitData: ProfitAnalysisResult;
  costAnalysis: RincianCalculations['costAnalysis'];
  costStructureAnalysis: RincianCalculations['costStructureAnalysis'];
  isMobile?: boolean;
}

/**
 * Tab content type
 */
export type TabKey = 'overview' | 'cogs' | 'opex' | 'analysis';

/**
 * Metric card data
 */
export interface MetricCardData {
  label: string;
  value: number;
  target: number;
  unit: string;
  status: 'on-target' | 'above-target' | 'below-target';
  color: 'green' | 'blue' | 'red';
}