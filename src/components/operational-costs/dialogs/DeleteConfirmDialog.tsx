// src/components/operational-costs/dialogs/DeleteConfirmDialog.tsx

import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { OperationalCost } from '../types';
import { formatCurrency } from '../utils/costHelpers';

interface DeleteConfirmDialogProps {
  cost: OperationalCost;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  cost,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const success = await onConfirm();
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error deleting cost:', error);
    } finally {
      setLoading(false);
    }
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
                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>

                {/* Title */}
                <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Hapus Biaya Operasional
                </Dialog.Title>

                {/* Content */}
                <div className="text-center mb-6">
                  <p className="text-gray-500 mb-4">
                    Apakah Anda yakin ingin menghapus biaya operasional berikut?
                  </p>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {cost.nama_biaya}
                    </div>
                    <div className="text-lg font-semibold text-red-600 mb-1">
                      {formatCurrency(cost.jumlah_per_bulan)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {cost.jenis === 'tetap' ? 'Biaya Tetap' : 'Biaya Variabel'} • {' '}
                      {cost.status === 'aktif' ? 'Aktif' : 'Non Aktif'}
                    </div>
                  </div>

                  <p className="text-sm text-red-600 mt-4">
                    <strong>Perhatian:</strong> Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi perhitungan total biaya operasional.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-center space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    Ya, Hapus
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DeleteConfirmDialog;