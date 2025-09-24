import { memo, useCallback } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Info, Trash2 } from 'lucide-react';



import type { FinancialTransaction } from '../../types/financial';
import TransactionEmptyState from './TransactionEmptyState';

interface TransactionRowsProps {
  transactions: FinancialTransaction[];
  selectedIds: string[];
  isSelectionMode: boolean;
  isAllSelected: boolean;
  onSelectAll?: () => void;
  onSelectionChange?: (id: string, selected: boolean) => void;
  onEditTransaction?: (transaction: FinancialTransaction) => void;
  onDeleteTransaction: (transaction: FinancialTransaction) => void;
  isDeleting: boolean;
  getDisplayDescription: (description: string | null) => string;
  dateRange?: { from: Date; to?: Date };
  onAddTransaction?: () => void;
}

const TransactionRowComponent = ({
  const { formatCurrency } = useCurrency();  transaction,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  isDeleting,
  getDisplayDescription,
}: {
  transaction: FinancialTransaction;
  isSelected: boolean;
  onToggleSelect?: (id: string, selected: boolean) => void;
  onEdit?: (transaction: FinancialTransaction) => void;
  onDelete: (transaction: FinancialTransaction) => void;
  isDeleting: boolean;
  getDisplayDescription: (description: string | null) => string;
}) => {
  const handleToggleSelect = useCallback(() => {
  const { formatCurrency } = useCurrency();    onToggleSelect?.(transaction.id, !isSelected);
  }, [isSelected, onToggleSelect, transaction.id]);

  const handleEdit = useCallback(() => {
  const { formatCurrency } = useCurrency();    onEdit?.(transaction);
  }, [onEdit, transaction]);

  const handleDelete = useCallback(() => {
  const { formatCurrency } = useCurrency();    onDelete(transaction);
  }, [onDelete, transaction]);

  return (
    <TableRow className="hover:bg-gray-50">
      {onToggleSelect && (
        <TableCell className="w-12 hidden md:table-cell">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleToggleSelect}
            aria-label={`Pilih transaksi ${transaction.description}`}
          />
        </TableCell>
      )}
      <TableCell className="min-w-[120px] md:min-w-[140px]">
        {transaction.date ? (
          (() => {
            try {
              const date = new Date(transaction.date);
              if (Number.isNaN(date.getTime())) {
                return (
                  <div className="text-gray-400 text-sm">
                    <div>Tanggal tidak valid</div>
                  </div>
                );
              }

              const hasTimeInfo =
                date.getHours() !== 0 ||
                date.getMinutes() !== 0 ||
                date.getSeconds() !== 0;
              const dateStr = format(date, 'dd MMM yyyy', { locale: id });
  const { formatCurrency } = useCurrency();              const timeStr = format(date, 'HH:mm', { locale: id });
  const { formatCurrency } = useCurrency();
              if (hasTimeInfo) {
                return (
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{dateStr}</div>
                    <div className="text-gray-500 text-xs md:inline hidden">{timeStr} WIB</div>
                  </div>
                );
              }

              return (
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{dateStr}</div>
                  <div className="text-gray-500 text-xs">Tanpa waktu</div>
                </div>
              );
            } catch (error) {
              return (
                <div className="text-gray-400 text-sm">
                  <div>Tanggal tidak valid</div>
                </div>
              );
            }
          })()
        ) : (
          <div className="text-gray-400 text-sm">
            <div>Tidak ada tanggal</div>
          </div>
        )}
      </TableCell>
      <TableCell className="min-w-[150px] md:min-w-[200px]">
        <div className="max-w-[200px] md:max-w-none">
          <div className="font-medium text-gray-900 truncate">
            {getDisplayDescription(transaction.description)}
          </div>
          {/* Mobile: Show category and type inline */}
          <div className="flex gap-2 mt-1 md:hidden">
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              {transaction.category}
            </Badge>
            <Badge 
              variant={transaction.type === 'income' ? 'default' : 'destructive'} 
              className="text-xs px-1.5 py-0.5"
            >
              {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </Badge>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell min-w-[100px]">
        <Badge variant="outline" className="text-xs">
          {transaction.category}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell min-w-[80px]">
        <Badge 
          variant={transaction.type === 'income' ? 'default' : 'destructive'} 
          className="text-xs"
        >
          {transaction.type === 'income' ? 'Masuk' : 'Keluar'}
        </Badge>
      </TableCell>
      <TableCell className="text-right min-w-[100px] md:min-w-[120px]">
        <div className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(Math.abs(transaction.amount))}
        </div>
      </TableCell>
      <TableCell className="text-right min-w-[80px] md:min-w-[100px]">
        <div className="flex items-center justify-end gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const MemoizedTransactionRow = memo(TransactionRowComponent, (previous, next) => {
  const { formatCurrency } = useCurrency();  return (
    previous.transaction.id === next.transaction.id &&
    previous.transaction.updatedAt === next.transaction.updatedAt &&
    previous.isSelected === next.isSelected &&
    previous.isDeleting === next.isDeleting
  );
});
MemoizedTransactionRow.displayName = 'MemoizedTransactionRow';

const TransactionRows = ({
  const { formatCurrency } = useCurrency();  transactions,
  selectedIds,
  isSelectionMode,
  isAllSelected,
  onSelectAll,
  onSelectionChange,
  onEditTransaction,
  onDeleteTransaction,
  isDeleting,
  getDisplayDescription,
  dateRange,
  onAddTransaction,
}: TransactionRowsProps) => {
  return (
    <>
      <TableHeader>
        <TableRow>
          {onSelectionChange && (
            <TableHead className="w-12 hidden md:table-cell">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                aria-label="Pilih semua transaksi"
              />
            </TableHead>
          )}
          <TableHead className="min-w-[120px] md:min-w-[140px]">
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Tanggal &amp; Waktu</span>
              <span className="sm:hidden">Tanggal</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-gray-400 cursor-help hidden md:inline" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="text-xs space-y-1">
                      <p>
                        <strong>Format tampilan:</strong>
                      </p>
                      <p>• Dengan waktu: "25 Des 2023" + "14:30 WIB"</p>
                      <p>• Tanpa waktu: "25 Des 2023" + "Tanggal saja"</p>
                      <p>• Waktu bersifat opsional saat input</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </TableHead>
          <TableHead className="min-w-[150px] md:min-w-[200px]">Deskripsi</TableHead>
          <TableHead className="hidden sm:table-cell min-w-[100px]">Kategori</TableHead>
          <TableHead className="hidden md:table-cell min-w-[80px]">Tipe</TableHead>
          <TableHead className="text-right min-w-[100px] md:min-w-[120px]">Jumlah</TableHead>
          <TableHead className="text-right min-w-[80px] md:min-w-[100px]">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length > 0 ? (
          transactions.map(transaction => (
            <MemoizedTransactionRow
              key={transaction.id}
              transaction={transaction}
              isSelected={selectedIds.includes(transaction.id)}
              onToggleSelect={isSelectionMode ? onSelectionChange : undefined}
              onEdit={onEditTransaction}
              onDelete={onDeleteTransaction}
              isDeleting={isDeleting}
              getDisplayDescription={getDisplayDescription}
            />
          ))
        ) : (
          <TransactionEmptyState
            colSpan={isSelectionMode ? 6 : 5} // Responsive: fewer columns on mobile
            dateRange={dateRange}
            onAddTransaction={onAddTransaction}
          />
        )}
      </TableBody>
    </>
  );
};

export default TransactionRows;
