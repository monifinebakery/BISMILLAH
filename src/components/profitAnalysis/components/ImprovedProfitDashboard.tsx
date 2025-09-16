// ImprovedProfitDashboard.tsx - User-friendly profit analysis with guided flow
// ================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2, 
  ArrowRight, Target, Calendar, Download, RefreshCw,
  DollarSign, Package, Calculator, Info, ChevronRight,
  Lightbulb, AlertTriangle, Sparkles, PieChart
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProfitAnalysis } from '../hooks';
import { formatCurrency, formatPercentage } from '../utils/profitTransformers';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ===== TYPES =====
interface DashboardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
  actionLabel?: string;
}

interface HealthIndicator {
  label: string;
  value: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
  recommendation?: string;
}

// ===== COMPONENTS =====

// 1. Welcome & Setup Component
const WelcomeSection: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const steps: DashboardStep[] = [
    {
      id: 'revenue',
      title: '💰 Catat Penjualan',
      description: 'Pastikan semua transaksi penjualan sudah dicatat',
      completed: true, // Check dari data
    },
    {
      id: 'inventory',
      title: '📦 Setup Stok Barang',
      description: 'Input data stok dan harga bahan baku',
      completed: false,
    },
    {
      id: 'opex',
      title: '💡 Biaya Operasional',
      description: 'Catat biaya sewa, listrik, gaji, dll',
      completed: false,
    },
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <CardTitle>Selamat Datang di Analisis Profit! 🎯</CardTitle>
        </div>
        <CardDescription>
          Yuk setup dulu biar analisisnya akurat. Tinggal 3 langkah aja kok!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress Setup</span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${
                step.completed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-400" />
                  )}
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
                {!step.completed && step.action && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={step.action}
                  >
                    {step.actionLabel || 'Setup'}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {progress === 100 && (
          <Button 
            className="w-full" 
            onClick={onComplete}
          >
            Lihat Analisis Profit 
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// 2. Health Score Component
const HealthScoreCard: React.FC<{ metrics: any }> = ({ metrics }) => {
  const calculateHealthScore = () => {
    const scores = [];
    
    // Gross margin score (target: 60-70% untuk F&B)
    const grossMarginScore = metrics.grossMargin >= 60 ? 100 : 
                             metrics.grossMargin >= 50 ? 75 :
                             metrics.grossMargin >= 40 ? 50 : 25;
    scores.push(grossMarginScore);
    
    // Net margin score (target: 15-20% untuk F&B)
    const netMarginScore = metrics.netMargin >= 15 ? 100 :
                          metrics.netMargin >= 10 ? 75 :
                          metrics.netMargin >= 5 ? 50 : 25;
    scores.push(netMarginScore);
    
    // COGS ratio score (target: <40% untuk F&B)
    const cogsRatio = (metrics.cogs / metrics.revenue) * 100;
    const cogsScore = cogsRatio <= 40 ? 100 :
                      cogsRatio <= 50 ? 75 :
                      cogsRatio <= 60 ? 50 : 25;
    scores.push(cogsScore);
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const healthScore = calculateHealthScore();
  const getHealthColor = () => {
    if (healthScore >= 75) return 'text-green-600 bg-green-50';
    if (healthScore >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };
  
  const getHealthEmoji = () => {
    if (healthScore >= 75) return '🎉';
    if (healthScore >= 50) return '😊';
    return '😟';
  };

  return (
    <Card className={`border-2 ${healthScore >= 75 ? 'border-green-200' : healthScore >= 50 ? 'border-yellow-200' : 'border-red-200'}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Kesehatan Bisnis</span>
          <span className="text-3xl">{getHealthEmoji()}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getHealthColor()}`}>
            <span className="text-5xl font-bold">{healthScore}</span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {healthScore >= 75 ? 'Mantap! Bisnis kamu sehat 💪' :
             healthScore >= 50 ? 'Lumayan, tapi masih bisa lebih baik 📈' :
             'Perlu perhatian khusus nih 🔧'}
          </p>
        </div>

        <div className="space-y-2">
          <HealthIndicator 
            label="Untung Kotor" 
            value={metrics.grossMargin}
            target={60}
            type="margin"
          />
          <HealthIndicator 
            label="Untung Bersih" 
            value={metrics.netMargin}
            target={15}
            type="margin"
          />
          <HealthIndicator 
            label="Efisiensi Bahan" 
            value={100 - (metrics.cogs / metrics.revenue * 100)}
            target={60}
            type="efficiency"
          />
        </div>
      </CardContent>
    </Card>
  );
};

// 3. Health Indicator Component
const HealthIndicator: React.FC<{ 
  label: string; 
  value: number; 
  target: number; 
  type: 'margin' | 'efficiency' 
}> = ({ label, value, target, type }) => {
  const percentage = Math.min((value / target) * 100, 100);
  const status = value >= target ? 'good' : value >= target * 0.75 ? 'warning' : 'danger';
  
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">
          {formatPercentage(value)}
          <span className="text-gray-400 ml-1">/ {target}%</span>
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${getStatusColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// 4. Quick Insights Component
const QuickInsights: React.FC<{ analysis: any }> = ({ analysis }) => {
  const insights = useMemo(() => {
    const items = [];
    
    // Revenue insight
    if (analysis?.revenue_data?.total > 0) {
      items.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Penjualan Bagus!',
        description: `Omset ${formatCurrency(analysis.revenue_data.total)} bulan ini`,
      });
    }
    
    // COGS warning
    const cogsRatio = (analysis?.cogs_data?.total / analysis?.revenue_data?.total) * 100;
    if (cogsRatio > 50) {
      items.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Modal Bahan Tinggi',
        description: `${formatPercentage(cogsRatio)} dari omset. Target ideal: <40%`,
        action: 'Cek harga supplier atau porsi menu',
      });
    }
    
    // Profit status
    const netProfit = (analysis?.revenue_data?.total || 0) - 
                     (analysis?.cogs_data?.total || 0) - 
                     (analysis?.opex_data?.total || 0);
    if (netProfit < 0) {
      items.push({
        type: 'danger',
        icon: TrendingDown,
        title: 'Rugi Bulan Ini',
        description: `Minus ${formatCurrency(Math.abs(netProfit))}`,
        action: 'Perlu evaluasi menyeluruh!',
      });
    }
    
    return items;
  }, [analysis]);

  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        Quick Insights
      </h3>
      
      {insights.map((insight, index) => (
        <Alert 
          key={index}
          className={
            insight.type === 'success' ? 'border-green-200 bg-green-50' :
            insight.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
            'border-red-200 bg-red-50'
          }
        >
          <insight.icon className="h-4 w-4" />
          <AlertTitle>{insight.title}</AlertTitle>
          <AlertDescription>
            {insight.description}
            {insight.action && (
              <p className="mt-2 font-semibold">{insight.action}</p>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

// 5. Simplified Metric Cards
const SimplifiedMetricCard: React.FC<{
  title: string;
  value: number;
  subtitle?: string;
  icon: any;
  trend?: number;
  helpText: string;
  status?: 'good' | 'warning' | 'danger';
}> = ({ title, value, subtitle, icon: Icon, trend, helpText, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'danger': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200';
    }
  };

  return (
    <Card className={`relative overflow-hidden ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Icon className="h-8 w-8 text-gray-400" />
          {trend !== undefined && (
            <Badge variant={trend >= 0 ? 'default' : 'destructive'} className="text-xs">
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
            </Badge>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{formatCurrency(value)}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <Info className="h-3 w-3" />
            {helpText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// ===== MAIN DASHBOARD COMPONENT =====
const ImprovedProfitDashboard: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'details' | 'trends'>('overview');
  const isMobile = useIsMobile();

  const {
    currentAnalysis,
    loading,
    error,
    refreshAnalysis,
    profitMetrics,
    currentPeriod,
  } = useProfitAnalysis({
    autoCalculate: true,
    enableWAC: true,
  });

  // Check if setup is complete
  const isSetupComplete = useMemo(() => {
    const hasRevenue = (currentAnalysis?.revenue_data?.total || 0) > 0;
    const hasCogs = (currentAnalysis?.cogs_data?.total || 0) > 0;
    const hasOpex = (currentAnalysis?.opex_data?.total || 0) > 0;
    
    return hasRevenue; // Simplified check - at least have revenue
  }, [currentAnalysis]);

  useEffect(() => {
    if (isSetupComplete) {
      setShowWelcome(false);
    }
  }, [isSetupComplete]);

  const handleRefresh = async () => {
    try {
      await refreshAnalysis();
      toast.success('Data berhasil diperbarui! 🎉');
    } catch (error) {
      toast.error('Gagal memperbarui data 😞');
    }
  };

  // Calculate business metrics
  const businessMetrics = useMemo(() => {
    if (!currentAnalysis) return null;
    
    const revenue = currentAnalysis.revenue_data?.total || 0;
    const cogs = profitMetrics.cogs || currentAnalysis.cogs_data?.total || 0;
    const opex = currentAnalysis.opex_data?.total || 0;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - opex;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    
    return {
      revenue,
      cogs,
      opex,
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
    };
  }, [currentAnalysis, profitMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Sedang menghitung profit...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (showWelcome && !isSetupComplete) {
    return <WelcomeSection onComplete={() => setShowWelcome(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analisis Profit {currentPeriod}</h1>
          <p className="text-gray-600">
            Pantau kesehatan bisnis kamu dengan mudah
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Insights */}
      {businessMetrics && <QuickInsights analysis={currentAnalysis} />}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SimplifiedMetricCard
              title="Omset Penjualan"
              value={businessMetrics?.revenue || 0}
              icon={DollarSign}
              helpText="Total uang masuk dari jualan"
              status="good"
            />
            
            <SimplifiedMetricCard
              title="Untung Bersih"
              value={businessMetrics?.netProfit || 0}
              subtitle={`${formatPercentage(businessMetrics?.netMargin || 0)} margin`}
              icon={TrendingUp}
              helpText="Untung yang bisa dibawa pulang"
              status={businessMetrics?.netProfit > 0 ? 'good' : 'danger'}
            />
            
            <SimplifiedMetricCard
              title="Modal Bahan"
              value={businessMetrics?.cogs || 0}
              subtitle={`${formatPercentage((businessMetrics?.cogs / businessMetrics?.revenue) * 100 || 0)} dari omset`}
              icon={Package}
              helpText="Total biaya bahan baku"
              status={(businessMetrics?.cogs / businessMetrics?.revenue) * 100 < 40 ? 'good' : 'warning'}
            />
            
            <SimplifiedMetricCard
              title="Biaya Operasional"
              value={businessMetrics?.opex || 0}
              subtitle={`${formatPercentage((businessMetrics?.opex / businessMetrics?.revenue) * 100 || 0)} dari omset`}
              icon={Calculator}
              helpText="Sewa, listrik, gaji, dll"
            />
          </div>

          {/* Detailed Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Breakdown Detail</CardTitle>
              <CardDescription>
                Lihat rincian pemasukan dan pengeluaran
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedView} onValueChange={(v: any) => setSelectedView(v)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Ringkasan</TabsTrigger>
                  <TabsTrigger value="details">Detail</TabsTrigger>
                  <TabsTrigger value="trends">Trend</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">💰 Pemasukan</span>
                      <span className="font-bold">{formatCurrency(businessMetrics?.revenue || 0)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="font-medium">📦 Modal Bahan</span>
                      <span className="font-bold">- {formatCurrency(businessMetrics?.cogs || 0)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium">= Untung Kotor</span>
                      <span className="font-bold">{formatCurrency(businessMetrics?.grossProfit || 0)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="font-medium">💡 Biaya Operasional</span>
                      <span className="font-bold">- {formatCurrency(businessMetrics?.opex || 0)}</span>
                    </div>
                    
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      businessMetrics?.netProfit > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <span className="font-bold">= Untung Bersih</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(businessMetrics?.netProfit || 0)}
                      </span>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="details">
                  <p className="text-gray-600 text-sm">
                    Detail breakdown akan ditampilkan di sini...
                  </p>
                </TabsContent>
                
                <TabsContent value="trends">
                  <p className="text-gray-600 text-sm">
                    Trend analysis akan ditampilkan di sini...
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Health Score */}
        <div>
          {businessMetrics && <HealthScoreCard metrics={businessMetrics} />}
          
          {/* Tips & Recommendations */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Tips Meningkatkan Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span>📈</span>
                  <span>Naikkan harga menu yang laris 5-10%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>📦</span>
                  <span>Nego ulang harga dengan supplier</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>💡</span>
                  <span>Kurangi waste dengan porsi yang tepat</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🎯</span>
                  <span>Fokus promosi menu margin tinggi</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImprovedProfitDashboard;