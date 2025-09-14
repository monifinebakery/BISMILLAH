// 🎯 VirtualOrderTable.tsx - Virtual Scrolling Implementation for Orders
import React, { useMemo } from 'react';
import { MoreHorizontal, Edit, Trash2, MessageSquare, Eye, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { Order, UseOrderUIReturn, OrderStatus } from '../types';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';
import { ORDER_STATUSES, getStatusText, getStatusColor } from '../constants';
import { useFollowUpTemplate, useProcessTemplate } from '@/contexts/FollowUpTemplateContext';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface VirtualOrderTableProps {
  uiState: UseOrderUIReturn;
  loading: boolean;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  onNewOrder: () => void;
  onFollowUp?: (order: Order) => void;
  onViewDetail?: (order: Order) => void;
  // Bulk operations props
  selectedIds?: string[];
  onSelectionChange?: (orderId: string) => void;
  isSelectionMode?: boolean;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
}

// Status Badge Component
const StatusBadge: React.FC<{
  status: OrderStatus;
  onChange?: (newStatus: OrderStatus) => void;
  disabled?: boolean;
}> = ({ status, onChange, disabled = false }) => {
  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status);

  if (!onChange || disabled) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
        {statusText}
      </span>
    );
  }

  return (
    <Select value={status} onValueChange={onChange}>
      <SelectTrigger className={`w-auto h-auto p-0 border-none bg-transparent ${statusColor}`}>
        <SelectValue>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
            {statusText}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((orderStatus) => (
          <SelectItem key={orderStatus} value={orderStatus}>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(orderStatus)}`}>
              {getStatusText(orderStatus)}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Order Row Actions Component
const OrderRowActions: React.FC<{
  order: Order;
  onEdit: () => void;
  onDelete: () => void;
  onFollowUp?: () => void;
  onViewDetail?: () => void;
  disabled?: boolean;
}> = ({ order, onEdit, onDelete, onFollowUp, onViewDetail, disabled = false }) => {
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
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          Edit Pesanan
        </DropdownMenuItem>
        
        {onFollowUp && ((order as any).telepon_pelanggan || (order as any)['teleponPelanggan'] || (order as any).customer_phone) && (
          <DropdownMenuItem onClick={onFollowUp} className="cursor-pointer">
            <MessageSquare className="mr-2 h-4 w-4" />
            Follow Up WhatsApp
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onDelete} 
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus Pesanan
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Completion Date Cell Component
const CompletionDateCell: React.FC<{ order: Order }> = ({ order }) => {
  const tanggalSelesaiAny: any = (order as any).tanggal_selesai || (order as any)['tanggalSelesai'];
  if (order.status !== 'completed' || !tanggalSelesaiAny) {
    return (
      <div className="text-sm text-gray-400">
        -
      </div>
    );
  }

  const completionDate = new Date(tanggalSelesaiAny);
  const orderDate = new Date((order as any).tanggal);
  const diffTime = completionDate.getTime() - orderDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div className="flex flex-col">
      <div className="text-sm font-medium text-gray-900">
        {formatDateForDisplay(tanggalSelesaiAny)}
      </div>
      <div className="text-xs text-gray-500">
        {diffDays === 0 ? 'Hari ini' : 
         diffDays === 1 ? '1 hari' : 
         `${diffDays} hari`}
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<{
  hasFilters: boolean;
  onAddFirst: () => void;
  onClearFilters: () => void;
}> = ({ hasFilters, onAddFirst, onClearFilters }) => {
  return (
    <div className="text-center py-12">
      <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        {hasFilters ? 'Tidak ada pesanan yang sesuai filter' : 'Belum ada pesanan'}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {hasFilters 
          ? 'Coba ubah atau hapus filter untuk melihat pesanan lainnya.'
          : 'Mulai dengan membuat pesanan pertama Anda.'
        }
      </p>
      <div className="mt-6">
        {hasFilters ? (
          <Button onClick={onClearFilters} variant="outline">
            Hapus Filter
          </Button>
        ) : (
          <Button onClick={onAddFirst}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Buat Pesanan Pertama
          </Button>
        )}
      </div>
    </div>
  );
};

const VirtualOrderTable: React.FC<VirtualOrderTableProps> = ({
  uiState,
  loading,
  onEditOrder,
  onDeleteOrder,
  onStatusChange,
  onNewOrder,
  onFollowUp,
  onViewDetail,
  selectedIds = [],
  onSelectionChange,
  isSelectionMode = false,
  onSelectAll,
  isAllSelected = false
}) => {
  const { getTemplate } = useFollowUpTemplate();
  const { processTemplate } = useProcessTemplate();

  // Handle follow up
  const handleFollowUp = (order: Order) => {
    if (onFollowUp) {
      onFollowUp(order);
      return;
    }
    
    const phone = (order as any).telepon_pelanggan || (order as any)['teleponPelanggan'] || (order as any).customer_phone;
    if (!phone) {
      toast.error('Tidak ada nomor WhatsApp untuk follow up');
      return;
    }

    try {
      const template = getTemplate(order.status);
      
      if (!template) {
        toast.error('Template untuk status ini belum tersedia');
        return;
      }

      const processedMessage = processTemplate(template, order as any);
      const cleanPhoneNumber = String(phone).replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(processedMessage)}`;
      
      window.open(whatsappUrl, '_blank');
      const nama = (order as any).nama_pelanggan || (order as any)['namaPelanggan'] || (order as any).customer_name;
      toast.success(`Follow up untuk ${nama} berhasil dibuka di WhatsApp`);
      
    } catch (error) {
      logger.error('Error processing follow up template:', error);
      toast.error('Gagal memproses template follow up');
      
      const nomor = (order as any).nomor_pesanan || (order as any)['nomorPesanan'] || (order as any).order_number;
      const nama = (order as any).nama_pelanggan || (order as any)['namaPelanggan'] || (order as any).customer_name;
      const fallbackMessage = `Halo ${nama}, saya ingin menanyakan status pesanan #${nomor}`;
      const cleanPhoneNumber = String(phone).replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(fallbackMessage)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  // Define columns for virtual table
  const columns: VirtualTableColumn<Order>[] = useMemo(() => {
    const baseColumns: VirtualTableColumn<Order>[] = [
      {
        key: 'nomor_pesanan',
        header: 'No. Pesanan',
        width: 120,
        render: (order: Order) => (
          <div className="flex flex-col">
            <div className="text-sm font-medium text-gray-900">#
              {(order as any).nomor_pesanan || (order as any)['nomorPesanan'] || (order as any).order_number}
            </div>
            <div className="text-xs text-gray-500">{order.id.slice(0, 8)}...</div>
          </div>
        )
      },
      {
        key: 'nama_pelanggan',
        header: 'Pelanggan',
        width: 180,
        render: (order: Order) => (
          <div className="flex flex-col">
            <div className="text-sm font-medium text-gray-900">
              {(order as any).nama_pelanggan || (order as any)['namaPelanggan'] || (order as any).customer_name}
            </div>
            {((order as any).telepon_pelanggan || (order as any)['teleponPelanggan'] || (order as any).customer_phone) && (
              <div className="text-xs text-gray-500">
                {(order as any).telepon_pelanggan || (order as any)['teleponPelanggan'] || (order as any).customer_phone}
              </div>
            )}
            {((order as any).email_pelanggan || (order as any)['emailPelanggan'] || (order as any).customer_email) && (
              <div className="text-xs text-gray-500">
                {(order as any).email_pelanggan || (order as any)['emailPelanggan'] || (order as any).customer_email}
              </div>
            )}
          </div>
        )
      },
      {
        key: 'tanggal',
        header: 'Tanggal Order',
        width: 120,
        render: (order: Order) => (
          <div className="text-sm text-gray-900">
            {formatDateForDisplay(order.tanggal)}
          </div>
        )
      },
      {
        key: 'tanggal_selesai',
        header: 'Tanggal Selesai',
        width: 120,
        render: (order: Order) => <CompletionDateCell order={order} />
      },
      {
        key: 'total_pesanan',
        header: 'Total',
        width: 100,
        align: 'right' as const,
        render: (order: Order) => (
          <div className="text-sm font-medium text-gray-900">
            {formatCurrency((order as any).total_pesanan || (order as any)['totalPesanan'])}
          </div>
        )
      },
      {
        key: 'updated_at',
        header: 'Terakhir Diperbarui',
        width: 120,
        render: (order: Order) => (
          <div className="text-sm text-gray-500">
            {formatDateForDisplay((order as any).updated_at || (order as any)['updatedAt'])}
          </div>
        )
      },
      {
        key: 'status',
        header: 'Status',
        width: 100,
        render: (order: Order) => (
          <StatusBadge
            status={order.status}
            onChange={(newStatus) => onStatusChange(order.id, newStatus)}
          />
        )
      },
      {
        key: 'actions',
        header: 'Aksi',
        width: 80,
        align: 'right' as const,
        render: (order: Order) => (
          <OrderRowActions
            order={order}
            onEdit={() => onEditOrder(order)}
            onDelete={() => onDeleteOrder(order.id)}
            onFollowUp={() => handleFollowUp(order)}
            onViewDetail={onViewDetail ? () => onViewDetail(order) : undefined}
          />
        )
      }
    ];

    // Add selection column if in selection mode
    if (isSelectionMode) {
      return [
        {
          key: 'selection',
          header: (
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={() => onSelectAll && onSelectAll()}
              className="h-4 w-4"
            />
          ) as any,
          width: 50,
          render: (order: Order) => (
            <Checkbox
              checked={selectedIds.includes(order.id)}
              onCheckedChange={() => onSelectionChange && onSelectionChange(order.id)}
              className="h-4 w-4"
            />
          )
        },
        ...baseColumns
      ];
    }

    return baseColumns;
  }, [isSelectionMode, selectedIds, isAllSelected, onSelectAll, onSelectionChange, onEditOrder, onDeleteOrder, onStatusChange, onViewDetail]);

  // Handle row click
  const handleRowClick = (order: Order) => {
    if (isSelectionMode && onSelectionChange) {
      onSelectionChange(order.id);
    } else if (onViewDetail) {
      onViewDetail(order);
    }
  };

  if (uiState.currentOrders.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <EmptyState
          hasFilters={uiState.hasActiveFilters}
          onAddFirst={onNewOrder}
          onClearFilters={uiState.clearFilters}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
      <VirtualTable
        data={uiState.currentOrders}
        columns={columns}
        loading={loading}
        itemHeight={60}
        containerHeight={600}
        onRowClick={handleRowClick}
        className="w-full"
        emptyMessage="Tidak ada pesanan"
        hoverable={true}
        striped={true}
        getItemId={(order) => order.id}
      />
    </div>
  );
};

export default VirtualOrderTable;
