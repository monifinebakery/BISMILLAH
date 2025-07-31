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
  onSuccess?: () => void;
}

const SupplierDialog: React.FC<SupplierDialogProps> = ({
  open,
  onOpenChange,
  supplier,
  onSuccess
}) => {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            {supplier ? 'Edit Supplier' : 'Tambah Supplier'}
          </DialogTitle>
        </DialogHeader>
        
        <SupplierForm
          supplier={supplier}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default SupplierDialog;