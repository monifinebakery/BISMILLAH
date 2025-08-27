// src/components/profitAnalysis/components/charts/AnalyticsDisplays.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '../../utils/profitTransformers';
import { AdvancedAnalytics, PeriodComparison, TrendData } from './types';

// ==============================================
// FORECASTING DISPLAY COMPONENT
// ==============================================

interface ForecastingDisplayProps {
  showForecast: boolean;
  advancedAnalytics: AdvancedAnalytics;
}

export const ForecastingDisplay: React.FC<ForecastingDisplayProps> = ({
  showForecast,
  advancedAnalytics
}) => {
  if (!showForecast) return null;

  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg border">
      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
        🔮 Prediksi Untung 3 Bulan Kedepan
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Linear Regression Forecast */}
        <div className="bg-white p-3 rounded border">
          <h5 className="font-medium text-sm text-gray-700 mb-2">Linear Regression</h5>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Akurasi:</span>
              <span className="font-medium">{advancedAnalytics.forecast.linear.confidence.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Trend:</span>
              <span className={`font-medium ${
                advancedAnalytics.forecast.linear.trend === 'increasing' ? 'text-green-600' :
                advancedAnalytics.forecast.linear.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {advancedAnalytics.forecast.linear.trend === 'increasing' ? '⬆️ Naik' :
                 advancedAnalytics.forecast.linear.trend === 'decreasing' ? '⬇️ Turun' : '➡️ Stabil'}
              </span>
            </div>
            {advancedAnalytics.forecast.linear.predictions.map((pred, i) => (
              <div key={i} className="flex justify-between text-gray-600">
                <span>{pred.period}:</span>
                <span>{formatCurrency(pred.value)}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Exponential Smoothing Forecast */}
        <div className="bg-white p-3 rounded border">
          <h5 className="font-medium text-sm text-gray-700 mb-2">Exponential Smoothing</h5>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Akurasi:</span>
              <span className="font-medium">{advancedAnalytics.forecast.exponential.confidence.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Trend:</span>
              <span className={`font-medium ${
                advancedAnalytics.forecast.exponential.trend === 'increasing' ? 'text-green-600' :
                advancedAnalytics.forecast.exponential.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {advancedAnalytics.forecast.exponential.trend === 'increasing' ? '⬆️ Naik' :
                 advancedAnalytics.forecast.exponential.trend === 'decreasing' ? '⬇️ Turun' : '➡️ Stabil'}
              </span>
            </div>
            {advancedAnalytics.forecast.exponential.predictions.map((pred, i) => (
              <div key={i} className="flex justify-between text-gray-600">
                <span>{pred.period}:</span>
                <span>{formatCurrency(pred.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================
// ANOMALY DETECTION DISPLAY COMPONENT
// ==============================================

interface AnomalyDisplayProps {
  showAnomalies: boolean;
  advancedAnalytics: AdvancedAnalytics;
}

export const AnomalyDisplay: React.FC<AnomalyDisplayProps> = ({
  showAnomalies,
  advancedAnalytics
}) => {
  if (!showAnomalies) return null;

  return (
    <div className="mt-6 p-4 bg-yellow-50 rounded-lg border">
      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
        ⚠️ Deteksi Anomali Data
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Anomaly Summary */}
        <div className="bg-white p-3 rounded border">
          <h5 className="font-medium text-sm text-gray-700 mb-2">Ringkasan</h5>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Total Anomali:</span>
              <span className="font-medium">{advancedAnalytics.anomalies.summary.totalAnomalies}</span>
            </div>
            <div className="flex justify-between">
              <span>Tingkat Tinggi:</span>
              <span className="font-medium text-red-600">{advancedAnalytics.anomalies.summary.highSeverityCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Rata-rata Deviasi:</span>
              <span className="font-medium">{formatCurrency(advancedAnalytics.anomalies.summary.averageDeviation)}</span>
            </div>
          </div>
        </div>
        
        {/* Anomaly Details */}
        <div className="bg-white p-3 rounded border">
          <h5 className="font-medium text-sm text-gray-700 mb-2">Detail Anomali</h5>
          <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
            {advancedAnalytics.anomalies.anomalies.length === 0 ? (
              <div className="text-green-600 font-medium">✓ Tidak ada anomali terdeteksi</div>
            ) : (
              advancedAnalytics.anomalies.anomalies.map((anomaly, i) => (
                <div key={i} className={`p-2 rounded border-l ${
                  anomaly.severity === 'high' ? 'border-red-500 bg-red-50' :
                  anomaly.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">Periode {anomaly.index + 1}</div>
                      <div className="text-gray-600">Aktual: {formatCurrency(anomaly.value)}</div>
                      <div className="text-gray-600">Ekspektasi: {formatCurrency(anomaly.expected)}</div>
                    </div>
                    <span className={`text-xs px-1 py-0.5 rounded ${
                      anomaly.severity === 'high' ? 'bg-red-200 text-red-800' :
                      anomaly.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {anomaly.severity === 'high' ? 'Tinggi' :
                       anomaly.severity === 'medium' ? 'Sedang' : 'Rendah'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================
// PERIOD COMPARISON DISPLAY COMPONENT
// ==============================================

interface PeriodComparisonDisplayProps {
  showComparison: boolean;
  selectedPeriods: string[];
  trendData: TrendData[];
  periodComparison: PeriodComparison | null;
  onTogglePeriodSelection: (period: string) => void;
  onClearPeriodSelection: () => void;
}

export const PeriodComparisonDisplay: React.FC<PeriodComparisonDisplayProps> = ({
  showComparison,
  selectedPeriods,
  trendData,
  periodComparison,
  onTogglePeriodSelection,
  onClearPeriodSelection
}) => {
  if (!showComparison) return null;

  return (
    <div className="mt-6 p-4 bg-purple-50 rounded-lg border">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-gray-800 flex items-center">
          🔄 Perbandingan Periode
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={onClearPeriodSelection}
          className="text-xs"
        >
          Clear
        </Button>
      </div>
      
      {/* Period Selection */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Pilih periode untuk dibandingkan (maksimal 3):</p>
        <div className="flex flex-wrap gap-1">
          {trendData.map((d: TrendData) => (
            <Button
              key={d.period}
              size="sm"
              variant={selectedPeriods.includes(d.period) ? 'default' : 'outline'}
              onClick={() => onTogglePeriodSelection(d.period)}
              disabled={!selectedPeriods.includes(d.period) && selectedPeriods.length >= 3}
              className="text-xs"
            >
              {d.periodLabel}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Comparison Results */}
      {periodComparison && periodComparison.data.length >= 2 ? (
        <div className="bg-white rounded border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 border-r">Metrik</th>
                  {periodComparison.data.map((period, i) => (
                    <th key={i} className="text-center p-2 border-r">{period!.period}</th>
                  ))}
                  {periodComparison.changes && (
                    <th className="text-center p-2">Perubahan</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="font-medium p-2 border-r">Omset</td>
                  {periodComparison.data.map((period, i) => (
                    <td key={i} className="text-center p-2 border-r">
                      {formatCurrency(period!.revenue)}
                    </td>
                  ))}
                  {periodComparison.changes && (
                    <td className={`text-center p-2 font-medium ${
                      periodComparison.changes.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {periodComparison.changes.revenueChange > 0 ? '+' : ''}
                      {periodComparison.changes.revenueChange.toFixed(1)}%
                    </td>
                  )}
                </tr>
                <tr className="border-t">
                  <td className="font-medium p-2 border-r">Untung Bersih</td>
                  {periodComparison.data.map((period, i) => (
                    <td key={i} className="text-center p-2 border-r">
                      {formatCurrency(period!.netProfit)}
                    </td>
                  ))}
                  {periodComparison.changes && (
                    <td className={`text-center p-2 font-medium ${
                      periodComparison.changes.profitChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {periodComparison.changes.profitChange > 0 ? '+' : ''}
                      {periodComparison.changes.profitChange.toFixed(1)}%
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedPeriods.length < 2 ? (
        <div className="text-center text-gray-500 text-sm py-4">
          Pilih minimal 2 periode untuk melihat perbandingan
        </div>
      ) : null}
    </div>
  );
};