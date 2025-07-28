// src/components/warehouse/dialogs/index.ts
/**
 * Warehouse Dialogs Barrel Export
 * All dialog components are lazy-loaded
 */

// Dynamic Dialog Imports
export const AddEditDialog = () => import('./AddEditDialog').then(m => ({ default: m.default }));
export const BulkOperationsDialog = () => import('./BulkOperationsDialog').then(m => ({ default: m.default }));
export const ImportExportDialog = () => import('./ImportExportDialog').then(m => ({ default: m.default }));

// Dialog preloader utility
export const preloadDialogs = {
  // Preload most common dialogs
  critical: async () => {
    const [addEdit] = await Promise.all([
      AddEditDialog(),
    ]);
    return { addEdit };
  },
  
  // Preload all dialogs
  all: async () => {
    const [addEdit, bulkOps, importExport] = await Promise.all([
      AddEditDialog(),
      BulkOperationsDialog(),
      ImportExportDialog(),
    ]);
    return { addEdit, bulkOps, importExport };
  },
  
  // Preload specific dialog
  dialog: (dialogName: 'addEdit' | 'bulkOps' | 'importExport') => {
    switch (dialogName) {
      case 'addEdit':
        return AddEditDialog();
      case 'bulkOps':
        return BulkOperationsDialog();
      case 'importExport':
        return ImportExportDialog();
      default:
        throw new Error(`Unknown dialog: ${dialogName}`);
    }
  }
};

// Type exports for dialogs
export type {
  AddEditDialogProps,
  BulkOperationsDialogProps,
  ImportExportDialogProps
} from '../types';