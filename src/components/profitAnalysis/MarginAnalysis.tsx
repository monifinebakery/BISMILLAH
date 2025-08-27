import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { formatCurrency } from './utils/profitTransformers';

// Types
export interface MarginAnalysisProps {
  currentAnalysis?: any;
  isLoading?: boolean;
  className?: string;
  effectiveCogs?: number;
  labels?: { hppLabel: string; hppHint: string };
}

export function MarginAnalysis({
  currentAnalysis,
  isLoading = false,
  className = '',
  effectiveCogs,
  labels
}: MarginAnalysisProps) {
  // Calculate margins
  const data = React.useMemo(() => {
    if (!currentAnalysis) return null;
    
    const revenue = currentAnalysis.revenue_data?.total || 0;
    const cogs = effectiveCogs || currentAnalysis.cogs_data?.total || 0;
    const opex = currentAnalysis.opex_data?.total || 0;
    
    if (revenue === 0) return null;
    
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - opex;
    
    const grossMargin = (grossProfit / revenue) * 100;
    const netMargin = (netProfit / revenue) * 100;
    const cogsRatio = (cogs / revenue) * 100;
    const opexRatio = (opex / revenue) * 100;
    
    return {
      revenue,
      cogs,
      opex,
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
      cogsRatio,
      opexRatio,
    };
  }, [currentAnalysis, effectiveCogs]);
  
  // Margin health assessment
  const marginHealth = React.useMemo(() => {
    if (!data) return null;
    
    const { grossMargin, netMargin } = data;
    
    // Industry benchmarks for F&B business
    const grossBenchmark = 60; // 60% is good for F&B
    const netBenchmark = 15;   // 15% is good for F&B
    
    const grossHealth = grossMargin >= grossBenchmark ? 'excellent' : 
                       grossMargin >= grossBenchmark * 0.8 ? 'good' : 'needs-improvement';
                       
    const netHealth = netMargin >= netBenchmark ? 'excellent' :
                     netMargin >= netBenchmark * 0.8 ? 'good' : 'needs-improvement';
    
    return {
      gross: { status: grossHealth, benchmark: grossBenchmark },
      net: { status: netHealth, benchmark: netBenchmark }
    };
  }, [data]);
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-40 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-orange-500" />
            Analisis Margin
          </CardTitle>
          <CardDescription>Belum ada data untuk analisis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Input data transaksi untuk melihat analisis margin</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'good':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-700 bg-green-100';
      case 'good': return 'text-orange-700 bg-orange-100';
      default: return 'text-red-700 bg-red-100';
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-orange-500" />
          Analisis Margin
        </CardTitle>
        <CardDescription>
          Evaluasi kesehatan profit margin
          {labels?.hppLabel && (
            <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
              {labels.hppLabel}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Margin Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Margin Kotor</span>
              {marginHealth && getStatusIcon(marginHealth.gross.status)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {data.grossMargin.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              {formatCurrency(data.grossProfit)} dari {formatCurrency(data.revenue)}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Margin Bersih</span>
              {marginHealth && getStatusIcon(marginHealth.net.status)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {data.netMargin.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              {formatCurrency(data.netProfit)} dari {formatCurrency(data.revenue)}
            </div>
          </div>
        </div>
        
        {/* Cost Breakdown */}
        <div className="space-y-3 pt-2 border-t">
          <h4 className="font-medium text-gray-900 text-sm">Breakdown Biaya</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                HPP {labels?.hppLabel ? `(${labels.hppLabel})` : ''}
              </span>
              <span className="font-medium">{data.cogsRatio.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full" 
                style={{ width: `${Math.min(data.cogsRatio, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Biaya Operasional</span>
              <span className="font-medium">{data.opexRatio.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${Math.min(data.opexRatio, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Health Status */}
        {marginHealth && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="font-medium text-gray-900 text-sm">Status Kesehatan</h4>
            
            <div className="space-y-1">
              <div className={`text-xs px-2 py-1 rounded inline-block ${getStatusColor(marginHealth.gross.status)}`}>
                Margin Kotor: {marginHealth.gross.status === 'excellent' ? 'Sangat Baik' : 
                              marginHealth.gross.status === 'good' ? 'Baik' : 'Perlu Diperbaiki'}
                <span className="ml-1 opacity-75">
                  (Target: {marginHealth.gross.benchmark}%)
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className={`text-xs px-2 py-1 rounded inline-block ${getStatusColor(marginHealth.net.status)}`}>
                Margin Bersih: {marginHealth.net.status === 'excellent' ? 'Sangat Baik' : 
                                marginHealth.net.status === 'good' ? 'Baik' : 'Perlu Diperbaiki'}
                <span className="ml-1 opacity-75">
                  (Target: {marginHealth.net.benchmark}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
