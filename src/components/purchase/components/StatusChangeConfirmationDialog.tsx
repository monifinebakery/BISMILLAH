// src/components/purchase/components/StatusChangeConfirmationDialog.tsx

import React from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Package, 
  TrendingUp,
  Info
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
        description: 'Stok bahan baku akan otomatis ditambahkan ke warehouse',
        type: 'success' as const
      };
    }
    
    if (purchase.status === 'completed' && newStatus !== 'completed') {
      return {
        icon: <TrendingUp className="h-4 w-4" />,
        title: 'Dampak Pembatalan Penyelesaian',
        description: 'Stok bahan baku akan dikurangi dari warehouse',
        type: 'warning' as const
      };
    }

    return null;
  };

  const impact = getStatusChangeImpact();

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasErrors ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : hasWarnings ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            Konfirmasi Perubahan Status
          </DialogTitle>
          <DialogDescription>
            Pastikan perubahan status ini sudah sesuai dengan kondisi purchase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Change Summary */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <span className="text-gray-600">Status akan berubah dari:</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={getStatusColor(purchase.status)}>
                  {oldStatusText}
                </Badge>
                <span className="text-gray-400">→</span>
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
                {impact.icon}
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
            <p><span className="font-medium">Total Nilai:</span> Rp {purchase.totalNilai.toLocaleString('id-ID')}</p>
          </div>

          {/* Errors */}
          {hasErrors && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
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
            <Alert className="border-yellow-200 bg-yellow-50">
              <Info className="h-4 w-4 text-yellow-600" />
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
                <Package className="h-4 w-4" />
                Item yang akan ditambahkan ke warehouse:
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {purchase.items.map((item: any, index: number) => (
                  <div key={index} className="text-xs text-gray-600 flex justify-between">
                    <span>{item.nama}</span>
                    <span>{item.kuantitas} {item.satuan}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isUpdating}
          >
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            disabled={hasErrors || isUpdating}
            className={newStatus === 'completed' ? 'bg-green-600 hover:bg-green-700' : undefined}
          >
            {isUpdating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Memproses...
              </div>
            ) : (
              `Ubah ke "${newStatusText}"`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatusChangeConfirmationDialog;