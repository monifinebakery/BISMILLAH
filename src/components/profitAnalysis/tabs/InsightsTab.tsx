// src/components/profitAnalysis/tabs/InsightsTab.tsx
// ✅ UPDATED - Material Usage Integration Compatible

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Info,
  Package2,
  Factory,
  Database,
  Eye,
  EyeOff
} from 'lucide-react';

// ✅ Import updated components and types
import { InsightsList } from '../components/InsightsList';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// ✅ Import updated types
import { 
  ProfitAnalysisResult,
  ProfitInsight,
  PROFIT_MARGIN_THRESHOLDS 
} from '../types';

interface InsightsTabProps {
  profitData: ProfitAnalysisResult;
  className?: string;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ 
  profitData,
  className 
}) => {
  const isMobile = useIsMobile();
  const [activeInsightTab, setActiveInsightTab] = useState('semua');
  const [showDetailedView, setShowDetailedView] = useState(false);

  // ✅ Enhanced insight filtering with material usage considerations
  const filterInsights = (category: string) => {
    if (!profitData?.insights) return [];
    if (category === 'semua') return profitData.insights;
    return profitData.insights.filter((insight: ProfitInsight) => insight.category === category);
  };

  // ✅ Enhanced insight generation with material usage data
  const generateAdditionalInsights = (): ProfitInsight[] => {
    const insights: ProfitInsight[] = [];
    const { profitMarginData, cogsBreakdown, opexBreakdown } = profitData;

    // ✅ Data quality insights for material usage
    if (cogsBreakdown.dataSource === 'estimated') {
      insights.push({
        type: 'warning',
        category: 'efficiency',
        title: 'Menggunakan Data Estimasi',
        message: 'HPP dihitung berdasarkan estimasi. Akurasi bisa ditingkatkan dengan data material usage aktual',
        recommendation: 'Aktifkan tracking material usage di warehouse untuk perhitungan HPP yang lebih akurat',
        impact: 'medium',
        value: 0,
        trend: 'stable'
      });
    } else if (cogsBreakdown.dataSource === 'mixed') {
      insights.push({
        type: 'info',
        category: 'efficiency',
        title: 'Data Sebagian Aktual',
        message: 'Sebagian HPP menggunakan data aktual, sebagian estimasi. Akurasi sedang',
        recommendation: 'Lengkapi data material usage untuk semua produk demi akurasi maksimal',
        impact: 'low',
        value: 0.5,
        trend: 'increasing'
      });
    } else if (cogsBreakdown.dataSource === 'actual') {
      insights.push({
        type: 'success',
        category: 'efficiency',
        title: 'Data Material Usage Aktual',
        message: 'HPP dihitung berdasarkan data material usage aktual. Akurasi tinggi!',
        recommendation: 'Pertahankan tracking material usage untuk konsistensi akurasi',
        impact: 'high',
        value: 1,
        trend: 'stable'
      });
    }

    // ✅ Material usage specific insights
    if (cogsBreakdown.actualMaterialUsage && cogsBreakdown.actualMaterialUsage.length > 0) {
      const wasteUsage = cogsBreakdown.actualMaterialUsage.filter(usage => usage.usage_type === 'waste');
      if (wasteUsage.length > 0) {
        const totalWasteCost = wasteUsage.reduce((sum, usage) => sum + usage.total_cost, 0);
        const wastePercentage = (totalWasteCost / cogsBreakdown.totalMaterialCost) * 100;
        
        if (wastePercentage > 5) {
          insights.push({
            type: 'warning',
            category: 'cogs',
            title: 'Waste Material Tinggi',
            message: `Material waste ${wastePercentage.toFixed(1)}% dari total material cost. Target ideal <3%`,
            recommendation: 'Review proses produksi untuk mengurangi waste dan meningkatkan efisiensi',
            impact: 'high',
            value: wastePercentage,
            trend: 'increasing'
          });
        }
      }
    }

    // ✅ Production efficiency insights
    if (cogsBreakdown.productionData && cogsBreakdown.productionData.length > 0) {
      const avgUnitCost = cogsBreakdown.productionData.reduce((sum, prod) => sum + prod.unit_cost, 0) / cogsBreakdown.productionData.length;
      const qualityIssues = cogsBreakdown.productionData.filter(prod => prod.quality_grade === 'reject' || prod.quality_grade === 'C');
      
      if (qualityIssues.length > 0) {
        const qualityRate = (qualityIssues.length / cogsBreakdown.productionData.length) * 100;
        insights.push({
          type: 'critical',
          category: 'efficiency',
          title: 'Quality Issues Terdeteksi',
          message: `${qualityRate.toFixed(1)}% produksi dengan quality grade C atau reject`,
          recommendation: 'Review quality control process dan training untuk mengurangi reject rate',
          impact: 'high',
          value: qualityRate,
          trend: 'stable'
        });
      }
    }

    // ✅ Enhanced margin analysis
    if (profitMarginData.grossMargin < PROFIT_MARGIN_THRESHOLDS.grossMargin.poor) {
      insights.push({
        type: 'critical',
        category: 'margin',
        title: 'Margin Kotor Sangat Rendah',
        message: `Margin kotor ${profitMarginData.grossMargin.toFixed(1)}% di bawah threshold minimum ${PROFIT_MARGIN_THRESHOLDS.grossMargin.poor}%`,
        recommendation: 'Urgent: Review pricing strategy dan optimisasi COGS secara menyeluruh',
        impact: 'high',
        value: profitMarginData.grossMargin,
        trend: profitMarginData.grossMargin < 0 ? 'decreasing' : 'stable'
      });
    }

    // ✅ Material cost ratio analysis
    const materialRatio = (cogsBreakdown.totalMaterialCost / profitMarginData.revenue) * 100;
    if (materialRatio > 50) {
      insights.push({
        type: 'warning',
        category: 'cogs',
        title: 'Biaya Material Terlalu Tinggi',
        message: `Material cost ${materialRatio.toFixed(1)}% dari revenue, target ideal <40%`,
        recommendation: 'Negosiasi supplier, cari alternative materials, atau optimize usage efficiency',
        impact: 'high',
        value: materialRatio,
        trend: 'increasing'
      });
    }

    // ✅ Operational efficiency insights
    const totalEfficiency = profitMarginData.revenue / (profitMarginData.cogs + profitMarginData.opex);
    if (totalEfficiency < 1.2) {
      insights.push({
        type: 'warning',
        category: 'efficiency',
        title: 'Efisiensi Operasional Rendah',
        message: `Revenue hanya ${totalEfficiency.toFixed(2)}x dari total biaya, target minimal 1.5x`,
        recommendation: 'Fokus pada peningkatan produktivitas dan eliminasi waste',
        impact: 'medium',
        value: totalEfficiency,
        trend: 'stable'
      });
    }

    return insights;
  };

  // ✅ Combine all insights
  const allInsights = [
    ...(profitData?.insights || []),
    ...generateAdditionalInsights()
  ];

  // ✅ Enhanced insight categories with material focus
  const insightCategories = [
    { id: 'semua', label: 'Semua', icon: BarChart3, count: allInsights.length },
    { id: 'margin', label: 'Margin', icon: TrendingUp, count: allInsights.filter(i => i.category === 'margin').length },
    { id: 'cogs', label: 'HPP', icon: Factory, count: allInsights.filter(i => i.category === 'cogs').length },
    { id: 'opex', label: 'OPEX', icon: DollarSign, count: allInsights.filter(i => i.category === 'opex').length },
    { id: 'efficiency', label: 'Efisiensi', icon: Target, count: allInsights.filter(i => i.category === 'efficiency').length },
    { id: 'trend', label: 'Trend', icon: Clock, count: allInsights.filter(i => i.category === 'trend').length }
  ];

  // ✅ Enhanced metrics with data quality indicators
  const insightMetrics = {
    total: allInsights.length,
    critical: allInsights.filter(i => i.type === 'critical').length,
    warning: allInsights.filter(i => i.type === 'warning').length,
    success: allInsights.filter(i => i.type === 'success').length,
    info: allInsights.filter(i => i.type === 'info').length,
    withRecommendations: allInsights.filter(i => i.recommendation).length,
    dataQuality: allInsights.filter(i => i.category === 'efficiency' && (i.message.includes('data') || i.message.includes('estimasi'))).length
  };

  // ✅ Format currency helper
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

  // ✅ Empty state
  if (!allInsights || allInsights.length === 0) {
    return (
      <div className={cn("space-y-6", isMobile && "space-y-4", className)}>
        <Card>
          <CardContent className={cn("p-12 text-center", isMobile && "p-6")}>
            <Lightbulb className={cn("h-12 w-12 text-gray-400 mx-auto mb-4", isMobile && "h-8 w-8 mb-3")} />
            <h3 className={cn("font-medium text-gray-600 mb-2", isMobile && "text-sm")}>Belum Ada Insights</h3>
            <p className={cn("text-sm text-gray-500 mb-4", isMobile && "text-xs mb-3")}>
              Insights akan muncul setelah sistem menganalisis data profit margin Anda.
            </p>
            <div className={cn("bg-blue-50 p-4 rounded mt-4", isMobile && "p-3 mt-3")}>
              <h4 className={cn("font-medium text-blue-800 mb-2", isMobile && "text-sm")}>💡 Tips untuk Mendapatkan Insights:</h4>
              <ul className={cn("text-sm text-blue-700 text-left space-y-1", isMobile && "text-xs")}>
                <li>• Pastikan data transaksi keuangan lengkap</li>
                <li>• Tambahkan data biaya operasional</li>
                <li>• Integrasikan data warehouse untuk HPP akurat</li>
                <li>• Aktifkan material usage tracking</li>
                <li>• Gunakan periode waktu yang cukup (min. 1 bulan)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", isMobile && "space-y-4", className)}>
      {/* ✅ Enhanced Insight Overview Metrics */}
      <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6")}>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className={cn("p-4 text-center", isMobile && "p-3")}>
            <BarChart3 className={cn("h-6 w-6 text-blue-600 mx-auto mb-2", isMobile && "h-5 w-5 mb-1")} />
            <p className={cn("text-2xl font-bold text-blue-700", isMobile && "text-lg")}>{insightMetrics.total}</p>
            <p className={cn("text-xs text-blue-600", isMobile && "text-[0.65rem]")}>Total</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className={cn("p-4 text-center", isMobile && "p-3")}>
            <AlertTriangle className={cn("h-6 w-6 text-red-600 mx-auto mb-2", isMobile && "h-5 w-5 mb-1")} />
            <p className={cn("text-2xl font-bold text-red-700", isMobile && "text-lg")}>{insightMetrics.critical}</p>
            <p className={cn("text-xs text-red-600", isMobile && "text-[0.65rem]")}>Kritis</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className={cn("p-4 text-center", isMobile && "p-3")}>
            <AlertTriangle className={cn("h-6 w-6 text-yellow-600 mx-auto mb-2", isMobile && "h-5 w-5 mb-1")} />
            <p className={cn("text-2xl font-bold text-yellow-700", isMobile && "text-lg")}>{insightMetrics.warning}</p>
            <p className={cn("text-xs text-yellow-600", isMobile && "text-[0.65rem]")}>Warning</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className={cn("p-4 text-center", isMobile && "p-3")}>
            <CheckCircle className={cn("h-6 w-6 text-green-600 mx-auto mb-2", isMobile && "h-5 w-5 mb-1")} />
            <p className={cn("text-2xl font-bold text-green-700", isMobile && "text-lg")}>{insightMetrics.success}</p>
            <p className={cn("text-xs text-green-600", isMobile && "text-[0.65rem]")}>Positif</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className={cn("p-4 text-center", isMobile && "p-3")}>
            <Lightbulb className={cn("h-6 w-6 text-purple-600 mx-auto mb-2", isMobile && "h-5 w-5 mb-1")} />
            <p className={cn("text-2xl font-bold text-purple-700", isMobile && "text-lg")}>{insightMetrics.withRecommendations}</p>
            <p className={cn("text-xs text-purple-600", isMobile && "text-[0.65rem]")}>Rekomendasi</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className={cn("p-4 text-center", isMobile && "p-3")}>
            <Database className={cn("h-6 w-6 text-gray-600 mx-auto mb-2", isMobile && "h-5 w-5 mb-1")} />
            <p className={cn("text-2xl font-bold text-gray-700", isMobile && "text-lg")}>{insightMetrics.dataQuality}</p>
            <p className={cn("text-xs text-gray-600", isMobile && "text-[0.65rem]")}>Data Quality</p>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Data Quality Status */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className={cn("p-4", isMobile && "p-3")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package2 className={cn("h-5 w-5 text-blue-600", isMobile && "h-4 w-4")} />
              <div>
                <h4 className={cn("font-medium text-blue-800", isMobile && "text-sm")}>
                  Status Data Material Usage
                </h4>
                <p className={cn("text-sm text-blue-600", isMobile && "text-xs")}>
                  Data source: <strong>{cogsBreakdown.dataSource === 'actual' ? 'Aktual' : 
                                       cogsBreakdown.dataSource === 'mixed' ? 'Campuran' : 'Estimasi'}</strong>
                </p>
              </div>
            </div>
            <Badge 
              variant={cogsBreakdown.dataSource === 'actual' ? 'default' : 'secondary'}
              className={isMobile ? "text-xs" : ""}
            >
              {cogsBreakdown.dataSource === 'actual' ? '✅ Optimal' : 
               cogsBreakdown.dataSource === 'mixed' ? '⚠️ Sebagian' : '❌ Estimasi'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Enhanced Filter Tabs */}
      <Card>
        <CardHeader className={cn("p-4 flex flex-row items-center justify-between", isMobile && "p-3")}>
          <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
            <Lightbulb className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
            Insights & Analisis
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowDetailedView(!showDetailedView)}
            className={cn("text-xs", isMobile && "text-[0.65rem]")}
          >
            {showDetailedView ? (
              <>
                <EyeOff className={cn("h-3 w-3 mr-1", isMobile && "h-2.5 w-2.5")} />
                Sembunyikan Detail
              </>
            ) : (
              <>
                <Eye className={cn("h-3 w-3 mr-1", isMobile && "h-2.5 w-2.5")} />
                Lihat Detail
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className={cn("p-4", isMobile && "p-3")}>
          <Tabs value={activeInsightTab} onValueChange={setActiveInsightTab}>
            <TabsList className={cn(
              "grid w-full grid-cols-6",
              isMobile && "flex overflow-x-auto whitespace-nowrap"
            )}>
              {insightCategories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id} 
                  className={cn("text-xs flex flex-col gap-1", isMobile && "text-[0.65rem] px-2")}
                >
                  <category.icon className={cn("h-3 w-3", isMobile && "h-2.5 w-2.5")} />
                  <span>{category.label}</span>
                  {category.count > 0 && (
                    <Badge variant="secondary" className="text-[0.6rem] px-1 py-0">
                      {category.count}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {insightCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className={cn("mt-4", isMobile && "mt-3")}>
                <InsightsList 
                  insights={filterInsights(category.id)} 
                  maxShow={category.id === 'semua' ? undefined : 10}
                  showFilters={category.id === 'semua'}
                  showCategories={category.id === 'semua'}
                  showDataQualityInsights={true}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* ✅ Enhanced Action Items Priority Matrix */}
      {showDetailedView && (
        <>
          <Card>
            <CardHeader className={cn("p-4", isMobile && "p-3")}>
              <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
                <Target className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
                Rencana Tindakan Prioritas
              </CardTitle>
            </CardHeader>
            <CardContent className={cn("p-4", isMobile && "p-3")}>
              <div className={cn("space-y-4", isMobile && "space-y-3")}>
                {/* High Priority Actions */}
                <div>
                  <h5 className={cn("font-medium mb-3 text-red-800", isMobile && "text-sm mb-2")}>🚨 Prioritas Tinggi</h5>
                  <div className={cn("space-y-3", isMobile && "space-y-2")}>
                    {allInsights
                      .filter((insight: ProfitInsight) => insight.impact === 'high' && insight.recommendation)
                      .slice(0, 3)
                      .map((insight: ProfitInsight, index: number) => (
                        <div 
                          key={index} 
                          className={cn(
                            "flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded",
                            isMobile && "gap-2 p-3"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold",
                            isMobile && "w-6 h-6 text-xs"
                          )}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h6 className={cn("font-medium text-red-800", isMobile && "text-sm")}>{insight.title}</h6>
                            <p className={cn("text-sm text-red-700 mt-1", isMobile && "text-xs")}>{insight.recommendation}</p>
                            <div className={cn("flex items-center gap-2 mt-2", isMobile && "gap-1 mt-1")}>
                              <Badge variant="destructive" className={cn("text-xs", isMobile && "text-[0.65rem]")}>
                                Dampak Tinggi
                              </Badge>
                              <Badge variant="outline" className={cn("text-xs", isMobile && "text-[0.65rem]")}>
                                <Clock className={cn("h-3 w-3 mr-1", isMobile && "h-2.5 w-2.5")} />
                                Segera
                              </Badge>
                              {insight.value !== undefined && (
                                <Badge variant="secondary" className={cn("text-xs", isMobile && "text-[0.65rem]")}>
                                  {insight.value > 1 ? formatCurrency(insight.value) : `${(insight.value * 100).toFixed(1)}%`}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Medium Priority Actions */}
                <div>
                  <h5 className={cn("font-medium mb-3 text-orange-800", isMobile && "text-sm mb-2")}>⚠️ Prioritas Sedang</h5>
                  <div className={cn("space-y-3", isMobile && "space-y-2")}>
                    {allInsights
                      .filter((insight: ProfitInsight) => insight.impact === 'medium' && insight.recommendation)
                      .slice(0, 2)
                      .map((insight: ProfitInsight, index: number) => (
                        <div 
                          key={index} 
                          className={cn(
                            "flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded",
                            isMobile && "gap-2 p-3"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold",
                            isMobile && "w-6 h-6 text-xs"
                          )}>
                            {index + 4}
                          </div>
                          <div className="flex-1">
                            <h6 className={cn("font-medium text-orange-800", isMobile && "text-sm")}>{insight.title}</h6>
                            <p className={cn("text-sm text-orange-700 mt-1", isMobile && "text-xs")}>{insight.recommendation}</p>
                            <div className={cn("flex items-center gap-2 mt-2", isMobile && "gap-1 mt-1")}>
                              <Badge variant="secondary" className={cn("text-xs", isMobile && "text-[0.65rem]")}>
                                Dampak Sedang
                              </Badge>
                              <Badge variant="outline" className={cn("text-xs", isMobile && "text-[0.65rem]")}>
                                <Clock className={cn("h-3 w-3 mr-1", isMobile && "h-2.5 w-2.5")} />
                                1-2 Minggu
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Quick Wins */}
                <div>
                  <h5 className={cn("font-medium mb-3 text-green-800", isMobile && "text-sm mb-2")}>✅ Quick Wins</h5>
                  <div className={cn("space-y-3", isMobile && "space-y-2")}>
                    {allInsights
                      .filter((insight: ProfitInsight) => insight.impact === 'low' && insight.recommendation)
                      .slice(0, 2)
                      .map((insight: ProfitInsight, index: number) => (
                        <div 
                          key={index} 
                          className={cn(
                            "flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded",
                            isMobile && "gap-2 p-3"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold",
                            isMobile && "w-6 h-6 text-xs"
                          )}>
                            {index + 7}
                          </div>
                          <div className="flex-1">
                            <h6 className={cn("font-medium text-green-800", isMobile && "text-sm")}>{insight.title}</h6>
                            <p className={cn("text-sm text-green-700 mt-1", isMobile && "text-xs")}>{insight.recommendation}</p>
                            <div className={cn("flex items-center gap-2 mt-2", isMobile && "gap-1 mt-1")}>
                              <Badge variant="default" className={cn("text-xs", isMobile && "text-[0.65rem]")}>
                                Quick Win
                              </Badge>
                              <Badge variant="outline" className={cn("text-xs", isMobile && "text-[0.65rem]")}>
                                <Clock className={cn("h-3 w-3 mr-1", isMobile && "h-2.5 w-2.5")} />
                                1-3 Hari
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ✅ Implementation Roadmap */}
          <Card>
            <CardHeader className={cn("p-4", isMobile && "p-3")}>
              <CardTitle className={cn(isMobile && "text-base")}>🗺️ Roadmap Implementasi</CardTitle>
            </CardHeader>
            <CardContent className={cn("p-4", isMobile && "p-3")}>
              <div className={cn("space-y-4", isMobile && "space-y-3")}>
                <div className={cn("grid grid-cols-1 gap-4", !isMobile && "md:grid-cols-3")}>
                  <div className={cn("bg-red-50 p-4 rounded", isMobile && "p-3")}>
                    <h5 className={cn("font-medium text-red-800 mb-2", isMobile && "text-sm mb-1")}>🎯 Minggu 1-2</h5>
                    <ul className={cn("text-sm text-red-700 space-y-1", isMobile && "text-xs")}>
                      <li>• Review struktur pricing</li>
                      <li>• Analisis supplier utama</li>
                      <li>• Identifikasi waste dalam produksi</li>
                      <li>• Setup material usage tracking</li>
                    </ul>
                  </div>

                  <div className={cn("bg-orange-50 p-4 rounded", isMobile && "p-3")}>
                    <h5 className={cn("font-medium text-orange-800 mb-2", isMobile && "text-sm mb-1")}>⚡ Minggu 3-6</h5>
                    <ul className={cn("text-sm text-orange-700 space-y-1", isMobile && "text-xs")}>
                      <li>• Implementasi efisiensi proses</li>
                      <li>• Negosiasi kontrak supplier</li>
                      <li>• Optimisasi alokasi tenaga kerja</li>
                      <li>• Improve quality control</li>
                    </ul>
                  </div>

                  <div className={cn("bg-green-50 p-4 rounded", isMobile && "p-3")}>
                    <h5 className={cn("font-medium text-green-800 mb-2", isMobile && "text-sm mb-1")}>🚀 Minggu 7-12</h5>
                    <ul className={cn("text-sm text-green-700 space-y-1", isMobile && "text-xs")}>
                      <li>• Monitor improvement hasil</li>
                      <li>• Scale best practices</li>
                      <li>• Continuous improvement</li>
                      <li>• Advanced analytics</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                <div className={cn("bg-blue-50 p-4 rounded", isMobile && "p-3")}>
                  <h5 className={cn("font-medium text-blue-800 mb-2", isMobile && "text-sm mb-1")}>📊 Expected Impact</h5>
                  <div className={cn("grid grid-cols-1 gap-4 mt-3", !isMobile && "md:grid-cols-4")}>
                    <div className="text-center">
                      <p className={cn("text-2xl font-bold text-blue-700", isMobile && "text-lg")}>+5-15%</p>
                      <p className={cn("text-xs text-blue-600", isMobile && "text-[0.65rem]")}>Peningkatan Margin</p>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-2xl font-bold text-blue-700", isMobile && "text-lg")}>-10-25%</p>
                      <p className={cn("text-xs text-blue-600", isMobile && "text-[0.65rem]")}>Pengurangan Waste</p>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-2xl font-bold text-blue-700", isMobile && "text-lg")}>+20-40%</p>
                      <p className={cn("text-xs text-blue-600", isMobile && "text-[0.65rem]")}>Efisiensi Operasional</p>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-2xl font-bold text-blue-700", isMobile && "text-lg")}>+90%</p>
                      <p className={cn("text-xs text-blue-600", isMobile && "text-[0.65rem]")}>Akurasi Data</p>
                    </div>
                  </div>
                </div>

                {/* Material Usage Focus */}
                {cogsBreakdown.dataSource !== 'actual' && (
                  <Alert>
                    <Package2 className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Prioritas: Material Usage Tracking</strong>
                      <p className="mt-2 text-sm">
                        Implement material usage tracking untuk akurasi HPP yang lebih tinggi. 
                        Ini akan memberikan insight yang lebih presisi tentang cost structure dan waste.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};