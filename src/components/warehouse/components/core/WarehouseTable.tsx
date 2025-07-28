// src/components/warehouse/components/core/WarehouseTable.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronUp, 
  ChevronDown, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  AlertTriangle,
  Calendar,
  Package,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { BahanBaku, SortConfig, TableColumn } from '../../types/warehouse';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '@/lib/utils';

interface WarehouseTableProps {
  items: BahanBaku[];
  isLoading?: boolean;
  isSelectionMode?: boolean;
  searchTerm?: string;
  sortConfig?: SortConfig;
  onSort?: (key: keyof BahanBaku) => void;
  onEdit?: (item: BahanBaku) => void;
  onDelete?: (id: string, nama: string) => void;
  onView?: (item: BahanBaku) => void;
  selectedItems?: string[];
  onToggleSelection?: (id: string) => void;
  onSelectAllCurrent?: () => void;
  isSelected?: (id: string) => boolean;
  allCurrentSelected?: boolean;
  someCurrentSelected?: boolean;
  emptyStateAction?: () => void;
  className?: string;
}

// Mobile breakpoint detection
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

const WarehouseTable: React.FC<WarehouseTableProps> = ({
  items,
  isLoading = false,
  isSelectionMode = false,
  searchTerm = '',
  sortConfig,
  onSort,
  onEdit,
  onDelete,
  onView,
  selectedItems = [],
  onToggleSelection,
  onSelectAllCurrent,
  isSelected,
  allCurrentSelected = false,
  someCurrentSelected = false,
  emptyStateAction,
  className,
}) => {
  const isMobile = useIsMobile();

  // Table columns configuration
  const columns: TableColumn[] = useMemo(() => [
    {
      key: 'nama',
      label: 'Nama Bahan',
      sortable: true,
      width: isMobile ? 'min-w-[140px]' : 'min-w-[200px]',
    },
    {
      key: 'kategori',
      label: 'Kategori',
      sortable: true,
      width: isMobile ? 'min-w-[100px]' : 'min-w-[120px]',
    },
    {
      key: 'stok',
      label: 'Stok',
      sortable: true,
      width: 'min-w-[80px]',
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium",
            item.stok === 0 ? "text-red-600" : 
            item.stok <= item.minimum ? "text-orange-600" : "text-green-600"
          )}>
            {item.stok}
          </span>
          <span className="text-xs text-gray-500">{item.satuan}</span>
          {item.stok <= item.minimum && (
            <AlertTriangle className="h-3 w-3 text-orange-500" />
          )}
        </div>
      ),
    },
    ...(isMobile ? [] : [
      {
        key: 'minimum' as keyof BahanBaku,
        label: 'Min. Stok',
        sortable: true,
        width: 'min-w-[80px]',
      },
      {
        key: 'hargaSatuan' as keyof BahanBaku,
        label: 'Harga',
        sortable: true,
        width: 'min-w-[100px]',
        render: (item: BahanBaku) => (
          <span className="font-medium">{formatCurrency(item.hargaSatuan)}</span>
        ),
      },
      {
        key: 'supplier' as keyof BahanBaku,
        label: 'Supplier',
        sortable: true,
        width: 'min-w-[120px]',
      },
    ]),
    {
      key: 'tanggalKadaluwarsa' as keyof BahanBaku,
      label: 'Expired',
      sortable: true,
      width: 'min-w-[100px]',
      render: (item) => {
        if (!item.tanggalKadaluwarsa) {
          return <span className="text-gray-400 text-xs">-</span>;
        }
        
        const expiryDate = new Date(item.tanggalKadaluwarsa);
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
        let icon = null;
        
        if (diffDays <= 0) {
          badgeVariant = "destructive";
          icon = <AlertTriangle className="h-3 w-3" />;
        } else if (diffDays <= 7) {
          badgeVariant = "outline";
          icon = <Calendar className="h-3 w-3" />;
        }
        
        return (
          <Badge variant={badgeVariant} className="text-xs flex items-center gap-1">
            {icon}
            {formatDate(item.tanggalKadaluwarsa)}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: 'Aksi',
      width: 'w-[80px]',
    },
  ] as TableColumn[], [isMobile]);

  // Render sort icon
  const renderSortIcon = (columnKey: keyof BahanBaku) => {
    if (!sortConfig || sortConfig.key !== columnKey) return null;
    
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  // Handle sort click
  const handleSort = (columnKey: keyof BahanBaku) => {
    if (onSort) {
      onSort(columnKey);
    }
  };

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-gray-50 rounded-full p-6 mb-4">
          <Package className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {searchTerm ? 'Tidak ada hasil ditemukan' : 'Belum ada bahan baku'}
        </h3>
        <p className="text-gray-500 text-center mb-6 max-w-md">
          {searchTerm 
            ? `Tidak ada bahan baku yang cocok dengan "${searchTerm}"`
            : 'Mulai tambahkan bahan baku pertama Anda untuk mengelola inventori.'
          }
        </p>
        {!searchTerm && emptyStateAction && (
          <Button onClick={emptyStateAction} className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Tambah Bahan Baku Pertama
          </Button>
        )}
      </div>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className={cn("space-y-4 p-4", className)}>
        {items.map((item) => (
          <div 
            key={item.id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            {/* Header with selection and actions */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {isSelectionMode && onToggleSelection && isSelected && (
                  <Checkbox
                    checked={isSelected(item.id)}
                    onCheckedChange={() => onToggleSelection(item.id)}
                    className="rounded"
                  />
                )}
                <div>
                  <h4 className="font-semibold text-gray-900">{item.nama}</h4>
                  <p className="text-xs text-gray-500">{item.kategori}</p>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(item)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Lihat Detail
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(item.id, item.nama)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Stok:</span>
                <div className="flex items-center gap-1 mt-1">
                  <span className={cn(
                    "font-medium",
                    item.stok === 0 ? "text-red-600" : 
                    item.stok <= item.minimum ? "text-orange-600" : "text-green-600"
                  )}>
                    {item.stok} {item.satuan}
                  </span>
                  {item.stok <= item.minimum && (
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-gray-500">Harga:</span>
                <p className="font-medium mt-1">{formatCurrency(item.hargaSatuan)}</p>
              </div>
              
              <div>
                <span className="text-gray-500">Supplier:</span>
                <p className="mt-1">{item.supplier}</p>
              </div>
              
              <div>
                <span className="text-gray-500">Expired:</span>
                <div className="mt-1">
                  {item.tanggalKadaluwarsa ? (
                    <Badge 
                      variant={(() => {
                        const expiryDate = new Date(item.tanggalKadaluwarsa);
                        const today = new Date();
                        const diffTime = expiryDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays <= 0) return "destructive";
                        if (diffDays <= 7) return "outline";
                        return "default";
                      })()}
                      className="text-xs"
                    >
                      {formatDate(item.tanggalKadaluwarsa)}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={cn("overflow-x-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {/* Selection header */}
            {isSelectionMode && onSelectAllCurrent && (
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allCurrentSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someCurrentSelected;
                  }}
                  onCheckedChange={onSelectAllCurrent}
                  className="rounded"
                />
              </TableHead>
            )}
            
            {/* Column headers */}
            {columns.map((column) => (
              <TableHead 
                key={column.key}
                className={cn(
                  column.width,
                  column.sortable && onSort ? "cursor-pointer hover:bg-gray-50 select-none" : "",
                  column.className
                )}
                onClick={() => column.sortable && onSort && column.key !== 'actions' && handleSort(column.key as keyof BahanBaku)}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && column.key !== 'actions' && renderSortIcon(column.key as keyof BahanBaku)}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {isSelectionMode && <TableCell><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></TableCell>}
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            items.map((item) => (
              <TableRow 
                key={item.id}
                className={cn(
                  "hover:bg-gray-50 transition-colors",
                  isSelectionMode && isSelected?.(item.id) && "bg-orange-50 hover:bg-orange-100"
                )}
              >
                {/* Selection cell */}
                {isSelectionMode && onToggleSelection && isSelected && (
                  <TableCell>
                    <Checkbox
                      checked={isSelected(item.id)}
                      onCheckedChange={() => onToggleSelection(item.id)}
                      className="rounded"
                    />
                  </TableCell>
                )}
                
                {/* Data cells */}
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.key === 'actions' ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(item)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {onDelete && (
                            <DropdownMenuItem 
                              onClick={() => onDelete(item.id, item.nama)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : column.render ? (
                      column.render(item)
                    ) : (
                      <span>{String(item[column.key as keyof BahanBaku] || '-')}</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default WarehouseTable;