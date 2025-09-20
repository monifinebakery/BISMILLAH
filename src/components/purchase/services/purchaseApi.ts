// src/components/purchase/services/purchaseApi.ts
// Updated facade that exports from refactored modules for backward compatibility

import type { Purchase } from '../types/purchase.types';

// Import all functions from the new refactored modules
import {
  fetchPurchases,
  fetchPaginatedPurchases,
  fetchPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
  bulkDeletePurchases,
  setPurchaseStatus,
  completePurchase,
  getPurchaseStats,
  getPurchasesByDateRange,
  searchPurchases
} from './crud/purchaseCrudService';

import {
  createPurchaseAndFetch as newCreatePurchaseAndFetch,
  updatePurchaseAndFetch as newUpdatePurchaseAndFetch,
  setStatusAndFetch as newSetStatusAndFetch
} from './purchaseApiRefactored';

import {
  deletePurchaseWithCleanup
} from './validation/purchaseValidationService';

// Re-export all individual functions for backward compatibility
export {
  // CRUD operations
  fetchPurchases,
  fetchPaginatedPurchases,
  fetchPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
  bulkDeletePurchases,
  
  // Status operations
  setPurchaseStatus,
  completePurchase,
  
  // Validation operations
  getPurchaseStats,
  getPurchasesByDateRange,
  searchPurchases,
  
  // Special operations
  deletePurchaseWithCleanup
};

/**
 * Create then fetch created purchase (backward compatibility)
 */
export async function createPurchaseAndFetch(
  purchaseData: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<{ data: Purchase | null; error: string | null }> {
  return newCreatePurchaseAndFetch(purchaseData, userId);
}

/**
 * Update then fetch updated purchase (backward compatibility)
 */
export async function updatePurchaseAndFetch(
  id: string,
  updatedData: Partial<Purchase>,
  userId: string
): Promise<{ data: Purchase | null; error: string | null }> {
  return newUpdatePurchaseAndFetch(id, updatedData, userId);
}

/**
 * Set status then fetch updated purchase (backward compatibility)
 */
export async function setStatusAndFetch(
  id: string,
  userId: string,
  newStatus: Purchase['status']
): Promise<{ data: Purchase | null; error: string | null }> {
  return newSetStatusAndFetch(id, userId, newStatus);
}

// For backward compatibility, we'll create a class that mimics the old API
export class PurchaseApiService {
  static fetchPurchases = fetchPurchases;
  static fetchPaginatedPurchases = fetchPaginatedPurchases;
  static fetchPurchaseById = fetchPurchaseById;
  static createPurchase = createPurchase;
  static updatePurchase = updatePurchase;
  static deletePurchase = deletePurchase;
  static bulkDeletePurchases = bulkDeletePurchases;
  static setPurchaseStatus = setPurchaseStatus;
  static completePurchase = completePurchase;
  static getPurchaseStats = getPurchaseStats;
  static getPurchasesByDateRange = getPurchasesByDateRange;
  static searchPurchases = searchPurchases;
  static createPurchaseAndFetch = createPurchaseAndFetch;
  static updatePurchaseAndFetch = updatePurchaseAndFetch;
  static setStatusAndFetch = setStatusAndFetch;
  static deletePurchaseWithCleanup = deletePurchaseWithCleanup;
}

// Export instances for backward compatibility
export const purchaseApi = {
  fetchPurchases,
  fetchPaginatedPurchases,
  fetchPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
  bulkDeletePurchases,
  setPurchaseStatus,
  completePurchase,
  getPurchaseStats,
  getPurchasesByDateRange,
  searchPurchases,
  createPurchaseAndFetch,
  updatePurchaseAndFetch,
  setStatusAndFetch,
  deletePurchaseWithCleanup
};

// Note: We're not implementing the realtime service here as it's not part of the refactored modules
// but we could add it if needed
export class PurchaseRealtimeService {
  static subscribe() {
    // Implementation would go here
    return () => {};
  }
  
  static unsubscribe() {
    // Implementation would go here
  }
  
  static unsubscribeAll() {
    // Implementation would go here
  }
}

export const purchaseRealtime = PurchaseRealtimeService;

// Additional instance exports for immediate use
export const purchaseApiInstance = purchaseApi;
export const purchaseRealtimeInstance = new PurchaseRealtimeService();