// src/components/profitAnalysis/tabs/rincianTab/components/DataQualityIndicator.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

import { DataQualityIndicatorProps } from '../types/components';
import { formatDataSource } from '../utils/formatters';
import { DATA_SOURCE_COLORS } from '../constants/colors';
import { SECTION_TITLES, BUTTON_LABELS } from '../constants/messages';

export const DataQualityIndicator: React.FC<DataQualityIndicatorProps> = ({
  profitData,
  dataQuality,
  showDetailedBreakdown,
  onToggleDetailed,
  isMobile,
  className
}) => {
  const { cogsBreakdown } = profitData;
  const dataSource = cogsBreakdown.dataSource || 'estimated';
  const colors = DATA_SOURCE_COLORS[dataSource as keyof typeof DATA_SOURCE_COLORS];

  return (
    <Card className={cn("border-l-4", colors.border, className)}>
      <CardContent className={cn("p-4", isMobile && "p-3")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className={cn("h-5 w-5", colors.icon, isMobile && "h-4 w-4")} />
            <div>
              <h3 className={cn("font-medium", colors.textDark, isMobile && "text-sm")}>
                {SECTION_TITLES.DATA_QUALITY}
              </h3>
              <div className={cn("text-sm", colors.text, isMobile && "text-xs")}>
                <span>Data source: </span>
                <strong>{formatDataSource(dataSource)}</strong>
                {cogsBreakdown.actualMaterialUsage && (
                  <span> • {cogsBreakdown.actualMaterialUsage.length} material usage records</span>
                )}
              </div>
              
              {/* Data Quality Score */}
              <div className={cn("mt-2 flex items-center gap-2", isMobile && "mt-1")}>
                <span className={cn("text-xs text-gray-600", isMobile && "text-[0.65rem]")}>
                  Data Quality Score:
                </span>
                <div className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  dataQuality.score >= 80 ? "bg-green-100 text-green-800" :
                  dataQuality.score >= 60 ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800",
                  isMobile && "text-[0.65rem] px-1.5 py-0.5"
                )}>
                  {dataQuality.score}%
                </div>
              </div>

              {/* Warnings */}
              {dataQuality.warnings.length > 0 && (
                <div className={cn("mt-2", isMobile && "mt-1")}>
                  <details className="text-xs">
                    <summary className={cn(
                      "cursor-pointer text-yellow-700 hover:text-yellow-800",
                      isMobile && "text-[0.65rem]"
                    )}>
                      ⚠️ {dataQuality.warnings.length} data warning(s)
                    </summary>
                    <ul className={cn(
                      "mt-1 ml-4 space-y-1 text-yellow-600",
                      isMobile && "text-[0.65rem]"
                    )}>
                      {dataQuality.warnings.slice(0, 3).map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                      {dataQuality.warnings.length > 3 && (
                        <li>• ... dan {dataQuality.warnings.length - 3} lainnya</li>
                      )}
                    </ul>
                  </details>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onToggleDetailed}
            className={cn("text-xs", isMobile && "text-[0.65rem] px-2")}
          >
            {showDetailedBreakdown ? (
              <>
                <EyeOff className={cn("h-3 w-3 mr-1", isMobile && "h-2.5 w-2.5")} />
                {BUTTON_LABELS.HIDE_DETAIL}
              </>
            ) : (
              <>
                <Eye className={cn("h-3 w-3 mr-1", isMobile && "h-2.5 w-2.5")} />
                {BUTTON_LABELS.SHOW_DETAIL}
              </>
            )}
          </Button>
        </div>

        {/* Data Quality Factors (when detailed view is enabled) */}
        {showDetailedBreakdown && (
          <div className={cn("mt-4 pt-3 border-t", isMobile && "mt-3 pt-2")}>
            <h5 className={cn("font-medium mb-2", isMobile && "text-sm mb-1")}>
              📊 Data Quality Breakdown
            </h5>
            <div className={cn("grid grid-cols-1 gap-2", !isMobile && "md:grid-cols-2")}>
              {dataQuality.factors.map((factor, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className={cn("text-xs text-gray-700", isMobile && "text-[0.65rem]")}>
                    {factor.name}:
                  </span>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-12 h-2 bg-gray-200 rounded overflow-hidden",
                      isMobile && "w-8 h-1.5"
                    )}>
                      <div 
                        className={cn(
                          "h-full transition-all duration-300",
                          factor.score >= 80 ? "bg-green-500" :
                          factor.score >= 60 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>
                    <span className={cn(
                      "text-xs font-medium w-8 text-right",
                      factor.score >= 80 ? "text-green-600" :
                      factor.score >= 60 ? "text-yellow-600" : "text-red-600",
                      isMobile && "text-[0.65rem] w-6"
                    )}>
                      {factor.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};