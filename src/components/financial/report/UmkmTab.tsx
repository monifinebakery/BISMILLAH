import React, { Suspense } from 'react';

const DailySummaryWidget = React.lazy(() => 
  import('../components/DailySummaryWidget').catch(() => ({ default: () => null }))
);
const DailyCashFlowTracker = React.lazy(() => 
  import('../components/DailyCashFlowTracker').catch(() => ({ default: () => null }))
);
const ProfitLossSimple = React.lazy(() => 
  import('../components/ProfitLossSimple').catch(() => ({ default: () => null }))
);
const UMKMExpenseCategories = React.lazy(() => 
  import('../components/UMKMExpenseCategories').catch(() => ({ default: () => null }))
);
const SavingsGoalTracker = React.lazy(() => 
  import('../components/SavingsGoalTracker').catch(() => ({ default: () => null }))
);
const DebtTracker = React.lazy(() => 
  import('../components/DebtTracker').catch(() => ({ default: () => null }))
);
const ExpenseAlerts = React.lazy(() => 
  import('../components/ExpenseAlerts').catch(() => ({ default: () => null }))
);

interface UmkmTabProps {
  transactions: any[];
}

const UmkmTab: React.FC<UmkmTabProps> = ({ transactions }) => {
  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <DailySummaryWidget transactions={transactions} />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Suspense fallback={null}>
          <DailyCashFlowTracker transactions={transactions} />
        </Suspense>
        <Suspense fallback={null}>
          <ProfitLossSimple transactions={transactions} />
        </Suspense>
        <Suspense fallback={null}>
          <UMKMExpenseCategories transactions={transactions} />
        </Suspense>
        <Suspense fallback={null}>
          <SavingsGoalTracker transactions={transactions} />
        </Suspense>
        <Suspense fallback={null}>
          <DebtTracker />
        </Suspense>
        <Suspense fallback={null}>
          <ExpenseAlerts transactions={transactions} />
        </Suspense>
      </div>
    </div>
  );
};

export default UmkmTab;
