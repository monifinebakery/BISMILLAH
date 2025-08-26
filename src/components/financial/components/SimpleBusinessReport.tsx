// src/components/financial/components/SimpleBusinessReport.tsx

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar, Target, Lightbulb, BarChart3, DollarSign, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==============================================
// TYPES
// ==============================================

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string | null;
  description: string | null;
  date: Date | string | null;
}

interface SimpleBusinessReportProps {
  transactions: Transaction[];
  className?: string;
}

// ==============================================
// MAIN COMPONENT
// ==============================================

const SimpleBusinessReport: React.FC<SimpleBusinessReportProps> = ({ transactions, className }) => {
  // Helper function untuk format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Analisis bisnis komprehensif
  const businessAnalysis = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
    
    // Helper function untuk filter transaksi berdasarkan bulan
    const getMonthTransactions = (month: string) => {
      return transactions.filter(t => {
        let dateStr = '';
        if (t.date instanceof Date) {
          dateStr = t.date.toISOString().slice(0, 7);
        } else if (typeof t.date === 'string' && t.date) {
          dateStr = t.date.slice(0, 7);
        }
        return dateStr === month;
      });
    };

    const thisMonthTxs = getMonthTransactions(currentMonth);
    const lastMonthTxs = getMonthTransactions(lastMonth);

    // Hitung pendapatan dan pengeluaran
    const thisMonthIncome = thisMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const thisMonthExpense = thisMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const thisMonthProfit = thisMonthIncome - thisMonthExpense;

    const lastMonthIncome = lastMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const lastMonthExpense = lastMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const lastMonthProfit = lastMonthIncome - lastMonthExpense;

    // Hitung perubahan dari bulan lalu
    const incomeChange = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
    const expenseChange = lastMonthExpense > 0 ? ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100 : 0;
    const profitChange = lastMonthProfit !== 0 ? ((thisMonthProfit - lastMonthProfit) / Math.abs(lastMonthProfit)) * 100 : 0;

    // Analisis kategori pengeluaran terbesar
    const expensesByCategory = thisMonthTxs
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.category || 'Lainnya';
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const topExpenseCategories = Object.entries(expensesByCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    // Analisis tren harian (7 hari terakhir)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().slice(0, 10);
    }).reverse();

    const dailyTrends = last7Days.map(date => {
      const dayTxs = transactions.filter(t => {
        let txDate = '';
        if (t.date instanceof Date) {
          txDate = t.date.toISOString().slice(0, 10);
        } else if (typeof t.date === 'string' && t.date) {
          txDate = t.date.slice(0, 10);
        }
        return txDate === date;
      });

      const income = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      return {
        date,
        income,
        expense,
        profit: income - expense
      };
    });

    // Hitung rata-rata harian
    const avgDailyIncome = dailyTrends.reduce((sum, day) => sum + day.income, 0) / 7;
    const avgDailyExpense = dailyTrends.reduce((sum, day) => sum + day.expense, 0) / 7;

    // Status kesehatan bisnis
    const getBusinessHealth = () => {
      if (thisMonthProfit > 0 && incomeChange > 0) return 'excellent';
      if (thisMonthProfit > 0) return 'good';
      if (thisMonthProfit > lastMonthProfit) return 'improving';
      return 'needs_attention';
    };

    // Generate insights dan rekomendasi
    const generateInsights = () => {
      const insights = [];

      // Insight tentang profitabilitas
      if (thisMonthProfit > 0) {
        insights.push({
          type: 'positive',
          title: 'Bisnis Untung!',
          message: `Bulan ini bisnis untung ${formatCurrency(thisMonthProfit)}. Pertahankan momentum ini!`
        });
      } else {
        insights.push({
          type: 'warning',
          title: 'Perlu Perhatian',
          message: `Bulan ini rugi ${formatCurrency(Math.abs(thisMonthProfit))}. Coba kurangi pengeluaran atau tingkatkan penjualan.`
        });
      }

      // Insight tentang tren pendapatan
      if (incomeChange > 10) {
        insights.push({
          type: 'positive',
          title: 'Pendapatan Naik!',
          message: `Pendapatan naik ${incomeChange.toFixed(1)}% dari bulan lalu. Strategi marketing berhasil!`
        });
      } else if (incomeChange < -10) {
        insights.push({
          type: 'warning',
          title: 'Pendapatan Turun',
          message: `Pendapatan turun ${Math.abs(incomeChange).toFixed(1)}% dari bulan lalu. Perlu strategi baru untuk boost penjualan.`
        });
      }

      // Insight tentang pengeluaran
      if (expenseChange > 20) {
        insights.push({
          type: 'warning',
          title: 'Pengeluaran Naik Drastis',
          message: `Pengeluaran naik ${expenseChange.toFixed(1)}% dari bulan lalu. Cek apakah semua pengeluaran memang perlu.`
        });
      }

      // Insight tentang kategori pengeluaran terbesar
      if (topExpenseCategories.length > 0) {
        const [topCategory, topAmount] = topExpenseCategories[0];
        const percentage = (topAmount / thisMonthExpense) * 100;
        if (percentage > 40) {
          insights.push({
            type: 'info',
            title: 'Pengeluaran Terbesar',
            message: `${topCategory} menghabiskan ${percentage.toFixed(1)}% dari total pengeluaran (${formatCurrency(topAmount)}). Cek apakah bisa dioptimalkan.`
          });
        }
      }

      return insights;
    };

    return {
      thisMonth: {
        income: thisMonthIncome,
        expense: thisMonthExpense,
        profit: thisMonthProfit
      },
      lastMonth: {
        income: lastMonthIncome,
        expense: lastMonthExpense,
        profit: lastMonthProfit
      },
      changes: {
        income: incomeChange,
        expense: expenseChange,
        profit: profitChange
      },
      topExpenseCategories,
      dailyTrends,
      avgDaily: {
        income: avgDailyIncome,
        expense: avgDailyExpense
      },
      businessHealth: getBusinessHealth(),
      insights: generateInsights()
    };
  }, [transactions]);

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-700 bg-green-50 border-green-200';
      case 'good': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'improving': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default: return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  const getHealthMessage = (health: string) => {
    switch (health) {
      case 'excellent': return 'Bisnis dalam kondisi sangat baik! 🎉';
      case 'good': return 'Bisnis berjalan dengan baik 👍';
      case 'improving': return 'Bisnis menunjukkan perbaikan 📈';
      default: return 'Bisnis perlu perhatian khusus ⚠️';
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Gimana Bisnis Bulan Ini?
        </CardTitle>
        <p className="text-sm text-gray-600">
          Laporan sederhana dengan insights yang mudah dipahami
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Business Health Status */}
        <div className={cn("border rounded-lg p-4", getHealthColor(businessAnalysis.businessHealth))}>
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5" />
            <h4 className="font-medium">Status Bisnis</h4>
          </div>
          <p className="text-lg font-semibold">{getHealthMessage(businessAnalysis.businessHealth)}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-green-800">Pendapatan</h4>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xl font-bold text-green-700">
              {formatCurrency(businessAnalysis.thisMonth.income)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {businessAnalysis.changes.income > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={cn(
                "text-sm font-medium",
                businessAnalysis.changes.income > 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatPercentage(businessAnalysis.changes.income)}
              </span>
              <span className="text-xs text-gray-600">vs bulan lalu</span>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-red-800">Pengeluaran</h4>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-xl font-bold text-red-700">
              {formatCurrency(businessAnalysis.thisMonth.expense)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {businessAnalysis.changes.expense > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
              <span className={cn(
                "text-sm font-medium",
                businessAnalysis.changes.expense > 0 ? "text-red-600" : "text-green-600"
              )}>
                {formatPercentage(businessAnalysis.changes.expense)}
              </span>
              <span className="text-xs text-gray-600">vs bulan lalu</span>
            </div>
          </div>

          <div className={cn(
            "border rounded-lg p-4",
            businessAnalysis.thisMonth.profit > 0 
              ? "bg-blue-50 border-blue-200" 
              : "bg-orange-50 border-orange-200"
          )}>
            <div className="flex items-center justify-between mb-2">
              <h4 className={cn(
                "text-sm font-medium",
                businessAnalysis.thisMonth.profit > 0 ? "text-blue-800" : "text-orange-800"
              )}>
                {businessAnalysis.thisMonth.profit > 0 ? 'Untung' : 'Rugi'}
              </h4>
              <Target className={cn(
                "h-4 w-4",
                businessAnalysis.thisMonth.profit > 0 ? "text-blue-600" : "text-orange-600"
              )} />
            </div>
            <p className={cn(
              "text-xl font-bold",
              businessAnalysis.thisMonth.profit > 0 ? "text-blue-700" : "text-orange-700"
            )}>
              {formatCurrency(Math.abs(businessAnalysis.thisMonth.profit))}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {businessAnalysis.changes.profit > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={cn(
                "text-sm font-medium",
                businessAnalysis.changes.profit > 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatPercentage(businessAnalysis.changes.profit)}
              </span>
              <span className="text-xs text-gray-600">vs bulan lalu</span>
            </div>
          </div>
        </div>

        {/* Top Expense Categories */}
        {businessAnalysis.topExpenseCategories.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Pengeluaran Terbesar Bulan Ini:</h4>
            <div className="space-y-2">
              {businessAnalysis.topExpenseCategories.map(([category, amount], index) => {
                const percentage = (amount / businessAnalysis.thisMonth.expense) * 100;
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                        index === 0 ? "bg-red-500" : index === 1 ? "bg-orange-500" : "bg-yellow-500"
                      )}>
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium">{category}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(amount)}</p>
                      <p className="text-xs text-gray-600">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily Average */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-3">Rata-rata Harian (7 hari terakhir):</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-blue-700">Pendapatan per hari:</p>
              <p className="text-lg font-bold text-blue-800">{formatCurrency(businessAnalysis.avgDaily.income)}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Pengeluaran per hari:</p>
              <p className="text-lg font-bold text-blue-800">{formatCurrency(businessAnalysis.avgDaily.expense)}</p>
            </div>
          </div>
        </div>

        {/* Insights & Recommendations */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Insights & Rekomendasi:
          </h4>
          
          {businessAnalysis.insights.map((insight, index) => (
            <div key={index} className={cn(
              "border rounded-lg p-4",
              insight.type === 'positive' ? "bg-green-50 border-green-200" :
              insight.type === 'warning' ? "bg-orange-50 border-orange-200" :
              "bg-blue-50 border-blue-200"
            )}>
              <div className="flex items-start gap-2">
                {insight.type === 'positive' ? (
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                ) : insight.type === 'warning' ? (
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                ) : (
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                )}
                <div>
                  <h5 className={cn(
                    "font-medium mb-1",
                    insight.type === 'positive' ? "text-green-800" :
                    insight.type === 'warning' ? "text-orange-800" :
                    "text-blue-800"
                  )}>
                    {insight.title}
                  </h5>
                  <p className={cn(
                    "text-sm",
                    insight.type === 'positive' ? "text-green-700" :
                    insight.type === 'warning' ? "text-orange-700" :
                    "text-blue-700"
                  )}>
                    {insight.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Tips */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h5 className="font-medium text-purple-800 mb-2">💡 Tips Aksi Bulan Depan:</h5>
          <ul className="text-sm text-purple-700 space-y-1">
            {businessAnalysis.thisMonth.profit > 0 ? (
              <>
                <li>• Pertahankan strategi yang sudah berhasil</li>
                <li>• Investasikan sebagian keuntungan untuk pengembangan</li>
                <li>• Coba ekspansi ke produk/layanan baru</li>
              </>
            ) : (
              <>
                <li>• Review semua pengeluaran, potong yang tidak perlu</li>
                <li>• Fokus pada produk/layanan yang paling laku</li>
                <li>• Tingkatkan marketing untuk boost penjualan</li>
              </>
            )}
            <li>• Set target yang realistis untuk bulan depan</li>
            <li>• Monitor cash flow setiap hari</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleBusinessReport;