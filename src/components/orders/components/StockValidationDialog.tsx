// src/components/orders/components/StockValidationDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Package,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { orderApi } from '../api/orderApi';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import type { Order } from '../types';

interface StockValidationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

interface StockValidationResult {
  canComplete: boolean;
  totalIngredients: number;
  availableIngredients: number;
  insufficientStock: {
    item: string;
    required: number;
    available: number;
    unit: string;
    shortage: number;
  }[];
}

const StockValidationDialog: React.FC<StockValidationDialogProps> = ({
  isOpen,
  onOpenChange,
  order,
  onConfirm,
  onCancel,
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [validationResult, setValidationResult] = useState<StockValidationResult | null>(null);
  const [hasValidated, setHasValidated] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen && order) {
      setValidationResult(null);
      setHasValidated(false);
      validateStock();
    }
  }, [isOpen, order]);

  const validateStock = async () => {
    if (!order) return;

    setIsValidating(true);
    try {
      logger.debug('StockValidation: Validating stock for order:', order.id);
      
      const result = await orderApi.canCompleteOrder(order.id);
      
      // Parse insufficient stock if it's string array
      const insufficientStock = result.insufficientStock.map(item => {
        if (typeof item === 'string') {
          try {
            return JSON.parse(item);
          } catch {
            return null;
          }
        }
        return item;
      }).filter(Boolean);

      setValidationResult({
        canComplete: result.canComplete,
        totalIngredients: result.totalIngredients,
        availableIngredients: result.availableIngredients,
        insufficientStock,
      });
      
      setHasValidated(true);
      
      logger.debug('StockValidation: Validation result:', result);
    } catch (error) {
      logger.error('StockValidation: Validation failed:', error);
      toast.error('Gagal memvalidasi stok. Silakan coba lagi.');
      onCancel();
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirm = async () => {
    if (!validationResult?.canComplete) {
      toast.error('Tidak dapat menyelesaikan pesanan karena stok tidak mencukupi');
      return;
    }

    setIsCompleting(true);
    try {
      await onConfirm();
      // onConfirm should handle closing the dialog
    } catch (error) {
      logger.error('StockValidation: Order completion failed:', error);
      toast.error('Gagal menyelesaikan pesanan');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleClose = () => {
    if (isValidating || isCompleting) return;
    onCancel();
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
    }
    
    if (!hasValidated) {
      return <Package className="h-6 w-6 text-gray-400" />;
    }
    
    if (validationResult?.canComplete) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    }
    
    return <XCircle className="h-6 w-6 text-red-500" />;
  };

  const getValidationMessage = () => {
    if (isValidating) {
      return 'Memvalidasi ketersediaan stok...';
    }
    
    if (!hasValidated) {
      return 'Memuat validasi stok...';
    }
    
    if (validationResult?.canComplete) {
      return `Stok mencukupi untuk ${validationResult.totalIngredients} bahan baku`;
    }
    
    const shortage = validationResult?.insufficientStock.length || 0;
    return `${shortage} bahan baku tidak mencukupi`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-overlay-center">
        <div className="dialog-panel w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="dialog-header-pad">
            <DialogTitle className="flex items-center gap-2">
              {getValidationIcon()}
              Validasi Stok Pesanan
            </DialogTitle>
            <DialogDescription>
              Pesanan #{order?.nomorPesanan} - {order?.namaPelanggan}
            </DialogDescription>
          </DialogHeader>

          <div className="dialog-body overflow-y-auto">
            <div className="space-y-4">
          {/* Validation Status */}
          <Alert className={
            isValidating ? 'border-blue-200 bg-blue-50' :
            !hasValidated ? 'border-gray-200 bg-gray-50' :
            validationResult?.canComplete ? 'border-green-200 bg-green-50' :
            'border-red-200 bg-red-50'
          }>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>{getValidationMessage()}</span>
                {hasValidated && validationResult && (
                  <Badge variant="outline" className="ml-2">
                    {validationResult.availableIngredients}/{validationResult.totalIngredients} tersedia
                  </Badge>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Order Summary */}
          {order && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Ringkasan Pesanan</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Item:</span>
                  <span className="font-medium">{order.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Nilai:</span>
                  <span className="font-medium">Rp {order.totalPesanan.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Item Resep:</span>
                  <span className="font-medium">{order.items.filter(item => item.isFromRecipe).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="outline">{order.status}</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Insufficient Stock Details */}
          {hasValidated && validationResult && validationResult.insufficientStock.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-red-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Stok Tidak Mencukupi
              </h4>
              
              <div className="space-y-2">
                {validationResult.insufficientStock.map((item, index) => (
                  <div
                    key={index}
                    className="bg-red-50 border border-red-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-red-900">{item.item}</span>
                      <Badge variant="destructive" className="text-xs">
                        Kurang {item.shortage} {item.unit}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-red-800">
                      <div className="flex justify-between">
                        <span>Dibutuhkan:</span>
                        <span className="font-medium">{item.required} {item.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tersedia:</span>
                        <span className="font-medium">{item.available} {item.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-orange-800">
                  <strong>Saran:</strong> Lakukan pembelian bahan baku yang kurang atau ubah jumlah pesanan sebelum menyelesaikan pesanan ini.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Success Message */}
          {hasValidated && validationResult?.canComplete && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                <strong>Siap untuk diselesaikan!</strong> Semua bahan baku tersedia untuk pesanan ini.
              </AlertDescription>
            </Alert>
          )}
            </div>
          </div>

          <DialogFooter className="dialog-footer-pad flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isValidating || isCompleting}
          >
            Batal
          </Button>
          
          {hasValidated && !validationResult?.canComplete && (
            <Button
              variant="outline"
              onClick={validateStock}
              disabled={isValidating}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validasi Ulang...
                </>
              ) : (
                'Validasi Ulang'
              )}
            </Button>
          )}
          
          <Button
            onClick={handleConfirm}
            disabled={!hasValidated || !validationResult?.canComplete || isValidating || isCompleting}
            className={
              hasValidated && validationResult?.canComplete
                ? 'bg-green-600 hover:bg-green-700'
                : ''
            }
          >
            {isCompleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyelesaikan...
              </>
            ) : (
              'Selesaikan Pesanan'
            )}
          </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockValidationDialog;
