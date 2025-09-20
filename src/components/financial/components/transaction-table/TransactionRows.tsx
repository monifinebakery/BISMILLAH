import { memo, useCallback } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Info, Trash2 } from 'lucide-react';

import { formatCurrency } from '@/lib/shared';

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
  transaction,
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
    onToggleSelect?.(transaction.id, !isSelected);
  }, [isSelected, onToggleSelect, transaction.id]);

  const handleEdit = useCallback(() => {
    onEdit?.(transaction);
  }, [onEdit, transaction]);

  const handleDelete = useCallback(() => {
    onDelete(transaction);
  }, [onDelete, transaction]);

  return (
    <TableRow className="hover:bg-gray-50">
      {onToggleSelect && (
        <TableCell className="w-12">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleToggleSelect}
            aria-label={`Pilih transaksi ${transaction.description}`}
          />
        </TableCell>
      )}
      <TableCell className="min-w-[140px]">
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
              const timeStr = format(date, 'HH:mm', { locale: id });

              if (hasTimeInfo) {
                return (
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{dateStr}</div>
                    <div className="text-gray-500 text-xs">{timeStr} WIB</div>
                  </div>
                );
              }

              return (
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{dateStr}</div>
                  <div className="text-gray-400 text-xs">Tanggal saja</div>
                </div>
              );
            } catch (error) {
              return (
                <div className="text-gray-400 text-sm">
                  <div>Format tidak valid</div>
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
      <TableCell className="max-w-[200px] truncate">
        {getDisplayDescription(transaction.description)}
      </TableCell>
      <TableCell>
        <Badge variant="outline">{transaction.category || 'Lainnya'}</Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant={transaction.type === 'income' ? 'default' : 'destructive'}
          className={
            transaction.type === 'income'
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : ''
          }
        >
          {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
        </Badge>
      </TableCell>
      <TableCell
        className={`text-right font-medium ${
          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {formatCurrency(transaction.amount)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const MemoizedTransactionRow = memo(TransactionRowComponent, (previous, next) => {
  return (
    previous.transaction.id === next.transaction.id &&
    previous.transaction.updatedAt === next.transaction.updatedAt &&
    previous.isSelected === next.isSelected &&
    previous.isDeleting === next.isDeleting
  );
});
MemoizedTransactionRow.displayName = 'MemoizedTransactionRow';

const TransactionRows = ({
  transactions,
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
          {isSelectionMode && (
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={() => onSelectAll?.()}
                aria-label="Pilih semua transaksi"
              />
            </TableHead>
          )}
          <TableHead className="min-w-[140px]">
            <div className="flex items-center gap-2">
              <span>Tanggal &amp; Waktu</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
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
          <TableHead>Deskripsi</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead>Tipe</TableHead>
          <TableHead className="text-right">Jumlah</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
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
            colSpan={isSelectionMode ? 7 : 6}
            dateRange={dateRange}
            onAddTransaction={onAddTransaction}
          />
        )}
      </TableBody>
    </>
  );
};

export default TransactionRows;
