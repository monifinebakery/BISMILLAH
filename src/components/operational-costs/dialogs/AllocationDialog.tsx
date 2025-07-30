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