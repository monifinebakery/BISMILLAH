// src/components/profitAnalysis/components/sections/AdvancedMetricsSection.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatPercentage } from '../../utils/profitTransformers';

// ==============================================
// TYPES
// ==============================================

export interface AdvancedMetricsData {
  grossProfitMargin: number;
  netProfitMargin: number;
  monthlyGrowthRate: number;
  marginOfSafety: number;
  cogsPercentage: number;
  opexPercentage: number;
  confidenceScore: number;
  operatingLeverage: number;
}

export interface AdvancedMetricsSectionProps {
  data: AdvancedMetricsData | null;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

// ==============================================
// METRIC CARD COMPONENT
// ==============================================

interface MetricCardProps {
  title: string;
  value: number;
  formatter?: (value: number) => string;
  color: string;
  bgColor: string;
  emoji: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  formatter = formatPercentage,
  color,
  bgColor,
  emoji
}) => (
  <div className={`text-center p-3 ${bgColor} rounded-lg`}>
    <div className={`text-xl sm:text-2xl font-bold ${color}`}>
      {formatter(value)}
    </div>
    <div className="text-xs sm:text-sm text-gray-600">
      {emoji} {title}
    </div>
  </div>
);

// ==============================================
// COMPONENT
// ==============================================

const AdvancedMetricsSection: React.FC<AdvancedMetricsSectionProps> = ({
  data,
  isLoading = false,
  title = 'Metrik Lanjutan',
  description = 'Data teknis untuk analisis mendalam'
}) => {
  // Don't render if no data or loading
  if (!data || isLoading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Margin Kotor"
            value={data.grossProfitMargin}
            color="text-orange-600"
            bgColor="bg-orange-50"
            emoji=""
          />
          <MetricCard
            title="Margin Bersih"
            value={data.netProfitMargin}
            color="text-green-600"
            bgColor="bg-green-50"
            emoji=""
          />
          <MetricCard
            title="Pertumbuhan"
            value={data.monthlyGrowthRate}
            color="text-purple-600"
            bgColor="bg-purple-50"
            emoji=""
          />
          <MetricCard
            title="Keamanan"
            value={data.marginOfSafety}
            color="text-amber-600"
            bgColor="bg-amber-50"
            emoji="🛡️"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedMetricsSection;
