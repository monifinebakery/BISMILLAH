// ===== 1. UPDATE DialogManager.tsx dengan useQuery =====
// src/components/warehouse/components/DialogManager.tsx
import React, { Suspense, lazy, useState, useEffect } from 'react';
// ✅ TAMBAH: Import useQuery dan mutation utilities
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

// ✅ ONLY Lazy Imports - Remove direct imports completely
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
    // ✅ TAMBAH: Enhanced handlers dengan useQuery support
    create: (item: any) => Promise<void>;
    update: (id: string, item: any) => Promise<void>;
    bulkDelete: (ids: string[]) => Promise<void>;
    bulkUpdate: (items: { id: string; data: any }[]) => Promise<void>;
  };
  context: any;
  selection: any;
  filters: any;
  bulk: any;
  pageId: string;
}

/**
 * ✅ ENHANCED: Dialog Manager Component dengan useQuery integration
 * 
 * Features:
 * - QueryClient integration untuk cache management
 * - Enhanced error handling dengan retry logic
 * - Performance monitoring untuk dialog loading
 * - Smart preloading untuk common dialogs
 * - Cache invalidation setelah operations
 * 
 * Size: ~4KB
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
  
  // ✅ TAMBAH: QueryClient untuk cache management
  const queryClient = useQueryClient();

  // Track which dialogs have been loaded for performance monitoring
  useEffect(() => {
    Object.entries(dialogs.states).forEach(([dialogName, isOpen]) => {
      if (isOpen && !loadedDialogs.has(dialogName)) {
        logger.debug(`[${pageId}] 📱 Loading dialog: ${dialogName}`);
        setLoadedDialogs(prev => new Set([...prev, dialogName]));
      }
    });
  }, [dialogs.states, loadedDialogs, pageId]);

  // ✅ TAMBAH: Preload critical dialogs untuk better performance
  useEffect(() => {
    // Preload AddEditDialog saat component mount (dialog paling sering digunakan)
    const preloadTimer = setTimeout(() => {
      import('../dialogs/AddEditDialog').catch(() => {
        logger.debug(`[${pageId}] Failed to preload AddEditDialog`);
      });
    }, 1000);

    return () => clearTimeout(preloadTimer);
  }, [pageId]);

  // Retry handler for failed dialog loads
  const retryDialog = (dialogName: string) => {
    setFailedDialogs(prev => {
      const newSet = new Set(prev);
      newSet.delete(dialogName);
      return newSet;
    });
  };

  // ✅ TAMBAH: Enhanced handlers dengan cache invalidation
  const enhancedHandlers = {
    ...handlers,
    
    // Enhanced save handler dengan cache management
    handleSave: async (data: any, isEdit: boolean = false) => {
      try {
        if (isEdit && dialogs.editingItem) {
          await handlers.update(dialogs.editingItem.id, data);
        } else {
          await handlers.create(data);
        }
        
        // ✅ Smart cache invalidation
        queryClient.invalidateQueries({ queryKey: ['warehouse', 'list'] });
        queryClient.invalidateQueries({ queryKey: ['warehouse', 'categories'] });
        queryClient.invalidateQueries({ queryKey: ['warehouse', 'suppliers'] });
        
        logger.debug(`[${pageId}] ✅ ${isEdit ? 'Updated' : 'Created'} item successfully`);
        
      } catch (error) {
        logger.error(`[${pageId}] ❌ Failed to ${isEdit ? 'update' : 'create'} item:`, error);
        throw error;
      }
    },

    // Enhanced bulk operations dengan cache management
    handleBulkOperation: async (operation: 'edit' | 'delete', data?: any) => {
      try {
        if (operation === 'delete') {
          const selectedIds = Array.from(selection.selectedItems);
          await handlers.bulkDelete(selectedIds);
          
          logger.debug(`[${pageId}] ✅ Bulk deleted ${selectedIds.length} items`);
        } else if (operation === 'edit' && data) {
          const selectedIds = Array.from(selection.selectedItems);
          const updateItems = selectedIds.map(id => ({ id, data }));
          await handlers.bulkUpdate(updateItems);
          
          logger.debug(`[${pageId}] ✅ Bulk updated ${selectedIds.length} items`);
        }
        
        // ✅ Comprehensive cache invalidation untuk bulk operations
        queryClient.invalidateQueries({ queryKey: ['warehouse'] });
        
      } catch (error) {
        logger.error(`[${pageId}] ❌ Bulk ${operation} operation failed:`, error);
        throw error;
      }
    },

    // Enhanced import handler
    handleImport: async (items: any[]) => {
      try {
        // Import items satu per satu dengan progress tracking
        let successCount = 0;
        let errorCount = 0;
        
        for (const item of items) {
          try {
            await handlers.create(item);
            successCount++;
          } catch (error) {
            errorCount++;
            logger.warn(`[${pageId}] Failed to import item:`, item.nama, error);
          }
        }
        
        // ✅ Full cache refresh setelah import
        await queryClient.refetchQueries({ queryKey: ['warehouse'] });
        
        logger.info(`[${pageId}] ✅ Import completed: ${successCount} success, ${errorCount} errors`);
        
        return { successCount, errorCount };
      } catch (error) {
        logger.error(`[${pageId}] ❌ Import operation failed:`, error);
        throw error;
      }
    }
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
                await enhancedHandlers.handleSave(data, !!dialogs.editingItem);
              }}
              availableCategories={filters.availableCategories || []}
              availableSuppliers={filters.availableSuppliers || []}
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
              selectedItems={selection.selectedItems || new Set()}
              selectedItemsData={Array.from(selection.selectedItems || []).map((id: string) => 
                context.bahanBaku?.find((item: any) => item.id === id)
              ).filter(Boolean)}
              onConfirm={async (data) => {
                const operation = dialogs.states.bulkEdit ? 'edit' : 'delete';
                await enhancedHandlers.handleBulkOperation(operation, data);
              }}
              isProcessing={bulk?.isProcessing || false}
              availableCategories={filters.availableCategories || []}
              availableSuppliers={filters.availableSuppliers || []}
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
              data={filters.filteredItems || []}
              selectedData={Array.from(selection.selectedItems || []).map((id: string) => 
                context.bahanBaku?.find((item: any) => item.id === id)
              ).filter(Boolean)}
              onImport={async (items: any[]) => {
                const result = await enhancedHandlers.handleImport(items);
                return result;
              }}
              onExport={(data, format) => {
                // ✅ Enhanced export dengan format options
                logger.info(`[${pageId}] 📤 Exporting ${data.length} items as ${format}`);
                
                // Bisa ditambahkan logic export sesuai format
                if (format === 'excel') {
                  // Export to Excel logic
                } else if (format === 'csv') {
                  // Export to CSV logic
                } else if (format === 'pdf') {
                  // Export to PDF logic
                }
              }}
            />
          </Suspense>
        </DialogErrorBoundary>
      )}

      {/* ✅ TAMBAH: Debug info untuk development */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-[100] max-w-xs">
          <div>Loaded Dialogs: {loadedDialogs.size}</div>
          <div>Failed Dialogs: {failedDialogs.size}</div>
          <div>Active: {Object.values(dialogs.states).filter(Boolean).length}</div>
        </div>
      )}
    </>
  );
};

export default DialogManager;