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
  const initStartTime = useRef<number>(Date.now());
  const componentId = useRef<string>(`BahanBaku-${Math.random().toString(36).substr(2, 9)}`);
  
  // 🐛 DEBUG: Performance tracking refs
  const perfTimers = useRef<{
    [key: string]: number;
  }>({});
  
  const startTimer = useCallback((operation: string) => {
    perfTimers.current[operation] = Date.now();
    logger.debug(`[${componentId.current}] PERF START: ${operation}`);
  }, []);
  
  const endTimer = useCallback((operation: string, extraData?: any) => {
    const startTime = perfTimers.current[operation];
    if (startTime) {
      const duration = Date.now() - startTime;
      logger.debug(`[${componentId.current}] PERF END: ${operation} took ${duration}ms`, extraData);
      delete perfTimers.current[operation];
      return duration;
    }
    return 0;
  }, []);

  logger.debug(`[${componentId.current}] 🚀 BahanBakuProvider initialization started`);

  // State
  const [state, setState] = useState<ContextState>({
    bahanBaku: [],
    isLoading: true,
    isBulkDeleting: false,
    selectedItems: [],
    isSelectionMode: false,
  });

  // 🐛 DEBUG: State change logger
  const logStateChange = useCallback((newState: Partial<ContextState>, reason: string) => {
    logger.debug(`[${componentId.current}] STATE CHANGE (${reason}):`, {
      before: {
        itemCount: state.bahanBaku.length,
        isLoading: state.isLoading,
        selectedCount: state.selectedItems.length,
        isSelectionMode: state.isSelectionMode
      },
      after: {
        itemCount: newState.bahanBaku?.length ?? state.bahanBaku.length,
        isLoading: newState.isLoading ?? state.isLoading,
        selectedCount: newState.selectedItems?.length ?? state.selectedItems.length,
        isSelectionMode: newState.isSelectionMode ?? state.isSelectionMode
      },
      reason
    });
  }, [state]);

  // Enhanced setState with logging
  const setStateWithLog = useCallback((updater: React.SetStateAction<ContextState>, reason: string) => {
    setState(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;
      logStateChange(newState, reason);
      return newState;
    });
  }, [logStateChange]);

  // Dependencies
  startTimer('dependencies-init');
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification();
  endTimer('dependencies-init', { userId: user?.id });

  // 🐛 DEBUG: User state tracking
  useEffect(() => {
    logger.debug(`[${componentId.current}] USER STATE CHANGE:`, {
      userId: user?.id,
      userEmail: user?.email,
      hasUser: !!user,
      timestamp: Date.now()
    });
  }, [user]);

  // Custom Hooks
  startTimer('hooks-init');
  const connectionManager = useConnectionManager();
  const { shouldSendNotification } = useNotificationDeduplicator();
  const analysis = useInventoryAnalysis(state.bahanBaku);
  const selection = useWarehouseSelection();
  endTimer('hooks-init');

  // 🐛 DEBUG: Hook state tracking
  useEffect(() => {
    logger.debug(`[${componentId.current}] HOOKS STATE:`, {
      connectionState: connectionManager.connectionState,
      analysisReady: !!analysis,
      selectionReady: !!selection,
      selectedCount: selection.selectedCount,
      isSelectionMode: selection.isSelectionMode
    });
  }, [connectionManager.connectionState, analysis, selection]);

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
    componentId: componentId.current,
    initTime: Date.now() - initStartTime.current,
    user: user?.id,
    itemCount: state.bahanBaku.length,
    selectedCount: selection.selectedCount,
    selectionMode: selection.isSelectionMode,
    connected: connectionManager.connectionState.isConnected
  });

  // ⚡ OPTIMIZED: Lazy service initialization
  const getServices = useCallback(() => {
    startTimer('get-services');
    
    if (!user) {
      endTimer('get-services', { reason: 'no-user' });
      return { crud: null, subscription: null, alert: null };
    }
    
    // Initialize services only when needed
    if (!servicesRef.current.crud) {
      startTimer('services-creation');
      logger.debug(`[${componentId.current}] 🔧 Creating services for user: ${user.id}`);
      
      const deps: ContextDeps = { user, addActivity, addNotification };

      // CRUD Service
      startTimer('crud-service-init');
      servicesRef.current.crud = new CrudService({
        userId: user.id,
        onError: async (error: string) => {
          logger.error(`[${componentId.current}] CRUD Service Error:`, error);
          await addNotification(createNotificationHelper.systemError(error));
        },
      });
      endTimer('crud-service-init');

      // Alert Service
      startTimer('alert-service-init');
      servicesRef.current.alert = new AlertService({
        addNotification,
        shouldSendNotification,
        getLowStockItems: analysis.getLowStockItems,
        getOutOfStockItems: analysis.getOutOfStockItems,
        getExpiringItems: analysis.getExpiringItems,
        getDaysUntilExpiry: analysis.getDaysUntilExpiry,
      });
      endTimer('alert-service-init');

      // Subscription Service
      startTimer('subscription-service-init');
      servicesRef.current.subscription = new SubscriptionService({
        userId: user.id,
        onDataChange: (items) => {
          logger.debug(`[${componentId.current}] 📡 Subscription data change: ${items.length} items`);
          setStateWithLog(prev => ({ ...prev, bahanBaku: items }), 'subscription-data-change');
        },
        onItemAdded: (item) => {
          logger.debug(`[${componentId.current}] ➕ Item added via subscription:`, item.nama);
          setStateWithLog(prev => ({
            ...prev,
            bahanBaku: [...prev.bahanBaku, item].sort((a, b) => a.nama.localeCompare(b.nama))
          }), 'subscription-item-added');
          servicesRef.current.alert?.processItemSpecificAlert(item, 'added');
        },
        onItemUpdated: (item) => {
          logger.debug(`[${componentId.current}] ✏️ Item updated via subscription:`, item.nama);
          setStateWithLog(prev => ({
            ...prev,
            bahanBaku: prev.bahanBaku.map(existing => 
              existing.id === item.id ? item : existing
            ).sort((a, b) => a.nama.localeCompare(b.nama))
          }), 'subscription-item-updated');
        },
        onItemDeleted: (itemId) => {
          logger.debug(`[${componentId.current}] 🗑️ Item deleted via subscription:`, itemId);
          setStateWithLog(prev => ({
            ...prev,
            bahanBaku: prev.bahanBaku.filter(item => item.id !== itemId)
          }), 'subscription-item-deleted');
          if (selection.selectedItems.includes(itemId)) {
            selection.toggleSelection(itemId);
          }
        },
        onConnectionStatusChange: (status) => {
          logger.debug(`[${componentId.current}] 🔌 Connection status changed:`, status);
          switch (status) {
            case 'SUBSCRIBED':
              connectionManager.setIsConnected(true);
              logger.debug(`[${componentId.current}] ✅ Subscription established`);
              break;
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
            case 'CLOSED':
              logger.warn(`[${componentId.current}] ❌ Connection issue: ${status}`);
              connectionManager.handleConnectionError(() => {
                logger.debug(`[${componentId.current}] 🔄 Attempting to reconnect subscription`);
                servicesRef.current.subscription?.setupSubscription();
              });
              break;
          }
        },
        isMountedRef,
      });
      endTimer('subscription-service-init');
      
      endTimer('services-creation');
      logger.debug(`[${componentId.current}] ✅ All services created successfully`);
    } else {
      logger.debug(`[${componentId.current}] 🔄 Using existing services`);
    }

    endTimer('get-services', { hasServices: !!servicesRef.current.crud });
    return servicesRef.current;
  }, [user, addActivity, addNotification, shouldSendNotification, analysis, selection, connectionManager, setStateWithLog]);

  // Initialize services effect with delay to prevent blocking
  useEffect(() => {
    startTimer('services-init-effect');
    
    if (!user) {
      logger.debug(`[${componentId.current}] 🚫 No user, clearing services`);
      servicesRef.current = { crud: null, subscription: null, alert: null };
      endTimer('services-init-effect', { reason: 'no-user' });
      return;
    }

    logger.debug(`[${componentId.current}] ⏰ Scheduling service initialization with 100ms delay`);
    
    // ⚡ Use setTimeout to prevent blocking main thread
    const timer = setTimeout(() => {
      startTimer('delayed-service-init');
      logger.debug(`[${componentId.current}] 🚀 Executing delayed service initialization`);
      getServices();
      endTimer('delayed-service-init');
    }, 100);

    endTimer('services-init-effect', { hasTimer: true });
    return () => {
      logger.debug(`[${componentId.current}] 🧹 Clearing service initialization timer`);
      clearTimeout(timer);
    };
  }, [user?.id, getServices]);

  // Debounced alert checking
  const checkInventoryAlerts = useCallback(async (itemsToCheck?: BahanBaku[]): Promise<void> => {
    startTimer('check-inventory-alerts');
    
    if (!user || !isMountedRef.current || !servicesRef.current.alert) {
      logger.debug(`[${componentId.current}] ⏭️ Skipping alert check:`, {
        hasUser: !!user,
        isMounted: isMountedRef.current,
        hasAlertService: !!servicesRef.current.alert
      });
      endTimer('check-inventory-alerts', { skipped: true });
      return;
    }
    
    const now = Date.now();
    if (now - lastAlertCheckRef.current < 30000) {
      logger.debug(`[${componentId.current}] ⏳ Alert check throttled (last check: ${now - lastAlertCheckRef.current}ms ago)`);
      endTimer('check-inventory-alerts', { throttled: true });
      return;
    }
    lastAlertCheckRef.current = now;
    
    const items = itemsToCheck || state.bahanBaku;
    if (items.length === 0) {
      logger.debug(`[${componentId.current}] 📭 No items to check for alerts`);
      endTimer('check-inventory-alerts', { noItems: true });
      return;
    }

    logger.debug(`[${componentId.current}] 🔔 Processing inventory alerts for ${items.length} items`);
    
    try {
      await servicesRef.current.alert.processInventoryAlerts(items);
      logger.debug(`[${componentId.current}] ✅ Inventory alerts processed successfully`);
    } catch (error) {
      logger.error(`[${componentId.current}] ❌ Error processing inventory alerts:`, error);
    }
    
    endTimer('check-inventory-alerts');
  }, [user, state.bahanBaku]);

  // Data fetching
  const fetchBahanBaku = useCallback(async (shouldCheckAlerts: boolean = false) => {
    const fetchId = Math.random().toString(36).substr(2, 9);
    startTimer(`fetch-bahan-baku-${fetchId}`);
    
    logger.debug(`[${componentId.current}] 📥 fetchBahanBaku called (${fetchId}):`, {
      hasUser: !!user,
      isMounted: isMountedRef.current,
      hasCrudService: !!servicesRef.current.crud,
      shouldCheckAlerts,
      currentItemCount: state.bahanBaku.length
    });
    
    if (!user || !isMountedRef.current || !servicesRef.current.crud) {
      logger.warn(`[${componentId.current}] 🚫 Cannot fetch - missing requirements:`, {
        hasUser: !!user,
        isMounted: isMountedRef.current,
        hasCrudService: !!servicesRef.current.crud
      });
      setStateWithLog(prev => ({ ...prev, bahanBaku: [], isLoading: false }), 'fetch-requirements-not-met');
      endTimer(`fetch-bahan-baku-${fetchId}`, { failed: true });
      return;
    }

    logger.context('BahanBakuContext', `Fetching data... (${fetchId})`);
    setStateWithLog(prev => ({ ...prev, isLoading: true }), 'fetch-started');
    
    try {
      startTimer(`crud-fetch-${fetchId}`);
      logger.debug(`[${componentId.current}] 🌐 Calling CRUD service fetchBahanBaku`);
      const data = await servicesRef.current.crud.fetchBahanBaku();
      const fetchDuration = endTimer(`crud-fetch-${fetchId}`, { itemCount: data.length });
      
      if (!isMountedRef.current) {
        logger.warn(`[${componentId.current}] ⚠️ Component unmounted during fetch, discarding data`);
        endTimer(`fetch-bahan-baku-${fetchId}`, { discarded: true });
        return;
      }

      logger.debug(`[${componentId.current}] ✅ Data fetched successfully:`, {
        itemCount: data.length,
        fetchDuration,
        shouldCheckAlerts
      });

      setStateWithLog(prev => ({ ...prev, bahanBaku: data, isLoading: false }), 'fetch-completed');

      // Debounced alert checking
      if (shouldCheckAlerts && data.length > 0) {
        logger.debug(`[${componentId.current}] ⏰ Scheduling alert check in 5 seconds`);
        if (alertTimeoutRef.current) {
          clearTimeout(alertTimeoutRef.current);
        }
        alertTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            logger.debug(`[${componentId.current}] 🔔 Executing scheduled alert check`);
            checkInventoryAlerts(data);
          } else {
            logger.debug(`[${componentId.current}] ⚠️ Component unmounted, skipping scheduled alert check`);
          }
        }, 5000);
      }
      
      endTimer(`fetch-bahan-baku-${fetchId}`, { success: true, itemCount: data.length });
    } catch (err: any) {
      const fetchDuration = endTimer(`crud-fetch-${fetchId}`, { error: true });
      
      if (!isMountedRef.current) {
        logger.warn(`[${componentId.current}] ⚠️ Component unmounted during error handling`);
        endTimer(`fetch-bahan-baku-${fetchId}`, { discarded: true });
        return;
      }
      
      logger.error(`[${componentId.current}] ❌ Error fetching bahan baku (${fetchId}):`, {
        error: err,
        message: err?.message,
        stack: err?.stack,
        fetchDuration
      });
      setStateWithLog(prev => ({ ...prev, isLoading: false }), 'fetch-error');
      endTimer(`fetch-bahan-baku-${fetchId}`, { error: true });
    }
  }, [user, checkInventoryAlerts, state.bahanBaku.length, setStateWithLog]);

  const refreshData = useCallback(async () => {
    logger.debug(`[${componentId.current}] 🔄 refreshData called`);
    await fetchBahanBaku(false);
  }, [fetchBahanBaku]);

  // Setup subscription and initial data load
  useEffect(() => {
    const effectId = Math.random().toString(36).substr(2, 9);
    startTimer(`setup-effect-${effectId}`);
    
    logger.debug(`[${componentId.current}] 🔧 Setup effect triggered (${effectId}):`, {
      hasUser: !!user,
      userId: user?.id
    });
    
    if (!user) {
      logger.debug(`[${componentId.current}] 🚫 No user in setup effect, resetting state`);
      setStateWithLog(prev => ({ 
        ...prev, 
        bahanBaku: [], 
        isLoading: false 
      }), 'no-user-setup');
      connectionManager.resetConnection();
      endTimer(`setup-effect-${effectId}`, { reason: 'no-user' });
      return;
    }

    // Setup subscription first
    startTimer(`subscription-setup-${effectId}`);
    logger.debug(`[${componentId.current}] 📡 Setting up subscription`);
    servicesRef.current.subscription?.setupSubscription();
    endTimer(`subscription-setup-${effectId}`);

    // Then fetch initial data
    startTimer(`initial-fetch-${effectId}`);
    logger.debug(`[${componentId.current}] 📥 Starting initial data fetch`);
    fetchBahanBaku(true).then(() => {
      endTimer(`initial-fetch-${effectId}`);
      logger.debug(`[${componentId.current}] ✅ Initial data fetch completed`);
    }).catch(err => {
      endTimer(`initial-fetch-${effectId}`, { error: true });
      logger.error(`[${componentId.current}] ❌ Initial data fetch failed:`, err);
    });

    // Cleanup function
    const cleanup = () => {
      logger.debug(`[${componentId.current}] 🧹 Setup effect cleanup (${effectId})`);
      servicesRef.current.subscription?.cleanupSubscription();
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
      connectionManager.cleanup();
    };

    endTimer(`setup-effect-${effectId}`);
    return cleanup;
  }, [user?.id, fetchBahanBaku, connectionManager, setStateWithLog]);

  // Component cleanup tracking
  useEffect(() => {
    logger.debug(`[${componentId.current}] 🏁 Component mount effect`);
    isMountedRef.current = true;
    
    return () => {
      logger.debug(`[${componentId.current}] 💀 Component unmount cleanup`);
      isMountedRef.current = false;
      servicesRef.current.subscription?.cleanupSubscription();
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
      connectionManager.cleanup();
      
      // Log final performance summary
      const totalTime = Date.now() - initStartTime.current;
      logger.debug(`[${componentId.current}] 📊 Component lifecycle completed:`, {
        totalLifetime: totalTime,
        finalItemCount: state.bahanBaku.length,
        wasLoading: state.isLoading
      });
    };
  }, [connectionManager, state.bahanBaku.length, state.isLoading]);

  // Reset selection when user changes
  useEffect(() => {
    logger.debug(`[${componentId.current}] 👤 User change detected, clearing selection`);
    selection.clearSelection();
    lastAlertCheckRef.current = 0;
  }, [user?.id, selection]);

  // ⚡ OPTIMIZED: CRUD Operations with lazy service access
  const addBahanBaku = async (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> => {
    const operationId = Math.random().toString(36).substr(2, 9);
    startTimer(`add-bahan-baku-${operationId}`);
    
    logger.debug(`[${componentId.current}] ➕ Adding bahan baku (${operationId}):`, bahan.nama);
    
    const services = getServices();
    if (!services.crud) {
      logger.warn(`[${componentId.current}] ❌ Cannot add bahan baku - no CRUD service`);
      endTimer(`add-bahan-baku-${operationId}`, { failed: true });
      return false;
    }

    const success = await services.crud.addBahanBaku(bahan);
    
    if (success) {
      logger.debug(`[${componentId.current}] ✅ Bahan baku added successfully: ${bahan.nama}`);
      addActivity({
        title: 'Bahan Baku Ditambahkan',
        description: `${bahan.nama} telah ditambahkan ke gudang.`,
        type: 'stok',
      });
    } else {
      logger.warn(`[${componentId.current}] ❌ Failed to add bahan baku: ${bahan.nama}`);
    }

    endTimer(`add-bahan-baku-${operationId}`, { success });
    return success;
  };

  const updateBahanBaku = async (id: string, updatedBahan: Partial<BahanBaku>): Promise<boolean> => {
    const operationId = Math.random().toString(36).substr(2, 9);
    startTimer(`update-bahan-baku-${operationId}`);
    
    logger.debug(`[${componentId.current}] ✏️ Updating bahan baku (${operationId}):`, { id, updatedBahan });
    
    const services = getServices();
    if (!services.crud) {
      logger.warn(`[${componentId.current}] ❌ Cannot update bahan baku - no CRUD service`);
      endTimer(`update-bahan-baku-${operationId}`, { failed: true });
      return false;
    }
    
    const success = await services.crud.updateBahanBaku(id, updatedBahan);
    logger.debug(`[${componentId.current}] ${success ? '✅' : '❌'} Update result: ${success}`);
    
    endTimer(`update-bahan-baku-${operationId}`, { success });
    return success;
  };

  const deleteBahanBaku = async (id: string): Promise<boolean> => {
    const operationId = Math.random().toString(36).substr(2, 9);
    startTimer(`delete-bahan-baku-${operationId}`);
    
    logger.debug(`[${componentId.current}] 🗑️ Deleting bahan baku (${operationId}):`, id);
    
    const services = getServices();
    if (!services.crud || !services.alert) {
      logger.warn(`[${componentId.current}] ❌ Cannot delete bahan baku - missing services`);
      endTimer(`delete-bahan-baku-${operationId}`, { failed: true });
      return false;
    }
    
    const itemToDelete = state.bahanBaku.find(b => b.id === id);
    const success = await services.crud.deleteBahanBaku(id);
    
    if (success && itemToDelete) {
      logger.debug(`[${componentId.current}] ✅ Bahan baku deleted: ${itemToDelete.nama}`);
      await services.alert.processItemSpecificAlert(itemToDelete, 'deleted');
    } else if (!success) {
      logger.warn(`[${componentId.current}] ❌ Failed to delete bahan baku: ${id}`);
    }

    endTimer(`delete-bahan-baku-${operationId}`, { success });
    return success;
  };

  const bulkDeleteBahanBaku = async (ids: string[]): Promise<boolean> => {
    const operationId = Math.random().toString(36).substr(2, 9);
    startTimer(`bulk-delete-${operationId}`);
    
    logger.debug(`[${componentId.current}] 🗑️📦 Bulk deleting bahan baku (${operationId}):`, { count: ids.length, ids });
    
    const services = getServices();
    if (!services.crud || !services.alert) {
      logger.warn(`[${componentId.current}] ❌ Cannot bulk delete - missing services`);
      endTimer(`bulk-delete-${operationId}`, { failed: true });
      return false;
    }
    
    setStateWithLog(prev => ({ ...prev, isBulkDeleting: true }), 'bulk-delete-started');
    
    try {
      const success = await services.crud.bulkDeleteBahanBaku(ids);
      
      if (success) {
        logger.debug(`[${componentId.current}] ✅ Bulk delete successful: ${ids.length} items`);
        selection.clearSelection();
        await services.alert.processBulkOperationAlert('bulk_delete', ids.length);
      } else {
        logger.warn(`[${componentId.current}] ❌ Bulk delete failed`);
      }

      endTimer(`bulk-delete-${operationId}`, { success, count: ids.length });
      return success;
    } finally {
      setStateWithLog(prev => ({ ...prev, isBulkDeleting: false }), 'bulk-delete-finished');
    }
  };

  // Utility methods
  const getBahanBakuByName = useCallback((nama: string): BahanBaku | undefined => {
    startTimer('get-bahan-baku-by-name');
    
    try {
      if (!nama || typeof nama !== 'string') {
        logger.error(`[${componentId.current}] ❌ Invalid nama for getBahanBakuByName:`, nama);
        endTimer('get-bahan-baku-by-name', { invalid: true });
        return undefined;
      }
      
      const result = state.bahanBaku.find(bahan => bahan.nama.toLowerCase() === nama.toLowerCase());
      logger.debug(`[${componentId.current}] 🔍 getBahanBakuByName result:`, { nama, found: !!result });
      
      endTimer('get-bahan-baku-by-name', { found: !!result });
      return result;
    } catch (error) {
      logger.error(`[${componentId.current}] ❌ Error in getBahanBakuByName:`, error);
      endTimer('get-bahan-baku-by-name', { error: true });
      return undefined;
    }
  }, [state.bahanBaku]);

  const reduceStok = async (nama: string, jumlah: number): Promise<boolean> => {
    const operationId = Math.random().toString(36).substr(2, 9);
    startTimer(`reduce-stok-${operationId}`);
    
    logger.debug(`[${componentId.current}] 📉 Reducing stock (${operationId}):`, { nama, jumlah });
    
    if (!servicesRef.current.crud) {
      logger.warn(`[${componentId.current}] ❌ Cannot reduce stock - no CRUD service`);
      endTimer(`reduce-stok-${operationId}`, { failed: true });
      return false;
    }
    
    const success = await servicesRef.current.crud.reduceStok(nama, jumlah, state.bahanBaku);
    logger.debug(`[${componentId.current}] ${success ? '✅' : '❌'} Stock reduction result: ${success}`);
    
    endTimer(`reduce-stok-${operationId}`, { success });
    return success;
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
    componentId: componentId.current,
    totalLifetime: Date.now() - initStartTime.current,
    itemCount: state.bahanBaku.length,
    selectedCount: selection.selectedCount,
    selectionMode: selection.isSelectionMode,
    loading: state.isLoading,
    connected: connectionManager.connectionState.isConnected,
    servicesReady: {
      crud: !!servicesRef.current.crud,
      subscription: !!servicesRef.current.subscription,
      alert: !!servicesRef.current.alert
    }
  });

  // 🐛 DEBUG: Log render performance
  useEffect(() => {
    const renderTime = Date.now() - initStartTime.current;
    logger.debug(`[${componentId.current}] 🎨 Provider render completed:`, {
      renderTime,
      isLoading: state.isLoading,
      itemCount: state.bahanBaku.length,
      hasUser: !!user,
      servicesInitialized: !!servicesRef.current.crud
    });
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
    logger.error('useBahanBaku must be used within a BahanBakuProvider');
    throw new Error('useBahanBaku must be used within a BahanBakuProvider');
  }
  
  // 🐛 DEBUG: Log hook usage
  logger.debug('useBahanBaku hook called:', {
    hasContext: !!context,
    loading: context.loading,
    itemCount: context.bahanBaku.length,
    isConnected: context.isConnected
  });
  
  return context;
};