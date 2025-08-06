// src/components/purchase/components/PurchaseTable.tsx
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  User,
  Package,
  Receipt,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
} from 'lucide-react';
import { logger } from '@/utils/logger'; // ✅ Import logger
import { formatCurrency, getFormattedTotalQuantities } from '../utils/formatters';
import type { Purchase, PurchaseStatus } from '../types';

// ✅ INTERFACES: Props and State
interface PurchaseTableProps {
  purchases: any[];
  selectedItems: string[];
  currentPage: number;
  itemsPerPage: number;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  filterConfig: { search: string; status: string; supplier: string; dateRange: { start: string; end: string } };
  onSort: (key: string) => void;
  onFilterChange: (filterType: string, value: string) => void;
  onItemsPerPageChange: (value: string) => void;
  setCurrentPage: (page: number) => void;
  toggleSelectItem: (id: string) => void;
  toggleSelectAll: (checked: boolean) => void;
  onEdit: (purchase: any) => void;
  onDelete: (id: string) => void;
  onViewDetails: (purchase: any) => void;
}

interface PurchaseTablePropsExtended extends PurchaseTableProps {
  actionHandlers: {
    edit: (purchase: any) => void;
    delete: (purchaseId: string) => void;
    viewDetails: (purchase: any) => void;
    resetFilters: () => void;
  };
}

// ✅ STATUS CONFIGURATION
const STATUS_CONFIG = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { value: 'pending', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'approved', label: 'Disetujui', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'processing', label: 'Diproses', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'shipped', label: 'Dikirim', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'delivered', label: 'Diterima', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'completed', label: 'Selesai', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-100 text-red-800 border-red-200' },
];

const ITEMS_PER_PAGE_OPTIONS = [
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' }
];

// ✅ INTERFACES: Consolidated dialog state
interface DialogState {
  confirmation: {
    isOpen: boolean;
    purchase: any | null;
    newStatus: PurchaseStatus | null;
    validation: any | null;
  };
}

const initialDialogState: DialogState = {
  confirmation: {
    isOpen: false,
    purchase: null,
    newStatus: null,
    validation: null
  }
};

