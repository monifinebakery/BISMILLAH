import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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
  const Fallback = (
    <div className="min-h-[120px] flex items-center justify-center">
      <LoadingSpinner size="sm" />
    </div>
  );

  return (
    <div className="space-y-4">
      <Suspense fallback={Fallback}>
        <DailySummaryWidget transactions={transactions} />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Suspense fallback={Fallback}>
          <DailyCashFlowTracker transactions={transactions} />
        </Suspense>
        <Suspense fallback={Fallback}>
          <ProfitLossSimple transactions={transactions} />
        </Suspense>
        <Suspense fallback={Fallback}>
          <UMKMExpenseCategories transactions={transactions} />
        </Suspense>
        <Suspense fallback={Fallback}>
          <SavingsGoalTracker transactions={transactions} />
        </Suspense>
        <Suspense fallback={Fallback}>
          <DebtTracker />
        </Suspense>
        <Suspense fallback={Fallback}>
          <ExpenseAlerts transactions={transactions} />
        </Suspense>
      </div>
    </div>
  );
};

export default UmkmTab;
