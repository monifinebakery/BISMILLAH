import { useState } from 'react';
import type { PurchaseStatus, Purchase } from '../types/purchase.types';

interface StatusValidation {
  canChange: boolean;
  warnings: string[];
  errors: string[];
}

interface DialogState {
  statusConfirmation: {
    isOpen: boolean;
    purchase: Purchase | null;
    newStatus: PurchaseStatus | null;
    validation: StatusValidation | null;
  };
  deleteConfirmation: {
    isOpen: boolean;
    purchase: Purchase | null;
    isDeleting: boolean;
  };
  bulkDeleteConfirmation: {
    isOpen: boolean;
    selectedCount: number;
    isDeleting: boolean;
  };
}

const initialDialogState: DialogState = {
  statusConfirmation: {
    isOpen: false,
    purchase: null,
    newStatus: null,
    validation: null,
  },
  deleteConfirmation: {
    isOpen: false,
    purchase: null,
    isDeleting: false,
  },
  bulkDeleteConfirmation: {
    isOpen: false,
    selectedCount: 0,
    isDeleting: false,
  },
};

export const usePurchaseTableDialogs = () => {
  const [dialogState, setDialogState] = useState<DialogState>(initialDialogState);

  const openDelete = (purchase: Purchase) =>
    setDialogState((prev) => ({
      ...prev,
      deleteConfirmation: { isOpen: true, purchase, isDeleting: false },
    }));

  const setDeleteLoading = (isDeleting: boolean) =>
    setDialogState((prev) => ({
      ...prev,
      deleteConfirmation: { ...prev.deleteConfirmation, isDeleting },
    }));

  const resetDelete = () =>
    setDialogState((prev) => ({
      ...prev,
      deleteConfirmation: initialDialogState.deleteConfirmation,
    }));

  const openBulkDelete = (selectedCount: number) =>
    setDialogState((prev) => ({
      ...prev,
      bulkDeleteConfirmation: {
        isOpen: true,
        selectedCount,
        isDeleting: false,
      },
    }));

  const setBulkDeleteLoading = (isDeleting: boolean) =>
    setDialogState((prev) => ({
      ...prev,
      bulkDeleteConfirmation: { ...prev.bulkDeleteConfirmation, isDeleting },
    }));

  const resetBulkDelete = () =>
    setDialogState((prev) => ({
      ...prev,
      bulkDeleteConfirmation: initialDialogState.bulkDeleteConfirmation,
    }));

  const openStatus = (purchase: Purchase, newStatus: PurchaseStatus, validation: StatusValidation) =>
    setDialogState((prev) => ({
      ...prev,
      statusConfirmation: {
        isOpen: true,
        purchase,
        newStatus,
        validation,
      },
    }));

  const resetStatus = () =>
    setDialogState((prev) => ({
      ...prev,
      statusConfirmation: initialDialogState.statusConfirmation,
    }));

  return {
    dialogState,
    openDelete,
    setDeleteLoading,
    resetDelete,
    openBulkDelete,
    setBulkDeleteLoading,
    resetBulkDelete,
    openStatus,
    resetStatus,
  };
};

export type { DialogState };
export { initialDialogState };

