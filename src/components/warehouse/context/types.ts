// src/components/warehouse/context/types.ts
import { BahanBaku } from '../types/warehouse';

export interface ConnectionState {
  isConnected: boolean;
  retryCount: number;
  maxRetries: number;
  baseRetryDelay: number;
}

export interface NotificationCache {
  key: string;
  timestamp: number;
}

export interface AlertState {
  alertsChecked: boolean;
  lastAlertCheck: number;
  alertTimeout?: NodeJS.Timeout;
}

export interface ContextState {
  bahanBaku: BahanBaku[];
  isLoading: boolean;
  isBulkDeleting: boolean;
  selectedItems: string[];
  isSelectionMode: boolean;
}

export interface ContextActions {
  // CRUD Operations
  addBahanBaku: (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateBahanBaku: (id: string, updates: Partial<BahanBaku>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  bulkDeleteBahanBaku: (ids: string[]) => Promise<boolean>;
  
  // Selection Operations
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleSelectionMode: () => void;
  isSelected: (id: string) => boolean;
  getSelectedItems: () => BahanBaku[];
  
  // Utility Operations
  getBahanBakuByName: (nama: string) => BahanBaku | undefined;
  reduceStok: (nama: string, jumlah: number) => Promise<boolean>;
  refreshData: () => Promise<void>;
  checkInventoryAlerts: () => Promise<void>;
  
  // Analytics
  getExpiringItems: (days?: number) => BahanBaku[];
  getLowStockItems: () => BahanBaku[];
  getOutOfStockItems: () => BahanBaku[];
}

export interface BahanBakuContextType extends ContextState, ContextActions {
  isConnected: boolean;
}

export interface ContextDeps {
  user: any; // From AuthContext
  addActivity: (activity: any) => void; // From ActivityContext
  addNotification: (notification: any) => Promise<void>; // From NotificationContext
}