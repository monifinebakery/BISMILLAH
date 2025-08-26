// src/components/profitAnalysis/components/EfficiencyMetricsCard.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, Clock, Package, Users, AlertTriangle, 
  CheckCircle, Target, Zap, DollarSign, BarChart3
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { 
  EfficiencyMetrics, 
  EfficiencyBenchmark,
  formatEfficiencyMetric,
  compareWithBenchmark
} from '../utils/efficiencyMetrics';
import { BusinessType } from '../utils/config/profitConfig';

// ==============================================
// TYPES
// ==============================================

export interface EfficiencyMetricsCardProps {
  metrics: EfficiencyMetrics | null;
  businessType: BusinessType;
  isLoading: boolean;
  className?: string;
}

interface MetricDisplayItem {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
  tooltip: string;
  status?: 'good' | 'warning' | 'danger';
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================

const getGradeColor = (grade: 'A' | 'B' | 'C' | 'D' | 'F') => {
  switch (grade) {
    case 'A': return 'bg-green-100 text-green-800 border-green-200';
    case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'F': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusColor = (status: 'good' | 'warning' | 'danger') => {
  switch (status) {
    case 'good': return 'text-green-600';
    case 'warning': return 'text-yellow-600';
    case 'danger': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const generateMetricItems = (metrics: EfficiencyMetrics, businessType: BusinessType): MetricDisplayItem[] => {
  const comparison = compareWithBenchmark(metrics, businessType);
  
  return [
    {
      label: 'Omset per Hari Kerja',
      value: formatEfficiencyMetric(metrics.revenuePerWorkingDay, 'currency'),
      icon: DollarSign,
      color: 'text-green-600',
      tooltip: 'Rata-rata pendapatan per hari operasional. Semakin tinggi semakin baik.',
      status: metrics.revenuePerWorkingDay > 1000000 ? 'good' : metrics.revenuePerWorkingDay > 500000 ? 'warning' : 'danger'
    },
    {
      label: 'Biaya per Omset',
      value: formatEfficiencyMetric(metrics.costPerRevenue, 'percentage'),
      icon: BarChart3,
      color: getStatusColor(comparison.cogsStatus === 'optimal' ? 'good' : comparison.cogsStatus === 'high' ? 'danger' : 'warning'),
      tooltip: 'Persentase total biaya terhadap omset. Idealnya di bawah 70% untuk F&B.',
      status: comparison.cogsStatus === 'optimal' ? 'good' : comparison.cogsStatus === 'high' ? 'danger' : 'warning'
    },
    {
      label: 'Perputaran Stok',
      value: formatEfficiencyMetric(metrics.inventoryTurnover, 'ratio'),
      icon: Package,
      color: 'text-blue-600',
      tooltip: 'Berapa kali stok berputar dalam setahun. Semakin tinggi semakin efisien.',
      status: metrics.inventoryTurnover > 20 ? 'good' : metrics.inventoryTurnover > 10 ? 'warning' : 'danger'
    },
    {
      label: 'Biaya per Porsi',
      value: formatEfficiencyMetric(metrics.costPerPortion, 'currency'),
      icon: Target,
      color: 'text-purple-600',
      tooltip: 'Rata-rata biaya bahan baku per porsi makanan/minuman.',
      status: metrics.costPerPortion < 15000 ? 'good' : metrics.costPerPortion < 25000 ? 'warning' : 'danger'
    },
    {
      label: 'Produktivitas Tenaga Kerja',
      value: formatEfficiencyMetric(metrics.laborProductivity, 'ratio'),
      icon: Users,
      color: 'text-orange-600',
      tooltip: 'Rasio omset terhadap biaya tenaga kerja. Semakin tinggi semakin produktif.',
      status: metrics.laborProductivity > 5 ? 'good' : metrics.laborProductivity > 3 ? 'warning' : 'danger'
    },
    {
      label: 'Rata-rata Nilai Order',
      value: formatEfficiencyMetric(metrics.averageOrderValue, 'currency'),
      icon: TrendingUp,
      color: 'text-indigo-600',
      tooltip: 'Rata-rata nilai pembelian per customer. Target: tingkatkan dengan upselling.',
      status: metrics.averageOrderValue > 50000 ? 'good' : metrics.averageOrderValue > 25000 ? 'warning' : 'danger'
    }
  ];
};

// ==============================================
// MAIN COMPONENT
// ==============================================

const EfficiencyMetricsCard: React.FC<EfficiencyMetricsCardProps> = ({
  metrics,
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
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Metrik Efisiensi
          </CardTitle>
          <CardDescription>
            Data tidak tersedia untuk menghitung metrik efisiensi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Tambahkan data operasional untuk melihat analisis efisiensi</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metricItems = generateMetricItems(metrics, businessType);
  const comparison = compareWithBenchmark(metrics, businessType);

  return (
    <TooltipProvider>
      <Card className={`${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Metrik Efisiensi Operasional
              </CardTitle>
              <CardDescription>
                Analisis performa dan efisiensi bisnis F&B Anda
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getGradeColor(metrics.efficiencyGrade)}>
                Grade {metrics.efficiencyGrade}
              </Badge>
              <Badge variant="outline">
                Score: {comparison.overallScore}/100
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Metrik Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metricItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div className="p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors cursor-help">
                      <div className="flex items-center justify-between mb-2">
                        <IconComponent className={`h-5 w-5 ${item.color}`} />
                        {item.status && (
                          <div className={`h-2 w-2 rounded-full ${
                            item.status === 'good' ? 'bg-green-500' :
                            item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{item.label}</p>
                      <p className={`font-semibold ${item.color}`}>{item.value}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{item.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Status Benchmark */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Perbandingan dengan Standar Industri
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <span className="text-sm text-gray-600">Modal Bahan</span>
                <div className="flex items-center gap-2">
                  {comparison.cogsStatus === 'optimal' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    comparison.cogsStatus === 'optimal' ? 'text-green-600' :
                    comparison.cogsStatus === 'high' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {comparison.cogsStatus === 'optimal' ? 'Optimal' :
                     comparison.cogsStatus === 'high' ? 'Tinggi' : 'Rendah'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <span className="text-sm text-gray-600">Biaya Operasional</span>
                <div className="flex items-center gap-2">
                  {comparison.opexStatus === 'optimal' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    comparison.opexStatus === 'optimal' ? 'text-green-600' :
                    comparison.opexStatus === 'high' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {comparison.opexStatus === 'optimal' ? 'Optimal' :
                     comparison.opexStatus === 'high' ? 'Tinggi' : 'Rendah'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <span className="text-sm text-gray-600">Margin Keuntungan</span>
                <div className="flex items-center gap-2">
                  {comparison.marginStatus === 'optimal' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    comparison.marginStatus === 'optimal' ? 'text-green-600' :
                    comparison.marginStatus === 'high' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparison.marginStatus === 'optimal' ? 'Optimal' :
                     comparison.marginStatus === 'high' ? 'Tinggi' : 'Rendah'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rekomendasi */}
          {metrics.recommendations.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Rekomendasi Perbaikan
              </h4>
              <div className="space-y-2">
                {metrics.recommendations.slice(0, 3).map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <p className="text-sm text-blue-800">{recommendation}</p>
                  </div>
                ))}
                {metrics.recommendations.length > 3 && (
                  <p className="text-xs text-gray-500 mt-2">
                    +{metrics.recommendations.length - 3} rekomendasi lainnya
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default EfficiencyMetricsCard;