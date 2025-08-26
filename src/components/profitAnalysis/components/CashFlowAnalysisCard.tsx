import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Calendar, Target } from 'lucide-react';
import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { BusinessType } from '../utils/config/profitConfig';
import {
  performCashFlowAnalysis,
  formatCashFlowMetric,
  getCashFlowHealthScore,
  CashFlowAnalysisResult
} from '../utils/cashFlowAnalysis';
import { formatCurrency } from '@/utils/formatUtils';

interface CashFlowAnalysisCardProps {
  currentAnalysis: RealTimeProfitCalculation;
  businessType: BusinessType;
  additionalData?: {
    currentCash?: number;
    accountsReceivable?: number;
    inventory?: number;
    accountsPayable?: number;
  };
}

const CashFlowAnalysisCard: React.FC<CashFlowAnalysisCardProps> = ({
  currentAnalysis,
  businessType,
  additionalData
}) => {
  const analysisResult: CashFlowAnalysisResult = performCashFlowAnalysis(
    currentAnalysis,
    businessType,
    additionalData
  );

  const healthScore = getCashFlowHealthScore(analysisResult.metrics, businessType);

  const getHealthScoreColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Analisis Cash Flow & Modal Kerja
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${getHealthScoreColor(healthScore.grade)} bg-opacity-10`}>
              Skor: {healthScore.score}/100 ({healthScore.grade})
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metrics">Metrik</TabsTrigger>
            <TabsTrigger value="forecast">Proyeksi</TabsTrigger>
            <TabsTrigger value="working-capital">Modal Kerja</TabsTrigger>
            <TabsTrigger value="insights">Insight</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Operating Cash Flow</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(analysisResult.metrics.operatingCashFlow)}
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Free Cash Flow</span>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(analysisResult.metrics.freeCashFlow)}
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Cash Runway</span>
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-2xl font-bold">
                  {Math.round(analysisResult.metrics.cashRunway)} hari
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Cash Conversion Cycle</span>
                  <Target className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold">
                  {Math.round(analysisResult.metrics.cashConversionCycle)} hari
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Inventory Turnover</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold">
                  {analysisResult.metrics.inventoryTurnover.toFixed(1)}x/tahun
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Cash Burn Rate</span>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(analysisResult.metrics.cashBurnRate)}/hari
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Proyeksi Cash Flow 6 Bulan</h4>
              <div className="space-y-3">
                {analysisResult.forecast.map((period, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{period.period}</span>
                      <Badge 
                        className={period.projectedCashFlow >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {period.projectedCashFlow >= 0 ? 'Positif' : 'Negatif'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Revenue:</span>
                        <div className="font-medium">{formatCurrency(period.projectedRevenue)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">COGS:</span>
                        <div className="font-medium">{formatCurrency(period.projectedCogs)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">OpEx:</span>
                        <div className="font-medium">{formatCurrency(period.projectedOpex)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Net Cash Flow:</span>
                        <div className={`font-medium ${period.projectedCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(period.projectedCashFlow)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-gray-600 text-sm">Kumulatif: </span>
                      <span className={`font-medium ${period.cumulativeCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(period.cumulativeCashFlow)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="working-capital" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">Analisis Modal Kerja</h4>
                <Badge className={getRiskLevelColor(analysisResult.workingCapitalAnalysis.riskLevel)}>
                  Risk: {analysisResult.workingCapitalAnalysis.riskLevel.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Modal Kerja Saat Ini</span>
                  <div className="text-xl font-bold">
                    {formatCurrency(analysisResult.workingCapitalAnalysis.currentWorkingCapital)}
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Modal Kerja Optimal</span>
                  <div className="text-xl font-bold">
                    {formatCurrency(analysisResult.workingCapitalAnalysis.optimalWorkingCapital)}
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Gap Modal Kerja</span>
                  <div className={`text-xl font-bold ${
                    analysisResult.workingCapitalAnalysis.workingCapitalGap > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(Math.abs(analysisResult.workingCapitalAnalysis.workingCapitalGap))}
                    {analysisResult.workingCapitalAnalysis.workingCapitalGap > 0 ? ' kurang' : ' surplus'}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-semibold">Rekomendasi Modal Kerja</h5>
                {analysisResult.workingCapitalAnalysis.recommendations.map((rec, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{rec.type.replace('_', ' ')}</span>
                      <div className="flex gap-2">
                        <Badge className={rec.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                         rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                         'bg-green-100 text-green-800'}>
                          {rec.priority}
                        </Badge>
                        <Badge variant="outline">{rec.timeframe.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <div className="text-sm">
                      <span className="font-medium">Estimasi Dampak: </span>
                      <span className="text-green-600">{formatCurrency(rec.estimatedImpact)}</span>
                    </div>
                    <div className="mt-2">
                      <span className="font-medium text-sm">Langkah Aksi:</span>
                      <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                        {rec.actionSteps.map((step, stepIndex) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Insight & Peringatan</h4>
              
              {analysisResult.alerts.length > 0 && (
                <div className="space-y-3">
                  <h5 className="font-semibold text-red-600">Peringatan</h5>
                  {analysisResult.alerts.map((alert, index) => (
                    <Alert key={index} variant={getAlertVariant(alert.type) as any}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm mt-1">{alert.message}</div>
                        {alert.actionRequired && (
                          <div className="text-sm mt-2 font-medium">⚠️ Tindakan segera diperlukan</div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <h5 className="font-semibold text-blue-600">Insight Bisnis</h5>
                <div className="space-y-2">
                  {analysisResult.insights.map((insight, index) => (
                    <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-semibold mb-2">Skor Kesehatan Cash Flow</h5>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Progress value={healthScore.score} className="h-3" />
                  </div>
                  <div className={`text-2xl font-bold ${getHealthScoreColor(healthScore.grade)}`}>
                    {healthScore.grade}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{healthScore.description}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CashFlowAnalysisCard;