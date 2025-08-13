// src/components/financial/profitAnalysis/tabs/InsightsTab.tsx
// ✅ TAB INSIGHTS - Complete version dengan AI insights dan action items

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

interface InsightsTabProps {
  profitData: any;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ profitData }) => {
  const [activeInsightTab, setActiveInsightTab] = useState('semua');

  // Filter insights berdasarkan kategori
  const filterInsights = (category: string) => {
    if (!profitData.insights) return [];
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
    ...(profitData.insights || []),
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
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-600 mb-2">Belum Ada Insights</h3>
            <p className="text-sm text-gray-500 mb-4">
              Insights akan muncul setelah sistem menganalisis data profit margin Anda.
            </p>
            <div className="bg-blue-50 p-4 rounded mt-4">
              <h4 className="font-medium text-blue-800 mb-2">💡 Tips untuk Mendapatkan Insights:</h4>
              <ul className="text-sm text-blue-700 text-left space-y-1">
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
    <div className="space-y-6">
      {/* Insight Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">{insightMetrics.total}</p>
            <p className="text-xs text-blue-600">Total Insights</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-700">{insightMetrics.critical}</p>
            <p className="text-xs text-red-600">Kritis</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-700">{insightMetrics.warning}</p>
            <p className="text-xs text-yellow-600">Peringatan</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">{insightMetrics.success}</p>
            <p className="text-xs text-green-600">Positif</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700">{insightMetrics.withRecommendations}</p>
            <p className="text-xs text-purple-600">Rekomendasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Insights & Analisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeInsightTab} onValueChange={setActiveInsightTab}>
            <TabsList className="grid w-full grid-cols-5">
              {insightCategories.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="text-xs">
                  <category.icon className="h-3 w-3 mr-1" />
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {insightCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-4">
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Rencana Tindakan Prioritas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* High Priority Actions */}
            <div>
              <h5 className="font-medium mb-3 text-red-800">🚨 Prioritas Tinggi</h5>
              <div className="space-y-3">
                {allInsights
                  .filter((insight: any) => insight.impact === 'high' && insight.recommendation)
                  .slice(0, 3)
                  .map((insight: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded">
                      <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h6 className="font-medium text-red-800">{insight.title}</h6>
                        <p className="text-sm text-red-700 mt-1">{insight.recommendation}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="destructive" className="text-xs">Dampak Tinggi</Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
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
              <h5 className="font-medium mb-3 text-orange-800">⚠️ Prioritas Sedang</h5>
              <div className="space-y-3">
                {allInsights
                  .filter((insight: any) => insight.impact === 'medium' && insight.recommendation)
                  .slice(0, 2)
                  .map((insight: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded">
                      <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 4}
                      </div>
                      <div className="flex-1">
                        <h6 className="font-medium text-orange-800">{insight.title}</h6>
                        <p className="text-sm text-orange-700 mt-1">{insight.recommendation}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">Dampak Sedang</Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
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
              <h5 className="font-medium mb-3 text-green-800">✅ Quick Wins</h5>
              <div className="space-y-3">
                {allInsights
                  .filter((insight: any) => insight.impact === 'low' && insight.recommendation)
                  .slice(0, 2)
                  .map((insight: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded">
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 7}
                      </div>
                      <div className="flex-1">
                        <h6 className="font-medium text-green-800">{insight.title}</h6>
                        <p className="text-sm text-green-700 mt-1">{insight.recommendation}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="default" className="text-xs">Quick Win</Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
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
        <CardHeader>
          <CardTitle>🗺️ Roadmap Implementasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded">
                <h5 className="font-medium text-red-800 mb-2">🎯 Minggu 1-2</h5>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Review struktur pricing</li>
                  <li>• Analisis supplier utama</li>
                  <li>• Identifikasi waste dalam produksi</li>
                </ul>
              </div>

              <div className="bg-orange-50 p-4 rounded">
                <h5 className="font-medium text-orange-800 mb-2">⚡ Minggu 3-6</h5>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Implementasi efisiensi proses</li>
                  <li>• Negosiasi kontrak supplier</li>
                  <li>• Optimisasi alokasi tenaga kerja</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded">
                <h5 className="font-medium text-green-800 mb-2">🚀 Minggu 7-12</h5>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Monitor improvement hasil</li>
                  <li>• Scale best practices</li>
                  <li>• Continuous improvement</li>
                </ul>
              </div>
            </div>

            <Separator />

            <div className="bg-blue-50 p-4 rounded">
              <h5 className="font-medium text-blue-800 mb-2">📊 Expected Impact</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-700">+5-15%</p>
                  <p className="text-xs text-blue-600">Peningkatan Margin</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-700">-10-25%</p>
                  <p className="text-xs text-blue-600">Pengurangan Waste</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-700">+20-40%</p>
                  <p className="text-xs text-blue-600">Efisiensi Operasional</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};