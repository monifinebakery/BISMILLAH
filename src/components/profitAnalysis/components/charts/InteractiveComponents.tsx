// src/components/profitAnalysis/components/charts/InteractiveComponents.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { InteractiveLegendProps, ChartControlsProps, MetricConfigs } from './types';

// ==============================================
// INTERACTIVE LEGEND COMPONENT
// ==============================================

export const InteractiveLegend: React.FC<InteractiveLegendProps> = ({ 
  metrics, 
  metricConfigs, 
  hiddenMetrics, 
  hoveredMetric,
  onToggleMetric, 
  onHoverMetric, 
  onShowAll, 
  onHideAll 
}) => {
  return (
    <div className="mt-4 p-3 bg-gray-50 rounded border">
      <div className="flex justify-between items-center mb-2">
        <h5 className="font-medium text-sm text-gray-700">Legend (Klik untuk show/hide)</h5>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onShowAll}
            className="text-xs px-2 py-1"
          >
            Show All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onHideAll}
            className="text-xs px-2 py-1"
          >
            Hide All
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {metrics.map(metric => {
          const config = metricConfigs[metric as keyof typeof metricConfigs];
          if (!config) return null;
          
          const isHidden = hiddenMetrics.has(metric);
          const isHovered = hoveredMetric === metric;
          
          return (
            <div
              key={metric}
              className={`
                flex items-center gap-2 px-3 py-2 rounded border cursor-pointer
                transition-all duration-200 transform
                ${
                  isHidden 
                    ? 'bg-gray-200 border-gray-300 opacity-50' 
                    : 'bg-white border-gray-300 hover:border-gray-400'
                }
                ${
                  isHovered 
                    ? 'scale-105 shadow-md' 
                    : 'hover:scale-102 hover:shadow-sm'
                }
              `}
              onClick={() => onToggleMetric(metric)}
              onMouseEnter={() => onHoverMetric(metric)}
              onMouseLeave={() => onHoverMetric(null)}
            >
              <div 
                className={`w-3 h-3 rounded-full border-2 transition-all ${
                  isHidden ? 'border-gray-400' : 'border-current'
                }`}
                style={{ 
                  backgroundColor: isHidden ? 'transparent' : config.color,
                  borderColor: config.color
                }}
              />
              <span className={`text-xs font-medium ${
                isHidden ? 'text-gray-500 line-through' : 'text-gray-700'
              }`}>
                {config.label}
              </span>
              {isHovered && !isHidden && (
                <span className="text-xs text-gray-500">
                  👁️
                </span>
              )}
              {isHidden && (
                <span className="text-xs text-gray-400">
                  🙈
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==============================================
// CHART CONTROLS COMPONENT
// ==============================================

export const ChartControls: React.FC<ChartControlsProps> = ({
  viewType,
  setViewType,
  showForecast,
  setShowForecast,
  showAnomalies,
  setShowAnomalies,
  showComparison,
  setShowComparison,
  advancedAnalytics,
  isMobile
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* View Type Controls */}
      <div className="flex gap-1.5 sm:gap-2">
        <Button
          variant={viewType === 'values' ? 'default' : 'outline'}
          size={isMobile ? 'sm' : 'sm'}
          onClick={() => setViewType('values')}
          className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
        >
          <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          {isMobile ? 'Nilai' : 'Nilai'}
        </Button>
        <Button
          variant={viewType === 'margins' ? 'default' : 'outline'}
          size={isMobile ? 'sm' : 'sm'}
          onClick={() => setViewType('margins')}
          className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
        >
          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          {isMobile ? 'Margin' : 'Margin'}
        </Button>
      </div>

      {/* Advanced Analytics Controls */}
      {advancedAnalytics && (
        <div className="flex gap-1.5 sm:gap-2 pl-2 sm:pl-3 border-l border-gray-300">
          <Button
            variant={showForecast ? 'default' : 'outline'}
            size={isMobile ? 'sm' : 'sm'}
            onClick={() => setShowForecast(!showForecast)}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            {isMobile ? 'Prediksi' : 'Prediksi'}
          </Button>
          <Button
            variant={showAnomalies ? 'default' : 'outline'}
            size={isMobile ? 'sm' : 'sm'}
            onClick={() => setShowAnomalies(!showAnomalies)}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            {isMobile ? 'Anomali' : 'Anomali'}
          </Button>
          <Button
            variant={showComparison ? 'default' : 'outline'}
            size={isMobile ? 'sm' : 'sm'}
            onClick={() => setShowComparison(!showComparison)}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            {isMobile ? 'Bandingkan' : 'Bandingkan'}
          </Button>
        </div>
      )}
    </div>
  );
};

// ==============================================
// METRIC TOGGLES COMPONENT
// ==============================================

export interface MetricTogglesProps {
  viewType: 'values' | 'margins';
  metricConfigs: MetricConfigs;
  selectedMetrics: string[];
  onToggleMetric: (metric: string) => void;
  isMobile: boolean;
}

export const MetricToggles: React.FC<MetricTogglesProps> = ({
  viewType,
  metricConfigs,
  selectedMetrics,
  onToggleMetric,
  isMobile
}) => {
  const metrics = viewType === 'values'
    ? ['revenue', 'grossProfit', 'netProfit', 'cogs', 'opex', 'stockValue', 'grossMargin', 'netMargin']
    : ['grossMargin', 'netMargin'];

  return (
    <div className="flex flex-wrap gap-1 sm:gap-2 mt-3 sm:mt-4">
      {metrics.map(metric => {
        const config = metricConfigs[metric as keyof typeof metricConfigs];
        if (!config) {
          console.warn(`Metric config not found for: ${metric}`);
          return null;
        }
        
        const isSelected = selectedMetrics.includes(metric);
        
        return (
          <Button
            key={metric}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggleMetric(metric)}
            className={`
              text-xs px-2 py-1.5 transition-all duration-200
              ${isMobile ? 'min-w-[70px] h-8' : 'min-w-[80px] h-9'}
              hover:scale-105 active:scale-95
              ${isSelected ? 'shadow-md' : 'hover:shadow-sm'}
            `}
            style={{
              backgroundColor: isSelected ? config.color : undefined,
              borderColor: config.color,
              color: isSelected ? 'white' : config.color
            }}
          >
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-center gap-1`}>
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: config.color }}
              />
              <span className={isMobile ? 'text-[10px] leading-tight' : 'text-xs'}>
                {config.label}
              </span>
            </div>
          </Button>
        );
      }).filter(Boolean)}
    </div>
  );
};