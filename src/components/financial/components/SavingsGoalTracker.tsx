// src/components/financial/components/SavingsGoalTracker.tsx

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, PiggyBank, TrendingUp, Calendar, Edit3, Check, X } from 'lucide-react';
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

interface SavingsGoalTrackerProps {
  transactions: Transaction[];
  className?: string;
}

interface SavingsData {
  currentSavings: number;
  monthlyTarget: number;
  progress: number;
  remainingDays: number;
  dailyTargetRemaining: number;
  isOnTrack: boolean;
  monthlyIncome: number;
  monthlyExpense: number;
}

// ==============================================
// MAIN COMPONENT
// ==============================================

const SavingsGoalTracker: React.FC<SavingsGoalTrackerProps> = ({ 
  transactions, 
  className 
}) => {
  const { formatCurrency } = useCurrency();
  // State untuk target tabungan (dalam praktik nyata, ini harus disimpan di database)
  const [monthlyTarget, setMonthlyTarget] = useState<number>(() => {
    const saved = localStorage.getItem('umkm-savings-target');
    return saved ? parseFloat(saved) : 1000000; // Default 1 juta
  });
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(monthlyTarget.toString());

  // Analisis data tabungan
  const savingsData = useMemo((): SavingsData => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthTransactions = transactions.filter(t => {
      if (!t.date) return false;
      const dateStr = t.date instanceof Date ? t.date.toISOString() : String(t.date);
      return dateStr.startsWith(currentMonth);
    });

    const monthlyIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const monthlyExpense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const currentSavings = monthlyIncome - monthlyExpense;
    const progress = monthlyTarget > 0 ? (currentSavings / monthlyTarget) * 100 : 0;
    
    // Hitung sisa hari dalam bulan
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = lastDayOfMonth - now.getDate();
    
    // Target harian yang tersisa
    const remainingTarget = Math.max(0, monthlyTarget - currentSavings);
    const dailyTargetRemaining = remainingDays > 0 ? remainingTarget / remainingDays : 0;
    
    // Apakah on track?
    const expectedSavings = (monthlyTarget / lastDayOfMonth) * now.getDate();
    const isOnTrack = currentSavings >= expectedSavings;

    return {
      currentSavings,
      monthlyTarget,
      progress: Math.min(progress, 100),
      remainingDays,
      dailyTargetRemaining,
      isOnTrack,
      monthlyIncome,
      monthlyExpense
    };
  }, [transactions, monthlyTarget]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSaveTarget = () => {
    const newTarget = parseFloat(tempTarget);
    if (newTarget > 0) {
      setMonthlyTarget(newTarget);
      localStorage.setItem('umkm-savings-target', newTarget.toString());
      setIsEditingTarget(false);
    }
  };

  const handleCancelEdit = () => {
    setTempTarget(monthlyTarget.toString());
    setIsEditingTarget(false);
  };

  const getProgressColor = () => {
    if (savingsData.progress >= 100) return 'bg-orange-600';
    if (savingsData.progress >= 75) return 'bg-orange-500';
    if (savingsData.progress >= 50) return 'bg-orange-400';
    return 'bg-orange-300';
  };

  const getStatusMessage = () => {
    if (savingsData.currentSavings >= savingsData.monthlyTarget) {
      return {
        message: '🎉 Selamat! Target tabungan bulan ini sudah tercapai!',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50 border-orange-200'
      };
    }
    
    if (savingsData.isOnTrack) {
      return {
        message: '👍 Bagus! Kamu on track untuk mencapai target bulan ini',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200'
      };
    }
    
    return {
      message: '⚠️ Perlu usaha lebih untuk mencapai target bulan ini',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200'
    };
  };

  const status = getStatusMessage();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-600" />
          Target Nabung Bulan Ini
        </CardTitle>
        <p className="text-sm text-orange-600">
          Atur target tabungan dan pantau progress harian
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Setting */}
        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-orange-800">Target Tabungan Bulanan</h4>
            {!isEditingTarget && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditingTarget(true)}
                className="flex items-center gap-1"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
          
          {isEditingTarget ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="flex-1 w-full">
                <Label htmlFor="target">Target (Rupiah)</Label>
                <Input
                  id="target"
                  type="number"
                  value={tempTarget}
                  onChange={(e) => setTempTarget(e.target.value)}
                  placeholder="Masukkan target tabungan"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-1 mt-2 sm:mt-6">
                <Button size="sm" onClick={handleSaveTarget}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-2xl font-bold text-orange-700">
              {formatCurrency(monthlyTarget)}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-orange-800">Progress Bulan Ini</h4>
            <span className="text-sm text-gray-500">
              {savingsData.progress.toFixed(1)}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className={cn("h-4 rounded-full transition-all duration-300", getProgressColor())}
              style={{ width: `${savingsData.progress}%` }}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
            <span className="text-orange-600">Terkumpul: {formatCurrency(savingsData.currentSavings)}</span>
            <span className="text-orange-600">Target: {formatCurrency(monthlyTarget)}</span>
          </div>
        </div>

        {/* Status Message */}
        <div className={cn("border rounded-lg p-4", status.bgColor)}>
          <p className={cn("font-medium", status.color)}>
            {status.message}
          </p>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Pemasukan</span>
            </div>
            <p className="text-lg font-bold text-orange-700">
              {formatCurrency(savingsData.monthlyIncome)}
            </p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-orange-600 rotate-180" />
              <span className="text-sm font-medium text-orange-800">Pengeluaran</span>
            </div>
            <p className="text-lg font-bold text-orange-700">
              {formatCurrency(savingsData.monthlyExpense)}
            </p>
          </div>
        </div>

        {/* Daily Target */}
        {savingsData.currentSavings < monthlyTarget && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Target Harian Tersisa</span>
            </div>
            <p className="text-lg font-bold text-orange-700">
              {formatCurrency(savingsData.dailyTargetRemaining)}
            </p>
            <p className="text-sm text-orange-600 mt-1">
              Untuk {savingsData.remainingDays} hari tersisa bulan ini
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-orange-600" />
            Tips Mencapai Target Nabung:
          </h5>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• Set target yang realistis (10-20% dari keuntungan)</li>
            <li>• Sisihkan uang tabungan di awal bulan, bukan di akhir</li>
            <li>• Kurangi pengeluaran yang tidak penting</li>
            <li>• Cari cara untuk meningkatkan pemasukan</li>
            <li>• Review dan sesuaikan target setiap bulan</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingsGoalTracker;