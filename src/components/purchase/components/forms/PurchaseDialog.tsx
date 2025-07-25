import React, { Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Purchase } from '@/types/supplier';
import LoadingPurchaseState from '../states/LoadingPurchaseState';

// Lazy load the form component
const PurchaseForm = React.lazy(() => import('./PurchaseForm'));

interface PurchaseDialogProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  purchase?: Purchase | null;
  suppliers: any[];
  bahanBaku: any[];
  onClose: () => void;
  className?: string;
}

const PurchaseDialog: React.FC<PurchaseDialogProps> = ({
  isOpen,
  mode,
  purchase,
  suppliers,
  bahanBaku,
  onClose,
  className = '',
}) => {
  const title = mode === 'edit' ? 'Edit Pembelian' : 'Tambah Pembelian';

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <Suspense fallback={
          <div className="min-h-[400px] flex items-center justify-center">
            <LoadingPurchaseState compact />
          </div>
        }>
          <PurchaseForm
            mode={mode}
            initialData={purchase}
            suppliers={suppliers}
            bahanBaku={bahanBaku}
            onSubmit={async (data) => {
              // Form will handle submission
              return true;
            }}
            onCancel={onClose}
          />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;