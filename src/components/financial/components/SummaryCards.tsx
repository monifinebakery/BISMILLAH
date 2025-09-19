// src/components/financial/components/SummaryCards.tsx - Summary Cards Component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const QuickSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={cn("bg-gray-200 rounded animate-pulse", className)} />
);

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  isLoading?: boolean;
  isRefreshing?: boolean;
  lastRefresh?: Date | null;
  onRefresh?: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ 
  totalIncome, 
  totalExpense, 
  balance, 
  isLoading, 
  isRefreshing, 
  lastRefresh, 
  onRefresh 
}) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

  const cards = [
    {
      title: 'Total Pemasukan',
      value: totalIncome,
      color: 'green',
      icon: TrendingUp,
      description: 'Jumlah seluruh pemasukan yang tercatat'
    },
    {
      title: 'Total Pengeluaran',
      value: totalExpense,
      color: 'red',
      icon: TrendingUp,
      iconRotate: true,
      description: 'Jumlah seluruh pengeluaran yang tercatat'
    },
    {
      title: 'Saldo Akhir',
      value: balance,
      color: balance >= 0 ? 'green' : 'red',
      icon: TrendingUp,
      description: 'Selisih antara pemasukan dan pengeluaran'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="border-l-4 border-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <card.icon className={cn(
                  "h-4 w-4",
                  card.iconRotate && "rotate-180"
                )} />
                {card.title}
              </CardTitle>
              {index === 0 && onRefresh && (
                <div className="flex items-center gap-2">
                  {lastRefresh && (
                    <span className="text-xs text-gray-500 hidden sm:inline">
                      {new Date(lastRefresh).toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onRefresh} 
                    disabled={isLoading || isRefreshing}
                    className={cn(
                      "transition-colors",
                      isRefreshing && "text-blue-600"
                    )}
                  >
                    <RefreshCw className={cn(
                      "h-3 w-3",
                      (isLoading || isRefreshing) && "animate-spin"
                    )} />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-xl md:text-2xl font-bold",
              card.color === 'green' ? 'text-green-600' : 'text-red-600'
            )}>
              {isLoading ? <QuickSkeleton className="h-8 w-24" /> : formatCurrency(card.value)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {isLoading ? <QuickSkeleton className="h-4 w-32" /> : card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};