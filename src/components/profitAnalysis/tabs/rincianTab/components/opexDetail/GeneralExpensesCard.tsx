// src/components/profitAnalysis/tabs/rincianTab/components/opexDetail/GeneralExpensesCard.tsx

import React from 'react';
import { Settings } from 'lucide-react';
import { ExpenseCard } from './ExpenseCard';
import { OperationalExpenseDetail } from '../../../types';

interface GeneralExpensesCardProps {
  expenses: OperationalExpenseDetail[];
  total: number;
  revenue: number;
  isMobile?: boolean;
}

export const GeneralExpensesCard: React.FC<GeneralExpensesCardProps> = ({
  expenses,
  total,
  revenue,
  isMobile
}) => {
  return (
    <ExpenseCard
      title="Biaya Umum"
      expenses={expenses}
      total={total}
      revenue={revenue}
      colorScheme="purple"
      icon={Settings}
      isMobile={isMobile}
    />
  );
};