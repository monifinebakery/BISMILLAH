import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { PaginationInfo } from '../../hooks/useTransactionData';

interface TransactionTableToolbarProps {
  lastUpdated?: Date;
  onRefresh: () => void;
  isRefreshing: boolean;
  onAddTransaction?: () => void;
  paginationInfo: PaginationInfo | null;
}

const TransactionTableToolbar = ({
  lastUpdated,
  onRefresh,
  isRefreshing,
  onAddTransaction,
  paginationInfo,
}: TransactionTableToolbarProps) => {
  return (
    <CardHeader>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <CardTitle>Daftar Transaksi</CardTitle>
          {lastUpdated && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Live
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          {onAddTransaction && (
            <Button size="sm" onClick={onAddTransaction}>
              <Plus className="mr-2 h-4 w-4" />
              Transaksi Baru
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        {lastUpdated && (
          <p className="text-xs text-gray-400">
            Terakhir diperbarui: {lastUpdated.toLocaleString('id-ID')}
          </p>
        )}
        {paginationInfo && (
          <p className="text-xs text-blue-600">
            Mode: Server-side Pagination | Total: {paginationInfo.total} data
          </p>
        )}
      </div>
    </CardHeader>
  );
};

export default TransactionTableToolbar;
