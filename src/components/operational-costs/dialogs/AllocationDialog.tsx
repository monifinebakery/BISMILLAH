// src/components/operational-costs/dialogs/AllocationDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AllocationSettings, AllocationFormData, CostSummary } from '../types';
import AllocationSettingsComponent from '../components/AllocationSettings';

interface AllocationDialogProps {
  isOpen: boolean;
  settings: AllocationSettings | null;
  costSummary: CostSummary;
  onClose: () => void;
  onSave: (data: AllocationFormData) => Promise<boolean>;
}

const AllocationDialog: React.FC<AllocationDialogProps> = ({
  isOpen,
  settings,
  costSummary,
  onClose,
  onSave,
}) => {
  const handleSave = async (data: AllocationFormData): Promise<boolean> => {
    const success = await onSave(data);
    return success;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent centerMode="overlay" size="md+">
        <div className="dialog-panel">
          <DialogHeader className="dialog-header-pad">
            <DialogTitle>Pengaturan Alokasi Biaya</DialogTitle>
          </DialogHeader>

          <div className="dialog-body overflow-y-auto">
            <div className="mt-4">
              <AllocationSettingsComponent
                settings={settings}
                costSummary={costSummary}
                onSave={handleSave}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AllocationDialog;