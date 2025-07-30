// src/components/operational-costs/dialogs/AllocationDialog.tsx

import React, { Fragment } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    Pengaturan Alokasi Biaya
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-0">
                  <AllocationSettingsComponent
                    settings={settings}
                    costSummary={costSummary}
                    onSave={handleSave}
                  />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AllocationDialog;