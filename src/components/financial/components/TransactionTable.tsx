// src/components/financial/components/TransactionTable.tsx
// Enhanced Transaction Table with Visible Pagination

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
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
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination logic
  const currentTransactions = useMemo(() => {
    const firstItem = (currentPage - 1) * itemsPerPage;
    return transactions.slice(firstItem, firstItem + itemsPerPage);
  }, [transactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, transactions.length);

  // Reset page when transactions change
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [transactions.length, totalPages, currentPage]);

  // Reset page when items per page changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
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
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-gray-400 mb-2">📊</div>
                      <p className="text-gray-500">Tidak ada transaksi pada rentang tanggal ini.</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={onAddTransaction}
                        className="mt-2"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Transaksi Pertama
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Enhanced Pagination - Always Show if there are transactions */}
      {transactions.length > 0 && (
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-4">
          {/* Left side - Info & Items per page */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div>
              Menampilkan {startItem}-{endItem} dari {transactions.length} transaksi
            </div>
            <div className="flex items-center gap-2">
              <span>Per halaman:</span>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right side - Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* Previous Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-3 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Sebelumnya
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 mx-2">
                {getPageNumbers().map((pageNum, index, array) => (
                  <React.Fragment key={pageNum}>
                    {/* Show ellipsis if there's a gap */}
                    {index === 0 && pageNum > 1 && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          className="w-8 h-8 p-0"
                        >
                          1
                        </Button>
                        {pageNum > 2 && (
                          <div className="px-2">
                            <MoreHorizontal className="h-4 w-4" />
                          </div>
                        )}
                      </>
                    )}
                    
                    <Button 
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>

                    {/* Show ellipsis if there's a gap at the end */}
                    {index === array.length - 1 && pageNum < totalPages && (
                      <>
                        {pageNum < totalPages - 1 && (
                          <div className="px-2">
                            <MoreHorizontal className="h-4 w-4" />
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          className="w-8 h-8 p-0"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Next Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 disabled:opacity-50"
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default TransactionTable;