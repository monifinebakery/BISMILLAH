// src/components/profitAnalysis/components/sections/CompetitiveBenchmarkSection.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPercentage } from '../../utils/profitTransformers';

// ==============================================
// TYPES
// ==============================================

export interface IndustryAverages {
  averageNetMargin: number;
  topQuartileMargin: number;
}

export interface CompetitivePosition {
  percentile: number;
  position: string;
  gapToLeader: number;
}

export interface BenchmarkData {
  industry: IndustryAverages;
  competitive: CompetitivePosition;
}

export interface CompetitiveBenchmarkSectionProps {
  data: BenchmarkData | null;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

// ==============================================
// BENCHMARK CARD COMPONENT
// ==============================================

interface BenchmarkCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  formatter?: (value: number) => string;
  position?: string;
  bgColor: string;
}

const BenchmarkCard: React.FC<BenchmarkCardProps> = ({
  title,
  value,
  subtitle,
  formatter,
  position,
  bgColor
}) => (
  <div className={`text-center p-4 ${bgColor} rounded-lg`}>
    <div className="text-sm text-gray-600 mb-2">{title}</div>
    <div className="text-xl font-bold text-gray-700 mb-1">
      {typeof value === 'number' && formatter ? formatter(value) : value}
    </div>
    <div className="text-xs text-gray-500">{subtitle}</div>
    {position && (
      <Badge
        variant={position === 'sangat baik' ? 'default' : 'secondary'}
        className="mt-2"
      >
        {position}
      </Badge>
    )}
  </div>
);

// ==============================================
// COMPONENT
// ==============================================

const CompetitiveBenchmarkSection: React.FC<CompetitiveBenchmarkSectionProps> = ({
  data,
  isLoading = false,
  title = 'Benchmarking Kompetitif',
  description = 'Bagaimana performa Anda dibandingkan dengan standar industri'
}) => {
  // Don't render if no data or loading
  if (!data || isLoading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <BenchmarkCard
            title="Rata-rata Industri"
            value={data.industry.averageNetMargin}
            subtitle="Margin Bersih"
            formatter={formatPercentage}
            bgColor="bg-gray-50"
          />
          <BenchmarkCard
            title="Posisi Anda"
            value={data.competitive.percentile}
            subtitle="Persentil"
            position={data.competitive.position}
            bgColor="bg-blue-50"
          />
          <BenchmarkCard
            title="Gap ke Kuartil Atas"
            value={data.competitive.gapToLeader}
            subtitle="Poin Margin"
            formatter={formatPercentage}
            bgColor="bg-amber-50"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CompetitiveBenchmarkSection;
