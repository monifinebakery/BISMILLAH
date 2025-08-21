// src/components/warehouse/components/DialogManager.tsx
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

// ✅ ONLY Lazy Imports
const AddEditDialog = lazy(() => import('../dialogs/AddEditDialog'));
const BulkOperationsDialog = lazy(() => import('../dialogs/BulkOperationsDialog'));
const ImportExportDialog = lazy(() => import('../dialogs/ImportExportDialog'));

const DialogLoader = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8 flex flex-col items-center">
      <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
      <p className="text-gray-600">Memuat dialog...</p>
    </div>
  </div>
);

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
    logger.error('Dialog loading error:', { error, errorInfo });
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
    create?: (item: any) => Promise<void>;
    update?: (id: string, item: any) => Promise<void>;
  };
  context: any;
  selection: any;
  filters: any;
  bulk: any;
  pageId: string;
}

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
  const queryClient = useQueryClient();

  useEffect(() => {
    Object.entries(dialogs.states).forEach(([dialogName, isOpen]) => {
      if (isOpen && !loadedDialogs.has(dialogName)) {
        logger.debug(`[${pageId}] 📱 Loading dialog: ${dialogName}`);
        setLoadedDialogs(prev => new Set([...prev, dialogName]));
      }
    });
  }, [dialogs.states, loadedDialogs, pageId]);

  useEffect(() => {
    const preloadTimer = setTimeout(() => {
      import('../dialogs/AddEditDialog').catch(() => {
        logger.debug(`[${pageId}] Failed to preload AddEditDialog`);
      });
    }, 1000);
    return () => clearTimeout(preloadTimer);
  }, [pageId]);

  const retryDialog = (dialogName: string) => {
    setFailedDialogs(prev => {
      const newSet = new Set(prev);
      newSet.delete(dialogName);
      return newSet;
    });
  };

  const enhancedHandlers = {
    handleSave: async (data: any, isEdit: boolean = false) => {
      try {
        logger.info('DialogManager.handleSave called', { data, isEdit, editingItem: dialogs.editingItem });
        if (isEdit && dialogs.editingItem) {
          if (handlers.update) {
            logger.info('Using handlers.update');
            await handlers.update(dialogs.editingItem.id, data);
          } else {
            logger.info('Using handlers.editSave');
            await handlers.editSave(data);
          }
        } else {
          if (handlers.create) {
            logger.info('Using handlers.create');
            await handlers.create(data);
          } else {
            throw new Error('Create handler not available');
          }
        }
        queryClient.invalidateQueries({ queryKey: ['warehouse', 'list'] });
        queryClient.invalidateQueries({ queryKey: ['warehouse', 'categories'] });
        queryClient.invalidateQueries({ queryKey: ['warehouse', 'suppliers'] });
        logger.debug(`[${pageId}] ✅ ${isEdit ? 'Updated' : 'Created'} item successfully`);
        toast.success(`${isEdit ? 'Diperbarui' : 'Ditambahkan'} item berhasil!`);
      } catch (error: any) {
        logger.error(`[${pageId}] ❌ Failed to ${isEdit ? 'update' : 'create'} item:`, error);
        toast.error(`Gagal ${isEdit ? 'memperbarui' : 'menambah'} item: ${error.message || 'Unknown error'}`);
        throw error;
      }
    },

    handleBulkOperation: async (operation: 'edit' | 'delete', data?: any) => {
      try {
        let success = false;
        
        logger.info(`[${pageId}] 🔄 Starting bulk ${operation} operation`, { 
          operation, 
          dataProvided: !!data,
          dataKeys: data ? Object.keys(data) : [],
          bulkAvailable: !!bulk,
          bulkMethods: bulk ? Object.keys(bulk) : []
        });
        
        if (operation === 'delete') {
          // Bulk delete doesn't need data parameter
          if (!bulk || typeof bulk.bulkDelete !== 'function') {
            logger.error(`[${pageId}] ❌ Bulk delete function not available`, { bulk: !!bulk, bulkDelete: !!bulk?.bulkDelete });
            throw new Error('Fungsi bulk delete tidak tersedia');
          }
          
          logger.debug(`[${pageId}] 🗑️ Calling bulk.bulkDelete()`);
          success = await bulk.bulkDelete();
          logger.debug(`[${pageId}] ✅ Bulk delete operation completed: ${success}`);
          
        } else if (operation === 'edit' && data) {
          // Log the data being passed for bulk edit
          logger.debug(`[${pageId}] 📝 Bulk edit raw data:`, data);
          
          if (!bulk || typeof bulk.bulkEdit !== 'function') {
            logger.error(`[${pageId}] ❌ Bulk edit function not available`, { bulk: !!bulk, bulkEdit: !!bulk?.bulkEdit });
            throw new Error('Fungsi bulk edit tidak tersedia');
          }
          
          // Validate that we have data to update
          if (!data || typeof data !== 'object') {
            logger.error(`[${pageId}] ❌ Invalid bulk edit data:`, { data, type: typeof data });
            throw new Error('Data bulk edit tidak valid');
          }
          
          // Convert and validate the data with enhanced type checking
          const updates: Partial<any> = {};
          let hasValidUpdates = false;
          
          // Map the fields correctly with strict validation
          if (data.kategori !== undefined && data.kategori !== null && String(data.kategori).trim() !== '') {
            updates.kategori = String(data.kategori).trim();
            hasValidUpdates = true;
            logger.debug(`[${pageId}] ✓ Adding kategori: "${updates.kategori}"`);
          }
          
          if (data.supplier !== undefined && data.supplier !== null && String(data.supplier).trim() !== '') {
            updates.supplier = String(data.supplier).trim();
            hasValidUpdates = true;
            logger.debug(`[${pageId}] ✓ Adding supplier: "${updates.supplier}"`);
          }
          
          if (data.minimum !== undefined && data.minimum !== null && data.minimum !== '') {
            const minimum = Number(data.minimum);
            if (!isNaN(minimum) && minimum >= 0) {
              updates.minimum = minimum;
              hasValidUpdates = true;
              logger.debug(`[${pageId}] ✓ Adding minimum: ${updates.minimum}`);
            } else {
              logger.warn(`[${pageId}] ⚠️ Invalid minimum value: ${data.minimum}`);
            }
          }
          
          if (data.harga !== undefined && data.harga !== null && data.harga !== '') {
            const harga = Number(data.harga);
            if (!isNaN(harga) && harga >= 0) {
              updates.harga = harga;
              hasValidUpdates = true;
              logger.debug(`[${pageId}] ✓ Adding harga: ${updates.harga}`);
            } else {
              logger.warn(`[${pageId}] ⚠️ Invalid harga value: ${data.harga}`);
            }
          }
          
          if (data.expiry !== undefined && data.expiry !== null && String(data.expiry).trim() !== '') {
            const expiryStr = String(data.expiry).trim();
            // Basic date validation
            const expiryDate = new Date(expiryStr);
            if (!isNaN(expiryDate.getTime())) {
              updates.expiry = expiryStr;
              hasValidUpdates = true;
              logger.debug(`[${pageId}] ✓ Adding expiry: "${updates.expiry}"`);
            } else {
              logger.warn(`[${pageId}] ⚠️ Invalid expiry date: ${data.expiry}`);
            }
          }
          
          logger.debug(`[${pageId}] 📝 Final bulk edit updates:`, updates);
          
          // Check if there are any actual valid updates
          if (!hasValidUpdates || Object.keys(updates).length === 0) {
            const message = 'Tidak ada perubahan valid yang akan diterapkan';
            logger.warn(`[${pageId}] ⚠️ ${message}`);
            toast.warning(message);
            return false;
          }
          
          logger.debug(`[${pageId}] 🚀 Calling bulk.bulkEdit() with updates:`, updates);
          success = await bulk.bulkEdit(updates);
          logger.debug(`[${pageId}] ✅ Bulk edit operation completed: ${success}`);
          
        } else {
          logger.warn(`[${pageId}] ⚠️ Invalid bulk operation parameters:`, { 
            operation, 
            hasData: !!data,
            isEditWithoutData: operation === 'edit' && !data
          });
          const message = operation === 'edit' ? 'Data untuk bulk edit tidak tersedia' : 'Operasi bulk tidak valid';
          toast.error(message);
          return false;
        }
        
        if (success) {
          queryClient.invalidateQueries({ queryKey: ['warehouse'] });
          logger.info(`[${pageId}] ✅ Bulk ${operation} operation successful`);
        } else {
          logger.warn(`[${pageId}] ⚠️ Bulk ${operation} operation returned false`);
          toast.warning(`Operasi ${operation === 'edit' ? 'edit' : 'hapus'} massal tidak berhasil`);
        }
        
        return success;
      } catch (error: any) {
        logger.error(`[${pageId}] ❌ Bulk ${operation} operation failed:`, {
          error: error.message,
          stack: error.stack,
          operation,
          dataProvided: !!data
        });
        
        // Provide more specific error messages
        let errorMessage = 'Operasi gagal';
        if (error.message?.includes('tidak tersedia')) {
          errorMessage = error.message;
        } else if (error.message?.includes('tidak valid')) {
          errorMessage = error.message;
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorMessage = 'Masalah koneksi jaringan. Silakan coba lagi.';
        } else {
          errorMessage = `Operasi ${operation === 'edit' ? 'edit' : 'hapus'} massal gagal: ${error.message || 'Error tidak diketahui'}`;
        }
        
        toast.error(errorMessage);
        return false; // Don't re-throw to prevent dialog from staying open
      }
    },

    handleImport: async (items: any[]) => {
      try {
        let successCount = 0;
        let errorCount = 0;
        for (const item of items) {
          try {
            if (handlers.create) {
              await handlers.create(item);
            } else {
              throw new Error('Create handler not available for import');
            }
            successCount++;
          } catch (error) {
            errorCount++;
            logger.warn(`[${pageId}] Failed to import item:`, { nama: item?.nama, error });
          }
        }
        await queryClient.refetchQueries({ queryKey: ['warehouse'] });
        logger.info(`[${pageId}] ✅ Import completed: ${successCount} success, ${errorCount} errors`);
        toast.success(`Import selesai: ${successCount} berhasil, ${errorCount} gagal`);
        return { successCount, errorCount };
      } catch (error: any) {
        logger.error(`[${pageId}] ❌ Import operation failed:`, error);
        toast.error(`Import gagal: ${error.message || 'Unknown error'}`);
        throw error;
      }
    }
  };

  return (
    <>
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
                logger.info('AddEditDialog onSave called with data:', data);
                await enhancedHandlers.handleSave(data, !!dialogs.editingItem);
              }}
              availableCategories={filters.availableCategories || []}
              availableSuppliers={filters.availableSuppliers || []}
            />
          </Suspense>
        </DialogErrorBoundary>
      )}

      {(dialogs.states.bulkEdit || dialogs.states.bulkDelete) && (
        <DialogErrorBoundary onRetry={() => retryDialog('bulkOps')}>
          <Suspense fallback={<DialogLoader />}>
            <BulkOperationsDialog
              isOpen={dialogs.states.bulkEdit || dialogs.states.bulkDelete}
              onClose={() => {
                dialogs.close('bulkEdit');
                dialogs.close('bulkDelete');
                selection.clearSelection?.();
              }}
              operation={dialogs.states.bulkEdit ? 'edit' : 'delete'}
              selectedItems={Array.from(selection.selectedItems || [])}
              selectedItemsData={Array.from(selection.selectedItems || []).map((id) => 
                context.bahanBaku?.find((item: any) => item.id === String(id))
              ).filter(Boolean)}
              onConfirm={async (data) => {
                const operation = dialogs.states.bulkEdit ? 'edit' : 'delete';
                const success = await enhancedHandlers.handleBulkOperation(operation, data);
                if (success) {
                  dialogs.close('bulkEdit');
                  dialogs.close('bulkDelete');
                  selection.clearSelection?.();
                }
              }}
              isProcessing={bulk?.isProcessing || false}
              availableCategories={filters.availableCategories || []}
              availableSuppliers={filters.availableSuppliers || []}
            />
          </Suspense>
        </DialogErrorBoundary>
      )}

      {(dialogs.states.import || dialogs.states.export) && (
        <DialogErrorBoundary onRetry={() => retryDialog('importExport')}>
          <Suspense fallback={<DialogLoader />}>
            <ImportExportDialog
              isOpen={dialogs.states.import || dialogs.states.export}
              onClose={() => {
                dialogs.close('import');
                dialogs.close('export');
              }}
              onImport={async (items: any[]) => {
                const result = await enhancedHandlers.handleImport(items);
                return result.successCount > 0;
              }}
            />
          </Suspense>
        </DialogErrorBoundary>
      )}

      {import.meta.env.DEV && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-[100] max-w-xs">
          <div>Loaded Dialogs: {loadedDialogs.size}</div>
          <div>Failed Dialogs: {failedDialogs.size}</div>
          <div>Active: {Object.values(dialogs.states).filter(Boolean).length}</div>
          <div>Handlers: {Object.keys(handlers).join(', ')}</div>
        </div>
      )}
    </>
  );
};

export default DialogManager;
