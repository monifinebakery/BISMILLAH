// src/components/orders/hooks/index.ts - Optimized Dependencies (menggunakan hook Anda)
/**
 * Orders Hooks - Essential Only Exports
 * 
 * HANYA export hooks yang benar-benar diperlukan untuk external consumers
 * Dependencies reduced with your existing optimized hooks
 */

// ✅ CORE HOOKS: Most commonly used hooks (using your existing hooks)
export { useOrderData } from './useOrderData';
export { useOrderUI } from './useOrderUI'; // Your existing optimized hook

// ✅ ESSENTIAL TYPES: Hook return types only
export type {
  UseOrderDataReturn,
  UseOrderUIReturn
} from '../types';

// ✅ OPTIONAL: Advanced hooks for power users (lazy-loaded)
export const ORDERS_HOOKS_ADVANCED = {
  // Data management hooks
  data: () => import('./useOrderData').then(m => ({ useOrderData: m.useOrderData })),
  ui: () => import('./useOrderUI').then(m => ({ useOrderUI: m.useOrderUI })),
  
  // Additional utility hooks (keeping the ones I created for specific features)
  export: () => import('./useOrderExport').then(m => ({ useOrderExport: m.useOrderExport })),
  notifications: () => import('./useOrderNotifications').then(m => ({ useOrderNotifications: m.useOrderNotifications })),
  
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
  
  // Get all hooks including utility ones
  getAllHooks: async () => {
    const [data, ui, exportHook, notifications] = await Promise.all([
      import('./useOrderData'),
      import('./useOrderUI'),
      import('./useOrderExport'),
      import('./useOrderNotifications')
    ]);
    
    return {
      useOrderData: data.useOrderData,
      useOrderUI: ui.useOrderUI,
      useOrderExport: exportHook.useOrderExport,
      useOrderNotifications: notifications.useOrderNotifications
    };
  }
} as const;

// ✅ HOOK PRESETS: Common hook combinations
export const ORDERS_HOOK_PRESETS = {
  // Basic order management - data only
  basic: () => import('./useOrderData').then(m => ({ useOrderData: m.useOrderData })),
  
  // Complete order management - data + UI (your optimized combination)
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
  
  // Full featured - with all utilities
  fullFeatured: async () => {
    const [data, ui, exportHook, notifications] = await Promise.all([
      import('./useOrderData'),
      import('./useOrderUI'),
      import('./useOrderExport'),
      import('./useOrderNotifications')
    ]);
    
    return {
      useOrderData: data.useOrderData,
      useOrderUI: ui.useOrderUI,
      useOrderExport: exportHook.useOrderExport,
      useOrderNotifications: notifications.useOrderNotifications
    };
  },
  
  // UI only - for components that don't need data management
  uiOnly: () => import('./useOrderUI').then(m => ({ useOrderUI: m.useOrderUI }))
} as const;

// ✅ MIGRATION HELPER: For upgrading from full exports
export const ORDERS_HOOKS_MIGRATION = {
  instructions: `
    // RECOMMENDED (essential hooks only):
    import { useOrderData, useOrderUI } from '@/components/orders/hooks';
    
    // OR (direct import - slightly better performance):
    import { useOrderData } from '@/components/orders/hooks/useOrderData';
    import { useOrderUI } from '@/components/orders/hooks/useOrderUI';
    
    // FOR ADDITIONAL FEATURES (lazy-loaded):
    const { useOrderExport } = await ORDERS_HOOKS_ADVANCED.export();
    const { useOrderNotifications } = await ORDERS_HOOKS_ADVANCED.notifications();
    
    // OR (preset import - for complete feature set):
    const hooks = await ORDERS_HOOK_PRESETS.fullFeatured();
  `,
  
  // Quick access to essential hooks
  getEssentialHooks: async () => {
    return await ORDERS_HOOK_PRESETS.complete();
  }
} as const;

// Keep the utility hooks for specific features, but make them optional
export { useOrderExport } from './useOrderExport';
export { useOrderNotifications } from './useOrderNotifications';