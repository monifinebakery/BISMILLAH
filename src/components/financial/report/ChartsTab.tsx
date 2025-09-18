import React, { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const FinancialCharts = React.lazy(() => 
  import('../components/FinancialCharts').catch((error) => {
    console.error('Failed to load FinancialCharts', error);
    return {
      default: () => (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-medium text-red-700 mb-1">Gagal Memuat Grafik</h3>
            <p className="text-sm text-red-500">Terjadi kesalahan saat memuat komponen grafik keuangan.</p>
          </CardContent>
        </Card>
      )
    };
  })
);

const CategoryCharts = React.lazy(() => 
  import('../components/CategoryCharts').catch((error) => {
    console.error('Failed to load CategoryCharts', error);
    return {
      default: () => (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-medium text-red-700 mb-1">Gagal Memuat Grafik Kategori</h3>
            <p className="text-sm text-red-500">Terjadi kesalahan saat memuat grafik distribusi kategori.</p>
          </CardContent>
        </Card>
      )
    };
  })
);

interface ChartsTabProps {
  filteredTransactions: any[];
  dateRange: { from: Date; to?: Date } | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated: Date | null | undefined;
}

const ChartsTab: React.FC<ChartsTabProps> = ({
  filteredTransactions,
  dateRange,
  isLoading,
  isRefreshing,
  onRefresh,
  lastUpdated
}) => {
  const Fallback = (
    <div className="min-h-[120px] flex items-center justify-center">
      <LoadingSpinner size="sm" />
    </div>
  );

  return (
    <div className="space-y-6">
      <Suspense fallback={Fallback}>
        <FinancialCharts 
          filteredTransactions={filteredTransactions}
          dateRange={dateRange as any}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          lastUpdated={lastUpdated as any}
        />
      </Suspense>

      <Suspense fallback={Fallback}>
        <CategoryCharts 
          filteredTransactions={filteredTransactions}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          lastUpdated={lastUpdated as any}
        />
      </Suspense>
    </div>
  );
};

export default ChartsTab;
