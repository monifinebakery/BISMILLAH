// src/components/profitAnalysis/tabs/InsightsTab.tsx
// ✅ TAB INSIGHTS - Fixed and Enhanced Version

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Info
} from 'lucide-react';
import { InsightsList } from '../components/InsightsList';
import { formatCurrency } from '../utils/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface InsightsTabProps {
  profitData: any;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ profitData }) => {
  const isMobile = useIsMobile();
  const [activeInsightTab, setActiveInsightTab] = useState('semua');

  // Filter insights berdasarkan kategori
  const filterInsights = (category: string) => {
    if (!profitData?.insights) return [];
    if (category === 'semua') return profitData.insights;
    return profitData.insights.filter((insight: any) => insight.category === category);
  };

  // Generate additional insights berdasarkan data
  const generateAdditionalInsights = () => {
    const insights = [];
    const { profitMarginData, cogsBreakdown, opexBreakdown } = profitData;

    // Insight tentang margin
    if (profitMarginData.grossMargin < 15) {
      insights.push({
        type: 'critical',
        category: 'margin',
        title: 'Margin Kotor Sangat Rendah',
        message: 'Margin kotor di bawah 15% menunjukkan masalah serius dalam struktur biaya',
        recommendation: 'Segera review pricing strategy dan optimisasi HPP',
        impact: 'high'
      });
    }

    // Insight tentang material cost
    const materialRatio = (cogsBreakdown.totalMaterialCost / profitMarginData.revenue) * 100;
    if (materialRatio > 50) {
      insights.push({
        type: 'warning',
        category: 'cogs',
        title: 'Biaya Material Terlalu Tinggi',
        message: `Material cost ${materialRatio.toFixed(1)}% dari revenue, jauh di atas target 40%`,
        recommendation: 'Negosiasi ulang dengan supplier atau cari alternative supplier',
        impact: 'high'
      });
    }

    // Insight tentang efisiensi
    const totalEfficiency = profitMarginData.revenue / (profitMarginData.cogs + profitMarginData.opex);
    if (totalEfficiency < 1.2) {
      insights.push({
        type: 'warning',
        category: 'efficiency',
        title: 'Efisiensi Operasional Rendah',
        message: 'Revenue hanya 1.2x dari total biaya, efisiensi perlu ditingkatkan',
        recommendation: 'Fokus pada peningkatan produktivitas dan automasi',
        impact: 'medium'
      });
    }

    return insights;
  };

  const allInsights = [
    ...(profitData?.insights || []),
    ...generateAdditionalInsights()
  ];

  const insightCategories = [
    { id: 'semua', label: 'Semua', icon: BarChart3 },
    { id: 'margin', label: 'Margin', icon: TrendingUp },
    { id: 'cogs', label: 'HPP', icon: DollarSign },
    { id: 'opex', label: 'OPEX', icon: Target },
    { id: 'efficiency', label: 'Efisiensi', icon: Lightbulb }
  ];

  // Metrics untuk insight overview
  const insightMetrics = {
    total: allInsights.length,
    critical: allInsights.filter(i => i.type === 'critical').length,
    warning: allInsights.filter(i => i.type === 'warning').length,
    success: allInsights.filter(i => i.type === 'success').length,
    withRecommendations: allInsights.filter(i => i.recommendation).length
  };

  if (!allInsights || allInsights.length === 0) {
    return (
      <div className={cn("space-y-6", isMobile && "space-y-4")}>
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
                <li>• Gunakan periode waktu yang cukup (min. 1 bulan)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", isMobile && "space-y-4")}>
      {/* Insight Overview Metrics */}
      <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-5")}>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className={cn("p-4 text-center", isMobile && "p-3")}>
            <BarChart3 className={cn("h-6 w-6 text-blue-600 mx-auto mb-2", isMobile && "h-5 w-5 mb-1")} />
            <p className={cn("text-2xl font-bold text-blue-700", isMobile && "text-lg")}>{insightMetrics.total}</p>
            <p className={cn("text-xs text-blue-600", isMobile && "text-[0.65rem]")}>Total Insights</p>
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
            <p className={cn("text-xs text-yellow-600", isMobile && "text-[0.65rem]")}>Peringatan</p>
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
            <Target className={cn("h-6 w-6 text-purple-600 mx-auto mb-2", isMobile && "h-5 w-5 mb-1")} />
            <p className={cn("text-2xl font-bold text-purple-700", isMobile && "text-lg")}>{insightMetrics.withRecommendations}</p>
            <p className={cn("text-xs text-purple-600", isMobile && "text-[0.65rem]")}>Rekomendasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardHeader className={cn("p-4", isMobile && "p-3")}>
          <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
            <Lightbulb className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
            Insights & Analisis
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("p-4", isMobile && "p-3")}>
          <Tabs value={activeInsightTab} onValueChange={setActiveInsightTab}>
            <TabsList className={cn(
              "grid w-full grid-cols-5",
              isMobile && "flex overflow-x-auto whitespace-nowrap"
            )}>
              {insightCategories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id} 
                  className={cn("text-xs", isMobile && "text-[0.65rem] px-2")}
                >
                  <category.icon className={cn("h-3 w-3 mr-1", isMobile && "h-2.5 w-2.5")} />
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {insightCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className={cn("mt-4", isMobile && "mt-3")}>
                <InsightsList 
                  insights={filterInsights(category.id)} 
                  maxShow={category.id === 'semua' ? undefined : 10}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Items Priority Matrix */}
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
                  .filter((insight: any) => insight.impact === 'high' && insight.recommendation)
                  .slice(0, 3)
                  .map((insight: any, index: number) => (
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
                  .filter((insight: any) => insight.impact === 'medium' && insight.recommendation)
                  .slice(0, 2)
                  .map((insight: any, index: number) => (
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
                  .filter((insight: any) => insight.impact === 'low' && insight.recommendation)
                  .slice(0, 2)
                  .map((insight: any, index: number) => (
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

      {/* Implementation Roadmap */}
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
                </ul>
              </div>

              <div className={cn("bg-orange-50 p-4 rounded", isMobile && "p-3")}>
                <h5 className={cn("font-medium text-orange-800 mb-2", isMobile && "text-sm mb-1")}>⚡ Minggu 3-6</h5>
                <ul className={cn("text-sm text-orange-700 space-y-1", isMobile && "text-xs")}>
                  <li>• Implementasi efisiensi proses</li>
                  <li>• Negosiasi kontrak supplier</li>
                  <li>• Optimisasi alokasi tenaga kerja</li>
                </ul>
              </div>

              <div className={cn("bg-green-50 p-4 rounded", isMobile && "p-3")}>
                <h5 className={cn("font-medium text-green-800 mb-2", isMobile && "text-sm mb-1")}>🚀 Minggu 7-12</h5>
                <ul className={cn("text-sm text-green-700 space-y-1", isMobile && "text-xs")}>
                  <li>• Monitor improvement hasil</li>
                  <li>• Scale best practices</li>
                  <li>• Continuous improvement</li>
                </ul>
              </div>
            </div>

            <Separator />

            <div className={cn("bg-blue-50 p-4 rounded", isMobile && "p-3")}>
              <h5 className={cn("font-medium text-blue-800 mb-2", isMobile && "text-sm mb-1")}>📊 Expected Impact</h5>
              <div className={cn("grid grid-cols-1 gap-4 mt-3", !isMobile && "md:grid-cols-3")}>
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};