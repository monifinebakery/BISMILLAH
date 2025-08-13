/ src/components/financial/profit-analysis/tabs/PerbandinganTab.tsx
// ✅ TAB PERBANDINGAN - Complete version dengan comprehensive comparison

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
  DollarSign,
  Calculator,
  ArrowUpDown
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface PerbandinganTabProps {
  profitData: any;
}

export const PerbandinganTab: React.FC<PerbandinganTabProps> = ({ profitData }) => {
  const [comparisonView, setComparisonView] = useState('cash-vs-real');

  // Calculate cash flow (old method)
  const cashFlow = profitData.profitMarginData.revenue - (profitData.profitMarginData.cogs + profitData.profitMarginData.opex);
  const realProfit = profitData.profitMarginData.netProfit;
  const difference = Math.abs(realProfit - cashFlow);
  const isRealProfitHigher = realProfit > cashFlow;

  // Industry benchmarks data
  const industryBenchmarks = {
    grossMargin: {
      excellent: 40,
      good: 25,
      acceptable: 15,
      poor: 5
    },
    netMargin: {
      excellent: 15,
      good: 10,
      acceptable: 5,
      poor: 2
    },
    costRatios: {
      cogs: { target: 70, current: (profitData.cogsBreakdown.totalCOGS / profitData.profitMarginData.revenue) * 100 },
      opex: { target: 20, current: (profitData.opexBreakdown.totalOPEX / profitData.profitMarginData.revenue) * 100 },
      material: { target: 40, current: (profitData.cogsBreakdown.totalMaterialCost / profitData.profitMarginData.revenue) * 100 },
      labor: { target: 20, current: (profitData.cogsBreakdown.totalDirectLaborCost / profitData.profitMarginData.revenue) * 100 }
    }
  };

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
                            {getMarginStatus(profitData.profitMarginData.grossMargin, 'gross