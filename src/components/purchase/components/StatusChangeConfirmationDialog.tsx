// Alternative solution - Create a wrapper that handles focus properly

import React, { useEffect, useRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Package, 
  TrendingUp,
  Info,
  X
} from 'lucide-react';

import { PurchaseStatus } from '../types/purchase.types';
import { getStatusDisplayText, getStatusColor } from '../utils/purchaseHelpers';

interface StatusChangeConfirmationDialogProps {
  isOpen: boolean;
  purchase: any | null;
  newStatus: PurchaseStatus;
  validation: {
    canChange: boolean;
    warnings: string[];
    errors: string[];
  } | null;
  isUpdating: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const StatusChangeConfirmationDialog: React.FC<StatusChangeConfirmationDialogProps> = ({
  isOpen,
  purchase,
  newStatus,
  validation,
  isUpdating,
  onConfirm,
  onCancel
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && !isUpdating) {
      // Focus the appropriate button when dialog opens
      setTimeout(() => {
        if (validation?.errors.length) {
          cancelButtonRef.current?.focus();
        } else {
          confirmButtonRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen, isUpdating, validation?.errors.length]);

  if (!purchase || !validation) return null;

  const oldStatusText = getStatusDisplayText(purchase.status);
  const newStatusText = getStatusDisplayText(newStatus);
  const hasWarnings = validation.warnings.length > 0;
  const hasErrors = validation.errors.length > 0;

  // Get status change impact description
  const getStatusChangeImpact = () => {
    if (newStatus === 'completed' && purchase.status !== 'completed') {
      return {
        icon: <Package className="h-4 w-4" />,
        title: 'Dampak Penyelesaian Purchase',
        description: 'Stok gudang otomatis bertambah dan harga rata-rata (WAC) dihitung oleh sistem.',
        type: 'success' as const
      };
    }
    
    if (purchase.status === 'completed' && newStatus !== 'completed') {
      return {
        icon: <TrendingUp className="h-4 w-4" />,
        title: 'Dampak Pembatalan Penyelesaian',
        description: 'Efek stok sebelumnya akan dikoreksi otomatis (dikurangi) oleh sistem.',
        type: 'warning' as const
      };
    }

    return null;
  };

  const impact = getStatusChangeImpact();

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onCancel}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          {/* Header */}
          <div className="flex flex-col space-y-1.5 text-center">
            <DialogPrimitive.Title 
              id="dialog-title"
              className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2"
            >
              {hasErrors ? (
                <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
              ) : hasWarnings ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" aria-hidden="true" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
              )}
              Konfirmasi Perubahan Status
            </DialogPrimitive.Title>
            
            <DialogPrimitive.Description 
              id="dialog-description"
              className="text-sm text-muted-foreground"
            >
              Pastikan perubahan status ini sudah sesuai dengan kondisi purchase
            </DialogPrimitive.Description>
          </div>

          {/* Close button */}
          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            disabled={isUpdating}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Content */}
          <div className="space-y-4">
            {/* Status Change Summary */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <span className="text-gray-600">Status akan berubah dari:</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={getStatusColor(purchase.status)}>
                    {oldStatusText}
                  </Badge>
                  <span className="text-gray-400" aria-hidden="true">→</span>
                  <Badge variant="outline" className={getStatusColor(newStatus)}>
                    {newStatusText}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Impact Description */}
            {impact && (
              <Alert className={impact.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}>
                <div className="flex items-start gap-2">
                  <div aria-hidden="true">{impact.icon}</div>
                  <div>
                    <h4 className="font-medium text-sm">{impact.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{impact.description}</p>
                  </div>
                </div>
              </Alert>
            )}

            {/* Purchase Details */}
            <div className="text-sm text-gray-600">
              <p><span className="font-medium">Supplier:</span> {purchase.supplier}</p>
              <p><span className="font-medium">Total Items:</span> {purchase.items.length} item</p>
              <p><span className="font-medium">Total Nilai:</span> Rp {(purchase.totalNilai ?? purchase.total_nilai ?? 0).toLocaleString('id-ID')}</p>
            </div>

            {/* Errors */}
            {hasErrors && (
              <Alert className="border-red-200 bg-red-50" role="alert">
                <AlertTriangle className="h-4 w-4 text-red-600" aria-hidden="true" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium text-red-800">Tidak dapat mengubah status:</p>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {validation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {hasWarnings && (
              <Alert className="border-yellow-200 bg-yellow-50" role="alert">
                <Info className="h-4 w-4 text-yellow-600" aria-hidden="true" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium text-yellow-800">Perhatian:</p>
                    <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                      {validation.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Item List for Completed Status */}
            {newStatus === 'completed' && purchase.items.length > 0 && (
              <div className="border rounded-lg p-3 bg-gray-50">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" aria-hidden="true" />
                  Item yang akan ditambahkan ke warehouse:
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {purchase.items.map((item: any, index: number) => (
                    <div key={index} className="text-xs text-gray-600 flex justify-between">
                      <span>{item.nama}</span>
                      <span>{item.quantity} {item.satuan}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              ref={cancelButtonRef}
              variant="outline"
              onClick={onCancel}
              disabled={isUpdating}
            >
              Batal
            </Button>
            <Button
              ref={confirmButtonRef}
              onClick={onConfirm}
              disabled={hasErrors || isUpdating}
              className={newStatus === 'completed' ? 'bg-green-600 hover:bg-green-700' : undefined}
            >
              {isUpdating ? (
                <div className="flex items-center gap-2">
                  <div 
                    className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                    aria-hidden="true"
                  />
                  <span>Memproses...</span>
                </div>
              ) : (
                `Ubah ke "${newStatusText}"`
              )}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default StatusChangeConfirmationDialog;
