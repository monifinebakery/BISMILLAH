// src/components/profitAnalysis/tabs/rincianTab/components/opexDetail/ExpenseCard.tsx

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OperationalExpenseDetail } from '../../../types';
import { formatCurrency } from '../../utils/formatters';

interface ExpenseCardProps {
  title: string;
  expenses: OperationalExpenseDetail[];
  total: number;
  revenue: number;
  colorScheme: 'blue' | 'green' | 'purple';
  icon: LucideIcon;
  isMobile?: boolean;
}

const colorSchemes = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    percentColor: 'text-blue-700'
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    titleColor: 'text-green-900',
    percentColor: 'text-green-700'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    titleColor: 'text-purple-900',
    percentColor: 'text-purple-700'
  }
};

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  title,
  expenses,
  total,
  revenue,
  colorScheme,
  icon: Icon,
  isMobile
}) => {
  const colors = colorSchemes[colorScheme];
  const percentageOfRevenue = revenue > 0 ? (total / revenue) * 100 : 0;

  return (
    <div className={cn(
      "rounded-lg border p-6 transition-shadow hover:shadow-md",
      colors.bg,
      colors.border,
      isMobile && "p-4"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "p-2 rounded-lg",
          colors.iconBg,
          isMobile && "p-1.5"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            colors.iconColor,
            isMobile && "w-4 h-4"
          )} />
        </div>
        <div className="flex-1">
          <h3 className={cn(
            "font-semibold text-lg",
            colors.titleColor,
            isMobile && "text-base"
          )}>
            {title}
          </h3>
          <p className={cn(
            "text-sm font-medium",
            colors.percentColor
          )}>
            {percentageOfRevenue.toFixed(1)}% dari revenue
          </p>
        </div>
      </div>

      {/* Total Amount */}
      <div className="mb-4 p-3 bg-white/80 rounded-lg border border-white/40">
        <div className="flex justify-between items-center">
          <span className={cn(
            "text-sm font-medium text-gray-600",
            isMobile && "text-xs"
          )}>
            Total {title}
          </span>
          <span className={cn(
            "text-xl font-bold",
            colors.titleColor,
            isMobile && "text-lg"
          )}>
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="space-y-2">
        <h4 className={cn(
          "text-sm font-semibold text-gray-700 mb-3",
          isMobile && "text-xs"
        )}>
          Rincian Biaya
        </h4>
        
        {expenses.length > 0 ? (
          <div className="space-y-2">
            {expenses.map((expense, index) => {
              const expensePercentage = total > 0 ? (expense.monthlyAmount / total) * 100 : 0;
              
              return (
                <div
                  key={expense.costId || index}
                  className="flex justify-between items-center py-2 px-3 bg-white/60 rounded border border-white/40"
                >
                  <div className="flex-1">
                    <span className={cn(
                      "text-sm font-medium text-gray-800",
                      isMobile && "text-xs"
                    )}>
                      {expense.costName}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded text-white",
                        expense.costType === 'tetap' ? 'bg-blue-500' : 'bg-orange-500',
                        isMobile && "text-[10px] px-1"
                      )}>
                        {expense.costType === 'tetap' ? 'Tetap' : 'Variabel'}
                      </span>
                      <span className={cn(
                        "text-xs text-gray-500",
                        isMobile && "text-[10px]"
                      )}>
                        {expense.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className={cn(
                      "text-sm font-semibold text-gray-900",
                      isMobile && "text-xs"
                    )}>
                      {formatCurrency(expense.monthlyAmount)}
                    </div>
                    <div className={cn(
                      "text-xs",
                      colors.percentColor
                    )}>
                      {expensePercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className={cn(
              "text-sm text-gray-500",
              isMobile && "text-xs"
            )}>
              Tidak ada rincian biaya tersedia
            </p>
          </div>
        )}
      </div>

      {/* Summary Bar */}
      {expenses.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/60">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-600">
              {expenses.length} item biaya
            </span>
            <span className={cn(
              "font-bold",
              colors.titleColor
            )}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};