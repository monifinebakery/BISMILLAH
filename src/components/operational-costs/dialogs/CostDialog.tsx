// src/components/operational-costs/dialogs/CostDialog.tsx
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
              <X className="h-4 w-4" /> {/* ✅ Added missing X icon */}
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

// =====================================================================

// src/components/operational-costs/dialogs/AllocationDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Pengaturan Alokasi Biaya</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" /> {/* ✅ Added missing X icon */}
            </Button>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          <AllocationSettingsComponent
            settings={settings}
            costSummary={costSummary}
            onSave={handleSave}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AllocationDialog;