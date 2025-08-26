// src/components/profitAnalysis/components/IndustryBenchmarkCard.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Target, TrendingUp, AlertTriangle, CheckCircle, 
  BarChart3, PieChart, DollarSign, Percent
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { BusinessType } from '../utils/config/profitConfig';
import { 
  EfficiencyBenchmark, 
  getBenchmarkForBusinessType,
  compareWithBenchmark,
  calculateEfficiencyMetrics
} from '../utils/efficiencyMetrics';

// ==============================================
// TYPES
// ==============================================

export interface IndustryBenchmarkCardProps {
  currentAnalysis: RealTimeProfitCalculation | null;
  businessType: BusinessType;
  isLoading: boolean;
  className?: string;
}

interface BenchmarkMetric {
  label: string;
  current: number;
  optimal: { min: number; max: number };
  unit: 'percentage' | 'currency' | 'ratio';
  status: 'excellent' | 'good' | 'warning' | 'danger';
  description: string;
}

interface IndustryInsight {
  category: string;
  message: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  actionable: boolean;
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================

const getBusinessTypeLabel = (businessType: BusinessType): string => {
  switch (businessType) {
    case BusinessType.FNB_RESTAURANT: return 'Restoran';
    case BusinessType.FNB_CAFE: return 'Kafe';
    case BusinessType.FNB_CATERING: return 'Katering';
    case BusinessType.FNB_BAKERY: return 'Bakery';
    case BusinessType.FNB_FASTFOOD: return 'Fast Food';
    case BusinessType.FNB_STREETFOOD: return 'Kuliner Kaki Lima';
    default: return 'F&B Umum';
  }
};

const getStatusColor = (status: 'excellent' | 'good' | 'warning' | 'danger') => {
  switch (status) {
    case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
    case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'danger': return 'text-red-600 bg-red-50 border-red-200';
  }
};

const getStatusIcon = (status: 'excellent' | 'good' | 'warning' | 'danger') => {
  switch (status) {
    case 'excellent': return CheckCircle;
    case 'good': return CheckCircle;
    case 'warning': return AlertTriangle;
    case 'danger': return AlertTriangle;
  }
};

const calculateBenchmarkMetrics = (
  analysis: RealTimeProfitCalculation,
  benchmark: EfficiencyBenchmark
): BenchmarkMetric[] => {
  const revenue = analysis.revenue_data?.total || 0;
  const cogs = analysis.cogs_data?.total || 0;
  const opex = analysis.opex_data?.total || 0;
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - opex;
  
  const cogsRatio = revenue > 0 ? (cogs / revenue) * 100 : 0;
  const opexRatio = revenue > 0 ? (opex / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  
  const getStatus = (current: number, optimal: { min: number; max: number }, isInverse = false): 'excellent' | 'good' | 'warning' | 'danger' => {
    if (isInverse) {
      // Untuk metrik yang lebih rendah lebih baik (seperti COGS ratio)
      if (current <= optimal.min) return 'excellent';
      if (current <= optimal.max) return 'good';
      if (current <= optimal.max * 1.2) return 'warning';
      return 'danger';
    } else {
      // Untuk metrik yang lebih tinggi lebih baik (seperti margin)
      if (current >= optimal.max) return 'excellent';
      if (current >= optimal.min) return 'good';
      if (current >= optimal.min * 0.8) return 'warning';
      return 'danger';
    }
  };
  
  return [
    {
      label: 'Rasio Modal Bahan (COGS)',
      current: cogsRatio,
      optimal: benchmark.optimalCogsRatio,
      unit: 'percentage',
      status: getStatus(cogsRatio, benchmark.optimalCogsRatio, true),
      description: 'Persentase biaya bahan baku terhadap total penjualan. Semakin rendah semakin efisien.'
    },
    {
      label: 'Rasio Biaya Operasional',
      current: opexRatio,
      optimal: benchmark.optimalOpexRatio,
      unit: 'percentage',
      status: getStatus(opexRatio, benchmark.optimalOpexRatio, true),
      description: 'Persentase biaya operasional terhadap total penjualan. Termasuk gaji, sewa, utilitas.'
    },
    {
      label: 'Margin Keuntungan Bersih',
      current: netMargin,
      optimal: benchmark.optimalNetMargin,
      unit: 'percentage',
      status: getStatus(netMargin, benchmark.optimalNetMargin),
      description: 'Persentase keuntungan bersih setelah dikurangi semua biaya. Target utama profitabilitas.'
    },
    {
      label: 'Margin Keuntungan Kotor',
      current: grossMargin,
      optimal: { min: 100 - benchmark.optimalCogsRatio.max, max: 100 - benchmark.optimalCogsRatio.min },
      unit: 'percentage',
      status: getStatus(grossMargin, { min: 100 - benchmark.optimalCogsRatio.max, max: 100 - benchmark.optimalCogsRatio.min }),
      description: 'Persentase keuntungan kotor sebelum biaya operasional. Indikator efisiensi bahan baku.'
    }
  ];
};

const generateIndustryInsights = (
  metrics: BenchmarkMetric[],
  businessType: BusinessType
): IndustryInsight[] => {
  const insights: IndustryInsight[] = [];
  const businessLabel = getBusinessTypeLabel(businessType);
  
  metrics.forEach(metric => {
    switch (metric.status) {
      case 'excellent':
        insights.push({
          category: metric.label,
          message: `${metric.label} Anda (${metric.current.toFixed(1)}%) sangat baik untuk standar ${businessLabel}`,
          type: 'success',
          actionable: false
        });
        break;
      case 'good':
        insights.push({
          category: metric.label,
          message: `${metric.label} Anda (${metric.current.toFixed(1)}%) dalam rentang optimal untuk ${businessLabel}`,
          type: 'success',
          actionable: false
        });
        break;
      case 'warning':
        if (metric.label.includes('Modal Bahan')) {
          insights.push({
            category: metric.label,
            message: `Rasio modal bahan (${metric.current.toFixed(1)}%) sedikit tinggi. Pertimbangkan negosiasi supplier atau optimasi porsi.`,
            type: 'warning',
            actionable: true
          });
        } else if (metric.label.includes('Operasional')) {
          insights.push({
            category: metric.label,
            message: `Biaya operasional (${metric.current.toFixed(1)}%) perlu dioptimasi. Review efisiensi operasional.`,
            type: 'warning',
            actionable: true
          });
        } else {
          insights.push({
            category: metric.label,
            message: `${metric.label} (${metric.current.toFixed(1)}%) di bawah standar optimal ${businessLabel}`,
            type: 'warning',
            actionable: true
          });
        }
        break;
      case 'danger':
        if (metric.label.includes('Modal Bahan')) {
          insights.push({
            category: metric.label,
            message: `Rasio modal bahan (${metric.current.toFixed(1)}%) terlalu tinggi! Segera review supplier dan kontrol porsi.`,
            type: 'danger',
            actionable: true
          });
        } else if (metric.label.includes('Operasional')) {
          insights.push({
            category: metric.label,
            message: `Biaya operasional (${metric.current.toFixed(1)}%) terlalu tinggi! Perlu restrukturisasi biaya.`,
            type: 'danger',
            actionable: true
          });
        } else {
          insights.push({
            category: metric.label,
            message: `${metric.label} (${metric.current.toFixed(1)}%) jauh di bawah standar ${businessLabel}. Perlu perbaikan segera.`,
            type: 'danger',
            actionable: true
          });
        }
        break;
    }
  });
  
  return insights.slice(0, 4); // Batasi 4 insight teratas
};

const formatValue = (value: number, unit: 'percentage' | 'currency' | 'ratio'): string => {
  switch (unit) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return `Rp ${value.toLocaleString('id-ID')}`;
    case 'ratio':
      return value.toFixed(2);
    default:
      return value.toString();
  }
};

// ==============================================
// MAIN COMPONENT
// ==============================================

const IndustryBenchmarkCard: React.FC<IndustryBenchmarkCardProps> = ({
  currentAnalysis,
  businessType,
  isLoading,
  className = ''
}) => {
  if (isLoading) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!currentAnalysis) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Perbandingan Industri
          </CardTitle>
          <CardDescription>
            Data tidak tersedia untuk perbandingan dengan standar industri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Tambahkan data keuangan untuk melihat perbandingan industri</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const benchmark = getBenchmarkForBusinessType(businessType);
  const metrics = calculateBenchmarkMetrics(currentAnalysis, benchmark);
  const insights = generateIndustryInsights(metrics, businessType);
  const businessLabel = getBusinessTypeLabel(businessType);
  
