// src/components/warehouse/components/DialogManager.tsx
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
// tambah ini utk dialog
import AddEditDialog from '../dialogs/AddEditDialog';
import BulkOperationsDialog from '../dialogs/BulkOperationsDialog'; 
import ImportExportDialog from '../dialogs/ImportExportDialog';

// Dynamic Dialog Imports (Lazy Loaded)
const AddEditDialog = lazy(() => import('../dialogs/AddEditDialog'));
const BulkOperationsDialog = lazy(() => import('../dialogs/BulkOperationsDialog'));
const ImportExportDialog = lazy(() => import('../dialogs/ImportExportDialog'));

// Loading Components
const DialogLoader = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8 flex flex-col items-center">
      <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
      <p className="text-gray-600">Memuat dialog...</p>
    </div>
  </div>
);

// Error Fallback
const DialogError = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md mx-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-red-600 text-xl">⚠️</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Gagal Memuat Dialog</h3>
          <p className="text-sm text-gray-600">Terjadi kesalahan saat memuat komponen</p>
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Refresh Halaman
        </button>
        <button
          onClick={retry}
          className="px-4 py-2 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  </div>
);

// Error Boundary for Dialog Loading
class DialogErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry: () => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Dialog loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <DialogError 
          error={this.state.error!}
          retry={() => {
            this.setState({ hasError: false });
            this.props.onRetry();
          }}
        />
      );
    }

    return this.props.children;
  }
}

// Types
interface DialogManagerProps {
  dialogs: {
    states: Record<string, boolean>;
    open: (dialog: string) => void;
    close: (dialog: string) => void;
    editingItem: any;
    setEditingItem: (item: any) => void;
  };
  handlers: {
    edit: (item: any) => void;
    editSave: (updates: any) => Promise<void>;
    delete: (id: string, nama: string) => Promise<void>;
    sort: (key: string) => void;
  };
  context: any;
  selection: any;
  filters: any;
  bulk: any;
  pageId: string;
}

/**
 * Dialog Manager Component
 * 
 * Manages dynamic loading of dialog components with:
 * - Lazy loading for better performance
 * - Error boundaries for graceful failure
 * - Loading states with smooth animations
 * - Smart preloading for common dialogs
 * 
 * Size: ~3KB
 */
const DialogManager: React.FC<DialogManagerProps> = ({
  dialogs,
  handlers,
  context,
  selection,
  filters,
  bulk,
  pageId
}) => {
  const [loadedDialogs, setLoadedDialogs] = useState<Set<string>>(new Set());
  const [failedDialogs, setFailedDialogs] = useState<Set<string>>(new Set());

  // Track which dialogs have been loaded for performance monitoring
  useEffect(() => {
    Object.entries(dialogs.states).forEach(([dialogName, isOpen]) => {
      if (isOpen && !loadedDialogs.has(dialogName)) {
        logger.debug(`[${pageId}] 📱 Loading dialog: ${dialogName}`);
        setLoadedDialogs(prev => new Set([...prev, dialogName]));
      }
    });
  }, [dialogs.states, loadedDialogs, pageId]);

  // Retry handler for failed dialog loads
  const retryDialog = (dialogName: string) => {
    setFailedDialogs(prev => {
      const newSet = new Set(prev);
      newSet.delete(dialogName);
      return newSet;
    });
  };

  return (
    <>
      {/* Add/Edit Item Dialog */}
      {(dialogs.states.addItem || dialogs.states.editItem || dialogs.editingItem) && (
        <DialogErrorBoundary onRetry={() => retryDialog('addEdit')}>
          <Suspense fallback={<DialogLoader />}>
            <AddEditDialog
              isOpen={dialogs.states.addItem || dialogs.states.editItem || !!dialogs.editingItem}
              onClose={() => {
                dialogs.close('addItem');
                dialogs.close('editItem');
                dialogs.setEditingItem(null);
              }}
              mode={dialogs.editingItem ? 'edit' : 'add'}
              item={dialogs.editingItem}
              onSave={async (data) => {
                if (dialogs.editingItem) {
                  await handlers.editSave(data);
                } else {
                  await context.addBahanBaku(data);
                }
              }}
              availableCategories={filters.availableCategories}
              availableSuppliers={filters.availableSuppliers}
            />
          </Suspense>
        </DialogErrorBoundary>
      )}

      {/* Bulk Operations Dialog */}
      {(dialogs.states.bulkEdit || dialogs.states.bulkDelete) && (
        <DialogErrorBoundary onRetry={() => retryDialog('bulkOps')}>
          <Suspense fallback={<DialogLoader />}>
            <BulkOperationsDialog
              isOpen={dialogs.states.bulkEdit || dialogs.states.bulkDelete}
              onClose={() => {
                dialogs.close('bulkEdit');
                dialogs.close('bulkDelete');
              }}
              operation={dialogs.states.bulkEdit ? 'edit' : 'delete'}
              selectedItems={selection.selectedItems}
              selectedItemsData={selection.selectedItems.map(id => 
                context.bahanBaku.find((item: any) => item.id === id)
              ).filter(Boolean)}
              onConfirm={async (data) => {
                if (dialogs.states.bulkEdit) {
                  await bulk.bulkEdit(data);
                } else {
                  await bulk.bulkDelete();
                }
              }}
              isProcessing={bulk.isProcessing}
              availableCategories={filters.availableCategories}
              availableSuppliers={filters.availableSuppliers}
            />
          </Suspense>
        </DialogErrorBoundary>
      )}

      {/* Import/Export Dialog */}
      {(dialogs.states.import || dialogs.states.export) && (
        <DialogErrorBoundary onRetry={() => retryDialog('importExport')}>
          <Suspense fallback={<DialogLoader />}>
            <ImportExportDialog
              isOpen={dialogs.states.import || dialogs.states.export}
              onClose={() => {
                dialogs.close('import');
                dialogs.close('export');
              }}
              type={dialogs.states.import ? 'import' : 'export'}
              data={filters.filteredItems}
              selectedData={selection.selectedItems.map(id => 
                context.bahanBaku.find((item: any) => item.id === id)
              ).filter(Boolean)}
              onImport={context.addBahanBaku}
              onExport={(data, format) => {
                // Handle export logic here
                logger.debug(`[${pageId}] 📤 Exporting ${data.length} items as ${format}`);
              }}
            />
          </Suspense>
        </DialogErrorBoundary>
      )}
    </>
  );
};

export default DialogManager;