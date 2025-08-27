// src/components/order/OrderControls.tsx - Mobile Responsive Version

import React from 'react';
import { 
  CheckSquare, 
  Square, 
  X, 
  Edit, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import type { UseOrderUIReturn } from '../types';
import { TABLE_PAGE_SIZES } from '../constants';

interface OrderControlsProps {
  uiState: UseOrderUIReturn;
  loading: boolean;
  onBulkEditStatus?: () => void;
  onBulkDelete?: () => void;
}

// Selection Toolbar Component - Mobile Responsive
const SelectionToolbar: React.FC<{
  uiState: UseOrderUIReturn;
  loading: boolean;
  onBulkEditStatus?: () => void;
  onBulkDelete?: () => void;
}> = ({ uiState, loading, onBulkEditStatus, onBulkDelete }) => {
  if (!uiState.isSelectionMode && uiState.selectedOrderIds.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-500 p-3 sm:p-4 mb-4 sm:mb-6">
      {!uiState.isSelectionMode ? (
        // Show selection toggle button - Desktop
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Button
            variant="outline"
            onClick={uiState.toggleSelectionMode}
            disabled={loading || uiState.totalItems === 0}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Square className="h-4 w-4" />
            Pilih Item
          </Button>
          
          <span className="text-sm text-gray-600 text-center sm:text-left">
            {uiState.totalItems} pesanan tersedia
          </span>
        </div>
      ) : (
        // Show selection info and actions - Mobile Responsive
        <div className="space-y-3 sm:space-y-0">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={uiState.toggleSelectionMode}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Batal</span>
              </Button>
              
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                <span className="text-sm font-medium">
                  <span className="sm:hidden">{uiState.selectedOrderIds.length}/{uiState.totalItems}</span>
                  <span className="hidden sm:inline">
                    {uiState.selectedOrderIds.length} dari {uiState.totalItems} dipilih
                  </span>
                </span>
              </div>
              
              {uiState.selectedOrderIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={uiState.clearSelection}
                  disabled={loading}
                  className="text-gray-500 hover:text-gray-700 hidden sm:flex"
                >
                  Bersihkan
                </Button>
              )}
            </div>

            {/* Mobile: Clear Selection Button */}
            {uiState.selectedOrderIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={uiState.clearSelection}
                disabled={loading}
                className="text-gray-500 hover:text-gray-700 sm:hidden w-full"
              >
                Bersihkan Pilihan
              </Button>
            )}
          </div>

          {/* Action Buttons Row */}
          {uiState.selectedOrderIds.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Desktop: Show all buttons */}
              <div className="hidden sm:flex sm:items-center sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={onBulkEditStatus}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Status
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={onBulkDelete}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus Terpilih
                </Button>
              </div>

              {/* Mobile: Dropdown for actions */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      Aksi Bulk
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    <DropdownMenuItem onClick={onBulkEditStatus} disabled={loading}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Status
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={onBulkDelete} 
                      disabled={loading}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus Terpilih
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Table Controls Component - Mobile Responsive
const TableControls: React.FC<{
  uiState: UseOrderUIReturn;
  loading: boolean;
}> = ({ uiState, loading }) => {
  return (
    <div className="bg-white border-b border-gray-500 px-3 sm:px-6 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Left Side Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* Items per page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 whitespace-nowrap">Tampilkan</span>
            <Select
              value={uiState.itemsPerPage.toString()}
              onValueChange={(value) => uiState.setItemsPerPage(parseInt(value))}
              disabled={loading}
            >
              <SelectTrigger className="w-16 sm:w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TABLE_PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-700 hidden sm:inline">item per halaman</span>
          </div>
          
          {/* Selection Mode Toggle - Always Visible */}
          {!uiState.isSelectionMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={uiState.toggleSelectionMode}
              disabled={loading || uiState.totalItems === 0}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              <span className="hidden sm:inline">Mode Pilih</span>
              <span className="sm:hidden">Pilih</span>
            </Button>
          )}
        </div>

        {/* Right Side Info */}
        <div className="text-sm text-gray-700 text-center sm:text-right">
          {uiState.totalItems > 0 ? (
            <>
              <span className="sm:hidden">
                {((uiState.currentPage - 1) * uiState.itemsPerPage) + 1}-{Math.min(uiState.currentPage * uiState.itemsPerPage, uiState.totalItems)} / {uiState.totalItems}
              </span>
              <span className="hidden sm:inline">
                Menampilkan {((uiState.currentPage - 1) * uiState.itemsPerPage) + 1} - {Math.min(uiState.currentPage * uiState.itemsPerPage, uiState.totalItems)} dari {uiState.totalItems} pesanan
              </span>
            </>
          ) : (
            'Tidak ada pesanan'
          )}
        </div>
      </div>
    </div>
  );
};

// Pagination Controls Component - Mobile Responsive
const PaginationControls: React.FC<{
  uiState: UseOrderUIReturn;
  loading: boolean;
}> = ({ uiState, loading }) => {
  if (uiState.totalPages <= 1) {
    return null;
  }

  // Mobile: Show fewer pages
  const isMobile = window.innerWidth < 640;
  const maxVisiblePages = isMobile ? 3 : 5;
  const sidePages = Math.floor(maxVisiblePages / 2);
  
  const startPage = Math.max(1, uiState.currentPage - sidePages);
  const endPage = Math.min(uiState.totalPages, uiState.currentPage + sidePages);
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className="bg-white border-t border-gray-500 px-3 sm:px-6 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Page Info */}
        <div className="text-sm text-gray-700 text-center sm:text-left">
          <span className="sm:hidden">
            Hal {uiState.currentPage}/{uiState.totalPages}
          </span>
          <span className="hidden sm:inline">
            Halaman {uiState.currentPage} dari {uiState.totalPages}
          </span>
          {uiState.selectedOrderIds.length > 0 && (
            <span className="ml-2 sm:ml-4 text-orange-600">
              • {uiState.selectedOrderIds.length} dipilih
            </span>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-center gap-1">
          {/* First Page - Desktop Only */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => uiState.setCurrentPage(1)}
            disabled={loading || uiState.currentPage === 1}
            className="hidden sm:flex"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => uiState.setCurrentPage(uiState.currentPage - 1)}
            disabled={loading || uiState.currentPage === 1}
            className="px-2 sm:px-3"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Prev</span>
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {pages.map((page) => (
              <Button
                key={page}
                variant={page === uiState.currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => uiState.setCurrentPage(page)}
                disabled={loading}
                className="min-w-[32px] sm:min-w-[40px] px-2 sm:px-3"
              >
                {page}
              </Button>
            ))}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => uiState.setCurrentPage(uiState.currentPage + 1)}
            disabled={loading || uiState.currentPage === uiState.totalPages}
            className="px-2 sm:px-3"
          >
            <span className="hidden sm:inline mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page - Desktop Only */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => uiState.setCurrentPage(uiState.totalPages)}
            disabled={loading || uiState.currentPage === uiState.totalPages}
            className="hidden sm:flex"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main Controls Component
const OrderControls: React.FC<OrderControlsProps> = ({ 
  uiState, 
  loading, 
  onBulkEditStatus,
  onBulkDelete 
}) => {
  return (
    <>
      <SelectionToolbar 
        uiState={uiState} 
        loading={loading} 
        onBulkEditStatus={onBulkEditStatus}
        onBulkDelete={onBulkDelete}
      />
      <div className="bg-white rounded-xl border border-gray-500/80 overflow-hidden mb-4 sm:mb-6">
        <TableControls uiState={uiState} loading={loading} />
        {/* Table content will be rendered by OrderTable */}
        <PaginationControls uiState={uiState} loading={loading} />
      </div>
    </>
  );
};

export default OrderControls;