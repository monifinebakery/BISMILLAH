// 🍽️ FNBInsights.tsx - Smart Insights untuk Bisnis F&B
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  ShoppingCart,
  DollarSign,
  Lightbulb,
  Target,
  Clock,
  Users,
  Zap,
  Star
} from 'lucide-react';

import { formatCurrency, formatPercentage } from '../utils/profitTransformers';
import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';

// ==============================================
// TYPES
// ==============================================

export interface FNBInsightsProps {
  currentAnalysis: RealTimeProfitCalculation | null;
  previousAnalysis?: RealTimeProfitCalculation | null;
  effectiveCogs?: number;
  hppBreakdown?: Array<{ id: string; nama: string; qty: number; price: number; hpp: number }>;
  className?: string;
}

interface FNBInsight {
  type: 'success' | 'warning' | 'danger' | 'info';
  icon: React.ComponentType<any>;
  title: string;
  message: string;
  action?: string;
  actionIcon?: React.ComponentType<any>;
  priority: 'high' | 'medium' | 'low';
  category: 'cost' | 'revenue' | 'operational' | 'seasonal' | 'menu';
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================

const getFoodCategoryFromName = (name: string): string => {
  const lowerName = name.toLowerCase();
  
  // Protein
  if (lowerName.includes('ayam') || lowerName.includes('daging') || lowerName.includes('ikan') || 
      lowerName.includes('telur') || lowerName.includes('tahu') || lowerName.includes('tempe')) {
    return 'protein';
  }
  
  // Karbohidrat
  if (lowerName.includes('nasi') || lowerName.includes('mie') || lowerName.includes('beras') || 
      lowerName.includes('tepung') || lowerName.includes('roti')) {
    return 'karbohidrat';
  }
  
  // Sayuran
  if (lowerName.includes('sayur') || lowerName.includes('bayam') || lowerName.includes('kangkung') ||
      lowerName.includes('kol') || lowerName.includes('tomat') || lowerName.includes('bawang')) {
    return 'sayuran';
  }
  
  // Bumbu
  if (lowerName.includes('garam') || lowerName.includes('gula') || lowerName.includes('minyak') ||
      lowerName.includes('bumbu') || lowerName.includes('sambal') || lowerName.includes('kecap')) {
    return 'bumbu';
  }
  
  // Minuman
  if (lowerName.includes('air') || lowerName.includes('teh') || lowerName.includes('kopi') ||
      lowerName.includes('sirup') || lowerName.includes('susu')) {
    return 'minuman';
  }
  
  return 'lainnya';
};

const generateFNBInsights = (
  currentAnalysis: RealTimeProfitCalculation | null,
  previousAnalysis: RealTimeProfitCalculation | undefined,
  effectiveCogs: number,
  hppBreakdown: Array<{ id: string; nama: string; qty: number; price: number; hpp: number }>
): FNBInsight[] => {
  if (!currentAnalysis) return [];
  
  const insights: FNBInsight[] = [];
  const revenue = currentAnalysis.revenue_data?.total || 0;
  const cogs = effectiveCogs || currentAnalysis.cogs_data?.total || 0;
  const opex = currentAnalysis.opex_data?.total || 0;
  
  const cogsPercentage = revenue > 0 ? (cogs / revenue) * 100 : 0;
  const netProfit = revenue - cogs - opex;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  
  // 1. 🚨 COST ANALYSIS - Modal Bahan Baku
  if (cogsPercentage > 65) {
    insights.push({
      type: 'danger',
      icon: AlertTriangle,
      title: '🚨 Modal Bahan Terlalu Tinggi!',
      message: `Modal bahan baku ${formatPercentage(cogsPercentage)} dari omset. Untuk warung sehat, sebaiknya di bawah 60%. Coba cari supplier lebih murah atau naikkan harga menu secara bertahap.`,
      action: 'Review Supplier & Harga',
      actionIcon: ShoppingCart,
      priority: 'high',
      category: 'cost'
    });
  } else if (cogsPercentage > 50) {
    insights.push({
      type: 'warning',
      icon: AlertTriangle,
      title: '⚠️ Modal Bahan Perlu Diperhatikan',
      message: `Modal bahan baku ${formatPercentage(cogsPercentage)} dari omset. Masih wajar tapi bisa dioptimalkan. Coba nego harga dengan supplier atau kurangi waste.`,
      action: 'Optimasi Modal Bahan',
      actionIcon: Target,
      priority: 'medium',
      category: 'cost'
    });
  } else if (cogsPercentage < 35) {
    insights.push({
      type: 'success',
      icon: CheckCircle,
      title: '✅ Modal Bahan Sangat Efisien!',
      message: `Modal bahan baku hanya ${formatPercentage(cogsPercentage)} dari omset. Ini sangat baik! Pertahankan dan mungkin bisa sedikit tingkatkan kualitas bahan.`,
      action: 'Pertahankan Efisiensi',
      actionIcon: Star,
      priority: 'low',
      category: 'cost'
    });
  }
  
  // 2. 📈 REVENUE GROWTH ANALYSIS
  if (previousAnalysis) {
    const prevRevenue = previousAnalysis.revenue_data?.total || 0;
    const revenueGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
    
    if (revenueGrowth > 20) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: '🚀 Omset Naik Signifikan!',
        message: `Omset naik ${formatPercentage(revenueGrowth)} dari bulan lalu! Luar biasa! Pastikan stok bahan selalu cukup dan pertimbangkan tambah menu favorit.`,
        action: 'Expand Menu Favorit',
        actionIcon: Users,
        priority: 'high',
        category: 'revenue'
      });
    } else if (revenueGrowth < -15) {
      insights.push({
        type: 'danger',
        icon: TrendingDown,
        title: '📉 Omset Turun, Perlu Action!',
        message: `Omset turun ${formatPercentage(Math.abs(revenueGrowth))} dari bulan lalu. Coba analisis: harga terlalu mahal? kompetitor baru? kualitas menurun?`,
        action: 'Analisis Penyebab',
        actionIcon: Zap,
        priority: 'high',
        category: 'revenue'
      });
    }
  }
  
  // 3. 🍽️ MENU & INGREDIENT ANALYSIS
  if (hppBreakdown && hppBreakdown.length > 0) {
    // Cari bahan termahal
    const mostExpensive = hppBreakdown.reduce((max, item) => 
      item.hpp > max.hpp ? item : max
    );
    
    const expensivePercentage = cogs > 0 ? (mostExpensive.hpp / cogs) * 100 : 0;
    
    if (expensivePercentage > 40) {
      const category = getFoodCategoryFromName(mostExpensive.nama);
      let suggestion = '';
      
      switch (category) {
        case 'protein':
          suggestion = 'Coba menu dengan protein lebih murah (telur, tahu, tempe) atau kurangi porsi protein sedikit';
          break;
        case 'karbohidrat':
          suggestion = 'Coba nego harga beras/mie dengan supplier atau beli dalam jumlah lebih besar';
          break;
        case 'sayuran':
          suggestion = 'Sayuran segar naik turun harganya, coba cari supplier sayur lebih murah atau ganti menu sayur musiman';
          break;
        case 'minuman':
          suggestion = 'Untuk minuman, coba buat sendiri atau cari supplier grosir yang lebih murah';
          break;
        default:
          suggestion = 'Cari supplier alternatif atau kurangi penggunaan bahan ini sedikit';
      }
      
      insights.push({
        type: 'warning',
        icon: ShoppingCart,
        title: `🥘 ${mostExpensive.nama} Terlalu Dominan`,
        message: `"${mostExpensive.nama}" menghabiskan ${formatPercentage(expensivePercentage)} dari total modal bahan. ${suggestion}.`,
        action: 'Optimasi Menu',
        actionIcon: Lightbulb,
        priority: 'medium',
        category: 'menu'
      });
    }
  }
  
  // 4. ⏰ SEASONAL & OPERATIONAL INSIGHTS
  const currentMonth = new Date().getMonth() + 1;
  
  // Ramadan insights
  if (currentMonth === 3 || currentMonth === 4) { // March-April (typically Ramadan season)
    insights.push({
      type: 'info',
      icon: Calendar,
      title: '🌙 Siapkan Menu Ramadhan!',
      message: 'Bulan puasa biasanya omset naik 30-50% untuk menu takjil dan bukber. Siapkan paket menu buka puasa dan takjil yang menarik!',
      action: 'Buat Menu Takjil',
      actionIcon: Clock,
      priority: 'high',
      category: 'seasonal'
    });
  }
  
  // Weekend analysis - assuming more sales on weekends
  if (revenue > 0) {
    insights.push({
      type: 'info',
      icon: Users,
      title: '📅 Optimasi Jam Sibuk',
      message: 'Warung biasanya lebih rame weekend dan jam makan (12-13, 18-20). Pastikan stok cukup dan pertimbangkan menu express untuk jam sibuk.',
      action: 'Atur Jadwal Stok',
      actionIcon: Clock,
      priority: 'medium',
      category: 'operational'
    });
  }
  
  // 5. 💰 PROFITABILITY INSIGHTS
  if (netMargin > 25) {
    insights.push({
      type: 'success',
      icon: DollarSign,
      title: '💎 Warung Super Profitable!',
      message: `Margin ${formatPercentage(netMargin)} sangat tinggi! Pertimbangkan ekspansi: tambah meja, delivery online, atau cabang baru.`,
      action: 'Plan Ekspansi',
      actionIcon: TrendingUp,
      priority: 'medium',
      category: 'revenue'
    });
  } else if (netMargin < 5) {
    insights.push({
      type: 'danger',
      icon: AlertTriangle,
      title: '⚠️ Margin Tipis, Hati-hati!',
      message: `Margin hanya ${formatPercentage(netMargin)}. Satu masalah kecil bisa jadi rugi. Fokus kurangi waste dan naikkan efisiensi.`,
      action: 'Emergency Review',
      actionIcon: Zap,
      priority: 'high',
      category: 'cost'
    });
  }
  
  // Sort by priority
  return insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

