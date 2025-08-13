// src/components/profitAnalysis/tabs/rincianTab/components/opexDetail/SellingExpensesCard.tsx

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ExpenseCard } from './ExpenseCard';
import { OperationalExpenseDetail } from '../../../types';

interface SellingExpensesCardProps {
  expenses: OperationalExpenseDetail[];
  total: number;
  revenue: number;
  isMobile?: boolean;
}

export const SellingExpensesCard: React.FC<SellingExpensesCardProps> = ({
  expenses,
  total,
  revenue,
  isMobile
}) => {
  return (
    <ExpenseCard
      title="Biaya Penjualan"
      expenses={expenses}
      total={total}
      revenue={revenue}
      colorScheme="green"
      icon={TrendingUp}
      isMobile={isMobile}
    />
  );
};