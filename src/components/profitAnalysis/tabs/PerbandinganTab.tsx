// src/components/profitAnalysis/tabs/PerbandinganTab.tsx
// ✅ UPDATED - Material Usage Integration Compatible

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
  Calculator,
  Database,
  Package2,
  Factory,
  Building,
  DollarSign
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// ✅ Import updated types
import { 
  ProfitAnalysisResult, 
  PROFIT_MARGIN_THRESHOLDS,
  MaterialUsageLog,
  ProductionRecord 
} from '../types';

interface PerbandinganTabProps {
  profitData: ProfitAnalysisResult;
  className?: string;
}

export const PerbandinganTab: React.FC<PerbandinganTabProps> = ({ 
  profitData,
  className 
}) => {
  const isMobile = useIsMobile();
  const [comparisonView, setComparisonView] = useState('cash-vs-real');

  // ✅ Enhanced currency formatter
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  // ✅ Calculate cash flow vs real profit with material usage context
  const calculateCashVsReal = () => {
    const { profitMarginData, cogsBreakdown } = profitData;
    
    // Simple cash flow calculation (old method)
    const cashFlow = profitMarginData.revenue - (profitMarginData.cogs + profitMarginData.opex);
    const realProfit = profitMarginData.netProfit;
    const difference = Math.abs(realProfit - cashFlow);
    const isRealProfitHigher = realProfit > cashFlow;
    
    // ✅ Enhanced accuracy indication based on data source
    const accuracyScore = cogsBreakdown.dataSource === 'actual' ? 95 : 
                         cogsBreakdown.dataSource === 'mixed' ? 75 : 50;
    
    return {
      cashFlow,
      realProfit,
      difference,
      isRealProfitHigher,
      accuracyScore,
      dataSource: cogsBreakdown.dataSource
    };
  };

  const cashVsReal = calculateCashVsReal();

  // ✅ Enhanced industry benchmarks with material usage considerations
  const industryBenchmarks = PROFIT_MARGIN_THRESHOLDS;

  // ✅ Enhanced competitive analysis with material efficiency
  const competitiveAnalysis = {
    yourCompany: {
      grossMargin: profitData.profitMarginData.grossMargin,
      netMargin: profitData.profitMarginData.netMargin,
      cogsRatio: (profitData.cogsBreakdown.totalCOGS / profitData.profitMarginData.revenue) * 100,
      opexRatio: (profitData.opexBreakdown.totalOPEX / profitData.profitMarginData.revenue) * 100,
      materialRatio: (profitData.cogsBreakdown.totalMaterialCost / profitData.profitMarginData.revenue) * 100,
      laborRatio: (profitData.cogsBreakdown.totalDirectLaborCost / profitData.profitMarginData.revenue) * 100,
      materialEfficiency: profitData.cogsBreakdown.dataSource === 'actual' ? 90 : 
                         profitData.cogsBreakdown.dataSource === 'mixed' ? 70 : 50
    },
    industryAverage: {
      grossMargin: 28,
      netMargin: 12,
      cogsRatio: 65,
      opexRatio: 18,
      materialRatio: 40,
      laborRatio: 15,
      materialEfficiency: 60
    },
    topPerformers: {
      grossMargin: 45,
      netMargin: 20,
      cogsRatio: 55,
      opexRatio: 15,
      materialRatio: 30,
      laborRatio: 12,
      materialEfficiency: 95
    }
  };

  // ✅ Enhanced status functions
  const getMarginStatus = (margin: number, type: 'gross' | 'net') => {
    const benchmarks = industryBenchmarks[type === 'gross' ? 'grossMargin' : 'netMargin'];
    
    if (margin >= benchmarks.excellent) return { status: 'Sangat Baik', color: 'green', description: 'Performa excellent' };
    if (margin >= benchmarks.good) return { status: 'Baik', color: 'blue', description: 'Di atas rata-rata' };
    if (margin >= benchmarks.acceptable) return { status: 'Cukup', color: 'yellow', description: 'Memenuhi minimum' };
    if (margin >= benchmarks.poor) return { status: 'Perlu Perbaikan', color: 'orange', description: 'Di bawah standar' };
    return { status: 'Kritis', color: 'red', description: 'Perlu tindakan segera' };
  };

  const getRatioStatus = (current: number, target: number, inverse: boolean = false) => {
    const diff = inverse ? target - current : current - target;
    if (diff <= -5) return { status: 'Sangat Efisien', color: 'green', description: 'Rasio sangat baik' };
    if (diff <= 0) return { status: 'Efisien', color: 'blue', description: 'Rasio sesuai target' };
    if (diff <= 5) return { status: 'Cukup', color: 'yellow', description: 'Rasio sedikit di atas target' };
    return { status: 'Perlu Optimasi', color: 'orange', description: 'Rasio melebihi target' };
  };

  // ✅ Enhanced improvement calculations
  const calculateImprovementPotential = () => {
    const { profitMarginData, cogsBreakdown, opexBreakdown } = profitData;
    
    return {
      cogsReduction10: cogsBreakdown.totalCOGS * 0.1,
      opexReduction10: opexBreakdown.totalOPEX * 0.1,
      materialOptimization: profitData.cogsBreakdown.totalMaterialCost * 0.15, // Material has higher optimization potential
      laborEfficiency: profitData.cogsBreakdown.totalDirectLaborCost * 0.08,
      dataAccuracyGain: profitData.cogsBreakdown.dataSource !== 'actual' ? profitMarginData.revenue * 0.02 : 0
    };
  };

  const improvementPotential = calculateImprovementPotential();

  return (
    <div className={cn("space-y-6", isMobile && "space-y-4", className)}>
      {/* ✅ Enhanced Comparison View Selector */}
      <Card>
        <CardHeader className={cn("p-6", isMobile && "p-4")}>
          <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
            <BarChart3 className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
            Jenis Perbandingan
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("p-6", isMobile && "p-4")}>
          <Tabs value={comparisonView} onValueChange={setComparisonView}>
            <TabsList className={cn(
              "grid w-full grid-cols-4",
              isMobile && "flex overflow-x-auto whitespace-nowrap"
            )}>
              <TabsTrigger value="cash-vs-real" className={isMobile ? "text-xs px-2" : ""}>
                Cash vs Real
              </TabsTrigger>
              <TabsTrigger value="benchmarks" className={isMobile ? "text-xs px-2" : ""}>
                Patokan Industri
              </TabsTrigger>
              <TabsTrigger value="competitive" className={isMobile ? "text-xs px-2" : ""}>
                Analisis Kompetitif
              </TabsTrigger>
              <TabsTrigger value="improvement" className={isMobile ? "text-xs px-2" : ""}>
                Potensi Perbaikan
              </TabsTrigger>
            </TabsList>

            {/* ✅ Enhanced Cash Flow vs Real Profit */}
            <TabsContent value="cash-vs-real" className={cn("mt-6", isMobile && "mt-4")}>
              <div className={cn("grid grid-cols-1 gap-6", !isMobile && "lg:grid-cols-2")}>
                <Card>
                  <CardHeader className={cn("p-4", isMobile && "p-3")}>
                    <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
                      <DollarSign className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
                      Perbandingan Metode Perhitungan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
                    <div className="bg-blue-50 p-3 rounded">
                      <h4 className={cn("font-medium text-blue-800 mb-2", isMobile && "text-sm")}>
                        📊 Cash Flow (Metode Lama)
                      </h4>
                      <p className={cn("text-3xl font-bold text-blue-700", isMobile && "text-xl")}>
                        {formatCurrency(cashVsReal.cashFlow)}
                      </p>
                      <p className={cn("text-sm text-blue-600", isMobile && "text-xs")}>Pemasukan - Pengeluaran</p>
                      <p className={cn("text-xs text-blue-500 mt-2", isMobile && "text-[0.65rem]")}>
                        ⚠️ Tidak mempertimbangkan alokasi HPP yang akurat
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded">
                      <h4 className={cn("font-medium text-green-800 mb-2", isMobile && "text-sm")}>
                        🎯 Laba Bersih (Real Profit)
                      </h4>
                      <p className={cn("text-3xl font-bold text-green-700", isMobile && "text-xl")}>
                        {formatCurrency(cashVsReal.realProfit)}
                      </p>
                      <p className={cn("text-sm text-green-600", isMobile && "text-xs")}>Pendapatan - HPP - OPEX</p>
                      <div className="flex items-center gap-2 mt-2">
                        <p className={cn("text-xs text-green-500", isMobile && "text-[0.65rem]")}>
                          ✅ Menghitung profit margin sesungguhnya
                        </p>
                        <Badge 
                          variant={cashVsReal.dataSource === 'actual' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {cashVsReal.accuracyScore}% akurat
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded">
                      <h4 className={cn("font-medium text-gray-800 mb-2", isMobile && "text-sm")}>
                        📈 Selisih Perhitungan
                      </h4>
                      <div className="flex items-center gap-2">
                        {cashVsReal.isRealProfitHigher ? (
                          <TrendingUp className={cn("h-5 w-5 text-green-600", isMobile && "h-4 w-4")} />
                        ) : (
                          <TrendingDown className={cn("h-5 w-5 text-red-600", isMobile && "h-4 w-4")} />
                        )}
                        <p className={cn("text-2xl font-bold text-gray-700", isMobile && "text-lg")}>
                          {formatCurrency(cashVsReal.difference)}
                        </p>
                      </div>
                      <p className={cn("text-sm text-gray-600 mt-2", isMobile && "text-xs")}>
                        {cashVsReal.isRealProfitHigher 
                          ? "✅ Real profit lebih akurat dan tinggi" 
                          : "⚠️ Ada discrepancy dalam perhitungan HPP"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className={cn("p-4", isMobile && "p-3")}>
                    <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
                      <Database className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
                      Analisis Akurasi Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
                    {/* Data Source Indicator */}
                    <div className={cn(
                      "p-3 rounded border-l-4",
                      cashVsReal.dataSource === 'actual' ? "bg-green-50 border-green-500" :
                      cashVsReal.dataSource === 'mixed' ? "bg-yellow-50 border-yellow-500" :
                      "bg-orange-50 border-orange-500"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <Package2 className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
                        <span className={cn("font-medium", isMobile && "text-sm")}>
                          Data Source: {cashVsReal.dataSource === 'actual' ? 'Aktual' : 
                                      cashVsReal.dataSource === 'mixed' ? 'Campuran' : 'Estimasi'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Akurasi HPP:</span>
                          <span className="font-medium">{cashVsReal.accuracyScore}%</span>
                        </div>
                        <Progress value={cashVsReal.accuracyScore} className="h-2" />
                      </div>
                    </div>

                    {/* Material Usage Stats */}
                    {profitData.cogsBreakdown.actualMaterialUsage && (
                      <div className="bg-blue-50 p-3 rounded">
                        <h5 className={cn("font-medium text-blue-800 mb-2", isMobile && "text-sm")}>
                          📦 Material Usage Data
                        </h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Total Records:</span>
                            <span className="font-medium">
                              {profitData.cogsBreakdown.actualMaterialUsage.length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Usage Types:</span>
                            <span className="font-medium">
                              {Array.from(new Set(profitData.cogsBreakdown.actualMaterialUsage.map(u => u.usage_type))).length}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Production Data Stats */}
                    {profitData.cogsBreakdown.productionData && (
                      <div className="bg-purple-50 p-3 rounded">
                        <h5 className={cn("font-medium text-purple-800 mb-2", isMobile && "text-sm")}>
                          🏭 Production Records
                        </h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Total Batches:</span>
                            <span className="font-medium">
                              {profitData.cogsBreakdown.productionData.length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Avg Unit Cost:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                profitData.cogsBreakdown.productionData.reduce((sum, p) => sum + p.unit_cost, 0) / 
                                profitData.cogsBreakdown.productionData.length
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Alert>
                      <AlertTriangle className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
                      <AlertDescription>
                        <strong className={isMobile ? "text-sm" : ""}>Mengapa berbeda?</strong>
                        <ul className={cn("mt-2 space-y-1 text-sm", isMobile && "text-xs")}>
                          <li>• Alokasi HPP akurat berdasarkan {cashVsReal.dataSource} data</li>
                          <li>• Pemisahan COGS dan OPEX yang proper</li>
                          <li>• Material costing berdasarkan usage sebenarnya</li>
                          <li>• Quality grade considerations dalam production</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ✅ Enhanced Industry Benchmarks */}
            <TabsContent value="benchmarks" className={cn("mt-6", isMobile && "mt-4")}>
              <div className={cn("grid grid-cols-1 gap-6", !isMobile && "lg:grid-cols-2")}>
                <Card>
                  <CardHeader className={cn("p-4", isMobile && "p-3")}>
                    <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
                      <Target className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
                      Patokan Margin Industri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={cn("space-y-6 p-4", isMobile && "space-y-4 p-3")}>
                    <div>
                      <div className={cn("flex justify-between items-center mb-2", isMobile && "mb-1")}>
                        <span className={cn("text-sm font-medium", isMobile && "text-xs")}>Margin Kotor</span>
                        <div className="text-right">
                          <span className={cn("text-sm font-bold", isMobile && "text-xs")}>
                            {formatPercentage(profitData.profitMarginData.grossMargin)}
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
                        value={Math.max(0, profitData.profitMarginData.grossMargin)} 
                        max={50}
                        className={cn("h-2", isMobile && "h-1.5")} 
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
                            {formatPercentage(profitData.profitMarginData.netMargin)}
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
                        value={Math.max(0, profitData.profitMarginData.netMargin)} 
                        max={30}
                        className={cn("h-2", isMobile && "h-1.5")} 
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
                          <li>• Material Cost Target: ≤40%</li>
                          <li>• COGS Target: ≤70%</li>
                          <li>• OPEX Target: ≤20%</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className={cn("p-4", isMobile && "p-3")}>
                    <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
                      <Factory className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
                      Rasio Biaya vs Industri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
                    {Object.entries({
                      'Material Cost': competitiveAnalysis.yourCompany.materialRatio,
                      'Labor Cost': competitiveAnalysis.yourCompany.laborRatio,
                      'Total COGS': competitiveAnalysis.yourCompany.cogsRatio,
                      'OPEX': competitiveAnalysis.yourCompany.opexRatio
                    }).map(([key, value]) => {
                      const targets = {
                        'Material Cost': 40,
                        'Labor Cost': 15,
                        'Total COGS': 70,
                        'OPEX': 20
                      };
                      const target = targets[key as keyof typeof targets];
                      
                      return (
                        <div key={key}>
                          <div className={cn("flex justify-between items-center mb-2", isMobile && "mb-1")}>
                            <span className={cn("text-sm font-medium", isMobile && "text-xs")}>{key}</span>
                            <div className="text-right">
                              <span className={cn("text-sm font-bold", isMobile && "text-xs")}>
                                {formatPercentage(value)}
                              </span>
                              <Badge 
                                variant={getRatioStatus(value, target).color === 'green' ? "default" : "secondary"}
                                className={cn("ml-2 text-xs", isMobile && "text-[0.65rem]")}
                              >
                                {getRatioStatus(value, target).status}
                              </Badge>
                            </div>
                          </div>
                          <Progress 
                            value={Math.min(value, 100)} 
                            max={100}
                            className={cn("h-2", isMobile && "h-1.5")} 
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Target: {target}%</span>
                            <span>
                              {value <= target ? 
                                `✅ ${(target - value).toFixed(1)}% di bawah target` : 
                                `⚠️ ${(value - target).toFixed(1)}% di atas target`
                              }
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Material Efficiency Indicator */}
                    <div className="bg-blue-50 p-3 rounded mt-4">
                      <h5 className={cn("font-medium text-blue-800 mb-2", isMobile && "text-sm")}>
                        📊 Material Efficiency Score
                      </h5>
                      <div className="flex items-center justify-between">
                        <span className={cn("text-sm", isMobile && "text-xs")}>
                          Based on data quality & usage tracking
                        </span>
                        <div className="text-right">
                          <span className={cn("text-lg font-bold text-blue-700", isMobile && "text-base")}>
                            {competitiveAnalysis.yourCompany.materialEfficiency}%
                          </span>
                          <Progress 
                            value={competitiveAnalysis.yourCompany.materialEfficiency} 
                            className="w-20 h-2 mt-1" 
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ✅ Enhanced Competitive Analysis */}
            <TabsContent value="competitive" className={cn("mt-6", isMobile && "mt-4")}>
              <Card>
                <CardHeader className={cn("p-4", isMobile && "p-3")}>
                  <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
                    <BarChart3 className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
                    Analisis Kompetitif
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn("p-4", isMobile && "p-3")}>
                  <div className={cn("space-y-6", isMobile && "space-y-4")}>
                    {/* Comparison Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Metrik</th>
                            <th className="text-center p-2">Your Company</th>
                            <th className="text-center p-2">Industry Avg</th>
                            <th className="text-center p-2">Top Performers</th>
                            <th className="text-center p-2">Gap to Top</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: 'Gross Margin', yours: competitiveAnalysis.yourCompany.grossMargin, industry: competitiveAnalysis.industryAverage.grossMargin, top: competitiveAnalysis.topPerformers.grossMargin, unit: '%' },
                            { key: 'Net Margin', yours: competitiveAnalysis.yourCompany.netMargin, industry: competitiveAnalysis.industryAverage.netMargin, top: competitiveAnalysis.topPerformers.netMargin, unit: '%' },
                            { key: 'Material Ratio', yours: competitiveAnalysis.yourCompany.materialRatio, industry: competitiveAnalysis.industryAverage.materialRatio, top: competitiveAnalysis.topPerformers.materialRatio, unit: '%' },
                            { key: 'Labor Ratio', yours: competitiveAnalysis.yourCompany.laborRatio, industry: competitiveAnalysis.industryAverage.laborRatio, top: competitiveAnalysis.topPerformers.laborRatio, unit: '%' },
                            { key: 'Material Efficiency', yours: competitiveAnalysis.yourCompany.materialEfficiency, industry: competitiveAnalysis.industryAverage.materialEfficiency, top: competitiveAnalysis.topPerformers.materialEfficiency, unit: '%' }
                          ].map((row, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2 font-medium">{row.key}</td>
                              <td className="p-2 text-center">
                                <Badge variant={
                                  (row.key.includes('Margin') || row.key.includes('Efficiency')) 
                                    ? (row.yours >= row.top * 0.9 ? 'default' : row.yours >= row.industry ? 'secondary' : 'destructive')
                                    : (row.yours <= row.top * 1.1 ? 'default' : row.yours <= row.industry ? 'secondary' : 'destructive')
                                }>
                                  {row.yours.toFixed(1)}{row.unit}
                                </Badge>
                              </td>
                              <td className="p-2 text-center text-gray-600">
                                {row.industry.toFixed(1)}{row.unit}
                              </td>
                              <td className="p-2 text-center text-green-600 font-medium">
                                {row.top.toFixed(1)}{row.unit}
                              </td>
                              <td className="p-2 text-center">
                                <span className={cn(
                                  "text-sm",
                                  (row.key.includes('Margin') || row.key.includes('Efficiency'))
                                    ? (row.yours >= row.top ? "text-green-600" : "text-red-600")
                                    : (row.yours <= row.top ? "text-green-600" : "text-red-600")
                                )}>
                                  {(row.key.includes('Margin') || row.key.includes('Efficiency'))
                                    ? (row.top - row.yours > 0 ? `+${(row.top - row.yours).toFixed(1)}` : `${(row.top - row.yours).toFixed(1)}`)
                                    : (row.yours - row.top > 0 ? `+${(row.yours - row.top).toFixed(1)}` : `${(row.yours - row.top).toFixed(1)}`)
                                  }{row.unit}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Competitive Position */}
                    <div className={cn("grid grid-cols-1 gap-4", !isMobile && "md:grid-cols-3")}>
                      <div className="bg-green-50 p-4 rounded">
                        <h5 className={cn("font-medium text-green-800 mb-2", isMobile && "text-sm")}>✅ Kekuatan</h5>
                        <ul className={cn("text-sm text-green-700 space-y-1", isMobile && "text-xs")}>
                          {competitiveAnalysis.yourCompany.grossMargin >= competitiveAnalysis.industryAverage.grossMargin && (
                            <li>• Gross margin di atas rata-rata industri</li>
                          )}
                          {competitiveAnalysis.yourCompany.materialEfficiency >= competitiveAnalysis.industryAverage.materialEfficiency && (
                            <li>• Material efficiency baik</li>
                          )}
                          {profitData.cogsBreakdown.dataSource === 'actual' && (
                            <li>• Data tracking material aktual</li>
                          )}
                          {competitiveAnalysis.yourCompany.cogsRatio <= competitiveAnalysis.industryAverage.cogsRatio && (
                            <li>• COGS ratio terkontrol</li>
                          )}
                        </ul>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded">
                        <h5 className={cn("font-medium text-yellow-800 mb-2", isMobile && "text-sm")}>⚠️ Area Perbaikan</h5>
                        <ul className={cn("text-sm text-yellow-700 space-y-1", isMobile && "text-xs")}>
                          {competitiveAnalysis.yourCompany.netMargin < competitiveAnalysis.industryAverage.netMargin && (
                            <li>• Net margin masih di bawah industri</li>
                          )}
                          {competitiveAnalysis.yourCompany.materialRatio > competitiveAnalysis.industryAverage.materialRatio && (
                            <li>• Material cost ratio tinggi</li>
                          )}
                          {profitData.cogsBreakdown.dataSource !== 'actual' && (
                            <li>• Perlu material usage tracking</li>
                          )}
                          {competitiveAnalysis.yourCompany.opexRatio > competitiveAnalysis.industryAverage.opexRatio && (
                            <li>• OPEX perlu optimisasi</li>
                          )}
                        </ul>
                      </div>

                      <div className="bg-blue-50 p-4 rounded">
                        <h5 className={cn("font-medium text-blue-800 mb-2", isMobile && "text-sm")}>🎯 Target Jangka Pendek</h5>
                        <ul className={cn("text-sm text-blue-700 space-y-1", isMobile && "text-xs")}>
                          <li>• Capai net margin {competitiveAnalysis.industryAverage.netMargin}%</li>
                          <li>• Reduksi material cost ke {competitiveAnalysis.topPerformers.materialRatio}%</li>
                          <li>• Tingkatkan material efficiency ke 90%+</li>
                          <li>• Optimisasi OPEX ke {competitiveAnalysis.topPerformers.opexRatio}%</li>
                        </ul>
                      </div>
                    </div>

                    <Alert>
                      <BarChart3 className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
                      <AlertDescription>
                        <strong className={isMobile ? "text-sm" : ""}>Strategic Recommendations:</strong>
                        <ul className={cn("mt-2 space-y-1 text-sm", isMobile && "text-xs")}>
                          <li>• Benchmark material sourcing dengan top performers</li>
                          <li>• Implement advanced material usage tracking</li>
                          <li>• Develop supplier partnership untuk cost reduction</li>
                          <li>• Focus pada operational efficiency improvements</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ✅ Enhanced Improvement Potential */}
            <TabsContent value="improvement" className={cn("mt-6", isMobile && "mt-4")}>
              <div className={cn("grid grid-cols-1 gap-6", !isMobile && "lg:grid-cols-2")}>
                <Card>
                  <CardHeader className={cn("p-4", isMobile && "p-3")}>
                    <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
                      <TrendingUp className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
                      Potensi Perbaikan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
                    {/* Critical Insights from Data */}
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
                                💡 {insight.recommendation}
                              </p>
                            )}
                            {insight.value !== undefined && (
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                  Impact: {formatCurrency(insight.value)}
                                </Badge>
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}

                    {/* Data Quality Improvement */}
                    {profitData.cogsBreakdown.dataSource !== 'actual' && (
                      <Alert>
                        <Database className={cn("h-4 w-4 text-blue-600", isMobile && "h-3 w-3")} />
                        <AlertDescription>
                          <strong className={isMobile ? "text-sm" : ""}>Data Quality Improvement</strong>
                          <p className={cn("text-sm", isMobile && "text-xs")}>
                            Implement material usage tracking untuk akurasi HPP +{100 - cashVsReal.accuracyScore}%
                          </p>
                          <p className={cn("text-xs text-gray-600 mt-1", isMobile && "text-[0.65rem]")}>
                            💡 Potensi saving: {formatCurrency(improvementPotential.dataAccuracyGain)}
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className={cn("p-4", isMobile && "p-3")}>
                    <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
                      <Calculator className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
                      Simulasi Skenario
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
                    <div>
                      <h5 className={cn("font-medium mb-3", isMobile && "text-sm mb-2")}>💰 Potensi Saving</h5>
                      <div className="space-y-3">
                        <div className="bg-green-50 p-3 rounded">
                          <div className="flex justify-between">
                            <span className={cn("text-green-800", isMobile && "text-sm")}>Material Optimization (15%)</span>
                            <span className={cn("font-medium text-green-700", isMobile && "text-sm")}>
                              +{formatCurrency(improvementPotential.materialOptimization)}
                            </span>
                          </div>
                          <p className={cn("text-xs text-green-600 mt-1", isMobile && "text-[0.65rem]")}>
                            Supplier negotiation + waste reduction
                          </p>
                        </div>

                        <div className="bg-blue-50 p-3 rounded">
                          <div className="flex justify-between">
                            <span className={cn("text-blue-800", isMobile && "text-sm")}>Labor Efficiency (8%)</span>
                            <span className={cn("font-medium text-blue-700", isMobile && "text-sm")}>
                              +{formatCurrency(improvementPotential.laborEfficiency)}
                            </span>
                          </div>
                          <p className={cn("text-xs text-blue-600 mt-1", isMobile && "text-[0.65rem]")}>
                            Productivity improvements + automation
                          </p>
                        </div>

                        <div className="bg-purple-50 p-3 rounded">
                          <div className="flex justify-between">
                            <span className={cn("text-purple-800", isMobile && "text-sm")}>OPEX Reduction (10%)</span>
                            <span className={cn("font-medium text-purple-700", isMobile && "text-sm")}>
                              +{formatCurrency(improvementPotential.opexReduction10)}
                            </span>
                          </div>
                          <p className={cn("text-xs text-purple-600 mt-1", isMobile && "text-[0.65rem]")}>
                            Administrative efficiency + cost control
                          </p>
                        </div>

                        {improvementPotential.dataAccuracyGain > 0 && (
                          <div className="bg-yellow-50 p-3 rounded">
                            <div className="flex justify-between">
                              <span className={cn("text-yellow-800", isMobile && "text-sm")}>Data Accuracy Gain</span>
                              <span className={cn("font-medium text-yellow-700", isMobile && "text-sm")}>
                                +{formatCurrency(improvementPotential.dataAccuracyGain)}
                              </span>
                            </div>
                            <p className={cn("text-xs text-yellow-600 mt-1", isMobile && "text-[0.65rem]")}>
                              Better decision making through accurate data
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Total Potential */}
                    <div className="bg-gray-50 p-4 rounded border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <h5 className={cn("font-medium text-gray-800 mb-2", isMobile && "text-sm")}>
                          💎 Total Improvement Potential
                        </h5>
                        <p className={cn("text-3xl font-bold text-gray-700", isMobile && "text-xl")}>
                          {formatCurrency(
                            improvementPotential.materialOptimization +
                            improvementPotential.laborEfficiency +
                            improvementPotential.opexReduction10 +
                            improvementPotential.dataAccuracyGain
                          )}
                        </p>
                        <p className={cn("text-sm text-gray-600 mt-1", isMobile && "text-xs")}>
                          ~{(((improvementPotential.materialOptimization + improvementPotential.laborEfficiency + improvementPotential.opexReduction10 + improvementPotential.dataAccuracyGain) / profitData.profitMarginData.revenue) * 100).toFixed(1)}% revenue improvement
                        </p>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className={cn("w-full", isMobile && "text-xs")}
                      onClick={() => {
                        // Could integrate with a more detailed simulation tool
                        alert('Advanced scenario simulation coming soon!');
                      }}
                    >
                      <Calculator className={cn("h-4 w-4 mr-2", isMobile && "h-3 w-3")} />
                      Simulasi Skenario Detail
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