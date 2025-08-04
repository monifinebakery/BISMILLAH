// src/components/orders/hooks/index.ts - Optimized Dependencies (3 → 2)
/**
 * Orders Hooks - Essential Only Exports
 * 
 * HANYA export hooks yang benar-benar diperlukan untuk external consumers
 * Dependencies reduced from 3 to 2
 */

// ✅ CORE HOOKS: Most commonly used hooks
export { useOrderData } from './useOrderData';
export { useOrderUI } from './useOrderUI';

// ✅ ESSENTIAL TYPES: Hook return types only
export type {
  UseOrderDataReturn,
  UseOrderUIReturn
} from '../types';

// ❌ REMOVED - Reduce dependencies:
// - Context hooks (use direct imports from context)
// - Detailed hook types (import from ../types if needed)
// - Utility hooks (create if needed, import directly)
//
// Use direct imports if these are needed:
// import { useOrder } from '../context/OrderContext';

// ✅ OPTIONAL: Advanced hooks for power users (lazy-loaded)
export const ORDERS_HOOKS_ADVANCED = {
  // Data management hooks
  data: () => import('./useOrderData').then(m => ({ useOrderData: m.useOrderData })),
  ui: () => import('./useOrderUI').then(m => ({ useOrderUI: m.useOrderUI })),
  
  // All hook types
  types: () => import('../types').then(m => ({
    UseOrderDataReturn: m.UseOrderDataReturn,
    UseOrderUIReturn: m.UseOrderUIReturn
  }))
} as const;

// ✅ HOOK UTILITIES: Grouped for convenience
export const ORDERS_HOOK_UTILS = {
  // Create composite hook combining data and UI
  createOrderManager: async (orders: any[], itemsPerPage: number = 10) => {
    const [dataHook, uiHook] = await Promise.all([
      import('./useOrderData'),
      import('./useOrderUI')
    ]);
    
    return {
      useOrderData: dataHook.useOrderData,
      useOrderUI: (orders: any[]) => uiHook.useOrderUI(orders, itemsPerPage)
    };
  },
  
  // Get all hooks
  getAllHooks: async () => {
    const [data, ui] = await Promise.all([
      import('./useOrderData'),
      import('./useOrderUI')
    ]);
    
    return {
      useOrderData: data.useOrderData,
      useOrderUI: ui.useOrderUI
    };
  }
} as const;

// ✅ HOOK PRESETS: Common hook combinations
export const ORDERS_HOOK_PRESETS = {
  // Basic order management - data only
  basic: () => import('./useOrderData').then(m => ({ useOrderData: m.useOrderData })),
  
  // Complete order management - data + UI
  complete: async () => {
    const [data, ui] = await Promise.all([
      import('./useOrderData'),
      import('./useOrderUI')
    ]);
    
    return {
      useOrderData: data.useOrderData,
      useOrderUI: ui.useOrderUI
    };
  },
  
  // UI only - for components that don't need data management
  uiOnly: () => import('./useOrderUI').then(m => ({ useOrderUI: m.useOrderUI }))
} as const;

// ✅ MIGRATION HELPER: For upgrading from full exports
export const ORDERS_HOOKS_MIGRATION = {
  instructions: `
    // OLD (full import):
    import { useOrderData, useOrderUI } from '@/components/orders/hooks';
    
    // NEW (still supported - these are essential):
    import { useOrderData, useOrderUI } from '@/components/orders/hooks';
    
    // OR (direct import - slightly better performance):
    import { useOrderData } from '@/components/orders/hooks/useOrderData';
    import { useOrderUI } from '@/components/orders/hooks/useOrderUI';
    
    // OR (preset import - for specific use cases):
    const { useOrderData, useOrderUI } = await ORDERS_HOOK_PRESETS.complete();
  `,
  
  // Quick access to essential hooks
  getEssentialHooks: async () => {
    return await ORDERS_HOOK_PRESETS.complete();
  }
} as const;