// src/components/financial/components/DailySummaryWidget.tsx

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowUp, ArrowDown, Wallet, Clock } from 'lucide-react';
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

interface DailySummaryProps {
  transactions: Transaction[];
  className?: string;
}

interface TodayData {
  masuk: number;
  keluar: number;
  saldo: number;
  jumlahTransaksi: number;
  transaksiTerakhir?: Transaction;
}

// ==============================================
// COMPONENT
// ==============================================

const DailySummaryWidget: React.FC<DailySummaryProps> = ({ 
  transactions, 
  className 
}) => {
  // Data hari ini
  const todayData = useMemo((): TodayData => {
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => {
      if (!t.date) return false;
      const dateStr = t.date instanceof Date ? t.date.toISOString() : String(t.date);
      return dateStr.startsWith(today);
    });

    const masuk = todayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const keluar = todayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Transaksi terakhir hari ini
    const transaksiTerakhir = todayTransactions
      .sort((a, b) => {
        const dateA = a.date ? (a.date instanceof Date ? a.date : new Date(a.date)) : new Date(0);
        const dateB = b.date ? (b.date instanceof Date ? b.date : new Date(b.date)) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      })[0];

    return {
      masuk,
      keluar,
      saldo: masuk - keluar,
      jumlahTransaksi: todayTransactions.length,
      transaksiTerakhir
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

  const formatTime = (dateInput: Date | string | null) => {
    if (!dateInput) return '--:--';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSaldoStatus = () => {
    if (todayData.saldo > 0) {
      return {
        color: 'green',
        message: 'Hari ini untung!',
        icon: '😊'
      };
    } else if (todayData.saldo < 0) {
      return {
        color: 'red',
        message: 'Hari ini minus',
        icon: '😟'
      };
    } else {
      return {
        color: 'gray',
        message: 'Hari ini impas',
        icon: '😐'
      };
    }
  };

  const getMotivationalMessage = () => {
    const hour = new Date().getHours();
    const { saldo } = todayData;
    
    if (hour < 12) {
      return saldo > 0 
        ? "Pagi yang bagus! Sudah ada pemasukan nih 🌅"
        : "Selamat pagi! Semangat cari rejeki hari ini! 💪";
    } else if (hour < 17) {
      return saldo > 0
        ? "Siang ini produktif! Terus semangat! ☀️"
        : "Masih siang, masih banyak kesempatan! 🚀";
    } else {
      return saldo > 0
        ? "Alhamdulillah, hari ini berkah! 🌙"
        : "Besok pasti lebih baik, tetap semangat! ⭐";
    }
  };

  const saldoStatus = getSaldoStatus();
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-blue-600" />
          Ringkasan Hari Ini
        </CardTitle>
        <p className="text-sm text-gray-600">{currentDate}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Saldo Hari Ini */}
        <div className={cn(
          "p-4 rounded-lg text-center",
          saldoStatus.color === 'green' ? 'bg-green-50 border border-green-200' :
          saldoStatus.color === 'red' ? 'bg-red-50 border border-red-200' :
          'bg-gray-50 border border-gray-200'
        )}>
          <div className="text-2xl mb-2">{saldoStatus.icon}</div>
          <h3 className={cn(
            "font-semibold text-lg mb-1",
            saldoStatus.color === 'green' ? 'text-green-800' :
            saldoStatus.color === 'red' ? 'text-red-800' :
            'text-gray-800'
          )}>
            {saldoStatus.message}
          </h3>
          <p className={cn(
            "text-2xl font-bold",
            saldoStatus.color === 'green' ? 'text-green-600' :
            saldoStatus.color === 'red' ? 'text-red-600' :
            'text-gray-600'
          )}>
            {formatCurrency(Math.abs(todayData.saldo))}
          </p>
        </div>

        {/* Rincian Uang Masuk & Keluar */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Uang Masuk
              </span>
            </div>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(todayData.masuk)}
            </p>
          </div>
          
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDown className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                Uang Keluar
              </span>
            </div>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(todayData.keluar)}
            </p>
          </div>
        </div>

        {/* Info Transaksi */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Total Transaksi Hari Ini
            </span>
          </div>
          <span className="text-lg font-bold text-blue-600">
            {todayData.jumlahTransaksi}
          </span>
        </div>

        {/* Transaksi Terakhir */}
        {todayData.transaksiTerakhir && (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Transaksi Terakhir
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {todayData.transaksiTerakhir.description || 'Transaksi'}
                </p>
                <p className="text-xs text-gray-500">
                  {formatTime(todayData.transaksiTerakhir.date)}
                </p>
              </div>
              <p className={cn(
                "font-semibold",
                todayData.transaksiTerakhir.type === 'income' 
                  ? 'text-green-600' 
                  : 'text-red-600'
              )}>
                {todayData.transaksiTerakhir.type === 'income' ? '+' : '-'}
                {formatCurrency(todayData.transaksiTerakhir.amount)}
              </p>
            </div>
          </div>
        )}

        {/* Pesan Motivasi */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 text-center font-medium">
            {getMotivationalMessage()}
          </p>
        </div>

        {/* Quick Stats */}
        {todayData.jumlahTransaksi === 0 && (
          <div className="text-center p-4 text-gray-500">
            <Wallet className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">
              Belum ada transaksi hari ini.
            </p>
            <p className="text-xs mt-1">
              Yuk mulai catat pemasukan dan pengeluaran!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailySummaryWidget;