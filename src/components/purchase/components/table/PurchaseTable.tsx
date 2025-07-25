import React, { Suspense } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { usePurchaseTable } from '../../context/PurchaseTableContext';
import { usePurchaseOperations } from '../../hooks/usePurchaseOperations';
import { useSupplier } from '@/contexts/SupplierContext';
import PurchaseTableControls from './PurchaseTableControls';
import PurchaseTableRow from './PurchaseTableRow';
import EmptyPurchaseState from '../states/EmptyPurchaseState';
import LoadingPurchaseState from '../states/LoadingPurchaseState';

// Lazy load pagination component
const PaginationFooter = React.lazy(() => import('./PaginationFooter'));

interface PurchaseTableProps {
  onEdit: (purchase: any) => void;
  onView?: (purchase: any) => void;
  className?: string;
}

const PurchaseTable: React.FC<PurchaseTableProps> = ({
  onEdit,
  onView,
  className = '',
}) => {
  const { suppliers } = useSupplier();
  const {
    filteredPurchases,
    currentItems,
    isSelectionMode,
    selectedPurchaseIds,
    setSelectedPurchaseIds,
    allCurrentSelected,
    someCurrentSelected,
    toggleSelectAllCurrent,
    searchTerm,
  } = usePurchaseTable();

  const { updatePurchase, deletePurchase, isLoading } = usePurchaseOperations({
    suppliers,
  });

  // Handlers
  const handleSelectItem = (id: string, selected: boolean) => {
    setSelectedPurchaseIds(prev => 
      selected ? [...prev, id] : prev.filter(itemId => itemId !== id)
    );
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const purchase = filteredPurchases.find(p => p.id === id);
    if (purchase) {
      await updatePurchase(id, { status: newStatus }, purchase);
    }
  };

  const handleDelete = async (id: string) => {
    const purchase = filteredPurchases.find(p => p.id === id);
    if (purchase) {
      await deletePurchase(id, purchase);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden ${className}`}>
      {/* Table Controls */}
      <PurchaseTableControls />

      {/* Table Content */}
      <div className="overflow-x-auto">
        <Table className="min-w-full text-sm text-left text-gray-700">
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-200">
              <TableHead className="w-12 p-4">
                {isSelectionMode && currentItems.length > 0 && (
                  <Checkbox
                    checked={allCurrentSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someCurrentSelected;
                    }}
                    onCheckedChange={toggleSelectAllCurrent}
                    className="border-gray-400"
                    aria-label="Select all visible items"
                  />
                )}
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Tanggal
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Supplier
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">
                Total Nilai
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Status
              </TableHead>
              <TableHead className="text-center font-semibold text-gray-700 w-20">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <LoadingPurchaseState compact />
                </TableCell>
              </TableRow>
            ) : filteredPurchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <EmptyPurchaseState
                    searchTerm={searchTerm}
                    onAddPurchase={() => {/* Will be handled by parent */}}
                    compact
                  />
                </TableCell>
              </TableRow>
            ) : currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-lg font-medium text-gray-600">
                      Tidak ada hasil di halaman ini
                    </div>
                    <p className="text-gray-500 text-sm">
                      Coba ubah halaman atau filter pencarian
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((purchase, index) => (
                <PurchaseTableRow
                  key={purchase.id}
                  purchase={purchase}
                  suppliers={suppliers}
                  index={index}
                  isSelected={selectedPurchaseIds.includes(purchase.id)}
                  isSelectionMode={isSelectionMode}
                  onSelect={handleSelectItem}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onView={onView}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {filteredPurchases.length > 0 && (
        <Suspense fallback={
          <div className="h-16 border-t border-gray-200 bg-gray-50/50 animate-pulse" />
        }>
          <PaginationFooter />
        </Suspense>
      )}
    </div>
  );
};

export default PurchaseTable;