  // Hitung skor keseluruhan
  const overallScore = metrics.reduce((acc, metric) => {
    const score = metric.status === 'excellent' ? 100 : 
                 metric.status === 'good' ? 80 : 
                 metric.status === 'warning' ? 60 : 40;
    return acc + score;
  }, 0) / metrics.length;

  return (
    <TooltipProvider>
      <Card className={`${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Perbandingan Standar Industri
              </CardTitle>
              <CardDescription>
                Benchmark performa bisnis {businessLabel} Anda
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {businessLabel}
              </Badge>
              <Badge className={`${
                overallScore >= 90 ? 'bg-green-100 text-green-800 border-green-200' :
                overallScore >= 75 ? 'bg-blue-100 text-blue-800 border-blue-200' :
                overallScore >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-red-100 text-red-800 border-red-200'
              }`}>
                Skor: {overallScore.toFixed(0)}/100
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Metrik Benchmark */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Metrik vs Standar Industri
            </h4>
            
            <div className="grid gap-4">
              {metrics.map((metric, index) => {
                const StatusIcon = getStatusIcon(metric.status);
                const progressValue = Math.min(100, (metric.current / metric.optimal.max) * 100);
                
                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div className={`p-4 rounded-lg border transition-colors hover:bg-gray-50 cursor-help ${
                        getStatusColor(metric.status)
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            <span className="font-medium text-sm">{metric.label}</span>
                          </div>
                          <span className="font-semibold">
                            {formatValue(metric.current, metric.unit)}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Target: {formatValue(metric.optimal.min, metric.unit)} - {formatValue(metric.optimal.max, metric.unit)}</span>
                            <span className="capitalize">{metric.status}</span>
                          </div>
                          <Progress 
                            value={progressValue} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{metric.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Industry Insights */}
          {insights.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Insight Industri
              </h4>
              <div className="space-y-3">
                {insights.map((insight, index) => {
                  const iconColor = insight.type === 'success' ? 'text-green-600' :
                                   insight.type === 'warning' ? 'text-yellow-600' :
                                   insight.type === 'danger' ? 'text-red-600' : 'text-blue-600';
                  
                  const bgColor = insight.type === 'success' ? 'bg-green-50 border-green-200' :
                                 insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                 insight.type === 'danger' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';
                  
                  return (
                    <div key={index} className={`p-3 rounded-lg border ${bgColor}`}>
                      <div className="flex items-start gap-2">
                        <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${iconColor.replace('text-', 'bg-')}`} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{insight.message}</p>
                          {insight.actionable && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Dapat ditindaklanjuti
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ringkasan Rekomendasi */}
          <div className="border-t pt-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Ringkasan Performa
              </h4>
              <p className="text-sm text-blue-700">
                Bisnis {businessLabel} Anda memiliki skor {overallScore.toFixed(0)}/100 dibanding standar industri.
                {overallScore >= 80 ? ' Performa sangat baik!' :
                 overallScore >= 60 ? ' Ada ruang untuk perbaikan.' :
                 ' Perlu fokus pada optimasi operasional.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default IndustryBenchmarkCard;