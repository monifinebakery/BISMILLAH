// src/components/operational-costs/dialogs/CostDialog.tsx

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    {title}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <CostForm
                  initialData={cost || undefined}
                  onSubmit={handleSave}
                  onCancel={onClose}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CostDialog;