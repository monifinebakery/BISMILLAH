// src/components/profitAnalysis/components/sections/ExecutiveSummarySection.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

// ==============================================
// TYPES
// ==============================================

export interface ExecutiveSummaryData {
  insights: string[];
  alerts: string[];
  opportunities: string[];
}

export interface ExecutiveSummarySectionProps {
  data: ExecutiveSummaryData | null;
  isLoading?: boolean;
  showAdvancedMetrics?: boolean;
}

// ==============================================
// COMPONENT
// ==============================================

const ExecutiveSummarySection: React.FC<ExecutiveSummarySectionProps> = ({
  data,
  isLoading = false,
  showAdvancedMetrics = true
}) => {
  // Don't render if no data or advanced metrics disabled
  if (!data || !showAdvancedMetrics || isLoading) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Key Insights Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            Insight Utama
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.insights.map((insight, index) => (
              <div key={index} className="text-sm text-gray-700 flex items-start">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 mr-2 flex-shrink-0" />
                {insight}
              </div>
            ))}
            {data.insights.length === 0 && (
              <div className="text-sm text-gray-500 italic">Tidak ada insight tersedia</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
            Item Tindakan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.alerts.length > 0 ? (
              data.alerts.map((alert, index) => (
                <div key={index} className="text-sm text-gray-700 flex items-start">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 mr-2 flex-shrink-0" />
                  {alert}
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 italic">Tidak ada masalah kritis yang terdeteksi</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Opportunities Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
            Peluang
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.opportunities.map((opportunity, index) => (
              <div key={index} className="text-sm text-gray-700 flex items-start">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-2 flex-shrink-0" />
                {opportunity}
              </div>
            ))}
            {data.opportunities.length === 0 && (
              <div className="text-sm text-gray-500 italic">Tidak ada peluang teridentifikasi</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutiveSummarySection;
