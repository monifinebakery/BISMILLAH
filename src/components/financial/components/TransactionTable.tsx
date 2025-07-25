// src/components/financial/components/TransactionTable.tsx
// Separated Transaction Table Component for Code Splitting

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';

interface TransactionTableProps {
  transactions: any[];
  onEditTransaction: (transaction: any) => void;
  onAddTransaction: () => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ 
  transactions, 
  onEditTransaction, 
  onAddTransaction 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Pagination logic
  const currentTransactions = useMemo(() => {
    const firstItem = (currentPage - 1) * itemsPerPage;
    return transactions.slice(firstItem, firstItem + itemsPerPage);
  }, [transactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  // Reset page when transactions change
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [transactions.length, totalPages, currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Daftar Transaksi</CardTitle>
          <Button size="sm" onClick={onAddTransaction}>
            <Plus className="mr-2 h-4 w-4" />
            Transaksi Baru
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTransactions.length > 0 ? (
                currentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.date), 'dd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {transaction.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {transaction.category || 'Lainnya'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={transaction.type === 'income' ? 'default' : 'destructive'}
                        className={transaction.type === 'income' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                      >
                        {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onEditTransaction(transaction)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    Tidak ada transaksi pada rentang tanggal ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {totalPages > 1 && (
        <CardFooter className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default TransactionTable;