// src/components/purchase/components/PurchaseTable.tsx

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  Calendar,
  User,
  Receipt
} from 'lucide-react';

import { PurchaseTableProps, PurchaseStatus } from '../types/purchase.types';
import { usePurchaseTable } from '../context/PurchaseTableContext';
import { formatCurrency } from '@/utils/formatUtils';
import { getStatusColor, getStatusDisplayText, generatePurchaseSummary } from '../utils/purchaseHelpers';
import { EmptyState } from './index';

const PurchaseTable: React.FC<PurchaseTableProps> = ({ onEdit }) => {
  const {
    filteredPurchases,
    selectedItems,
    setSelectedItems,
    selectAll,
    isAllSelected,
    toggleSelectItem,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortField,
    sortOrder,
    handleSort,
    getSupplierName,
  } = usePurchaseTable();

  // Local state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPurchases = filteredPurchases.slice(startIndex, endIndex);

  // Handle edit purchase
  const handleEdit = (purchase: any) => {
    onEdit(purchase);
  };

  // Handle delete purchase (individual)
  const handleDelete = (purchaseId: string) => {
    if (confirm('Yakin ingin menghapus pembelian ini?')) {
      // Will be handled by bulk delete with single item
      setSelectedItems([purchaseId]);
      // Trigger bulk delete dialog or direct delete
    }
  };

  // Handle view details
  const handleViewDetails = (purchase: any) => {
    // TODO: Implement detail view modal
    console.log('View details:', purchase);
  };

  // Render sort icon
  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  // Empty state
  if (filteredPurchases.length === 0 && !searchQuery && statusFilter === 'all') {
    return (
      <EmptyState 
        onAddPurchase={() => {/* Will be handled by parent */}}
        hasSuppliers={true}
        hasBahanBaku={true}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari supplier, item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value: PurchaseStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>

            {/* Items per page */}
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results info */}
        {(searchQuery || statusFilter !== 'all') && (
          <div className="mt-3 text-sm text-gray-600">
            Menampilkan {filteredPurchases.length} hasil
            {searchQuery && ` untuk "${searchQuery}"`}
            {statusFilter !== 'all' && ` dengan status "${getStatusDisplayText(statusFilter)}"`}
          </div>
        )}
      </Card>

      {/* Table */}
      <Card>
        {filteredPurchases.length === 0 ? (
          // No results state
          <div className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada hasil</h3>
              <p className="text-gray-500 mb-4">
                Tidak ditemukan pembelian yang sesuai dengan kriteria pencarian.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Reset Filter
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Select All Checkbox */}
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={selectAll}
                      aria-label="Select all"
                    />
                  </TableHead>

                  {/* Sortable columns */}
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('tanggal')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Tanggal
                      {renderSortIcon('tanggal')}
                    </Button>
                  </TableHead>

                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('supplier')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Supplier
                      {renderSortIcon('supplier')}
                    </Button>
                  </TableHead>

                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Items
                    </div>
                  </TableHead>

                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('totalNilai')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Total Nilai
                      {renderSortIcon('totalNilai')}
                    </Button>
                  </TableHead>

                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('status')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Status
                      {renderSortIcon('status')}
                    </Button>
                  </TableHead>

                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPurchases.map((purchase) => (
                  <TableRow key={purchase.id} className="hover:bg-gray-50">
                    {/* Select Checkbox */}
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(purchase.id)}
                        onCheckedChange={() => toggleSelectItem(purchase.id)}
                        aria-label={`Select purchase ${purchase.id}`}
                      />
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {new Date(purchase.tanggal).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(purchase.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </TableCell>

                    {/* Supplier */}
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {getSupplierName(purchase.supplier)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {purchase.metodePerhitungan}
                        </div>
                      </div>
                    </TableCell>

                    {/* Items Summary */}
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {purchase.items.length} item{purchase.items.length > 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          {generatePurchaseSummary(purchase)}
                        </div>
                        {/* Show first few items */}
                        {purchase.items.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            {purchase.items.slice(0, 2).map(item => item.nama).join(', ')}
                            {purchase.items.length > 2 && `, +${purchase.items.length - 2} lainnya`}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Total Value */}
                    <TableCell className="text-right">
                      <div className="font-bold text-green-600">
                        {formatCurrency(purchase.totalNilai)}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(purchase.status)}
                      >
                        {getStatusDisplayText(purchase.status)}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(purchase)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleEdit(purchase)}
                            disabled={purchase.status === 'completed'}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(purchase.id)}
                            disabled={purchase.status === 'completed'}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-gray-700">
                  Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredPurchases.length)} dari {filteredPurchases.length} data
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="px-2">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-8 h-8 p-0"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PurchaseTable;