const PurchaseTable: React.FC<PurchaseTablePropsExtended> = ({
  purchases,
  selectedItems,
  currentPage,
  itemsPerPage,
  sortConfig,
  filterConfig,
  onSort,
  onFilterChange,
  onItemsPerPageChange,
  setCurrentPage,
  toggleSelectItem,
  toggleSelectAll,
  actionHandlers
}) => {
  // ✅ STATE MANAGEMENT
  const [dialogState, setDialogState] = useState<DialogState>(initialDialogState);
  const [localFilterConfig, setLocalFilterConfig] = useState(filterConfig);

  // ✅ Update local filters when props change
  React.useEffect(() => {
    setLocalFilterConfig(filterConfig);
  }, [filterConfig]);

  // ✅ PAGINATION LOGIC
  const paginationData = useMemo(() => {
    const filteredPurchases = purchases.filter(purchase => {
      const matchesSearch = !localFilterConfig.search || 
        purchase.id.toLowerCase().includes(localFilterConfig.search.toLowerCase()) ||
        purchase.supplier.toLowerCase().includes(localFilterConfig.search.toLowerCase());
      
      const matchesStatus = !localFilterConfig.status || purchase.status === localFilterConfig.status;
      const matchesSupplier = !localFilterConfig.supplier || purchase.supplier === localFilterConfig.supplier;
      
      let matchesDateRange = true;
      if (localFilterConfig.dateRange.start || localFilterConfig.dateRange.end) {
        const purchaseDate = new Date(purchase.tanggal);
        if (localFilterConfig.dateRange.start) {
          matchesDateRange = matchesDateRange && purchaseDate >= new Date(localFilterConfig.dateRange.start);
        }
        if (localFilterConfig.dateRange.end) {
          matchesDateRange = matchesDateRange && purchaseDate <= new Date(localFilterConfig.dateRange.end);
        }
      }
      
      return matchesSearch && matchesStatus && matchesSupplier && matchesDateRange;
    });

    const totalItems = filteredPurchases.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentPurchases = filteredPurchases.slice(startIndex, startIndex + itemsPerPage);

    return {
      currentPurchases,
      totalItems,
      totalPages
    };
  }, [purchases, localFilterConfig, currentPage, itemsPerPage]);

  // ✅ SORT INDICATOR
  const renderSortIcon = (columnKey: string) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'asc' ? 
        <ChevronUp className="h-4 w-4 inline" /> : 
        <ChevronDown className="h-4 w-4 inline" />;
    }
    return null;
  };

  // ✅ HANDLE LOCAL FILTER CHANGE
  const handleLocalFilterChange = (filterType: string, value: string) => {
    setLocalFilterConfig(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // ✅ APPLY FILTERS
  const applyFilters = () => {
    onFilterChange('search', localFilterConfig.search);
    onFilterChange('status', localFilterConfig.status);
    onFilterChange('supplier', localFilterConfig.supplier);
    onFilterChange('dateRange', localFilterConfig.dateRange);
    setCurrentPage(1);
  };

  // ✅ RESET FILTERS
  const resetFilters = () => {
    const resetConfig = {
      search: '',
      status: '',
      supplier: '',
      dateRange: { start: '', end: '' }
    };
    setLocalFilterConfig(resetConfig);
    actionHandlers.resetFilters();
  };

  // ✅ CHECK IF FILTERS ARE ACTIVE
  const areFiltersActive = useMemo(() => {
    return localFilterConfig.search !== '' || 
           localFilterConfig.status !== '' || 
           localFilterConfig.supplier !== '' || 
           localFilterConfig.dateRange.start !== '' || 
           localFilterConfig.dateRange.end !== '';
  }, [localFilterConfig]);

  logger.debug('📊 PurchaseTable render:', { // ✅ Ganti console.log dengan logger.debug
    purchases: purchases.length,
    selectedItems: selectedItems.length,
    currentPage,
    itemsPerPage,
    totalItems: paginationData.totalItems,
    totalPages: paginationData.totalPages,
    filters: localFilterConfig
  });

  // ✅ STATUS ICON MAPPING
  const getStatusIcon = (status: PurchaseStatus) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari ID atau supplier..."
                value={localFilterConfig.search}
                onChange={(e) => handleLocalFilterChange('search', e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <Select
              value={localFilterConfig.status}
              onValueChange={(value) => handleLocalFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Status</SelectItem>
                {STATUS_CONFIG.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Supplier Filter */}
          <div className="w-full lg:w-48">
            <Select
              value={localFilterConfig.supplier}
              onValueChange={(value) => handleLocalFilterChange('supplier', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Supplier</SelectItem>
                {Array.from(new Set(purchases.map(p => p.supplier))).map(supplier => (
                  <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={applyFilters}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Filter className="h-4 w-4 mr-2" />
              Terapkan
            </Button>
            {areFiltersActive && (
              <Button
                onClick={resetFilters}
                variant="outline"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
            <Input
              type="date"
              value={localFilterConfig.dateRange.start}
              onChange={(e) => handleLocalFilterChange('dateRange', { ...localFilterConfig.dateRange, start: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
            <Input
              type="date"
              value={localFilterConfig.dateRange.end}
              onChange={(e) => handleLocalFilterChange('dateRange', { ...localFilterConfig.dateRange, end: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {/* Select All Checkbox */}
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedItems.length > 0 && selectedItems.length === paginationData.currentPurchases.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all purchases"
                />
              </TableHead>
              
              {/* ID Column */}
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort('id')}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                  type="button"
                >
                  ID Pembelian
                  {renderSortIcon('id')}
                </Button>
              </TableHead>
              
              {/* Date Column */}
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort('tanggal')}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                  type="button"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Tanggal
                  {renderSortIcon('tanggal')}
                </Button>
              </TableHead>
              
              {/* Supplier Column */}
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort('supplier')}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                  type="button"
                >
                  <User className="h-4 w-4 mr-2" />
                  Supplier
                  {renderSortIcon('supplier')}
                </Button>
              </TableHead>
              
              {/* Items Column */}
              <TableHead>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Items
                </div>
              </TableHead>
              
              {/* Total Value Column */}
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => onSort('totalNilai')}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                  type="button"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Total Nilai
                  {renderSortIcon('totalNilai')}
                </Button>
              </TableHead>
              
              {/* Status Column */}
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort('status')}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                  type="button"
                >
                  Status
                  {renderSortIcon('status')}
                </Button>
              </TableHead>
              
              {/* Actions Column */}
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {paginationData.currentPurchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Tidak ada data pembelian
                </TableCell>
              </TableRow>
            ) : (
              paginationData.currentPurchases.map((purchase) => (
                <TableRow
                  key={purchase.id}
                  className="hover:bg-gray-50"
                  onClick={(e) => {
                    // Prevent row click when clicking action buttons
                    if (e.target.closest('button, [role="menuitem"]')) {
                      e.stopPropagation();
                    }
                  }}
                >
                  {/* Select Checkbox */}
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(purchase.id)}
                      onCheckedChange={() => toggleSelectItem(purchase.id)}
                      aria-label={`Select purchase ${purchase.id}`}
                    />
                  </TableCell>
                  
                  {/* ID */}
                  <TableCell className="font-medium text-blue-600">
                    {purchase.id}
                  </TableCell>
                  
                  {/* Date */}
                  <TableCell>
                    <div className="text-sm font-medium text-gray-900">
                      {format(new Date(purchase.tanggal), 'dd MMM yyyy', { locale: localeId })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(purchase.tanggal), 'HH:mm', { locale: localeId })}
                    </div>
                  </TableCell>
                  
                  {/* Supplier */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{purchase.supplier}</div>
                        <div className="text-xs text-gray-500">Supplier</div>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Items */}
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.items && purchase.items.length === 1 ? (
                          purchase.items[0].nama
                        ) : purchase.items && purchase.items.length > 0 ? (
                          `${purchase.items[0].nama}${purchase.items.length > 1 ? ` +${purchase.items.length - 1} lainnya` : ''}`
                        ) : (
                          'Tidak ada item'
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {getFormattedTotalQuantities(purchase)}
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Total Value */}
                  <TableCell className="text-right">
                    <div className="font-bold text-green-600">
                      {formatCurrency(purchase.totalNilai)}
                    </div>
                  </TableCell>
                  
                  {/* Status with Dropdown */}
                  <TableCell>
                    <StatusDropdown
                      purchase={purchase}
                      onStatusChange={(newStatus) => {
                        // Handle status change if needed
                        logger.debug('Status changed for purchase:', purchase.id, newStatus); // ✅ Ganti console.log dengan logger.debug
                      }}
                    />
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          aria-label={`Actions for purchase ${purchase.id}`}
                          type="button"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      
                      <DropdownMenuContent
                        align="end"
                        className="w-[160px] z-[9999] bg-white border border-gray-200 shadow-lg rounded-md"
                        side="bottom"
                        sideOffset={4}
                        avoidCollisions={true}
                        collisionPadding={8}
                      >
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            actionHandlers.viewDetails(purchase);
                          }}
                          className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-sm"
                          role="menuitem"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Lihat Detail
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (purchase.status !== 'completed') {
                              actionHandlers.edit(purchase);
                            }
                          }}
                          disabled={purchase.status === 'completed'}
                          className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          role="menuitem"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            actionHandlers.delete(purchase.id);
                          }}
                          disabled={purchase.status === 'completed'}
                          className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-sm text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          role="menuitem"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {paginationData.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-700">
            Menampilkan {Math.min(itemsPerPage, paginationData.totalItems)} dari {paginationData.totalItems} items
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Items per page:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={onItemsPerPageChange}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                type="button"
              >
                Sebelumnya
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, paginationData.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                      type="button"
                    >
                      {page}
                    </Button>
                  );
                })}
                
                {paginationData.totalPages > 5 && currentPage < paginationData.totalPages - 2 && (
                  <>
                    <span className="px-2">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(paginationData.totalPages)}
                      className="w-8 h-8 p-0"
                      type="button"
                    >
                      {paginationData.totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(paginationData.totalPages, currentPage + 1))}
                disabled={currentPage === paginationData.totalPages}
                type="button"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseTable;