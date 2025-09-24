// src/components/financial/components/ProfitLossSimple.tsx

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==============================================
// TYPES
// ==============================================

interface Transaction {
  id: string;
  date: Date | string | null;
  amount: number;
  type: 'income' | 'expense';
  description?: string | null;
  category?: string | null;
}

interface ProfitLossSimpleProps {
  transactions: Transaction[];
  className?: string;
}

interface MonthlyAnalysis {
  totalMasuk: number;
  totalKeluar: number;
  untungRugi: number;
  persentaseUntung: number;
  kategoriTerbesar: string;
  jumlahTransaksi: number;
  rataHarian: number;
}

// ==============================================
// COMPONENT
// ==============================================

const ProfitLossSimple: React.FC<ProfitLossSimpleProps> = ({ 
  transactions, 
  className 
}) => {
  const { formatCurrency } = useCurrency();
  // Analisis data bulan ini
  const monthlyAnalysis = useMemo((): MonthlyAnalysis => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthTransactions = transactions.filter(t => {
      if (!t.date) return false;
      const dateStr = t.date instanceof Date ? t.date.toISOString() : String(t.date);
      return dateStr.startsWith(currentMonth);
    });

    const totalMasuk = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalKeluar = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const untungRugi = totalMasuk - totalKeluar;
    const persentaseUntung = totalMasuk > 0 ? (untungRugi / totalMasuk) * 100 : 0;

    // Cari kategori pengeluaran terbesar
    const expensesByCategory = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.category || 'Lain-lain';
        acc[category] = (acc[category] || 0) + (t.amount || 0);
        return acc;
      }, {} as Record<string, number>);

    const kategoriTerbesar = Object.entries(expensesByCategory)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Tidak ada';

    const daysInMonth = new Date().getDate();
    const rataHarian = untungRugi / daysInMonth;

    return {
      totalMasuk,
      totalKeluar,
      untungRugi,
      persentaseUntung,
      kategoriTerbesar,
      jumlahTransaksi: monthTransactions.length,
      rataHarian
    };
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusInfo = () => {
    if (monthlyAnalysis.untungRugi > 0) {
      return {
        status: 'untung',
        icon: CheckCircle,
        color: 'gray',
        message: 'Alhamdulillah! Bisnis untung bulan ini',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
    } else if (monthlyAnalysis.untungRugi < 0) {
      return {
        status: 'rugi',
        icon: AlertCircle,
        color: 'gray',
        message: 'Hati-hati! Bisnis rugi bulan ini',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
    } else {
      return {
        status: 'impas',
        icon: AlertCircle,
        color: 'gray',
        message: 'Bisnis impas (tidak untung tidak rugi)',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
    }
  };

  const getTips = () => {
    const { untungRugi, persentaseUntung, totalKeluar, totalMasuk } = monthlyAnalysis;
    
    if (untungRugi > 0) {
      if (persentaseUntung > 20) {
        return "Profit margin sangat bagus! Pertahankan dan pertimbangkan untuk ekspansi.";
      } else if (persentaseUntung > 10) {
        return "Profit margin sehat. Coba tingkatkan dengan efisiensi operasional.";
      } else {
        return "Profit tipis. Coba kurangi pengeluaran atau naikkan harga jual.";
      }
    } else if (untungRugi < 0) {
      if (totalMasuk === 0) {
        return "Belum ada pemasukan. Fokus pada penjualan dan marketing.";
      } else {
        return "Pengeluaran terlalu besar. Review dan potong biaya yang tidak perlu.";
      }
    } else {
      return "Coba tingkatkan penjualan atau kurangi pengeluaran untuk dapat profit.";
    }
  };

  const statusInfo = getStatusInfo();
  const currentMonth = new Date().toLocaleDateString('id-ID', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          Untung Rugi Bulan {currentMonth}
        </CardTitle>
        <p className="text-sm text-orange-600">
          Ringkasan sederhana kondisi keuangan bisnis bulan ini
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Utama */}
        <div className={cn(
          "p-4 rounded-lg border-2",
          statusInfo.bgColor,
          statusInfo.borderColor
        )}>
          <div className="flex items-center gap-3 mb-3">
            <statusInfo.icon className={cn(
              "h-6 w-6",
              `text-${statusInfo.color}-600`
            )} />
            <div>
              <h3 className={cn(
                "font-semibold text-lg",
                `text-${statusInfo.color}-800`
              )}>
                {statusInfo.message}
              </h3>
              <p className={cn(
                "text-2xl font-bold mt-1",
                'text-gray-700'
              )}>
                {formatCurrency(Math.abs(monthlyAnalysis.untungRugi))}
              </p>
            </div>
          </div>
          
          {monthlyAnalysis.untungRugi !== 0 && (
            <p className={cn(
              "text-sm",
              `text-${statusInfo.color}-700`
            )}>
              Margin: {monthlyAnalysis.persentaseUntung.toFixed(1)}% dari total pemasukan
            </p>
          )}
        </div>

        {/* Rincian Angka */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Uang Masuk
              </span>
            </div>
            <p className="text-lg font-bold text-orange-700">
              {formatCurrency(monthlyAnalysis.totalMasuk)}
            </p>
            <p className="text-xs text-orange-600 mt-1">
              Rata-rata: {formatCurrency(monthlyAnalysis.rataHarian)} /hari
            </p>
          </div>
          
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Uang Keluar
              </span>
            </div>
            <p className="text-lg font-bold text-orange-700">
              {formatCurrency(monthlyAnalysis.totalKeluar)}
            </p>
            <p className="text-xs text-orange-600 mt-1">
              Terbesar: {monthlyAnalysis.kategoriTerbesar}
            </p>
          </div>
        </div>

        {/* Info Tambahan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">Total Transaksi</p>
            <p className="font-semibold text-gray-700">
              {monthlyAnalysis.jumlahTransaksi}
            </p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">Rata-rata Harian</p>
            <p className={cn(
              "font-semibold",
              monthlyAnalysis.rataHarian >= 0 ? 'text-gray-700' : 'text-gray-500'
            )}>
              {formatCurrency(monthlyAnalysis.rataHarian)}
            </p>
          </div>
        </div>

        {/* Tips Praktis */}
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800 mb-1">
                Tips Untuk Bulan Depan:
              </p>
              <p className="text-xs text-orange-700">
                {getTips()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitLossSimple;