// src/components/financial/profit-analysis/components/InsightsList.tsx
// ✅ KOMPONEN DAFTAR INSIGHTS

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfitInsight } from '@/components/financial/types/profitAnalysis';

interface InsightsListProps {
  insights: ProfitInsight[];
  maxShow?: number;
}

export const InsightsList: React.FC<InsightsListProps> = ({ insights, maxShow }) => {
  if (!insights || insights.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Info className="h-8 w-8 mx-auto mb-2" />
        <p>Belum ada insight tersedia</p>
        <p className="text-xs mt-1">Insight akan muncul setelah analisis selesai</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <TrendingUp className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'high': return 'Tinggi';
      case 'medium': return 'Sedang';
      case 'low': return 'Rendah';
      default: return impact;
    }
  };

  const displayInsights = maxShow ? insights.slice(0, maxShow) : insights;

  return (
    <div className="space-y-3">
      {displayInsights.map((insight, index) => (
        <Card key={index} className={cn("border-l-4", getBgColor(insight.type))}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {getIcon(insight.type)}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{insight.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                {insight.recommendation && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    💡 {insight.recommendation}
                  </p>
                )}
                <Badge 
                  variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}
                  className="mt-2 text-xs"
                >
                  Dampak: {getImpactLabel(insight.impact)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {maxShow && insights.length > maxShow && (
        <p className="text-xs text-gray-500 text-center">
          +{insights.length - maxShow} insight lainnya
        </p>
      )}
    </div>
  );
};