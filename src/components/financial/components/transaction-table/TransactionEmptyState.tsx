import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';

interface TransactionEmptyStateProps {
  colSpan: number;
  dateRange?: { from: Date; to?: Date };
  onAddTransaction?: () => void;
}

const TransactionEmptyState = ({
  colSpan,
  dateRange,
  onAddTransaction,
}: TransactionEmptyStateProps) => {
  const message = dateRange
    ? 'Tidak ada transaksi pada rentang tanggal ini.'
    : 'Belum ada transaksi.';

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center h-24">
        <div className="flex flex-col items-center justify-center">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-gray-500">{message}</p>
          {onAddTransaction && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddTransaction}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Transaksi Pertama
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default TransactionEmptyState;
