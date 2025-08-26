import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Package, 
  Users, 
  Megaphone, 
  DollarSign,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { BusinessType } from '../utils/config/profitConfig';
import {
  performSeasonalAnalysis,
  formatPeriod,
  getPatternColor,
  getRecommendationIcon,
  SeasonalAnalysisResult,
  SeasonalTrend,
  SeasonalPattern,
  StockPlanningRecommendation
} from '../utils/seasonalAnalysis';
import { formatCurrency } from '@/utils/formatUtils';

interface SeasonalAnalysisCardProps {
  historicalData: RealTimeProfitCalculation[];
  businessType: BusinessType;
  currentMonth?: number;
}

const SeasonalAnalysisCard: React.FC<SeasonalAnalysisCardProps> = ({
  historicalData,
  businessType,
  currentMonth = new Date().getMonth() + 1
}) => {
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);
  
  const analysisResult: SeasonalAnalysisResult = performSeasonalAnalysis(
    historicalData,
    businessType,
    currentMonth
  );

  const getSeasonalIcon = (type: SeasonalPattern['type']) => {
    switch (type) {
      case 'peak': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'low': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'normal': return <BarChart3 className="h-4 w-4 text-blue-600" />;
      default: return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeframeColor = (timeframe: string) => {
    switch (timeframe) {
      case 'immediate': return 'bg-red-50 border-red-200';
      case 'short_term': return 'bg-yellow-50 border-yellow-200';
      case 'medium_term': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: StockPlanningRecommendation['category']) => {
    switch (category) {
      case 'inventory': return <Package className="h-4 w-4" />;
      case 'staffing': return <Users className="h-4 w-4" />;
      case 'marketing': return <Megaphone className="h-4 w-4" />;
      case 'pricing': return <DollarSign className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getGrowthTrendIcon = (growthRate: number) => {
    if (growthRate > 5) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growthRate < -5) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <BarChart3 className="h-4 w-4 text-blue-600" />;
  };

  const currentPattern = analysisResult.patterns.find(p => p.months.includes(currentMonth));
  const recentTrends = analysisResult.trends.slice(-6);
  const averageGrowth = recentTrends.length > 0 
    ? recentTrends.reduce((sum, t) => sum + t.growthRate, 0) / recentTrends.length 
    : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Analisis Tren Musiman & Perencanaan Stok
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">
              Akurasi: {analysisResult.forecastAccuracy.toFixed(0)}%
            </Badge>
            {currentPattern && (
              <Badge className={`${getPatternColor(currentPattern.type)} bg-opacity-10`}>
                {currentPattern.type === 'peak' ? 'Peak Season' : 
                 currentPattern.type === 'low' ? 'Low Season' : 'Normal Period'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Tren Historis</TabsTrigger>
            <TabsTrigger value="patterns">Pola Musiman</TabsTrigger>
            <TabsTrigger value="recommendations">Rekomendasi</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Current Period Status */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Periode Saat Ini</span>
                  {currentPattern && getSeasonalIcon(currentPattern.type)}
                </div>
                <div className="text-xl font-bold">
                  {formatPeriod(currentMonth)}
                </div>
                <div className="text-sm text-gray-600">
                  {currentPattern ? currentPattern.description : 'Periode normal'}
                </div>
              </div>

              {/* Growth Trend */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Tren Pertumbuhan</span>
                  {getGrowthTrendIcon(averageGrowth)}
                </div>
                <div className={`text-xl font-bold ${
                  averageGrowth > 0 ? 'text-green-600' : averageGrowth < 0 ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {averageGrowth > 0 ? '+' : ''}{averageGrowth.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  Rata-rata 6 bulan terakhir
                </div>
              </div>

              {/* Next Peak Period */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Peak Berikutnya</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-xl font-bold">
                  {formatPeriod(analysisResult.nextPeakPeriod.startMonth)}
                </div>
                <div className="text-sm text-gray-600">
                  Estimasi +{analysisResult.nextPeakPeriod.expectedGrowth}%
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Insight Utama</h4>
              <div className="space-y-2">
                {analysisResult.insights.slice(0, 3).map((insight, index) => (
                  <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Forecast Accuracy */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold">Akurasi Prediksi</h5>
                <span className="text-sm text-gray-600">
                  {analysisResult.forecastAccuracy.toFixed(0)}%
                </span>
              </div>
              <Progress value={analysisResult.forecastAccuracy} className="h-2" />
              <p className="text-xs text-gray-600 mt-2">
                Berdasarkan perbandingan prediksi vs aktual 12 bulan terakhir
              </p>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Tren Historis Revenue</h4>
              
              {analysisResult.trends.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Data historis tidak cukup untuk analisis tren. Minimal diperlukan data 6 bulan.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {analysisResult.trends.slice(-12).map((trend, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {formatPeriod(trend.month, trend.year)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge className={trend.seasonalIndex > 1.1 ? 'bg-green-100 text-green-800' : 
                                           trend.seasonalIndex < 0.9 ? 'bg-red-100 text-red-800' : 
                                           'bg-blue-100 text-blue-800'}>
                            Index: {trend.seasonalIndex.toFixed(2)}
                          </Badge>
                          {trend.growthRate !== 0 && (
                            <Badge className={trend.growthRate > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {trend.growthRate > 0 ? '+' : ''}{trend.growthRate.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Revenue:</span>
                          <div className="font-medium">{formatCurrency(trend.revenue)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">COGS:</span>
                          <div className="font-medium">{formatCurrency(trend.cogs)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Profit:</span>
                          <div className={`font-medium ${trend.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(trend.profit)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Margin:</span>
                          <div className={`font-medium ${trend.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.profitMargin.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Pola Musiman Bisnis</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysisResult.patterns.map((pattern, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${
                    pattern.months.includes(currentMonth) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getSeasonalIcon(pattern.type)}
                        <span className="font-medium capitalize">
                          {pattern.type === 'peak' ? 'Peak Season' : 
                           pattern.type === 'low' ? 'Low Season' : 'Normal Period'}
                        </span>
                      </div>
                      <Badge className={`${getPatternColor(pattern.type)} bg-opacity-10`}>
                        {Math.round((pattern.averageMultiplier - 1) * 100) > 0 ? '+' : ''}
                        {Math.round((pattern.averageMultiplier - 1) * 100)}%
                      </Badge>
                    </div>
                    
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-600">Bulan:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pattern.months.map(month => (
                          <Badge 
                            key={month} 
                            variant="outline" 
                            className={month === currentMonth ? 'bg-blue-100 border-blue-300' : ''}
                          >
                            {formatPeriod(month)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{pattern.description}</p>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-600">Rekomendasi Utama:</span>
                      <ul className="list-disc list-inside text-xs text-gray-600 mt-1 space-y-1">
                        {pattern.recommendations.slice(0, 2).map((rec, recIndex) => (
                          <li key={recIndex}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">Rekomendasi Perencanaan Stok</h4>
                <Badge className="bg-gray-100 text-gray-800">
                  {analysisResult.stockRecommendations.length} Rekomendasi
                </Badge>
              </div>
              
              <div className="space-y-3">
                {analysisResult.stockRecommendations.map((recommendation, index) => (
                  <div 
                    key={index} 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedRecommendation === recommendation.period 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    } ${getTimeframeColor(recommendation.timeframe)}`}
                    onClick={() => setSelectedRecommendation(
                      selectedRecommendation === recommendation.period ? null : recommendation.period
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(recommendation.category)}
                        <span className="font-medium capitalize">
                          {recommendation.category.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority}
                        </Badge>
                        <Badge variant="outline">
                          {recommendation.timeframe.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-600">Periode: </span>
                      <span className="text-sm">{recommendation.period}</span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">{recommendation.action}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Estimasi Dampak: 
                        <span className="font-medium text-green-600">
                          +{recommendation.estimatedImpact}%
                        </span>
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecommendation(
                            selectedRecommendation === recommendation.period ? null : recommendation.period
                          );
                        }}
                      >
                        {selectedRecommendation === recommendation.period ? 'Tutup' : 'Detail'}
                      </Button>
                    </div>
                    
                    {selectedRecommendation === recommendation.period && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-600">KPI yang Dipantau:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {recommendation.kpiToTrack.map((kpi, kpiIndex) => (
                                <Badge key={kpiIndex} variant="outline" className="text-xs">
                                  {kpi.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Siap untuk implementasi</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {analysisResult.stockRecommendations.length === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Tidak ada rekomendasi khusus saat ini. Pertahankan operasional normal dan pantau tren pasar.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SeasonalAnalysisCard;