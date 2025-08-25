// src/components/profitAnalysis/components/sections/ForecastSection.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/profitTransformers';

// ==============================================
// TYPES
// ==============================================

export interface ForecastPeriod {
  profit: number;
  margin: number;
  confidence: number;
}

export interface ForecastData {
  nextMonth: ForecastPeriod;
  nextQuarter: ForecastPeriod;
  nextYear: ForecastPeriod;
  metadata?: {
    currentRevenue: number;
    currentNetProfit: number;
    currentMargin: number;
    averageGrowthRate: number;
    cogsPercentage: number;
    opexPercentage: number;
    historyLength: number;
    validationIssues: string[];
    forecastMethod?: string;
    dataConfidence?: number;
  };
}

export interface ForecastSectionProps {
  data: ForecastData | null;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

// ==============================================
// FORECAST CARD COMPONENT
// ==============================================

interface ForecastCardProps {
  period: string;
  data: ForecastPeriod;
  currentProfit: number;
}

const ForecastCard: React.FC<ForecastCardProps> = ({ period, data, currentProfit }) => {
  const isPositive = data.profit >= currentProfit;
  const change = ((data.profit - currentProfit) / Math.abs(currentProfit)) * 100;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          {period}
          <Badge variant={data.confidence > 70 ? 'default' : 'secondary'}>
            {data.confidence.toFixed(0)}% yakin
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold flex items-center">
              {formatCurrency(data.profit)}
              {isPositive ? (
                <TrendingUp className="w-5 h-5 text-green-600 ml-2" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 ml-2" />
              )}
            </div>
            <div className="text-sm text-gray-600">
              Prediksi untung bersih
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {formatPercentage(data.margin)}
            </div>
            <div className="text-sm text-gray-600">
              Margin prediksi
            </div>
          </div>
          <div>
            <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{change.toFixed(1)}% dari sekarang
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ==============================================
// COMPONENT
// ==============================================

const ForecastSection: React.FC<ForecastSectionProps> = ({
  data,
  isLoading = false,
  title = '🔮 Prediksi Untung Rugi',
  description = 'Perkiraan performa bisnis berdasarkan tren historis'
}) => {
  // Don't render if loading
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Memuat prediksi...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Show fallback visual when no data or insufficient history
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Butuh data historis minimal 3 bulan untuk prediksi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">📊</div>
            <h4 className="font-semibold text-lg mb-2">Data Belum Cukup untuk Prediksi</h4>
            <p className="text-gray-600 mb-4">
              Untuk mendapatkan prediksi yang akurat, kami membutuhkan data historis minimal 3 bulan.
              Silakan kumpulkan data keuangan selama beberapa bulan ke depan untuk melihat prediksi performa bisnis Anda.
            </p>
            <div className="bg-blue-100 p-4 rounded-lg max-w-md">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Tips:</span> Pastikan Anda mencatat semua transaksi keuangan secara rutin 
                setiap bulan untuk mendapatkan prediksi yang lebih akurat.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentProfit = data.metadata?.currentNetProfit ?? 0;

  // Check if using fallback forecast method
  const isFallbackForecast = data.metadata?.forecastMethod === 'fallback_conservative';
  const hasSufficientHistory = data.metadata?.historyLength && data.metadata.historyLength >= 3;
  
  // Show enhanced fallback forecast for limited data
  if (isFallbackForecast || !hasSufficientHistory) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {title}
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                Prediksi Konservatif
              </Badge>
            </CardTitle>
            <CardDescription>
              Prediksi berdasarkan asumsi konservatif untuk bisnis dengan data terbatas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 text-lg">⚠️</div>
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">Prediksi Berdasarkan Data Terbatas</h4>
                  <p className="text-sm text-yellow-700 mb-2">
                    Saat ini tersedia {data.metadata?.historyLength || 0} periode data historis. 
                    Prediksi menggunakan asumsi konservatif untuk bisnis baru.
                  </p>
                  <p className="text-xs text-yellow-600">
                    Tingkat kepercayaan: {data.metadata?.dataConfidence ? Math.round(data.metadata.dataConfidence * 100) : 30}% 
                    • Kumpulkan data 3+ bulan untuk prediksi yang lebih akurat
                  </p>
                </div>
              </div>
            </div>
            
            {/* Show forecast cards with conservative predictions */}
            <div className="grid gap-4 md:grid-cols-3">
              <ForecastCard 
                period="Bulan Depan" 
                data={data.nextMonth} 
                currentProfit={currentProfit}
              />
              <ForecastCard 
                period="3 Bulan Ke Depan" 
                data={data.nextQuarter} 
                currentProfit={currentProfit}
              />
              <ForecastCard 
                period="Tahun Depan" 
                data={data.nextYear} 
                currentProfit={currentProfit}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Show methodology info for fallback forecast */}
        {data.metadata && (
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <strong>Metodologi prediksi konservatif:</strong> Pertumbuhan bulanan {data.metadata.averageGrowthRate.toFixed(1)}%, 
            COGS {data.metadata.cogsPercentage.toFixed(0)}%, OPEX {data.metadata.opexPercentage.toFixed(0)}% dari revenue. 
            Tingkat kepercayaan disesuaikan dengan ketersediaan data historis.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
        {data.metadata?.validationIssues && data.metadata.validationIssues.length > 0 && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 text-sm font-medium mb-1">
              <span>💡</span>
              <span>Catatan Data:</span>
            </div>
            <ul className="text-xs text-blue-700 space-y-1">
              {data.metadata.validationIssues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
            <p className="text-xs text-blue-600 mt-2 italic">
              *Prediksi telah disesuaikan dengan kondisi bisnis F&B pada umumnya
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ForecastCard 
          period="Bulan Depan" 
          data={data.nextMonth} 
          currentProfit={currentProfit}
        />
        <ForecastCard 
          period="3 Bulan Ke Depan" 
          data={data.nextQuarter} 
          currentProfit={currentProfit}
        />
        <ForecastCard 
          period="Tahun Depan" 
          data={data.nextYear} 
          currentProfit={currentProfit}
        />
      </div>

      {data.metadata && (
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <strong>Basis perhitungan:</strong> Data {data.metadata.historyLength} periode terakhir, 
          pertumbuhan rata-rata {data.metadata.averageGrowthRate.toFixed(1)}% per bulan
        </div>
      )}
    </div>
  );
};

export default ForecastSection;
