// src/components/warehouse/services/types/serviceTypes.ts
// Centralized type definitions for warehouse services

export interface SyncResult {
  itemId: string;
  itemName: string;
  oldWac?: number;
  newWac?: number;
  oldStock?: number;
  newStock?: number;
  status: 'success' | 'error' | 'skipped';
  message: string;
}

export interface SyncSummary {
  totalItems: number;
  successful: number;
  failed: number;
  skipped: number;
  results: SyncResult[];
  duration: number;
}

export interface WarehouseServiceConfig {
  userId: string;
  enableLogging?: boolean;
  validateWac?: boolean;
  strictMode?: boolean;
}

export interface MaterialUpdateData {
  stok: number;
  harga_rata_rata: number;
  harga_satuan?: number;
  supplier?: string;
  updated_at: string;
}

export interface PurchaseHistoryQuery {
  userId: string;
  status?: 'completed' | 'pending' | 'cancelled';
  dateFrom?: string;
  dateTo?: string;
}

export interface WacRecalculationOptions {
  itemId?: string; // If specified, only recalculate this item
  forceRecalculation?: boolean; // Force recalculation even if WAC seems correct
  dryRun?: boolean; // Only calculate, don't update database
}