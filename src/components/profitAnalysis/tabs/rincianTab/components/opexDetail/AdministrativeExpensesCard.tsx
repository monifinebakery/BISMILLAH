// src/components/profitAnalysis/tabs/rincianTab/components/opexDetail/AdministrativeExpensesCard.tsx

import React from 'react';
import { Building } from 'lucide-react';
import { ExpenseCard } from './ExpenseCard';
import { OperationalExpenseDetail } from '../../../types';

interface AdministrativeExpensesCardProps {
  expenses: OperationalExpenseDetail[];
  total: number;
  revenue: number;
  isMobile?: boolean;
}

export const AdministrativeExpensesCard: React.FC<AdministrativeExpensesCardProps> = ({
  expenses,
  total,
  revenue,
  isMobile
}) => {
  return (
    <ExpenseCard
      title="Biaya Administrasi"
      expenses={expenses}
      total={total}
      revenue={revenue}
      colorScheme="blue"
      icon={Building}
      isMobile={isMobile}
    />
  );
};