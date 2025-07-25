// src/components/orders/components/OrderTable.tsx
import React from 'react';
import { Edit, MessageSquare, Eye, Trash2, MoreHorizontal } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Order } from '../types/order';
import { formatCurrency } from '@/utils/formatUtils';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils'; 
import OrderStatusCell from './OrderStatusCell';
import { TableLoading } from './LoadingStates';
import EmptyState from './EmptyState';

interface OrderTableProps {
  orders: Order[];
  isLoading: boolean;
  isSelectionMode: boolean;
  selectedOrderIds: string[];
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
  hasFilters: boolean;
  onToggleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleSelectOrder: (orderId: string, checked: boolean) => void;
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => void; // Updated to use OrderStatus type
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  onFollowUp?: (order: Order) => void;
  onViewDetail?: (order: Order) => void;
  onAddFirst?: () => void;
  onClearFilters?: () => void;
  className?: string;
}

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isLoading,
  isSelectionMode,
  selectedOrderIds,
  allCurrentSelected,
  someCurrentSelected,
  hasFilters,
  onToggleSelectAll,
  onToggleSelectOrder,
  onStatusChange,
  onEdit,
  onDelete,
  onFollowUp,
  onViewDetail,
  onAddFirst,
  onClearFilters,
  className = ""
}) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <Table className="min-w-full text-sm text-left text-gray-700">
        <TableHeader>
          <TableRow className="bg-gray-50 border-b border-gray-200">
            <TableHead className="w-12 p-4">
              {isSelectionMode && (
                <Checkbox
                  checked={allCurrentSelected}
                  ref={(el) => { 
                    if (el) el.indeterminate = someCurrentSelected; 
                  }}
                  onCheckedChange={onToggleSelectAll}
                  className="border-gray-400"
                  aria-label="Select all orders"
                />
              )}
            </TableHead>
            <TableHead className="font-semibold text-gray-700">
              Nomor Pesanan
            </TableHead>
            <TableHead className="font-semibold text-gray-700">
              Pelanggan
            </TableHead>
            <TableHead className="font-semibold text-gray-700">
              Tanggal
            </TableHead>
            <TableHead className="font-semibold text-gray-700 w-[180px]">
              Status
            </TableHead>
            <TableHead className="font-semibold text-gray-700">
              Total
            </TableHead>
            <TableHead className="text-center font-semibold text-gray-700 w-20">
              Aksi
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="p-0">
                <TableLoading />
              </TableCell>
            </TableRow>
          ) : orders.length > 0 ? (
            orders.map((order, index) => (
              <TableRow
                key={order.id}
                className={cn(
                  "hover:bg-orange-50/50 transition-colors border-b border-gray-100",
                  selectedOrderIds.includes(order.id) && "bg-blue-50 border-l-4 border-l-blue-500",
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                )}
              >
                <TableCell className="p-4">
                  {isSelectionMode && (
                    <Checkbox
                      checked={selectedOrderIds.includes(order.id)}
                      onCheckedChange={(checked) => 
                        onToggleSelectOrder(order.id, checked as boolean)
                      }
                      className="border-gray-400"
                      aria-label={`Select order ${order.nomorPesanan}`}
                    />
                  )}
                </TableCell>
                
                <TableCell className="font-medium text-gray-900 p-4">
                  <Badge 
                    variant="outline" 
                    className="bg-orange-50 text-orange-700 border-orange-200 font-medium"
                  >
                    {order.nomorPesanan || '-'}
                  </Badge>
                </TableCell>
                
                <TableCell className="p-4">
                  <div className="font-medium">{order.namaPelanggan || '-'}</div>
                  <div className="text-xs text-muted-foreground">
                    {order.teleponPelanggan || '-'}
                  </div>
                </TableCell>
                
                <TableCell className="p-4">
                  {formatDateForDisplay(order.tanggal)}
                </TableCell>
                
                <TableCell className="p-4">
                  <OrderStatusCell
                    order={order}
                    onStatusChange={onStatusChange}
                    onTemplateManagerOpen={onFollowUp} // Corrected to match OrderStatusCell prop
                    disabled={isSelectionMode}
                  />
                </TableCell>
                
                <TableCell className="text-right p-4">
                  <span className="font-semibold text-green-600 text-base">
                    {formatCurrency(order.totalPesanan || 0)}
                  </span>
                </TableCell>
                
                <TableCell className="text-center p-4">
                  {!isSelectionMode && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-gray-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {onEdit && (
                          <DropdownMenuItem 
                            onClick={() => onEdit(order)} 
                            className="cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        
                        {onFollowUp && (
                          <DropdownMenuItem 
                            onClick={() => onFollowUp(order)} 
                            className="cursor-pointer"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Follow Up WhatsApp
                          </DropdownMenuItem>
                        )}
                        
                        {onViewDetail && (
                          <DropdownMenuItem 
                            onClick={() => onViewDetail(order)} 
                            className="cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Detail
                          </DropdownMenuItem>
                        )}
                        
                        {onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(order.id)}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="p-0">
                <EmptyState
                  hasFilters={hasFilters}
                  onAddFirst={onAddFirst}
                  onClearFilters={onClearFilters}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrderTable;