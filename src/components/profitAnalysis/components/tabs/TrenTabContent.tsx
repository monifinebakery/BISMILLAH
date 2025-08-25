// src/components/profitAnalysis/components/tabs/TrenTabContent.tsx

import React, { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart3, LineChart, Activity } from 'lucide-react';

// Use lazy wrapper to keep code-splitting without mixing imports
import ProfitTrendChart from '../lazy/LazyProfitTrendChart';
import { ChartLineMultiple } from '../../ChartLineMultiple';

// ==============================================
// TYPES
// ==============================================

export interface TrenTabContentProps {
  profitHistory: any[];
  isLoading: boolean;
  effectiveCogs?: number;
  labels?: { hppLabel: string; hppHint: string };
}

// ==============================================
// COMPONENT
// ==============================================

const TrenTabContent: React.FC<TrenTabContentProps> = ({
  profitHistory,
  isLoading,
  effectiveCogs,
  labels
}) => {
  const [chartVariant, setChartVariant] = useState<'advanced' | 'multiple'>('advanced');
  
  return (
    <TabsContent value="tren" className="space-y-4 sm:space-y-6 mt-6">
      {/* Chart Type Selector */}
      <div className="flex flex-wrap gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-orange-700 font-medium mr-4">
          <BarChart3 className="w-4 h-4" />
          Jenis Grafik:
        </div>
        <Button
          variant={chartVariant === 'advanced' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartVariant('advanced')}
          className={`text-xs ${
            chartVariant === 'advanced' 
              ? 'bg-orange-600 hover:bg-orange-700 text-white' 
              : 'border-orange-300 text-orange-700 hover:bg-orange-100'
          }`}
        >
          <Activity className="w-3 h-3 mr-1" />
          Advanced Chart
        </Button>
        <Button
          variant={chartVariant === 'multiple' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartVariant('multiple')}
          className={`text-xs ${
            chartVariant === 'multiple' 
              ? 'bg-orange-600 hover:bg-orange-700 text-white' 
              : 'border-orange-300 text-orange-700 hover:bg-orange-100'
          }`}
        >
          <LineChart className="w-3 h-3 mr-1" />
          Multi-Line Chart
        </Button>
      </div>
      
      {/* Chart Content */}
      {chartVariant === 'advanced' ? (
        <React.Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
          <ProfitTrendChart
            profitHistory={profitHistory}
            isLoading={isLoading}
            chartType="area"
            showMetrics={['revenue', 'grossProfit', 'netProfit', 'cogs', 'opex']}
            effectiveCogs={effectiveCogs ?? 0}
            labels={labels}
          />
        </React.Suspense>
      ) : (
        <ChartLineMultiple
          profitHistory={profitHistory}
          isLoading={isLoading}
          effectiveCogs={effectiveCogs ?? 0}
          labels={labels}
          className="w-full"
        />
      )}
    </TabsContent>
  );
};

export default TrenTabContent;
