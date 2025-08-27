// src/components/supplier/SupplierDialog.tsx
// Dialog wrapper for supplier form

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SupplierForm from './SupplierForm';
import type { Supplier } from '@/types/supplier';

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSuccess?: (supplier: Supplier) => void;
}

const SupplierDialog: React.FC<SupplierDialogProps> = ({
  open,
  onOpenChange,
  supplier,
  onSuccess
}) => {
  const handleSuccess = (createdSupplier: Supplier) => {
    onOpenChange(false);
    onSuccess?.(createdSupplier);

  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent centerMode="overlay" size="md">
        <div className="dialog-panel dialog-no-overflow">
          <DialogHeader className="dialog-header">
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-800 text-overflow-safe">
              {supplier ? 'Edit Supplier' : 'Tambah Supplier'}
            </DialogTitle>
          </DialogHeader>

          <div className="dialog-body">
            <SupplierForm
              supplier={supplier}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              className="dialog-no-overflow"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierDialog;