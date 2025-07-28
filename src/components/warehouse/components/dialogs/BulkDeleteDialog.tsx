// src/components/warehouse/components/dialogs/BulkDeleteDialog.tsx
import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2,
  Loader2,
  AlertTriangle,
  Package,
  DollarSign,
  TrendingDown,
  Calendar,
  Users,
} from 'lucide-react';
import { BahanBaku } from '../../types/warehouse';
import { formatCurrency, formatDate, formatStock } from '../../utils/formatters';
import { cn } from '@/lib/utils';

interface BulkDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  selectedItems: string[];
  selectedItemsData: BahanBaku[];
  isBulkDeleting: boolean;
}

const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedItems,
  selectedItemsData,
  isBulkDeleting,
}) => {
  // Calculate statistics
  const statistics = useMemo(() => {
    const totalValue = selectedItemsData.reduce((sum, item) => sum + (item.stok * item.hargaSatuan), 0);
    const totalStock = selectedItemsData.reduce((sum, item) => sum + item.stok, 0);
    
    const categories = selectedItemsData.reduce((acc, item) => {
      acc[item.kategori] = (acc[item.kategori] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const suppliers = selectedItemsData.reduce((acc, item) => {
      if (item.supplier) {
        acc[item.supplier] = (acc[item.supplier] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const lowStockItems = selectedItemsData.filter(item => item.stok <= item.minimum);
    const expiringItems = selectedItemsData.filter(item => {
      if (!item.tanggalKadaluwarsa) return false;
      const today = new Date();
      const expiryDate = new Date(item.tanggalKadaluwarsa);
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    });

    return {
      totalValue,
      totalStock,
      categories: Object.entries(categories).sort(([,a], [,b]) => b - a),
      suppliers: Object.entries(suppliers).sort(([,a], [,b]) => b - a),
      lowStockCount: lowStockItems.length,
      expiringCount: expiringItems.length,
    };
  }, [selectedItemsData]);

  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      onClose();
    }
  };

  const getItemDisplayInfo = (item: BahanBaku) => {
    const isLowStock = item.stok <= item.minimum;
    const isExpiring = item.tanggalKadaluwarsa && (() => {
      const today = new Date();
      const expiryDate = new Date(item.tanggalKadaluwarsa);
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    })();

    return { isLowStock, isExpiring };
  };

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Hapus Bahan Baku
          </DialogTitle>
          <DialogDescription>
            Anda akan menghapus {selectedItems.length} item dari inventory. Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        {/* Warning Alert */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900 mb-1">Peringatan!</h4>
              <p className="text-sm text-red-800">
                Data yang dihapus tidak dapat dikembalikan. Pastikan Anda yakin sebelum melanjutkan.
              </p>
            </div>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Dampak Penghapusan
          </h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Item:</span>
                <span className="font-medium">{selectedItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Nilai:</span>
                <span className="font-medium text-red-600">{formatCurrency(statistics.totalValue)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Item Stok Rendah:</span>
                <span className={cn("font-medium", statistics.lowStockCount > 0 ? "text-orange-600" : "text-gray-900")}>
                  {statistics.lowStockCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Item Akan Expired:</span>
                <span className={cn("font-medium", statistics.expiringCount > 0 ? "text-red-600" : "text-gray-900")}>
                  {statistics.expiringCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {statistics.categories.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Kategori yang Terpengaruh
            </h4>
            <div className="flex flex-wrap gap-2">
              {statistics.categories.map(([category, count]) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Supplier Breakdown */}
        {statistics.suppliers.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Supplier yang Terpengaruh
            </h4>
            <div className="flex flex-wrap gap-2">
              {statistics.suppliers.slice(0, 5).map(([supplier, count]) => (
                <Badge key={supplier} variant="outline" className="text-xs">
                  {supplier}: {count}
                </Badge>
              ))}
              {statistics.suppliers.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{statistics.suppliers.length - 5} lainnya
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="border rounded-lg max-h-64 overflow-y-auto">
          <div className="p-3 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900 text-sm">
              Item yang Akan Dihapus ({selectedItems.length})
            </h4>
          </div>
          
          <div className="divide-y">
            {selectedItemsData.slice(0, 10).map((item) => {
              const { isLowStock, isExpiring } = getItemDisplayInfo(item);
              
              return (
                <div key={item.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-gray-900 truncate">
                          {item.nama}
                        </h5>
                        {isLowStock && (
                          <Badge variant="destructive" className="text-xs">
                            <TrendingDown className="h-2 w-2 mr-1" />
                            Rendah
                          </Badge>
                        )}
                        {isExpiring && (
                          <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                            <Calendar className="h-2 w-2 mr-1" />
                            Expired
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>{item.kategori}</span>
                        <span>{formatStock(item.stok, item.satuan)}</span>
                        <span>{formatCurrency(item.hargaSatuan)}/{item.satuan}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium text-sm">
                        {formatCurrency(item.stok * item.hargaSatuan)}
                      </div>
                      {item.tanggalKadaluwarsa && (
                        <div className="text-xs text-gray-500">
                          {formatDate(item.tanggalKadaluwarsa)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {selectedItemsData.length > 10 && (
              <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                dan {selectedItemsData.length - 10} item lainnya...
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isBulkDeleting}
          >
            Batal
          </Button>
          
          <Button
            onClick={handleConfirm}
            disabled={isBulkDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isBulkDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Ya, Hapus {selectedItems.length} Item
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkDeleteDialog;