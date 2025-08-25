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
  const [chartVariant, setChartVariant] = useState<'advanced' | 'multiple'>('multiple');
  
  console.log('TrenTabContent - chartVariant:', chartVariant);
  
  return (
    <TabsContent value="tren" className="space-y-3 sm:space-y-6 mt-4 sm:mt-6">
      {/* Chart Type Selector - Always visible with debug */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 p-3 bg-orange-50 border-2 border-orange-300 rounded-lg shadow-sm">
        <div className="w-full text-xs text-gray-600 mb-1">
          Debug: Current chart = {chartVariant}
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-orange-700 font-medium mb-2 sm:mb-0 sm:mr-4">
          <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="whitespace-nowrap">Jenis Grafik:</span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant={chartVariant === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartVariant('advanced')}
            className={`flex-1 sm:flex-none text-xs px-2 py-1.5 h-auto ${
              chartVariant === 'advanced' 
                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                : 'border-orange-300 text-orange-700 hover:bg-orange-100'
            }`}
          >
            <Activity className="w-3 h-3 mr-1" />
            <span className="hidden xs:inline">Advanced Chart</span>
            <span className="xs:hidden">Advanced</span>
          </Button>
          <Button
            variant={chartVariant === 'multiple' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartVariant('multiple')}
            className={`flex-1 sm:flex-none text-xs px-2 py-1.5 h-auto ${
              chartVariant === 'multiple' 
                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                : 'border-orange-300 text-orange-700 hover:bg-orange-100'
            }`}
          >
            <LineChart className="w-3 h-3 mr-1" />
            <span className="hidden xs:inline">Multi-Line Chart</span>
            <span className="xs:hidden">Multi-Line</span>
          </Button>
        </div>
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
