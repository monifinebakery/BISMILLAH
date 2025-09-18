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

const FallbackSpinner = () => (
  <div className="min-h-[120px] flex items-center justify-center">
    <div className="h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full motion-safe:animate-spin" />
    <span className="sr-only">Memuat…</span>
  </div>
);

interface UmkmTabProps {
  transactions: any[];
}

const UmkmTab: React.FC<UmkmTabProps> = ({ transactions }) => {
  return (
    <div className="space-y-4">
      <Suspense fallback={<FallbackSpinner />}>
        <DailySummaryWidget transactions={transactions} />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Suspense fallback={<FallbackSpinner />}>
          <DailyCashFlowTracker transactions={transactions} />
        </Suspense>
        <Suspense fallback={<FallbackSpinner />}>
          <ProfitLossSimple transactions={transactions} />
        </Suspense>
        <Suspense fallback={<FallbackSpinner />}>
          <UMKMExpenseCategories transactions={transactions} />
        </Suspense>
        <Suspense fallback={<FallbackSpinner />}>
          <SavingsGoalTracker transactions={transactions} />
        </Suspense>
        <Suspense fallback={<FallbackSpinner />}>
          <DebtTracker />
        </Suspense>
        <Suspense fallback={<FallbackSpinner />}>
          <ExpenseAlerts transactions={transactions} />
        </Suspense>
      </div>
    </div>
  );
};

export default UmkmTab;