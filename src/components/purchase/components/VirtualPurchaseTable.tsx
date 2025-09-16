// 🎯 VirtualPurchaseTable.tsx - Virtual Scrolling Implementation for Purchases
import React, { useMemo, useCallback } from 'react';
import { MoreHorizontal, Edit, Trash2, Package, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import VirtualTable, { VirtualTableColumn } from '@/components/ui/VirtualTable';
import { formatCurrency } from '@/utils/formatUtils';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Types
interface Purchase {
  id: string;
  user_id: string;
  tanggal: string;
  supplier: string;
  totalNilai: number;
  total_nilai?: number; // Support for different naming conventions
  status: PurchaseStatus;
  items?: any[];
  catatan?: string;
  created_at: string;
  updated_at: string;
}

type PurchaseStatus = 'pending' | 'completed' | 'cancelled';

interface VirtualPurchaseTableProps {
  purchases: Purchase[];
  loading: boolean;
  onEditPurchase: (purchase: Purchase) => void;
  onDeletePurchase: (purchaseId: string) => void;
  onStatusChange: (purchaseId: string, newStatus: PurchaseStatus) => void;
  onNewPurchase: () => void;
  onViewDetail?: (purchase: Purchase) => void;
  getSupplierName?: (supplierName: string) => string;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

// Status Badge Component
const StatusBadge: React.FC<{
  status: PurchaseStatus;
  onChange?: (newStatus: PurchaseStatus) => void;
  disabled?: boolean;
}> = ({ status, onChange, disabled = false }) => {
  const getStatusConfig = (status: PurchaseStatus) => {
    switch (status) {
      case 'completed':
        return { color: 'bg-green-100 text-green-800', text: 'Selesai' };
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', text: 'Dibatalkan' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: 'Unknown' };
    }
  };

  const statusConfig = getStatusConfig(status);

  if (!onChange || disabled) {
    return (
      <Badge className={statusConfig.color}>
        {statusConfig.text}
      </Badge>
    );
  }

  const statuses: PurchaseStatus[] = ['pending', 'completed', 'cancelled'];

  return (
    <Select value={status} onValueChange={onChange}>
      <SelectTrigger className="w-auto h-auto p-0 border-none bg-transparent">
        <SelectValue>
          <Badge className={statusConfig.color}>
            {statusConfig.text}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statuses.map((statusOption) => {
          const config = getStatusConfig(statusOption);
          return (
            <SelectItem key={statusOption} value={statusOption}>
              <Badge className={config.color}>
                {config.text}
              </Badge>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

// Purchase Row Actions Component
const PurchaseRowActions: React.FC<{
  purchase: Purchase;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetail?: () => void;
  disabled?: boolean;
}> = ({ purchase, onEdit, onDelete, onViewDetail, disabled = false }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-gray-100"
          disabled={disabled}
        >
          <span className="sr-only">Buka menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onViewDetail && (
          <>
            <DropdownMenuItem onClick={onViewDetail} className="cursor-pointer">
              <Package className="mr-2 h-4 w-4" />
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          Edit Pembelian
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onDelete} 
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus Pembelian
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Empty State Component
const EmptyState: React.FC<{
  hasFilters: boolean;
  onAddFirst: () => void;
  onClearFilters?: () => void;
}> = ({ hasFilters, onAddFirst, onClearFilters }) => {
  return (
    <div className="text-center py-12">
      <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        {hasFilters ? 'Tidak ada pembelian yang sesuai filter' : 'Belum ada pembelian'}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {hasFilters 
          ? 'Coba ubah atau hapus filter untuk melihat pembelian lainnya.'
          : 'Mulai dengan membuat pembelian pertama Anda.'
        }
      </p>
      <div className="mt-6">
        {hasFilters && onClearFilters ? (
          <Button onClick={onClearFilters} variant="outline">
            Hapus Filter
          </Button>
        ) : (
          <Button onClick={onAddFirst}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Buat Pembelian Pertama
          </Button>
        )}
      </div>
    </div>
  );
};

const VirtualPurchaseTable: React.FC<VirtualPurchaseTableProps> = ({
  purchases,
  loading,
  onEditPurchase,
  onDeletePurchase,
  onStatusChange,
  onNewPurchase,
  onViewDetail,
  getSupplierName,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  hasActiveFilters = false,
  onClearFilters
}) => {

  // Define table columns with mobile responsive features
  const columns: VirtualTableColumn<Purchase>[] = useMemo(() => {
    const baseColumns: VirtualTableColumn<Purchase>[] = [
      {
        key: 'tanggal',
        header: 'Tanggal',
        width: 120,
        mobileWidth: 100,
        sortable: true,
        render: (purchase) => {
          const date = purchase.tanggal;
          const createdAt = purchase.created_at;
          return (
            <div className="flex flex-col min-w-0">
              <div className="text-sm text-gray-900">
                {formatDateForDisplay(date)}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(createdAt).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          );
        },
      },
      {
        key: 'supplier',
        header: 'Supplier',
        width: 160,
        mobileWidth: 120,
        sortable: true,
        render: (purchase) => {
          // Enhanced supplier name resolution with fallbacks
          let supplierName = 'Supplier Tidak Dikenal';
          
          try {
            if (getSupplierName && purchase.supplier) {
              supplierName = getSupplierName(purchase.supplier);
            } else if (purchase.supplier) {
              // If no getSupplierName function, show raw supplier value
              // Check if it looks like a UUID/ID or actual name
              const supplier = purchase.supplier;
              if (supplier.length > 30 || supplier.includes('-')) {
                // Looks like UUID, truncate it
                supplierName = supplier.slice(0, 8) + '...';
              } else {
                // Looks like actual supplier name
                supplierName = supplier;
              }
            }
          } catch (error) {
            logger.error('Error resolving supplier name:', error);
            supplierName = 'Error: ' + (purchase.supplier?.slice(0, 8) || 'N/A');
          }
          
          return (
            <div className="flex flex-col min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {supplierName}
              </div>
              {purchase.supplier && purchase.supplier !== supplierName && (
                <div className="text-xs text-gray-400 truncate">
                  {purchase.supplier.slice(0, 8)}...
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: 'totalNilai',
        header: 'Total',
        width: 110,
        mobileWidth: 90,
        sortable: true,
        align: 'right' as const,
        render: (purchase) => {
          const total = purchase.totalNilai ?? purchase.total_nilai ?? 0;
          const itemCount = Array.isArray(purchase.items) ? purchase.items.length : 0;
          return (
            <div className="flex flex-col items-end min-w-0">
              <div className="text-sm font-semibold text-green-600">
                {formatCurrency(total)}
              </div>
              {itemCount > 0 && (
                <div className="text-xs text-gray-500">
                  {itemCount} item{itemCount > 1 ? 's' : ''}
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        width: 100,
        mobileWidth: 80,
        sortable: true,
        render: (purchase) => (
          <StatusBadge
            status={purchase.status}
            onChange={(newStatus) => onStatusChange(purchase.id, newStatus)}
            disabled={purchase.status === 'completed' || purchase.status === 'cancelled'}
          />
        ),
      },
      {
        key: 'actions',
        header: 'Aksi',
        width: 60,
        mobileWidth: 50,
        align: 'center' as const,
        render: (purchase) => (
          <PurchaseRowActions
            purchase={purchase}
            onEdit={() => onEditPurchase(purchase)}
            onDelete={() => onDeletePurchase(purchase.id)}
            onViewDetail={onViewDetail ? () => onViewDetail(purchase) : undefined}
          />
        ),
      },
    ];

    return baseColumns;
  }, [onEditPurchase, onDeletePurchase, onStatusChange, onViewDetail, getSupplierName]);

  // Handle row click
  const handleRowClick = useCallback((purchase: Purchase) => {
    if (onViewDetail) {
      onViewDetail(purchase);
    }
  }, [onViewDetail]);

  // Empty state
  if (purchases.length === 0 && !loading) {
    return (
      <div className="w-full max-w-full">
        <EmptyState
          hasFilters={hasActiveFilters}
          onAddFirst={onNewPurchase}
          onClearFilters={onClearFilters}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-4">
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <VirtualTable
          data={purchases}
          columns={columns}
          loading={loading}
          itemHeight={72}
          containerHeight={600}
          onRowClick={handleRowClick}
          className="w-full"
          emptyMessage="Tidak ada pembelian ditemukan"
          hoverable={true}
          striped={true}
          getItemId={(purchase) => purchase.id}
        />
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
          <div className="text-sm text-gray-700 text-center sm:text-left">
            Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - 
            {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} pembelian
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
            >
              Sebelumnya
            </button>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualPurchaseTable;