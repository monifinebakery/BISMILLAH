import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
            </Button>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          <CostForm
            initialData={cost || undefined}
            onSubmit={handleSave}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CostDialog;