// ==============================================
// MAIN COMPONENT
// ==============================================

const FNBInsights: React.FC<FNBInsightsProps> = ({
  currentAnalysis,
  previousAnalysis,
  effectiveCogs = 0,
  hppBreakdown = [],
  className = ''
}) => {
  
  const insights = useMemo(() => 
    generateFNBInsights(currentAnalysis, previousAnalysis, effectiveCogs, hppBreakdown),
    [currentAnalysis, previousAnalysis, effectiveCogs, hppBreakdown]
  );
  
  const categorizedInsights = useMemo(() => {
    const categories = {
      high: insights.filter(i => i.priority === 'high'),
      medium: insights.filter(i => i.priority === 'medium'),
      low: insights.filter(i => i.priority === 'low')
    };
    return categories;
  }, [insights]);
  
  if (!currentAnalysis || insights.length === 0) {
    return (
      <div className={`space-y-4 sm:space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Lightbulb className="w-5 h-5 mr-2 text-orange-600" />
              🍽️ Saran & Tips Khusus Warung
            </CardTitle>
            <CardDescription className="text-sm">
              Belum ada cukup data untuk memberikan saran. Pastikan data keuangan sudah lengkap.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Lightbulb className="w-5 h-5 mr-2 text-orange-600" />
            🍽️ Saran & Tips Khusus Warung
          </CardTitle>
          <CardDescription className="text-sm">
            Analisis otomatis berdasarkan data keuangan warung Anda dengan saran yang bisa langsung diterapkan
          </CardDescription>
        </CardHeader>
      </Card>
      
      {/* Priority Insights */}
      {categorizedInsights.high.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center text-base sm:text-lg">
              <AlertTriangle className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              🚨 Perlu Perhatian Segera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {categorizedInsights.high.map((insight, index) => {
                const Icon = insight.icon;
                const ActionIcon = insight.actionIcon;
                
                return (
                  <Alert key={index} className="border-red-200 bg-red-50">
                    <Icon className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-semibold text-red-800 text-sm sm:text-base">{insight.title}</div>
                        <div className="text-red-700 text-xs sm:text-sm leading-relaxed">{insight.message}</div>
                        {insight.action && (
                          <Button size="sm" variant="outline" className="mt-2 border-red-300 text-red-700 hover:bg-red-100 text-xs">
                            {ActionIcon && <ActionIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                            {insight.action}
                          </Button>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Medium Priority */}
      {categorizedInsights.medium.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600 flex items-center text-base sm:text-lg">
              <Target className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              💡 Peluang Optimasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {categorizedInsights.medium.map((insight, index) => {
                const Icon = insight.icon;
                const ActionIcon = insight.actionIcon;
                
                return (
                  <Alert key={index} className="border-orange-200 bg-orange-50">
                    <Icon className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-semibold text-orange-800 text-sm sm:text-base">{insight.title}</div>
                        <div className="text-orange-700 text-xs sm:text-sm leading-relaxed">{insight.message}</div>
                        {insight.action && (
                          <Button size="sm" variant="outline" className="mt-2 border-orange-300 text-orange-700 hover:bg-orange-100 text-xs">
                            {ActionIcon && <ActionIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                            {insight.action}
                          </Button>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Success & Good News */}
      {categorizedInsights.low.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center text-base sm:text-lg">
              <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              ✅ Hal Yang Sudah Baik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {categorizedInsights.low.map((insight, index) => {
                const Icon = insight.icon;
                const ActionIcon = insight.actionIcon;
                
                return (
                  <Alert key={index} className="border-green-200 bg-green-50">
                    <Icon className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-semibold text-green-800 text-sm sm:text-base">{insight.title}</div>
                        <div className="text-green-700 text-xs sm:text-sm leading-relaxed">{insight.message}</div>
                        {insight.action && (
                          <Button size="sm" variant="outline" className="mt-2 border-green-300 text-green-700 hover:bg-green-100 text-xs">
                            {ActionIcon && <ActionIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                            {insight.action}
                          </Button>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base text-gray-700">📊 Ringkasan Analisis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="destructive" className="text-xs">
              {categorizedInsights.high.length} Prioritas Tinggi
            </Badge>
            <Badge className="bg-orange-100 text-orange-800 text-xs">
              {categorizedInsights.medium.length} Peluang Optimasi
            </Badge>
            <Badge variant="outline" className="text-xs">
              {categorizedInsights.low.length} Hal Positif
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-3 leading-relaxed">
            Analisis diperbarui berdasarkan data keuangan terbaru • Saran khusus untuk bisnis F&B
          </p>
        </CardContent>
      </Card>
      
    </div>
  );
};

export default FNBInsights;
