// src/components/warehouse/context/BahanBakuContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Types and Interfaces
import { BahanBaku } from '../types/warehouse';
import { BahanBakuContextType, ContextState, ContextDeps } from './types';

// Services
import { CrudService } from './services/crudService';
import { SubscriptionService } from './services/subscriptionService';
import { AlertService } from './services/alertService';

// Hooks
import { useConnectionManager } from './hooks/useConnectionManager';
import { useNotificationDeduplicator } from './hooks/useNotificationDeduplicator';
import { useInventoryAnalysis } from './hooks/useInventoryAnalysis';
import { useWarehouseSelection } from '../hooks/useWarehouseSelection';

// Dependencies
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useNotification } from '@/contexts/NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';

const BahanBakuContext = createContext<BahanBakuContextType | undefined>(undefined);

export const BahanBakuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [state, setState] = useState<ContextState>({
    bahanBaku: [],
    isLoading: true,
    isBulkDeleting: false,
    selectedItems: [],
    isSelectionMode: false,
  });

  // Dependencies
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification();

  // Custom Hooks
  const connectionManager = useConnectionManager();
  const { shouldSendNotification } = useNotificationDeduplicator();
  const analysis = useInventoryAnalysis(state.bahanBaku);
  const selection = useWarehouseSelection();

  // Refs for cleanup and state management
  const isMountedRef = useRef<boolean>(true);
  const alertTimeoutRef = useRef<NodeJS.Timeout>();
  const lastAlertCheckRef = useRef<number>(0);
  const servicesRef = useRef<{
    crud: CrudService | null;
    subscription: SubscriptionService | null;
    alert: AlertService | null;
  }>({ crud: null, subscription: null, alert: null });

  logger.context('BahanBakuContext', 'Provider render', { 
    user: user?.id,
    itemCount: state.bahanBaku.length,
    selectedCount: selection.selectedCount,
    selectionMode: selection.isSelectionMode,
    connected: connectionManager.connectionState.isConnected
  });

  // ⚡ OPTIMIZED: Lazy service initialization
  const getServices = useCallback(() => {
    if (!user) return { crud: null, subscription: null, alert: null };
    
    // Initialize services only when needed
    if (!servicesRef.current.crud) {
      const deps: ContextDeps = { user, addActivity, addNotification };

      servicesRef.current.crud = new CrudService({
        userId: user.id,
        onError: async (error: string) => {
          await addNotification(createNotificationHelper.systemError(error));
        },
      });

      servicesRef.current.alert = new AlertService({
        addNotification,
        shouldSendNotification,
        getLowStockItems: analysis.getLowStockItems,
        getOutOfStockItems: analysis.getOutOfStockItems,
        getExpiringItems: analysis.getExpiringItems,
        getDaysUntilExpiry: analysis.getDaysUntilExpiry,
      });

      servicesRef.current.subscription = new SubscriptionService({
        userId: user.id,
        onDataChange: (items) => {
          setState(prev => ({ ...prev, bahanBaku: items }));
        },
        onItemAdded: (item) => {
          setState(prev => ({
            ...prev,
            bahanBaku: [...prev.bahanBaku, item].sort((a, b) => a.nama.localeCompare(b.nama))
          }));
          servicesRef.current.alert?.processItemSpecificAlert(item, 'added');
        },
        onItemUpdated: (item) => {
          setState(prev => ({
            ...prev,
            bahanBaku: prev.bahanBaku.map(existing => 
              existing.id === item.id ? item : existing
            ).sort((a, b) => a.nama.localeCompare(b.nama))
          }));
        },
        onItemDeleted: (itemId) => {
          setState(prev => ({
            ...prev,
            bahanBaku: prev.bahanBaku.filter(item => item.id !== itemId)
          }));
          if (selection.selectedItems.includes(itemId)) {
            selection.toggleSelection(itemId);
          }
        },
        onConnectionStatusChange: (status) => {
          switch (status) {
            case 'SUBSCRIBED':
              connectionManager.setIsConnected(true);
              break;
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
            case 'CLOSED':
              connectionManager.handleConnectionError(() => {
                servicesRef.current.subscription?.setupSubscription();
              });
              break;
          }
        },
        isMountedRef,
      });
    }

    return servicesRef.current;
  }, [user, addActivity, addNotification, shouldSendNotification, analysis, selection, connectionManager]);

  // Initialize services effect with delay to prevent blocking
  useEffect(() => {
    if (!user) {
      servicesRef.current = { crud: null, subscription: null, alert: null };
      return;
    }

    // ⚡ Use setTimeout to prevent blocking main thread
    const timer = setTimeout(() => {
      getServices();
    }, 100);

    return () => clearTimeout(timer);
  }, [user?.id, getServices]);

  // Debounced alert checking
  const checkInventoryAlerts = useCallback(async (itemsToCheck?: BahanBaku[]): Promise<void> => {
    if (!user || !isMountedRef.current || !servicesRef.current.alert) return;
    
    const now = Date.now();
    if (now - lastAlertCheckRef.current < 30000) {
      return; // Throttle alerts to every 30 seconds
    }
    lastAlertCheckRef.current = now;
    
    const items = itemsToCheck || state.bahanBaku;
    if (items.length === 0) return;

    await servicesRef.current.alert.processInventoryAlerts(items);
  }, [user, state.bahanBaku]);

  // Data fetching
  const fetchBahanBaku = useCallback(async (shouldCheckAlerts: boolean = false) => {
    if (!user || !isMountedRef.current || !servicesRef.current.crud) {
      setState(prev => ({ ...prev, bahanBaku: [], isLoading: false }));
      return;
    }

    logger.context('BahanBakuContext', 'Fetching data...');
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const data = await servicesRef.current.crud.fetchBahanBaku();
      
      if (!isMountedRef.current) return;

      setState(prev => ({ ...prev, bahanBaku: data, isLoading: false }));

      // Debounced alert checking
      if (shouldCheckAlerts && data.length > 0) {
        if (alertTimeoutRef.current) {
          clearTimeout(alertTimeoutRef.current);
        }
        alertTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            checkInventoryAlerts(data);
          }
        }, 5000);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      
      logger.error('BahanBakuContext - Error fetching bahan baku:', err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, checkInventoryAlerts]);

  const refreshData = useCallback(async () => {
    await fetchBahanBaku(false);
  }, [fetchBahanBaku]);

  // Setup subscription and initial data load
  useEffect(() => {
    if (!user) {
      setState(prev => ({ 
        ...prev, 
        bahanBaku: [], 
        isLoading: false 
      }));
      connectionManager.resetConnection();
      return;
    }

    // Setup subscription first
    servicesRef.current.subscription?.setupSubscription();

    // Then fetch initial data
    fetchBahanBaku(true);

    // Cleanup function
    return () => {
      servicesRef.current.subscription?.cleanupSubscription();
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
      connectionManager.cleanup();
    };
  }, [user?.id, fetchBahanBaku, connectionManager]);

  // Component cleanup tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      servicesRef.current.subscription?.cleanupSubscription();
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
      connectionManager.cleanup();
    };
  }, [connectionManager]);

  // Reset selection when user changes
  useEffect(() => {
    selection.clearSelection();
    lastAlertCheckRef.current = 0;
  }, [user?.id, selection]);

  // ⚡ OPTIMIZED: CRUD Operations with lazy service access
  const addBahanBaku = async (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> => {
    const services = getServices();
    if (!services.crud) return false;

    const success = await services.crud.addBahanBaku(bahan);
    
    if (success) {
      addActivity({
        title: 'Bahan Baku Ditambahkan',
        description: `${bahan.nama} telah ditambahkan ke gudang.`,
        type: 'stok',
      });
    }

    return success;
  };

  const updateBahanBaku = async (id: string, updatedBahan: Partial<BahanBaku>): Promise<boolean> => {
    const services = getServices();
    if (!services.crud) return false;
    
    return await services.crud.updateBahanBaku(id, updatedBahan);
  };

  const deleteBahanBaku = async (id: string): Promise<boolean> => {
    const services = getServices();
    if (!services.crud || !services.alert) return false;
    
    const itemToDelete = state.bahanBaku.find(b => b.id === id);
    const success = await services.crud.deleteBahanBaku(id);
    
    if (success && itemToDelete) {
      await services.alert.processItemSpecificAlert(itemToDelete, 'deleted');
    }

    return success;
  };

  const bulkDeleteBahanBaku = async (ids: string[]): Promise<boolean> => {
    const services = getServices();
    if (!services.crud || !services.alert) return false;
    
    setState(prev => ({ ...prev, isBulkDeleting: true }));
    
    try {
      const success = await services.crud.bulkDeleteBahanBaku(ids);
      
      if (success) {
        selection.clearSelection();
        await services.alert.processBulkOperationAlert('bulk_delete', ids.length);
      }

      return success;
    } finally {
      setState(prev => ({ ...prev, isBulkDeleting: false }));
    }
  };

  // Utility methods
  const getBahanBakuByName = useCallback((nama: string): BahanBaku | undefined => {
    try {
      if (!nama || typeof nama !== 'string') {
        logger.error('BahanBakuContext', 'Invalid nama for getBahanBakuByName:', nama);
        return undefined;
      }
      return state.bahanBaku.find(bahan => bahan.nama.toLowerCase() === nama.toLowerCase());
    } catch (error) {
      logger.error('BahanBakuContext', 'Error in getBahanBakuByName:', error);
      return undefined;
    }
  }, [state.bahanBaku]);

  const reduceStok = async (nama: string, jumlah: number): Promise<boolean> => {
    if (!servicesRef.current.crud) return false;
    
    return await servicesRef.current.crud.reduceStok(nama, jumlah, state.bahanBaku);
  };

  // Context value
  const value: BahanBakuContextType = {
    // State
    bahanBaku: state.bahanBaku,
    loading: state.isLoading,
    isBulkDeleting: state.isBulkDeleting,
    selectedItems: selection.selectedItems,
    isSelectionMode: selection.isSelectionMode,
    
    // CRUD Operations
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    bulkDeleteBahanBaku,
    
    // Selection Operations
    toggleSelection: selection.toggleSelection,
    selectAll: () => selection.selectAll(state.bahanBaku),
    clearSelection: selection.clearSelection,
    toggleSelectionMode: selection.toggleSelectionMode,
    isSelected: selection.isSelected,
    getSelectedItems: () => selection.getSelectedItems(state.bahanBaku),
    
    // Utility Operations
    getBahanBakuByName,
    reduceStok,
    refreshData,
    checkInventoryAlerts,
    
    // Analysis Methods
    getExpiringItems: analysis.getExpiringItems,
    getLowStockItems: analysis.getLowStockItems,
    getOutOfStockItems: analysis.getOutOfStockItems,
    
    // Connection Status
    isConnected: connectionManager.connectionState.isConnected,
  };

  logger.context('BahanBakuContext', 'Providing context value:', {
    itemCount: state.bahanBaku.length,
    selectedCount: selection.selectedCount,
    selectionMode: selection.isSelectionMode,
    loading: state.isLoading,
    connected: connectionManager.connectionState.isConnected
  });

  return (
    <BahanBakuContext.Provider value={value}>
      {children}
    </BahanBakuContext.Provider>
  );
};

export const useBahanBaku = (): BahanBakuContextType => {
  const context = useContext(BahanBakuContext);
  if (context === undefined) {
    throw new Error('useBahanBaku must be used within a BahanBakuProvider');
  }
  return context;
};