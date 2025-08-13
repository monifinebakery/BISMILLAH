// src/components/profitAnalysis/tabs/PerbandinganTab/components/CashVsReal/CashVsRealComparison.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { CashVsRealComparison } from '../../types';
import { formatCurrency } from '../../utils';

interface CashVsRealComparisonProps {
  cashVsReal: CashVsRealComparison;
}

export const CashVsRealComparisonCard: React.FC<CashVsRealComparisonProps> = ({
  cashVsReal
}) => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
          <DollarSign className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
          Perbandingan Metode Perhitungan
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
        <div className="bg-blue-50 p-3 rounded">
          <h4 className={cn("font-medium text-blue-800 mb-2", isMobile && "text-sm")}>
            📊 Cash Flow (Metode Lama)
          </h4>
          <p className={cn("text-3xl font-bold text-blue-700", isMobile && "text-xl")}>
            {formatCurrency(cashVsReal.cashFlow)}
          </p>
          <p className={cn("text-sm text-blue-600", isMobile && "text-xs")}>Pemasukan - Pengeluaran</p>
          <p className={cn("text-xs text-blue-500 mt-2", isMobile && "text-[0.65rem]")}>
            ⚠️ Tidak mempertimbangkan alokasi HPP yang akurat
          </p>
        </div>
        
        <div className="bg-green-50 p-3 rounded">
          <h4 className={cn("font-medium text-green-800 mb-2", isMobile && "text-sm")}>
            🎯 Laba Bersih (Real Profit)
          </h4>
          <p className={cn("text-3xl font-bold text-green-700", isMobile && "text-xl")}>
            {formatCurrency(cashVsReal.realProfit)}
          </p>
          <p className={cn("text-sm text-green-600", isMobile && "text-xs")}>Pendapatan - HPP - OPEX</p>
          <div className="flex items-center gap-2 mt-2">
            <p className={cn("text-xs text-green-500", isMobile && "text-[0.65rem]")}>
              ✅ Menghitung profit margin sesungguhnya
            </p>
            <Badge 
              variant={cashVsReal.dataSource === 'actual' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {cashVsReal.accuracyScore}% akurat
            </Badge>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded">
          <h4 className={cn("font-medium text-gray-800 mb-2", isMobile && "text-sm")}>
            📈 Selisih Perhitungan
          </h4>
          <div className="flex items-center gap-2">
            {cashVsReal.isRealProfitHigher ? (
              <TrendingUp className={cn("h-5 w-5 text-green-600", isMobile && "h-4 w-4")} />
            ) : (
              <TrendingDown className={cn("h-5 w-5 text-red-600", isMobile && "h-4 w-4")} />
            )}
            <p className={cn("text-2xl font-bold text-gray-700", isMobile && "text-lg")}>
              {formatCurrency(cashVsReal.difference)}
            </p>
          </div>
          <p className={cn("text-sm text-gray-600 mt-2", isMobile && "text-xs")}>
            {cashVsReal.isRealProfitHigher 
              ? "✅ Real profit lebih akurat dan tinggi" 
              : "⚠️ Ada discrepancy dalam perhitungan HPP"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};