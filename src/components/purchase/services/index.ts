// src/components/purchase/services/index.ts - Optimized Dependencies (6 → 3)
/**
 * Purchase Services - Clean API Export
 * 
 * HANYA export services yang benar-benar diperlukan untuk external consumers
 * Dependencies reduced from 6 to 3
 */

// ✅ CORE API: Main purchase API service (most commonly used)
export { purchaseApi } from './purchaseApi';

// ✅ CORE TYPES: Essential API types only
export type {
  PurchaseApiResponse,
  CreatePurchaseRequest,
  UpdatePurchaseRequest
} from '../types/purchase.types';

// ✅ WAREHOUSE INTEGRATION: For stock management
// export { purchaseWarehouseService } from './purchaseWarehouseService';

// ❌ REMOVED - Reduce dependencies:
// - PurchaseApiService (class - use purchaseApi instance instead)
// - PurchaseRealtimeService (internal - accessed via purchaseApi.realtime)
// - purchaseRealtime (internal - use purchaseApi.setupRealtimeSubscription)
// - Detailed API types (import from ../types if needed)

// ✅ OPTIONAL: Advanced services for power users (lazy-loaded)
export const PURCHASE_SERVICES_ADVANCED = {
  // Full API service class for advanced usage
  ApiService: () => import('./purchaseApi').then(m => m.PurchaseApiService),
  
  // Realtime service for direct access
  RealtimeService: () => import('./purchaseApi').then(m => m.PurchaseRealtimeService),
  
  // All service utilities
  utils: () => import('./purchaseApi'),
  
  // All API types
  types: () => import('../types/purchase.types')
} as const;

// ✅ INTERNAL: For advanced internal usage
export const PURCHASE_SERVICES_INTERNAL = {
  // Instance access for advanced customization
  api: () => import('./purchaseApi').then(m => ({ 
    api: m.purchaseApi, 
    realtime: m.purchaseRealtime 
  }))
} as const;