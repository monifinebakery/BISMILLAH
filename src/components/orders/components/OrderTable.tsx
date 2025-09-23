// 🎯 OrderTable.tsx - OPTIMIZED with React.memo, useMemo, useCallback
import React, { useState, useCallback, useMemo } from 'react';
import { MoreHorizontal, Edit, Trash2, MessageSquare, Eye, ShoppingCart, Search, Plus, ChevronDown, ChevronRight, MoreVertical } from 'lucide-react';
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
import { formatCurrency } from '@/lib/shared';
import type { Order, UseOrderUIReturn, OrderStatus } from '../types';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';
import { ORDER_STATUSES, getStatusText, getStatusColor } from '../constants';
// ✅ FIXED: Hooks dipanggil di top level component
import { useFollowUpTemplate, useProcessTemplate } from '@/contexts/FollowUpTemplateContext';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface OrderTableProps {
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

// Status Badge Component (unchanged)
const StatusBadge: React.FC<{
  status: OrderStatus;
  onChange?: (newStatus: OrderStatus) => void;
  disabled?: boolean;
}> = ({ status, onChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (disabled || !onChange) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
        {getStatusText(status)}
      </span>
    );
  }

  return (
    <Select value={status} onValueChange={(value: OrderStatus) => onChange?.(value)} open={isOpen} onOpenChange={setIsOpen}>
      <SelectTrigger
        className={`w-auto h-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 ${getStatusColor(status)} rounded-full px-2.5 py-0.5 text-xs font-medium`}
        onClick={(e) => e.stopPropagation()}
      >
        <SelectValue />
        <ChevronDown className="h-3 w-3 ml-1" />
      </SelectTrigger>
      
      <SelectContent>
        {ORDER_STATUSES.map((statusOption) => (
          <SelectItem key={statusOption} value={statusOption}>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(statusOption)}`}>
              {getStatusText(statusOption)}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// ✅ FIXED: Row Actions Component
const OrderRowActions: React.FC<{
  order: Order;
  onEdit: () => void;
  onDelete: () => void;
  onFollowUp?: () => void;
  onViewDetail?: () => void;
  disabled?: boolean;
}> = ({ order, onEdit, onDelete, onFollowUp, onViewDetail, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = () => {
    setIsOpen(false);
    const nomor = (order as any).nomor_pesanan || (order as any).order_number || (order as any)['nomorPesanan'];
    if (window.confirm(`Apakah Anda yakin ingin menghapus pesanan #${nomor}?`)) {
      onDelete();
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={disabled}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => { onEdit(); setIsOpen(false); }}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        {onFollowUp && (
          <DropdownMenuItem onClick={() => { onFollowUp(); setIsOpen(false); }}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Follow Up</span>
          </DropdownMenuItem>
        )}
        {onViewDetail && (
          <DropdownMenuItem onClick={() => { onViewDetail(); setIsOpen(false); }}>
            <Eye className="mr-2 h-4 w-4" />
            <span>Lihat Detail</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Hapus</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ✅ NEW: Mobile Order Row Component with expandable details (like WarehouseTable)
const MobileOrderRow: React.FC<{
  order: Order;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelectionChange?: (orderId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onFollowUp?: () => void;
  onViewDetail?: () => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}> = ({
  order,
  isSelected,
  isSelectionMode,
  onSelectionChange,
  onEdit,
  onDelete,
  onFollowUp,
  onViewDetail,
  onStatusChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  const customerName = (order as any).nama_pelanggan || (order as any)['namaPelanggan'] || (order as any).customer_name || (order as any)['customerName'];
  const customerPhone = (order as any).telepon_pelanggan || (order as any)['teleponPelanggan'] || (order as any).customer_phone || (order as any)['customerPhone'];
  const customerEmail = (order as any).email_pelanggan || (order as any)['emailPelanggan'] || (order as any).customer_email || (order as any)['customerEmail'];
  const orderNumber = (order as any).nomor_pesanan || (order as any).order_number || (order as any)['nomorPesanan'];
  const totalAmount = (order as any).total_pesanan || (order as any)['totalPesanan'] || order.total_amount;

  return (
    <div
      className={`
        border rounded-lg overflow-hidden transition-all duration-200
        ${isSelected ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'}
        ${order.status === 'cancelled' ? 'border-red-200 bg-red-50' : ''}
        ${order.status === 'completed' ? 'border-green-200 bg-green-50' : ''}
      `}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {isSelectionMode && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelectionChange && onSelectionChange(order.id)}
                aria-label={`Select order ${orderNumber}`}
                className="mt-1 flex-shrink-0"
              />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      #{orderNumber}
                    </h3>
                    <StatusBadge
                      status={order.status}
                      onChange={(newStatus) => onStatusChange(order.id, newStatus)}
                      disabled={order.status === 'completed' || order.status === 'cancelled'}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-1 truncate">
                    {customerName}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDateForDisplay(order.tanggal)}</span>
                    <span className="font-medium">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {!isSelectionMode && (
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={() => setShowMobileActions(!showMobileActions)}
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                      aria-label="Show actions"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showMobileActions && !isSelectionMode && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit();
                  setShowMobileActions(false);
                }}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              {onFollowUp && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onFollowUp();
                    setShowMobileActions(false);
                  }}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Follow Up
                </Button>
              )}
              {onViewDetail && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onViewDetail();
                    setShowMobileActions(false);
                  }}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Detail
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus pesanan #${orderNumber}?`);
                  if (confirmed) {
                    onDelete();
                  }
                  setShowMobileActions(false);
                }}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus
              </Button>
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Nomor Pesanan:</span>
              <span className="font-medium text-gray-900">{order.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tanggal Dibuat:</span>
              <span className="font-medium text-gray-900">
                {formatDateForDisplay((order as any).created_at || (order as any)['createdAt'])}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Terakhir Diperbarui:</span>
              <span className="font-medium text-gray-900">
                {formatDateForDisplay((order as any).updated_at || (order as any)['updatedAt'])}
              </span>
            </div>
            {customerPhone && (
              <div className="flex justify-between">
                <span className="text-gray-500">Telepon:</span>
                <span className="font-medium text-gray-900">{customerPhone}</span>
              </div>
            )}
            {customerEmail && (
              <div className="flex flex-col gap-1">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium text-gray-900 break-all text-sm">{customerEmail}</span>
              </div>
            )}
            {(order as any).alamat_pengiriman && (
              <div className="flex flex-col gap-1">
                <span className="text-gray-500">Alamat Pengiriman:</span>
                <span className="font-medium text-gray-900 text-sm">
                  {(order as any).alamat_pengiriman}
                </span>
              </div>
            )}
            {order.catatan && (
              <div className="flex flex-col gap-1">
                <span className="text-gray-500">Catatan:</span>
                <span className="font-medium text-gray-900 text-sm">
                  {order.catatan}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-300">
              <span className="text-gray-500">Jumlah Item:</span>
              <span className="font-medium text-gray-900">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Row Selection Component (unchanged)
const OrderRowSelect: React.FC<{
  isSelected: boolean;
  onToggle: (forceValue?: boolean) => void;
  orderId: string;
}> = ({ isSelected, onToggle, orderId }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggle(e.target.checked);
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleChange}
        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
        aria-label={`Select order ${orderId}`}
      />
    </div>
  );
};

// Empty State Component (unchanged)
const EmptyState: React.FC<{
  hasFilters: boolean;
  onAddFirst: () => void;
  onClearFilters: () => void;
}> = ({ hasFilters, onAddFirst, onClearFilters }) => {
  if (hasFilters) {
    return (
      <div className="text-center py-12">
        <Search className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Tidak ada pesanan ditemukan</h3>
        <p className="mt-1 text-sm text-gray-500">Tidak ada pesanan yang sesuai dengan filter Anda.</p>
        <div className="mt-6">
          <Button onClick={onClearFilters} variant="outline">Hapus Filter</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">Belum ada pesanan</h3>
      <p className="mt-1 text-sm text-gray-500">Mulai dengan membuat pesanan pertama Anda.</p>
      <div className="mt-6">
        <Button onClick={onAddFirst} className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Buat Pesanan Pertama
        </Button>
      </div>
    </div>
  );
};

// ✅ Completion Date Display Component
const CompletionDateCell: React.FC<{ order: Order }> = ({ order }) => {
  // ✅ Use tanggalSelesai from transformed order data (no direct DB calls)
  const tanggalSelesaiAny: any = (order as any).tanggal_selesai || (order as any)['tanggalSelesai'];
  if (tanggalSelesaiAny) {
    // Has completion date - show it
    return (
      <div className="flex flex-col">
        <div className="text-sm text-green-700 font-medium">
          {formatDateForDisplay(tanggalSelesaiAny)}
        </div>
        <div className="text-xs text-green-600">
          {new Date(tanggalSelesaiAny).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    );
  } else if (order.status === 'completed' || order.status === 'delivered') {
    // Completed but no completion date recorded
    return (
      <div className="flex flex-col">
        <div className="text-sm text-green-700 font-medium">Hari ini</div>
        <div className="text-xs text-green-600">Baru selesai</div>
      </div>
    );
  } else if (order.status === 'cancelled') {
    // Cancelled orders
    return (
      <div className="flex flex-col">
        <div className="text-sm text-red-700">-</div>
        <div className="text-xs text-red-600">Dibatalkan</div>
      </div>
    );
  } else {
    // Not completed yet
    return (
      <div className="flex flex-col">
        <div className="text-sm text-gray-400">-</div>
        <div className="text-xs text-gray-500">Belum selesai</div>
      </div>
    );
  }
};

// ✅ MAIN: Table Component with proper completion date handling - OPTIMIZED
const OrderTable: React.FC<OrderTableProps> = React.memo(({
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
  // ✅ FIXED: Hooks dipanggil di top level component
  const { getTemplate } = useFollowUpTemplate();
  const { processTemplate } = useProcessTemplate();

  // ✅ PERFORMANCE: Memoized callback functions to prevent unnecessary re-renders
  const handleRowClick = useCallback((order: Order, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'INPUT' ||
      target.closest('button') ||
      target.closest('select') ||
      target.closest('input') ||
      target.closest('[role="button"]')
    ) {
      return;
    }

    if (isSelectionMode && onSelectionChange) {
      onSelectionChange(order.id);
    }
  }, [isSelectionMode, onSelectionChange]);

  // ✅ PERFORMANCE: Memoized view detail handler
  const handleViewDetail = useCallback((order: Order) => {
    if (onViewDetail) {
      onViewDetail(order);
    } else {
      const nomor = (order as any).nomor_pesanan || (order as any).order_number || (order as any)['nomorPesanan'];
      alert(`Detail pesanan #${nomor}`);
    }
  }, [onViewDetail]);

  // ✅ PERFORMANCE: Memoized follow up handler with template processing
  const handleFollowUp = useCallback((order: Order) => {
    const nomor = (order as any).nomor_pesanan || (order as any).order_number || (order as any)['nomorPesanan'];
    logger.info('Follow up clicked for order:', nomor);
    
    if (onFollowUp) {
      onFollowUp(order);
      return;
    }
    
    const phone = (order as any).telepon_pelanggan || (order as any).customer_phone || (order as any)['customerPhone'];
    if (!phone) {
      toast.error('Tidak ada nomor WhatsApp untuk follow up');
      return;
    }

    try {
      // ✅ SAFE: Hooks sudah dipanggil di top level
      const template = getTemplate(order.status);
      
      if (!template) {
        toast.error('Template untuk status ini belum tersedia');
        return;
      }

      // Process template dengan data order
      const processedMessage = processTemplate(template, order as any);
      
      // Format nomor telepon
      const cleanPhoneNumber = String(phone).replace(/\D/g, '');
      
      // Buat WhatsApp URL
      const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(processedMessage)}`;
      
      // Buka WhatsApp
      window.open(whatsappUrl, '_blank');
      const nama = (order as any).nama_pelanggan || (order as any)['namaPelanggan'] || (order as any).customer_name || (order as any)['customerName'];
      const nomor = (order as any).nomor_pesanan || (order as any)['nomorPesanan'] || (order as any).order_number || '';
      toast.success(`Follow up untuk ${nama} berhasil dibuka di WhatsApp`);
      
    } catch (error) {
      logger.error('Error processing follow up template:', error);
      toast.error('Gagal memproses template follow up');
      
      // Fallback ke pesan sederhana
      const nama = (order as any).nama_pelanggan || (order as any)['namaPelanggan'] || (order as any).customer_name || (order as any)['customerName'];
      const fallbackMessage = `Halo ${nama}, saya ingin menanyakan status pesanan #${nomor}`;
      const cleanPhoneNumber = String(phone).replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(fallbackMessage)}`;
      window.open(whatsappUrl, '_blank');
    }
  }, [onFollowUp, getTemplate, processTemplate]);

  if (loading) {
    const { LoadingStates } = require('@/components/ui/loading-spinner');
    return (
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden p-6">
        <LoadingStates.Table />
      </div>
    );
  }

  if (uiState.currentOrders.length === 0) {
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
    <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden max-w-full">
      <div className="block md:hidden">
        {uiState.currentOrders.map((order: Order) => (
          <MobileOrderRow
            key={order.id}
            order={order}
            isSelected={selectedIds.includes(order.id)}
            isSelectionMode={isSelectionMode}
            onSelectionChange={onSelectionChange}
            onEdit={() => onEditOrder(order)}
            onDelete={() => onDeleteOrder(order.id)}
            onFollowUp={() => handleFollowUp(order)}
            onViewDetail={() => handleViewDetail(order)}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block">
        {/* Table View - Responsive with horizontal scroll */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-w-full">
          <table 
            className="min-w-[1000px] w-full"
            role="table"
            aria-label="Orders table"
          >
          <thead className="bg-gray-50">
            <tr role="row">
              {isSelectionMode && (
                <th className="w-12 px-3 py-3 text-left" role="columnheader" scope="col">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={() => onSelectAll && onSelectAll()}
                    className="h-4 w-4"
                    aria-label="Select all orders"
                  />
                </th>
              )}
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]" role="columnheader" scope="col">
                No. Pesanan
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]" role="columnheader" scope="col">
                Nama Pelanggan
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]" role="columnheader" scope="col">
                Tanggal Order
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]" role="columnheader" scope="col">
                Tanggal Selesai
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]" role="columnheader" scope="col">
                Total
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]" role="columnheader" scope="col">
                Terakhir Diperbarui
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]" role="columnheader" scope="col">
                Status
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]" role="columnheader" scope="col">
                Aksi
              </th>
            </tr>
          </thead>

          {/* ✅ UPDATED: Table Body with Completion Date */}
          <tbody className="bg-white divide-y divide-gray-200" role="rowgroup">
            {uiState.currentOrders.map((order) => (
              <tr 
                key={order.id}
                className={`
                  hover:bg-gray-50 cursor-pointer transition-colors duration-150
                  ${selectedIds.includes(order.id) ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''}
                  ${isSelectionMode ? 'hover:bg-orange-50' : ''}
                `}
                onClick={(e) => handleRowClick(order, e)}
                role="row"
                aria-label={`Order ${(order as any).nomor_pesanan || (order as any).order_number || (order as any)['nomorPesanan']} for ${(order as any).nama_pelanggan || (order as any)['namaPelanggan'] || (order as any).customer_name || (order as any)['customerName']}`}
              >
                {/* Selection Checkbox */}
                {isSelectionMode && (
                  <td className="px-3 py-4 whitespace-nowrap" role="cell">
                    <Checkbox
                      checked={selectedIds.includes(order.id)}
                      onCheckedChange={() => onSelectionChange && onSelectionChange(order.id)}
                      className="h-4 w-4"
                      aria-label={`Select order ${(order as any).nomor_pesanan || (order as any).order_number || (order as any)['nomorPesanan']}`}
                    />
                  </td>
                )}

                {/* Order Number */}
                <td className="px-3 py-4 whitespace-nowrap min-w-[120px]" role="cell">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">#
                      {(order as any).nomor_pesanan || (order as any).order_number || (order as any)['nomorPesanan']}
                    </div>
                    <div className="text-xs text-gray-500">{order.id.slice(0, 8)}...</div>
                  </div>
                </td>

                {/* Customer Info */}
                <td className="px-3 py-4 whitespace-nowrap min-w-[180px]" role="cell">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">
                      {(order as any).nama_pelanggan || (order as any)['namaPelanggan'] || (order as any).customer_name || (order as any)['customerName']}
                    </div>
                    {((order as any).telepon_pelanggan || (order as any)['teleponPelanggan'] || (order as any).customer_phone || (order as any)['customerPhone']) && (
                      <div className="text-xs text-gray-500">
                        {(order as any).telepon_pelanggan || (order as any)['teleponPelanggan'] || (order as any).customer_phone || (order as any)['customerPhone']}
                      </div>
                    )}
                    {((order as any).email_pelanggan || (order as any)['emailPelanggan'] || (order as any).customer_email || (order as any)['customerEmail']) && (
                      <div className="text-xs text-gray-500">
                        {(order as any).email_pelanggan || (order as any)['emailPelanggan'] || (order as any).customer_email || (order as any)['customerEmail']}
                      </div>
                    )}
                  </div>
                </td>

                {/* Order Date */}
                <td className="px-3 py-4 whitespace-nowrap min-w-[120px]" role="cell">
                  <div className="flex flex-col">
                    <div className="text-sm text-gray-900">{formatDateForDisplay(order.tanggal)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date((order as any).created_at || (order as any)['createdAt']).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </td>

                {/* ✅ NEW: Completion Date using proper types/utils */}
                <td className="px-3 py-4 whitespace-nowrap min-w-[120px]" role="cell">
                  <CompletionDateCell order={order} />
                </td>

                {/* Total Amount */}
                <td className="px-3 py-4 whitespace-nowrap min-w-[100px]" role="cell">
                  <div className="flex flex-col">
                    <div className="text-sm font-semibold text-gray-900">{formatCurrency((order as any).total_pesanan || (order as any)['totalPesanan'])}</div>
                    {order.items.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </td>

                {/* Last Updated */}
                <td className="px-3 py-4 whitespace-nowrap min-w-[120px]" role="cell">
                  <div className="flex flex-col">
                    <div className="text-sm text-gray-900">{formatDateForDisplay((order as any).updated_at || (order as any)['updatedAt'])}</div>
                    <div className="text-xs text-gray-500">
                      {new Date((order as any).updated_at || (order as any)['updatedAt']).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-3 py-4 whitespace-nowrap min-w-[100px]" role="cell">
                  <StatusBadge
                    status={order.status}
                    onChange={(newStatus) => onStatusChange(order.id, newStatus)}
                    disabled={order.status === 'completed' || order.status === 'cancelled'}
                  />
                </td>

                {/* Actions */}
                <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium min-w-[80px]" role="cell">
                  <OrderRowActions
                    order={order}
                    onEdit={() => onEditOrder(order)}
                    onDelete={() => onDeleteOrder(order.id)}
                    onFollowUp={() => handleFollowUp(order)}
                    onViewDetail={() => handleViewDetail(order)}
                    disabled={uiState.isSelectionMode}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
      
    {/* ✅ RESPONSIVE PAGINATION CONTROLS */}
    {uiState.totalPages > 1 && (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 py-3 border-t">
        <div className="text-sm text-gray-700 text-center sm:text-left">
          <span className="sm:hidden">
            {((uiState.currentPage - 1) * uiState.itemsPerPage) + 1}-{Math.min(uiState.currentPage * uiState.itemsPerPage, uiState.totalItems)} / {uiState.totalItems}
          </span>
          <span className="hidden sm:inline">
            Menampilkan {((uiState.currentPage - 1) * uiState.itemsPerPage) + 1} - {Math.min(uiState.currentPage * uiState.itemsPerPage, uiState.totalItems)} dari {uiState.totalItems} pesanan
          </span>
        </div>
        
        <div className="flex items-center justify-center gap-2">
          <button
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => uiState.setCurrentPage(Math.max(1, uiState.currentPage - 1))}
            disabled={uiState.currentPage === 1}
          >
            Sebelumnya
          </button>
          
          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm font-medium">
            {uiState.currentPage}
          </span>
          
          <button
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => uiState.setCurrentPage(Math.min(uiState.totalPages, uiState.currentPage + 1))}
            disabled={uiState.currentPage === uiState.totalPages}
          >
            Selanjutnya
          </button>
        </div>
      </div>
    )}
  </div>
  );
});

OrderTable.displayName = 'OrderTable';

export default OrderTable;
