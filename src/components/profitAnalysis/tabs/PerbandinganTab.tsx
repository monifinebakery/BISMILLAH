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
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency } from '../utils/formatters';
import { ProfitAnalysisResult, PROFIT_MARGIN_THRESHOLDS } from '@/components/profitAnalysis/types';
import { cn } from '@/lib/utils';

interface PerbandinganTabProps {
  profitData: ProfitAnalysisResult;
}

export const PerbandinganTab: React.FC<PerbandinganTabProps> = ({ profitData }) => {
  const isMobile = useIsMobile();
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
    <div className={cn("space-y-6", isMobile && "space-y-4")}>
      {/* Comparison View Selector */}
      <Card>
        <CardHeader className={cn("p-6", isMobile && "p-4")}>
          <CardTitle className={cn(isMobile && "text-base")}>📊 Jenis Perbandingan</CardTitle>
        </CardHeader>
        <CardContent className={cn("p-6", isMobile && "p-4")}>
          <Tabs value={comparisonView} onValueChange={setComparisonView}>
            <TabsList className={cn(
              "grid w-full grid-cols-4",
              isMobile && "flex overflow-x-auto whitespace-nowrap"
            )}>
              <TabsTrigger value="cash-vs-real" className={isMobile ? "text-xs px-2" : ""}>Cash vs Real</TabsTrigger>
              <TabsTrigger value="benchmarks" className={isMobile ? "text-xs px-2" : ""}>Patokan Industri</TabsTrigger>
              <TabsTrigger value="competitive" className={isMobile ? "text-xs px-2" : ""}>Analisis Kompetitif</TabsTrigger>
              <TabsTrigger value="improvement" className={isMobile ? "text-xs px-2" : ""}>Potensi Perbaikan</TabsTrigger>
            </TabsList>

            {/* Cash Flow vs Real Profit */}
            <TabsContent value="cash-vs-real" className={cn("mt-6", isMobile && "mt-4")}>
              <div className={cn("grid grid-cols-1 gap-6", !isMobile && "lg:grid-cols-2")}>
                <Card>
                  <CardHeader className={cn("p-4", isMobile && "p-3")}>
                    <CardTitle className={cn(isMobile && "text-base")}>💰 Perbandingan Metode Perhitungan</CardTitle>
                  </CardHeader>
                  <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
                    <div className="bg-blue-50 p-3 rounded">
                      <h4 className={cn("font-medium text-blue-800 mb-2", isMobile && "text-sm")}>📊 Cash Flow (Metode Lama)</h4>
                      <p className={cn("text-3xl font-bold text-blue-700", isMobile && "text-xl")}>
                        {formatCurrency(cashFlow)}
                      </p>
                      <p className={cn("text-sm text-blue-600", isMobile && "text-xs")}>Pemasukan - Pengeluaran</p>
                      <p className={cn("text-xs text-blue-500 mt-2", isMobile && "text-[0.65rem]")}>
                        ⚠️ Tidak mempertimbangkan alokasi HPP yang akurat
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded">
                      <h4 className={cn("font-medium text-green-800 mb-2", isMobile && "text-sm")}>🎯 Laba Bersih (Real Profit)</h4>
                      <p className={cn("text-3xl font-bold text-green-700", isMobile && "text-xl")}>
                        {formatCurrency(realProfit)}
                      </p>
                      <p className={cn("text-sm text-green-600", isMobile && "text-xs")}>Pendapatan - HPP - OPEX</p>
                      <p className={cn("text-xs text-green-500 mt-2", isMobile && "text-[0.65rem]")}>
                        ✅ Menghitung profit margin sesungguhnya
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded">
                      <h4 className={cn("font-medium text-gray-800 mb-2", isMobile && "text-sm")}>📈 Selisih Perhitungan</h4>
                      <div className="flex items-center gap-2">
                        {isRealProfitHigher ? (
                          <TrendingUp className={cn("h-5 w-5 text-green-600", isMobile && "h-4 w-4")} />
                        ) : (
                          <TrendingDown className={cn("h-5 w-5 text-red-600", isMobile && "h-4 w-4")} />
                        )}
                        <p className={cn("text-2xl font-bold text-gray-700", isMobile && "text-lg")}>
                          {formatCurrency(difference)}
                        </p>
                      </div>
                      <p className={cn("text-sm text-gray-600 mt-2", isMobile && "text-xs")}>
                        {isRealProfitHigher 
                          ? "✅ Real profit lebih akurat dan tinggi" 
                          : "⚠️ Ada discrepancy dalam perhitungan HPP"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className={cn("p-4", isMobile && "p-3")}>
                    <CardTitle className={cn(isMobile && "text-base")}>🔍 Analisis Perbedaan</CardTitle>
                  </CardHeader>
                  <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
                    <Alert>
                      <AlertTriangle className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
                      <AlertDescription>
                        <strong className={isMobile ? "text-sm" : ""}>Mengapa berbeda?</strong>
                        <ul className={cn("mt-2 space-y-1 text-sm", isMobile && "text-xs")}>
                          <li>• Alokasi HPP yang akurat berdasarkan warehouse data</li>
                          <li>• Pemisahan COGS dan OPEX yang proper</li>
                          <li>• Overhead allocation yang tepat</li>
                          <li>• Material costing berdasarkan usage sebenarnya</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <h5 className={cn("font-medium", isMobile && "text-sm")}>📊 Breakdown Perbedaan:</h5>
                      
                      <div className="bg-red-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className={cn("text-red-800", isMobile && "text-sm")}>HPP (Real Calculation):</span>
                          <span className={cn("font-medium text-red-700", isMobile && "text-sm")}>
                            {formatCurrency(profitData.cogsBreakdown.totalCOGS)}
                          </span>
                        </div>
                        <p className={cn("text-xs text-red-600 mt-1", isMobile && "text-[0.65rem]")}>
                          Material + Labor + Overhead dengan alokasi akurat
                        </p>
                      </div>

                      <div className="bg-purple-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className={cn("text-purple-800", isMobile && "text-sm")}>OPEX (Categorized):</span>
                          <span className={cn("font-medium text-purple-700", isMobile && "text-sm")}>
                            {formatCurrency(profitData.opexBreakdown.totalOPEX)}
                          </span>
                        </div>
                        <p className={cn("text-xs text-purple-600 mt-1", isMobile && "text-[0.65rem]")}>
                          Administrasi + Penjualan + Umum (non-production)
                        </p>
                      </div>

                      <div className="bg-green-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className={cn("text-green-800", isMobile && "text-sm")}>Margin Accuracy:</span>
                          <span className={cn("font-medium text-green-700", isMobile && "text-sm")}>
                            {((difference / profitData.profitMarginData.revenue) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className={cn("text-xs text-green-600 mt-1", isMobile && "text-[0.65rem]")}>
                          Peningkatan akurasi dari metode cash flow
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Industry Benchmarks */}
            <TabsContent value="benchmarks" className={cn("mt-6", isMobile && "mt-4")}>
              <div className={cn("grid grid-cols-1 gap-6", !isMobile && "lg:grid-cols-2")}>
                <Card>
                  <CardHeader className={cn("p-4", isMobile && "p-3")}>
                    <CardTitle className={cn(isMobile && "text-base")}>📊 Patokan Margin Industri</CardTitle>
                  </CardHeader>
                  <CardContent className={cn("space-y-6 p-4", isMobile && "space-y-4 p-3")}>
                    <div>
                      <div className={cn("flex justify-between items-center mb-2", isMobile && "mb-1")}>
                        <span className={cn("text-sm font-medium", isMobile && "text-xs")}>Margin Kotor</span>
                        <div className="text-right">
                          <span className={cn("text-sm font-bold", isMobile && "text-xs")}>
                            {profitData.profitMarginData.grossMargin.toFixed(1)}%
                          </span>
                          <Badge 
                            variant={getMarginStatus(profitData.profitMarginData.grossMargin, 'gross').color === 'green' ? "default" : "secondary"}
                            className={cn("ml-2 text-xs", isMobile && "text-[0.65rem]")}
                          >
                            {getMarginStatus(profitData.profitMarginData.grossMargin, 'gross').status}
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={profitData.profitMarginData.grossMargin} 
                        max={50}
                        className={cn(`h-2 bg-${getMarginStatus(profitData.profitMarginData.grossMargin, 'gross').color}-500`, isMobile && "h-1.5")} 
                      />
                        <p className={cn("text-xs text-gray-600 mt-1", isMobile && "text-[0.65rem]")}>
                        {getMarginStatus(profitData.profitMarginData.grossMargin, 'gross').description}
                      </p>
                    </div>

                    <div>
                      <div className={cn("flex justify-between items-center mb-2", isMobile && "mb-1")}>
                        <span className={cn("text-sm font-medium", isMobile && "text-xs")}>Margin Bersih</span>
                        <div className="text-right">
                          <span className={cn("text-sm font-bold", isMobile && "text-xs")}>
                            {profitData.profitMarginData.netMargin.toFixed(1)}%
                          </span>
                          <Badge 
                            variant={getMarginStatus(profitData.profitMarginData.netMargin, 'net').color === 'green' ? "default" : "secondary"}
                            className={cn("ml-2 text-xs", isMobile && "text-[0.65rem]")}
                          >
                            {getMarginStatus(profitData.profitMarginData.netMargin, 'net').status}
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={profitData.profitMarginData.netMargin} 
                        max={30}
                        className={cn(`h-2 bg-${getMarginStatus(profitData.profitMarginData.netMargin, 'net').color}-500`, isMobile && "h-1.5")} 
                      />
                      <p className={cn("text-xs text-gray-600 mt-1", isMobile && "text-[0.65rem]")}>
                        {getMarginStatus(profitData.profitMarginData.netMargin, 'net').description}
                      </p>
                    </div>

                    <Alert>
                      <Target className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
                      <AlertDescription>
                        <strong className={isMobile ? "text-sm" : ""}>Target Industri:</strong>
                        <ul className={cn("mt-2 space-y-1 text-sm", isMobile && "text-xs")}>
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
                  <CardHeader className={cn("p-4", isMobile && "p-3")}>
                    <CardTitle className={cn(isMobile && "text-base")}>🔍 Rasio Biaya vs Industri</CardTitle>
                  </CardHeader>
                  <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
                    {Object.entries({
                      COGS: (profitData.cogsBreakdown.totalCOGS / profitData.profitMarginData.revenue) * 100,
                      OPEX: (profitData.opexBreakdown.totalOPEX / profitData.profitMarginData.revenue) * 100,
                      Material: (profitData.cogsBreakdown.totalMaterialCost / profitData.profitMarginData.revenue) * 100,
                      Labor: (profitData.cogsBreakdown.totalDirectLaborCost / profitData.profitMarginData.revenue) * 100
                    }).map(([key, value]) => (
                      <div key={key}>
                        <div className={cn("flex justify-between items-center mb-2", isMobile && "mb-1")}>
                          <span className={cn("text-sm font-medium", isMobile && "text-xs")}>{key}</span>
                          <div className="text-right">
                            <span className={cn("text-sm font-bold", isMobile && "text-xs")}>{value.toFixed(1)}%</span>
                            <Badge 
                              variant={getRatioStatus(value, 70).color === 'green' ? "default" : "secondary"}
                              className={cn("ml-2 text-xs", isMobile && "text-[0.65rem]")}
                            >
                              {getRatioStatus(value, 70).status}
                            </Badge>
                          </div>
                        </div>
                        <Progress 
                          value={value} 
                          max={100}
                          className={cn(`h-2 bg-${getRatioStatus(value, 70).color}-500`, isMobile && "h-1.5")} 
                        />
                        <p className={cn("text-xs text-gray-600 mt-1", isMobile && "text-[0.65rem]")}>
                          {getRatioStatus(value, 70).description}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Competitive Analysis */}
            <TabsContent value="competitive" className={cn("mt-6", isMobile && "mt-4")}>
              <Card>
                <CardHeader className={cn("p-4", isMobile && "p-3")}>
                  <CardTitle className={cn(isMobile && "text-base")}>🏆 Analisis Kompetitif</CardTitle>
                </CardHeader>
                <CardContent className={cn("p-4", isMobile && "p-3")}>
                  <div className={cn("space-y-6", isMobile && "space-y-4")}>
                    <div>
                      <h5 className={cn("font-medium mb-2", isMobile && "text-sm mb-1")}>📊 Perbandingan Margin</h5>
                      <div className={cn("bg-gray-100 p-4 rounded overflow-x-auto", isMobile && "p-3")}>
                        <pre className={isMobile ? "text-xs" : ""}>
{`{
  type: 'bar',
  data: {
    labels: ['Your Company', 'Industry Average', 'Top Performers'],
    datasets: [
      {
        label: 'Gross Margin (%)',
        data: [${competitiveAnalysis.yourCompany.grossMargin}, ${competitiveAnalysis.industryAverage.grossMargin}, ${competitiveAnalysis.topPerformers.grossMargin}],
        backgroundColor: '#4CAF50',
        borderColor: '#388E3C',
        borderWidth: 1
      },
      {
        label: 'Net Margin (%)',
        data: [${competitiveAnalysis.yourCompany.netMargin}, ${competitiveAnalysis.industryAverage.netMargin}, ${competitiveAnalysis.topPerformers.netMargin}],
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
}`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h5 className={cn("font-medium mb-2", isMobile && "text-sm mb-1")}>🔍 Analisis Rasio Biaya</h5>
                      <div className={cn("grid grid-cols-1 gap-4", !isMobile && "md:grid-cols-2")}>
                        {Object.entries({
                          'COGS Ratio': competitiveAnalysis.yourCompany.cogsRatio,
                          'OPEX Ratio': competitiveAnalysis.yourCompany.opexRatio
                        }).map(([key, value]) => {
                          const normalizedKey = key.toLowerCase().replace(' ', '') as keyof typeof competitiveAnalysis.industryAverage;
                          const industryValue = competitiveAnalysis.industryAverage[normalizedKey];
                          const topPerformerValue = competitiveAnalysis.topPerformers[normalizedKey];
                          
                          return (
                            <div key={key} className={cn("bg-gray-50 p-3 rounded", isMobile && "p-2")}>
                              <div className="flex justify-between">
                                <span className={cn("text-sm font-medium", isMobile && "text-xs")}>{key}</span>
                                <span className={cn("text-sm font-bold", isMobile && "text-xs")}>{value.toFixed(1)}%</span>
                              </div>
                              <p className={cn("text-xs text-gray-600 mt-1", isMobile && "text-[0.65rem]")}>
                                vs Industri: {industryValue !== undefined ? industryValue.toFixed(1) : 'N/A'}%
                                <br />
                                vs Top: {topPerformerValue !== undefined ? topPerformerValue.toFixed(1) : 'N/A'}%
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <Alert>
                      <BarChart3 className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
                      <AlertDescription>
                        <strong className={isMobile ? "text-sm" : ""}>Rekomendasi:</strong>
                        <ul className={cn("mt-2 space-y-1 text-sm", isMobile && "text-xs")}>
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
            <TabsContent value="improvement" className={cn("mt-6", isMobile && "mt-4")}>
              <div className={cn("grid grid-cols-1 gap-6", !isMobile && "lg:grid-cols-2")}>
                <Card>
                  <CardHeader className={cn("p-4", isMobile && "p-3")}>
                    <CardTitle className={cn(isMobile && "text-base")}>🚀 Potensi Perbaikan</CardTitle>
                  </CardHeader>
                  <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
                    {profitData.insights
                      .filter(insight => insight.impact === 'high' || insight.impact === 'medium')
                      .map((insight, index) => (
                        <Alert key={index}>
                          <AlertTriangle className={cn(
                            `h-4 w-4 ${insight.type === 'critical' ? 'text-red-600' : 'text-yellow-600'}`,
                            isMobile && "h-3 w-3"
                          )} />
                          <AlertDescription>
                            <strong className={isMobile ? "text-sm" : ""}>{insight.title}</strong>
                            <p className={cn("text-sm", isMobile && "text-xs")}>{insight.message}</p>
                            {insight.recommendation && (
                              <p className={cn("text-xs text-gray-600 mt-1", isMobile && "text-[0.65rem]")}>
                                Rekomendasi: {insight.recommendation}
                              </p>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className={cn("p-4", isMobile && "p-3")}>
                    <CardTitle className={cn(isMobile && "text-base")}>🎯 Target Optimasi</CardTitle>
                  </CardHeader>
                  <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
                    <div>
                      <h5 className={cn("font-medium mb-2", isMobile && "text-sm mb-1")}>Skenario Perbaikan</h5>
                      <div className="space-y-3">
                        <div className="bg-green-50 p-3 rounded">
                          <div className="flex justify-between">
                            <span className={cn("text-green-800", isMobile && "text-sm")}>Reduksi COGS 10%</span>
                            <span className={cn("font-medium text-green-700", isMobile && "text-sm")}>
                              +{formatCurrency(profitData.cogsBreakdown.totalCOGS * 0.1)}
                            </span>
                          </div>
                          <p className={cn("text-xs text-green-600 mt-1", isMobile && "text-[0.65rem]")}>
                            Potensi kenaikan laba bersih
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="flex justify-between">
                            <span className={cn("text-blue-800", isMobile && "text-sm")}>Reduksi OPEX 10%</span>
                            <span className={cn("font-medium text-blue-700", isMobile && "text-sm")}>
                              +{formatCurrency(profitData.opexBreakdown.totalOPEX * 0.1)}
                            </span>
                          </div>
                          <p className={cn("text-xs text-blue-600 mt-1", isMobile && "text-[0.65rem]")}>
                            Potensi kenaikan laba bersih
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className={cn("w-full", isMobile && "text-xs")}
                    >
                      <Calculator className={cn("h-4 w-4 mr-2", isMobile && "h-3 w-3")} />
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