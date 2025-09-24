// src/components/financial/components/DailyCashFlowTracker.tsx

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

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

interface DailyCashFlowProps {
  transactions: Transaction[];
  className?: string;
}

interface DailyData {
  date: string;
  masuk: number;
  keluar: number;
  saldo: number;
  transaksi: number;
}

// ==============================================
// COMPONENT
// ==============================================

const DailyCashFlowTracker: React.FC<DailyCashFlowProps> = ({ 
  transactions, 
  className 
}) => {
  const { formatCurrency } = useCurrency();
  // Hitung data harian
  const dailyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayTransactions = transactions.filter(t => {
        if (!t.date) return false;
        const dateStr = t.date instanceof Date ? t.date.toISOString() : String(t.date);
        return dateStr.startsWith(date);
      });

      const masuk = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const keluar = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      return {
        date,
        masuk,
        keluar,
        saldo: masuk - keluar,
        transaksi: dayTransactions.length
      };
    });
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Hari Ini';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Kemarin';
    } else {
      return date.toLocaleDateString('id-ID', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const totalMasuk = dailyData.reduce((sum, day) => sum + day.masuk, 0);
  const totalKeluar = dailyData.reduce((sum, day) => sum + day.keluar, 0);
  const totalSaldo = totalMasuk - totalKeluar;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-orange-600" />
          Arus Kas 7 Hari Terakhir
        </CardTitle>
        <p className="text-sm text-orange-600">
          Lihat uang masuk dan keluar setiap hari dengan mudah
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ringkasan Total */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-orange-50 rounded-lg">
          <div className="text-center">
              <p className="text-xs text-orange-500 mb-1">Total Masuk</p>
              <p className="font-semibold text-orange-600 text-sm">
                +{formatCurrency(totalMasuk)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-orange-500 mb-1">Total Keluar</p>
              <p className="font-semibold text-orange-600 text-sm">
                -{formatCurrency(totalKeluar)}
              </p>
            </div>
          <div className="text-center">
            <p className="text-xs text-orange-500 mb-1">Selisih</p>
            <p className="font-bold text-sm text-orange-600">
              {formatCurrency(totalSaldo)}
            </p>
          </div>
        </div>

        {/* Data Harian */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-orange-700 mb-3">
            Rincian Per Hari:
          </h4>
          {dailyData.map((day, index) => (
            <div 
              key={day.date} 
              className={cn(
                "flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border gap-2",
                index === dailyData.length - 1 ? "bg-gray-50 border-gray-200" : "bg-white"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  day.saldo >= 0 ? "bg-orange-600" : "bg-orange-400"
                )} />
                <div>
                  <p className="font-medium text-sm">{formatDate(day.date)}</p>
                  <p className="text-xs text-gray-500">
                    {day.transaksi} transaksi
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm ml-5 sm:ml-0">
                <div className="flex items-center justify-between sm:justify-start gap-1">
                  <span className="text-orange-500 text-xs sm:hidden">Masuk:</span>
                  <span className="font-medium text-orange-600">
                    {day.masuk > 0 ? '+' + formatCurrency(day.masuk) : '-'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between sm:justify-start gap-1">
                  <span className="text-orange-500 text-xs sm:hidden">Keluar:</span>
                  <span className="font-medium text-orange-600">
                    {day.keluar > 0 ? '-' + formatCurrency(day.keluar) : '-'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between sm:justify-start gap-1">
                  <span className="text-orange-500 text-xs sm:hidden">Saldo:</span>
                  <div className={cn(
                    "font-semibold",
                    day.saldo >= 0 ? "text-orange-700" : "text-orange-500"
                  )}>
                    {formatCurrency(day.saldo)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips Sederhana */}
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-2">
            <DollarSign className="h-4 w-4 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800 mb-1">
                Tips Arus Kas:
              </p>
              <p className="text-xs text-orange-700">
                {totalSaldo >= 0 
                  ? "Bagus! Uang masuk lebih besar dari keluar. Sisihkan sebagian untuk tabungan."
                  : "Hati-hati! Pengeluaran lebih besar dari pemasukan. Coba kurangi pengeluaran yang tidak penting."
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyCashFlowTracker;