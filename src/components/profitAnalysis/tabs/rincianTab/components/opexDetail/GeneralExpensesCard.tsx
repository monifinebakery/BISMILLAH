// src/components/profitAnalysis/tabs/rincianTab/components/opexDetail/ExpenseCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { ExpenseCardProps } from '../../types/components';
import { OperationalExpenseDetail } from '../../../types';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { getStatusColors } from '../../utils/targetAnalysis';

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  title,
  expenses,
  total,
  revenue,
  colorScheme,
  icon: Icon,
  isMobile
}) => {
  const colors = getStatusColors(colorScheme);
  const revenuePercentage = revenue > 0 ? (total / revenue) * 100 : 0;

  if (!expenses || expenses.length === 0) {
    return (
      <Card>
        <CardHeader className={cn("p-4", isMobile && "p-3")}>
          <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
            <Icon className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("p-4", isMobile && "p-3")}>
          <div className="text-center text-gray-500 py-8">
            <p className={cn("text-sm", isMobile && "text-xs")}>
              Tidak ada data {title.toLowerCase()}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
          <Icon className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("p-4", isMobile && "p-3")}>
        <div className="space-y-2">
          {expenses.map((expense: OperationalExpenseDetail, index: number) => (
            <div key={index} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
              <div className="flex-1 min-w-0">
                <span className="truncate block">{expense.costName}</span>
                {expense.description && (
                  <span className={cn(
                    "text-xs text-gray-500 block truncate",
                    isMobile && "text-[0.65rem]"
                  )}>
                    {expense.description}
                  </span>
                )}
                {expense.costType && (
                  <span className={cn(
                    "text-xs text-gray-600",
                    isMobile && "text-[0.65rem]"
                  )}>
                    {expense.costType === 'tetap' ? 'Fixed' : 'Variable'}
                  </span>
                )}
              </div>
              <div className="text-right ml-2">
                <span className={cn("font-medium", isMobile && "text-sm")}>
                  {formatCurrency(expense.monthlyAmount)}
                </span>
                <div className={cn("text-xs text-gray-500", isMobile && "text-[0.65rem]")}>
                  {formatPercentage((expense.monthlyAmount / total) * 100)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Total Summary */}
        <div className={cn("p-2 rounded mt-3", colors.bg)}>
          <div className={cn("flex justify-between font-medium", colors.textDark)}>
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className={cn("text-xs mt-1", colors.text)}>
            {formatPercentage(revenuePercentage)} dari revenue
          </div>
          
          {/* Additional metrics */}
          <div className={cn("mt-2 pt-2 border-t", colors.border, "text-xs")}>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg per item:</span>
              <span className="font-medium">{formatCurrency(total / expenses.length)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Items count:</span>
              <span className="font-medium">{expenses.length}</span>
            </div>
          </div>
        </div>

        {/* Cost Distribution */}
        {expenses.length > 1 && (
          <div className={cn("mt-3 text-xs", isMobile && "text-[0.65rem]")}>
            <span className="text-gray-600">Top expense: </span>
            <span className="font-medium">
              {expenses.reduce((max, exp) => 
                exp.monthlyAmount > max.monthlyAmount ? exp : max
              ).costName.substring(0, 20)}
              {expenses.reduce((max, exp) => 
                exp.monthlyAmount > max.monthlyAmount ? exp : max
              ).costName.length > 20 ? '...' : ''}
            </span>
            <span className={cn("ml-1", colors.text)}>
              ({formatPercentage(
                (expenses.reduce((max, exp) => 
                  exp.monthlyAmount > max.monthlyAmount ? exp : max
                ).monthlyAmount / total) * 100
              )})
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};