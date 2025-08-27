// src/components/operational-costs/dialogs/CostDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OperationalCost, CostFormData } from '../types';
import CostForm from '../components/CostForm';

interface CostDialogProps {
  cost?: OperationalCost | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CostFormData) => Promise<boolean>;
}

const CostDialog: React.FC<CostDialogProps> = ({
  cost,
  isOpen,
  onClose,
  onSave,
}) => {
  const isEditing = !!cost;
  const title = isEditing ? 'Edit Biaya Operasional' : 'Tambah Biaya Operasional';

  const handleSave = async (data: CostFormData): Promise<boolean> => {
    const success = await onSave(data);
    return success;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent centerMode="overlay" size="lg">
        <div className="dialog-panel">
          <DialogHeader className="dialog-header">
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          
          <div className="dialog-body">
            <CostForm
              initialData={cost || undefined}
              onSubmit={handleSave}
              onCancel={onClose}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CostDialog;