// 🎯 120 lines - Selection + pagination controls
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
  ChevronsRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UseOrderUIReturn } from '../types';
import { TABLE_PAGE_SIZES } from '../constants';

interface OrderControlsProps {
  uiState: UseOrderUIReturn;
  loading: boolean;
}

// Selection Toolbar Component (consolidated)
const SelectionToolbar: React.FC<{
  uiState: UseOrderUIReturn;
  loading: boolean;
}> = ({ uiState, loading }) => {
  if (!uiState.isSelectionMode && uiState.selectedOrderIds.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between">
        {!uiState.isSelectionMode ? (
          // Show selection toggle button
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={uiState.toggleSelectionMode}
              disabled={loading || uiState.totalItems === 0}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Pilih Item
            </Button>
            
            <span className="text-sm text-gray-600">
              {uiState.totalItems} pesanan tersedia
            </span>
          </div>
        ) : (
          // Show selection info and actions
          <>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={uiState.toggleSelectionMode}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Batal
              </Button>
              
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium">
                  {uiState.selectedOrderIds.length} dari {uiState.totalItems} dipilih
                </span>
              </div>
              
              {uiState.selectedOrderIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={uiState.clearSelection}
                  disabled={loading}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Bersihkan Pilihan
                </Button>
              )}
            </div>

            {uiState.selectedOrderIds.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Status
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus Terpilih
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Table Controls Component (consolidated)
const TableControls: React.FC<{
  uiState: UseOrderUIReturn;
  loading: boolean;
}> = ({ uiState, loading }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Tampilkan</span>
            <Select
              value={uiState.itemsPerPage.toString()}
              onValueChange={(value) => uiState.setItemsPerPage(parseInt(value))}
              disabled={loading}
            >
              <SelectTrigger className="w-20">
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
            <span className="text-sm text-gray-700">item per halaman</span>
          </div>
          
          {!uiState.isSelectionMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={uiState.toggleSelectionMode}
              disabled={loading || uiState.totalItems === 0}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Mode Pilih
            </Button>
          )}
        </div>

        <div className="text-sm text-gray-700">
          {uiState.totalItems > 0 ? (
            <>
              Menampilkan {((uiState.currentPage - 1) * uiState.itemsPerPage) + 1} - {Math.min(uiState.currentPage * uiState.itemsPerPage, uiState.totalItems)} dari {uiState.totalItems} pesanan
            </>
          ) : (
            'Tidak ada pesanan'
          )}
        </div>
      </div>
    </div>
  );
};

// Pagination Controls Component (consolidated)
const PaginationControls: React.FC<{
  uiState: UseOrderUIReturn;
  loading: boolean;
}> = ({ uiState, loading }) => {
  if (uiState.totalPages <= 1) {
    return null;
  }

  const startPage = Math.max(1, uiState.currentPage - 2);
  const endPage = Math.min(uiState.totalPages, uiState.currentPage + 2);
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className="bg-white border-t border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Halaman {uiState.currentPage} dari {uiState.totalPages}
          {uiState.selectedOrderIds.length > 0 && (
            <span className="ml-4 text-orange-600">
              • {uiState.selectedOrderIds.length} dipilih
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* First Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => uiState.setCurrentPage(1)}
            disabled={loading || uiState.currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => uiState.setCurrentPage(uiState.currentPage - 1)}
            disabled={loading || uiState.currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page Numbers */}
          {pages.map((page) => (
            <Button
              key={page}
              variant={page === uiState.currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => uiState.setCurrentPage(page)}
              disabled={loading}
              className="min-w-[40px]"
            >
              {page}
            </Button>
          ))}

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => uiState.setCurrentPage(uiState.currentPage + 1)}
            disabled={loading || uiState.currentPage === uiState.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => uiState.setCurrentPage(uiState.totalPages)}
            disabled={loading || uiState.currentPage === uiState.totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main Controls Component
const OrderControls: React.FC<OrderControlsProps> = ({ uiState, loading }) => {
  return (
    <>
      <SelectionToolbar uiState={uiState} loading={loading} />
      <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden mb-6">
        <TableControls uiState={uiState} loading={loading} />
        {/* Table content will be rendered by OrderTable */}
        <PaginationControls uiState={uiState} loading={loading} />
      </div>
    </>
  );
};

export default OrderControls;