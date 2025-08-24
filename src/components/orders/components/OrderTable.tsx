// 🎯 OrderTable.tsx - Proper Implementation using Types & Utils (No Direct DB Calls)
import React, { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, MessageSquare, Eye, ShoppingCart, Search, Plus, ChevronDown } from 'lucide-react';
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
import { formatCurrency } from '@/utils/formatUtils';
import type { Order, UseOrderUIReturn } from '../types';
import { formatDateForDisplay } from '../utils';
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
  onStatusChange: (orderId: string, newStatus: string) => void;
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
  status: string;
  onChange?: (newStatus: string) => void;
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
    <Select value={status} onValueChange={onChange} open={isOpen} onOpenChange={setIsOpen}>
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
    if (window.confirm(`Apakah Anda yakin ingin menghapus pesanan #${order.nomorPesanan}?`)) {
      onDelete();
    }
  };

  const handleFollowUp = () => {
    setIsOpen(false);
    if (onFollowUp) {
      onFollowUp();
    } else {
      // Fallback behavior
      const message = `Halo ${order.namaPelanggan}, saya ingin menanyakan status pesanan #${order.nomorPesanan}`;
      if (order.teleponPelanggan) {
        const whatsappUrl = `https://wa.me/${order.teleponPelanggan.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      } else if (order.emailPelanggan) {
        const emailUrl = `mailto:${order.emailPelanggan}?subject=Follow Up Pesanan #${order.nomorPesanan}&body=${encodeURIComponent(message)}`;
        window.location.href = emailUrl;
      } else {
        alert('Tidak ada kontak yang tersedia untuk follow up');
      }
    }
  };

  const handleViewDetail = () => {
    setIsOpen(false);
    if (onViewDetail) {
      onViewDetail();
    } else {
      logger.info('View detail clicked for order:', order.nomorPesanan);
      alert(`Detail pesanan #${order.nomorPesanan} akan ditampilkan`);
    }
  };

  if (disabled) {
    return (
      <div className="text-gray-400">
        <MoreHorizontal className="h-5 w-5" />
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-8 w-8 p-0" 
          onClick={(e) => {
            e.stopPropagation();
            logger.info('Dropdown menu clicked for order:', order.nomorPesanan);
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">        
        <DropdownMenuItem 
          onClick={() => { setIsOpen(false); onEdit(); }}
          className="cursor-pointer"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Pesanan
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleFollowUp}
          className="cursor-pointer"
          disabled={!order.teleponPelanggan && !onFollowUp}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Follow Up WhatsApp
          {(!order.teleponPelanggan && !onFollowUp) && (
            <span className="text-xs text-gray-400 ml-2">(No WhatsApp)</span>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleDelete} 
          className="text-red-600 focus:text-red-600 cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
  if (order.tanggalSelesai) {
    // Has completion date - show it
    return (
      <div className="flex flex-col">
        <div className="text-sm text-green-700 font-medium">
          {formatDateForDisplay(order.tanggalSelesai)}
        </div>
        <div className="text-xs text-green-600">
          {order.tanggalSelesai.toLocaleTimeString('id-ID', {
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

// ✅ MAIN: Table Component with proper completion date handling
const OrderTable: React.FC<OrderTableProps> = ({
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

  // Handle row click logic (unchanged)
  const handleRowClick = (order: Order, e: React.MouseEvent) => {
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
  };



  // ✅ FIXED: View detail handler
  const handleViewDetail = (order: Order) => {
    if (onViewDetail) {
      onViewDetail(order);
    } else {
      alert(`Detail pesanan #${order.nomorPesanan}`);
    }
  };

  // ✅ FIXED: Follow Up handler dengan proper hooks usage
  const handleFollowUp = (order: Order) => {
    logger.info('Follow up clicked for order:', order.nomorPesanan);
    
    if (onFollowUp) {
      onFollowUp(order);
      return;
    }
    
    if (!order.teleponPelanggan) {
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
      const processedMessage = processTemplate(template, order);
      
      // Format nomor telepon
      const cleanPhoneNumber = order.teleponPelanggan.replace(/\D/g, '');
      
      // Buat WhatsApp URL
      const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(processedMessage)}`;
      
      // Buka WhatsApp
      window.open(whatsappUrl, '_blank');
      
      toast.success(`Follow up untuk ${order.namaPelanggan} berhasil dibuka di WhatsApp`);
      
    } catch (error) {
      logger.error('Error processing follow up template:', error);
      toast.error('Gagal memproses template follow up');
      
      // Fallback ke pesan sederhana
      const fallbackMessage = `Halo ${order.namaPelanggan}, saya ingin menanyakan status pesanan #${order.nomorPesanan}`;
      const cleanPhoneNumber = order.teleponPelanggan.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(fallbackMessage)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat pesanan...</p>
        </div>
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
    <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          {/* ✅ UPDATED: Table Header with Completion Date */}
          <thead className="bg-gray-50">
            <tr>
              {isSelectionMode && (
                <th className="w-12 px-6 py-3 text-left">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={() => onSelectAll && onSelectAll()}
                    className="h-4 w-4"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                No. Pesanan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pelanggan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal Selesai
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Terakhir Diperbarui
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>

          {/* ✅ UPDATED: Table Body with Completion Date */}
          <tbody className="bg-white divide-y divide-gray-200">
            {uiState.currentOrders.map((order) => (
              <tr 
                key={order.id}
                className={`
                  hover:bg-gray-50 cursor-pointer transition-colors duration-150
                  ${selectedIds.includes(order.id) ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''}
                  ${isSelectionMode ? 'hover:bg-orange-50' : ''}
                `}
                onClick={(e) => handleRowClick(order, e)}
              >
                {/* Selection Checkbox */}
                {isSelectionMode && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedIds.includes(order.id)}
                      onCheckedChange={() => onSelectionChange && onSelectionChange(order.id)}
                      className="h-4 w-4"
                    />
                  </td>
                )}

                {/* Order Number */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">#{order.nomorPesanan}</div>
                    <div className="text-xs text-gray-500">{order.id.slice(0, 8)}...</div>
                  </div>
                </td>

                {/* Customer Info */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">{order.namaPelanggan}</div>
                    {order.teleponPelanggan && (
                      <div className="text-xs text-gray-500">{order.teleponPelanggan}</div>
                    )}
                    {order.emailPelanggan && (
                      <div className="text-xs text-gray-500">{order.emailPelanggan}</div>
                    )}
                  </div>
                </td>

                {/* Order Date */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm text-gray-900">{formatDateForDisplay(order.tanggal)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </td>

                {/* ✅ NEW: Completion Date using proper types/utils */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <CompletionDateCell order={order} />
                </td>

                {/* Total Amount */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(order.totalPesanan)}</div>
                    {order.items.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </td>

                {/* Last Updated */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm text-gray-900">{formatDateForDisplay(order.updatedAt)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.updatedAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge
                    status={order.status}
                    onChange={(newStatus) => onStatusChange(order.id, newStatus)}
                    disabled={order.status === 'completed' || order.status === 'cancelled'}
                  />
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
  );
};

export default OrderTable;