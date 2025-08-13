// src/components/financial/profit-analysis/tabs/PerbandinganTab.tsx
// ✅ TAB PERBANDINGAN - Complete version with comprehensive comparison

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Target,
  Calculator
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { ProfitAnalysisResult, PROFIT_MARGIN_THRESHOLDS } from '@/components/profitAnalysis/types';

interface PerbandinganTabProps {
  profitData: ProfitAnalysisResult;
}

export const PerbandinganTab: React.FC<PerbandinganTabProps> = ({ profitData }) => {
  const [comparisonView, setComparisonView] = useState('cash-vs-real');

  // Calculate cash flow (old method)
  const cashFlow = profitData.profitMarginData.revenue - (profitData.profitMarginData.cogs + profitData.profitMarginData.opex);
  const realProfit = profitData.profitMarginData.netProfit;
  const difference = Math.abs(realProfit - cashFlow);
  const isRealProfitHigher = realProfit > cashFlow;

  // Industry benchmarks data
  const industryBenchmarks = PROFIT_MARGIN_THRESHOLDS;

  // Competitive analysis simulation
  const competitiveAnalysis = {
    yourCompany: {
      grossMargin: profitData.profitMarginData.grossMargin,
      netMargin: profitData.profitMarginData.netMargin,
      cogsRatio: (profitData.cogsBreakdown.totalCOGS / profitData.profitMarginData.revenue) * 100,
      opexRatio: (profitData.opexBreakdown.totalOPEX / profitData.profitMarginData.revenue) * 100
    },
    industryAverage: {
      grossMargin: 28,
      netMargin: 12,
      cogsRatio: 65,
      opexRatio: 18
    },
    topPerformers: {
      grossMargin: 45,
      netMargin: 20,
      cogsRatio: 55,
      opexRatio: 15
    }
  };

  const getMarginStatus = (margin: number, type: 'gross' | 'net') => {
    const benchmarks = industryBenchmarks[type === 'gross' ? 'grossMargin' : 'netMargin'];
    
    if (margin >= benchmarks.excellent) return { status: 'Sangat Baik', color: 'green', description: 'Performa excellent' };
    if (margin >= benchmarks.good) return { status: 'Baik', color: 'blue', description: 'Di atas rata-rata' };
    if (margin >= benchmarks.acceptable) return { status: 'Cukup', color: 'yellow', description: 'Memenuhi minimum' };
    if (margin >= benchmarks.poor) return { status: 'Perlu Perbaikan', color: 'orange', description: 'Di bawah standar' };
    return { status: 'Kritis', color: 'red', description: 'Perlu tindakan segera' };
  };

  const getRatioStatus = (current: number, target: number) => {
    const diff = current - target;
    if (diff <= -5) return { status: 'Efisien', color: 'green', description: 'Rasio sangat baik' };
    if (diff <= 0) return { status: 'Baik', color: 'blue', description: 'Rasio sesuai target' };
    if (diff <= 5) return { status: 'Cukup', color: 'yellow', description: 'Rasio sedikit di atas target' };
    return { status: 'Perlu Optimasi', color: 'orange', description: 'Rasio melebihi target' };
  };

  return (
    <div className="space-y-6">
      {/* Comparison View Selector */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Jenis Perbandingan</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={comparisonView} onValueChange={setComparisonView}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cash-vs-real">Cash vs Real</TabsTrigger>
              <TabsTrigger value="benchmarks">Patokan Industri</TabsTrigger>
              <TabsTrigger value="competitive">Analisis Kompetitif</TabsTrigger>
              <TabsTrigger value="improvement">Potensi Perbaikan</TabsTrigger>
            </TabsList>

            {/* Cash Flow vs Real Profit */}
            <TabsContent value="cash-vs-real" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>💰 Perbandingan Metode Perhitungan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded">
                      <h4 className="font-medium text-blue-800 mb-2">📊 Cash Flow (Metode Lama)</h4>
                      <p className="text-3xl font-bold text-blue-700">
                        {formatCurrency(cashFlow)}
                      </p>
                      <p className="text-sm text-blue-600">Pemasukan - Pengeluaran</p>
                      <p className="text-xs text-blue-500 mt-2">
                        ⚠️ Tidak mempertimbangkan alokasi HPP yang akurat
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded">
                      <h4 className="font-medium text-green-800 mb-2">🎯 Laba Bersih (Real Profit)</h4>
                      <p className="text-3xl font-bold text-green-700">
                        {formatCurrency(realProfit)}
                      </p>
                      <p className="text-sm text-green-600">Pendapatan - HPP - OPEX</p>
                      <p className="text-xs text-green-500 mt-2">
                        ✅ Menghitung profit margin sesungguhnya
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded">
                      <h4 className="font-medium text-gray-800 mb-2">📈 Selisih Perhitungan</h4>
                      <div className="flex items-center gap-2">
                        {isRealProfitHigher ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                        <p className="text-2xl font-bold text-gray-700">
                          {formatCurrency(difference)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {isRealProfitHigher 
                          ? "✅ Real profit lebih akurat dan tinggi" 
                          : "⚠️ Ada discrepancy dalam perhitungan HPP"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>🔍 Analisis Perbedaan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Mengapa berbeda?</strong> Cash flow tidak mempertimbangkan:
                        <ul className="mt-2 space-y-1 text-sm">
                          <li>• Alokasi HPP yang akurat berdasarkan warehouse data</li>
                          <li>• Pemisahan COGS dan OPEX yang proper</li>
                          <li>• Overhead allocation yang tepat</li>
                          <li>• Material costing berdasarkan usage sebenarnya</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <h5 className="font-medium">📊 Breakdown Perbedaan:</h5>
                      
                      <div className="bg-red-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="text-red-800">HPP (Real Calculation):</span>
                          <span className="font-medium text-red-700">
                            {formatCurrency(profitData.cogsBreakdown.totalCOGS)}
                          </span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">
                          Material + Labor + Overhead dengan alokasi akurat
                        </p>
                      </div>

                      <div className="bg-purple-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="text-purple-800">OPEX (Categorized):</span>
                          <span className="font-medium text-purple-700">
                            {formatCurrency(profitData.opexBreakdown.totalOPEX)}
                          </span>
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                          Administrasi + Penjualan + Umum (non-production)
                        </p>
                      </div>

                      <div className="bg-green-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="text-green-800">Margin Accuracy:</span>
                          <span className="font-medium text-green-700">
                            {((difference / profitData.profitMarginData.revenue) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Peningkatan akurasi dari metode cash flow
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Industry Benchmarks */}
            <TabsContent value="benchmarks" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>📊 Patokan Margin Industri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Margin Kotor</span>
                        <div className="text-right">
                          <span className="text-sm font-bold">{profitData.profitMarginData.grossMargin.toFixed(1)}%</span>
                          <Badge 
                            variant={getMarginStatus(profitData.profitMarginData.grossMargin, 'gross').color === 'green' ? "default" : "secondary"}
                            className="ml-2 text-xs"
                          >
                            {getMarginStatus(profitData.profitMarginData.grossMargin, 'gross').status}
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={profitData.profitMarginData.grossMargin} 
                        max={50}
                        className={`h-2 bg-${getMarginStatus(profitData.profitMarginData.grossMargin, 'gross').color}-500`} 
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        {getMarginStatus(profitData.profitMarginData.grossMargin, 'gross').description}
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Margin Bersih</span>
                        <div className="text-right">
                          <span className="text-sm font-bold">{profitData.profitMarginData.netMargin.toFixed(1)}%</span>
                          <Badge 
                            variant={getMarginStatus(profitData.profitMarginData.netMargin, 'net').color === 'green' ? "default" : "secondary"}
                            className="ml-2 text-xs"
                          >
                            {getMarginStatus(profitData.profitMarginData.netMargin, 'net').status}
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={profitData.profitMarginData.netMargin} 
                        max={30}
                        className={`h-2 bg-${getMarginStatus(profitData.profitMarginData.netMargin, 'net').color}-500`} 
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        {getMarginStatus(profitData.profitMarginData.netMargin, 'net').description}
                      </p>
                    </div>

                    <Alert>
                      <Target className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Target Industri:</strong>
                        <ul className="mt-2 space-y-1 text-sm">
                          <li>• Margin Kotor Excellent: ≥{industryBenchmarks.grossMargin.excellent}%</li>
                          <li>• Margin Bersih Excellent: ≥{industryBenchmarks.netMargin.excellent}%</li>
                          <li>• Rasio COGS Target: ≤70%</li>
                          <li>• Rasio OPEX Target: ≤20%</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>🔍 Rasio Biaya vs Industri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries({
                      COGS: (profitData.cogsBreakdown.totalCOGS / profitData.profitMarginData.revenue) * 100,
                      OPEX: (profitData.opexBreakdown.totalOPEX / profitData.profitMarginData.revenue) * 100,
                      Material: (profitData.cogsBreakdown.totalMaterialCost / profitData.profitMarginData.revenue) * 100,
                      Labor: (profitData.cogsBreakdown.totalDirectLaborCost / profitData.profitMarginData.revenue) * 100
                    }).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">{key}</span>
                          <div className="text-right">
                            <span className="text-sm font-bold">{value.toFixed(1)}%</span>
                            <Badge 
                              variant={getRatioStatus(value, 70).color === 'green' ? "default" : "secondary"}
                              className="ml-2 text-xs"
                            >
                              {getRatioStatus(value, 70).status}
                            </Badge>
                          </div>
                        </div>
                        <Progress 
                          value={value} 
                          max={100}
                          className={`h-2 bg-${getRatioStatus(value, 70).color}-500`} 
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          {getRatioStatus(value, 70).description}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Competitive Analysis */}
            <TabsContent value="competitive" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>🏆 Analisis Kompetitif</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h5 className="font-medium mb-2">📊 Perbandingan Margin</h5>
                      <div className="bg-gray-100 p-4 rounded">
                        ```chartjs
                        {
                          type: 'bar',
                          data: {
                            labels: ['Your Company', 'Industry Average', 'Top Performers'],
                            datasets: [
                              {
                                label: 'Gross Margin (%)',
                                data: [
                                  ${competitiveAnalysis.yourCompany.grossMargin},
                                  ${competitiveAnalysis.industryAverage.grossMargin},
                                  ${competitiveAnalysis.topPerformers.grossMargin}
                                ],
                                backgroundColor: '#4CAF50',
                                borderColor: '#388E3C',
                                borderWidth: 1
                              },
                              {
                                label: 'Net Margin (%)',
                                data: [
                                  ${competitiveAnalysis.yourCompany.netMargin},
                                  ${competitiveAnalysis.industryAverage.netMargin},
                                  ${competitiveAnalysis.topPerformers.netMargin}
                                ],
                                backgroundColor: '#2196F3',
                                borderColor: '#1976D2',
                                borderWidth: 1
                              }
                            ]
                          },
                          options: {
                            scales: {
                              y: {
                                beginAtZero: true,
                                title: {
                                  display: true,
                                  text: 'Margin (%)'
                                }
                              }
                            },
                            plugins: {
                              legend: {
                                position: 'top'
                              }
                            }
                          }
                        }
                        ```
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">🔍 Analisis Rasio Biaya</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries({
                          'COGS Ratio': competitiveAnalysis.yourCompany.cogsRatio,
                          'OPEX Ratio': competitiveAnalysis.yourCompany.opexRatio
                        }).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 p-4 rounded">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">{key}</span>
                              <span className="text-sm font-bold">{value.toFixed(1)}%</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              vs Industri: {competitiveAnalysis.industryAverage[key.toLowerCase().replace(' ', '') as keyof typeof competitiveAnalysis.industryAverage].toFixed(1)}%
                              <br />
                              vs Top: {competitiveAnalysis.topPerformers[key.toLowerCase().replace(' ', '') as keyof typeof competitiveAnalysis.topPerformers].toFixed(1)}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Alert>
                      <BarChart3 className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Rekomendasi:</strong>
                        <ul className="mt-2 space-y-1 text-sm">
                          <li>• Optimasi COGS untuk mendekati top performers (55%)</li>
                          <li>• Reduksi OPEX melalui efisiensi operasional</li>
                          <li>• Benchmark dengan top performers untuk strategi pricing</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Improvement Potential */}
            <TabsContent value="improvement" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>🚀 Potensi Perbaikan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profitData.insights
                      .filter(insight => insight.impact === 'high' || insight.impact === 'medium')
                      .map((insight, index) => (
                        <Alert key={index}>
                          <AlertTriangle className={`h-4 w-4 ${insight.type === 'critical' ? 'text-red-600' : 'text-yellow-600'}`} />
                          <AlertDescription>
                            <strong>{insight.title}</strong>
                            <p className="text-sm">{insight.message}</p>
                            {insight.recommendation && (
                              <p className="text-xs text-gray-600 mt-1">Rekomendasi: {insight.recommendation}</p>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>🎯 Target Optimasi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-2">Skenario Perbaikan</h5>
                      <div className="space-y-3">
                        <div className="bg-green-50 p-3 rounded">
                          <div className="flex justify-between">
                            <span className="text-green-800">Reduksi COGS 10%</span>
                            <span className="font-medium text-green-700">
                              +{formatCurrency(profitData.cogsBreakdown.totalCOGS * 0.1)}
                            </span>
                          </div>
                          <p className="text-xs text-green-600 mt-1">
                            Potensi kenaikan laba bersih
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="flex justify-between">
                            <span className="text-blue-800">Reduksi OPEX 10%</span>
                            <span className="font-medium text-blue-700">
                              +{formatCurrency(profitData.opexBreakdown.totalOPEX * 0.1)}
                            </span>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            Potensi kenaikan laba bersih
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Calculator className="h-4 w-4 mr-2" />
                      Simulasikan Skenario Lain
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};