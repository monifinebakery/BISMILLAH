import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, X, Trash2, Download, RefreshCw } from 'lucide-react';
import { usePurchaseTable } from '../../context/PurchaseTableContext';
import { useBulkOperations } from '../../hooks/useBulkOperations';
import { useSupplier } from '@/contexts/SupplierContext';
import { formatCurrency } from '@/utils/formatUtils';

interface BulkActionsToolbarProps {
  className?: string;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({ className = '' }) => {
  const { suppliers } = useSupplier();
  const {
    isSelectionMode,
    selectedPurchaseIds,
    setSelectedPurchaseIds,
    setIsSelectionMode,
    filteredPurchases,
    setShowBulkDeleteDialog,
  } = usePurchaseTable();

  const { selectedSummary, bulkUpdateStatus, exportSelected, isLoading } = useBulkOperations({
    purchases: filteredPurchases,
    suppliers,
    selectedIds: selectedPurchaseIds,
    onSuccess: (action, count) => {
      console.log(`Bulk ${action} completed for ${count} items`);
      // Reset selection after successful operation
      setSelectedPurchaseIds([]);
      setIsSelectionMode(false);
    },
  });

  // Don't show toolbar if not in selection mode and no items selected
  if (!isSelectionMode && selectedPurchaseIds.length === 0) {
    return null;
  }

  const handleCancel = () => {
    setSelectedPurchaseIds([]);
    setIsSelectionMode(false);
  };

  const handleSelectAll = () => {
    const allIds = filteredPurchases.map(p => p.id);
    const areAllSelected = selectedPurchaseIds.length === allIds.length;
    
    if (areAllSelected) {
      setSelectedPurchaseIds([]);
    } else {
      setSelectedPurchaseIds(allIds);
    }
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteDialog(true);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    await bulkUpdateStatus(newStatus);
  };

  const handleExport = async () => {
    await exportSelected('csv');
  };

  const allSelected = selectedPurchaseIds.length === filteredPurchases.length;
  const hasSelection = selectedPurchaseIds.length > 0;

  return (
    <Card className={`mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg ${className}`}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left Section - Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-700">Mode Pilih Multiple</span>
            </div>
            
            {hasSelection && (
              <>
                <Badge 
                  variant="secondary" 
                  className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 font-semibold"
                >
                  {selectedPurchaseIds.length} item dipilih
                </Badge>
                
                <div className="hidden sm:flex items-center gap-2 text-sm text-blue-700">
                  <span>Total:</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedSummary.totalValue)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Cancel */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="border-gray-300 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Batalkan
            </Button>

            {/* Select All Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              {allSelected ? 'Batal Pilih Semua' : `Pilih Semua (${filteredPurchases.length})`}
            </Button>

            {/* Actions - only show if items are selected */}
            {hasSelection && (
              <>
                {/* Status Update */}
                <Select onValueChange={handleStatusUpdate} disabled={isLoading}>
                  <SelectTrigger className="w-40 border-green-300 text-green-600 hover:bg-green-50">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Ubah Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Set ke Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Set ke Selesai
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Set ke Dibatalkan
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Export */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={isLoading}
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export ({selectedPurchaseIds.length})
                </Button>

                {/* Delete */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus {selectedPurchaseIds.length} Item
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Summary */}
        {hasSelection && (
          <div className="sm:hidden mt-3 pt-3 border-t border-blue-200">
            <div className="flex justify-between items-center text-sm">
              <span className="text-blue-700">Total Nilai:</span>
              <span className="font-semibold text-blue-800">
                {formatCurrency(selectedSummary.totalValue)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-blue-700">Suppliers:</span>
              <span className="text-blue-800">
                {selectedSummary.suppliers.slice(0, 2).join(', ')}
                {selectedSummary.suppliers.length > 2 && 
                  ` +${selectedSummary.suppliers.length - 2} lainnya`
                }
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkActionsToolbar;