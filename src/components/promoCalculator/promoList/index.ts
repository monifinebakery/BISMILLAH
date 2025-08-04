// src/components/promoCalculator/promoList/index.ts - Optimized Dependencies (6 → 3)
/**
 * PromoCalculator PromoList - Essential Components Only
 * 
 * HANYA components yang essential untuk promo list functionality
 * Dependencies reduced from 6 to 3 - 50% reduction!
 */

// ✅ CORE LIST COMPONENTS: Essential for promo list functionality (3 exports)
export { default as PromoList } from './PromoList';
export { default as PromoTable } from './PromoTable';
export { default as PromoFilters } from './PromoFilters';

// ❌ REMOVED - Better code splitting (3 exports removed):
// - BulkActions (use direct import when bulk operations needed)
// - PromoEditModal (use direct import when editing needed)
// - PromoTableRow (internal component, use direct import)
//
// Use direct imports for better tree-shaking:
// import BulkActions from './BulkActions';
// import PromoEditModal from './PromoEditModal';
// import PromoTableRow from './PromoTableRow';

// ✅ PROMO LIST GROUPS: For batch loading related components
export const PROMO_LIST_GROUPS = {
  // Core list functionality - list, table, filters
  core: () => Promise.all([
    import('./PromoList'),
    import('./PromoTable'),
    import('./PromoFilters')
  ]).then(([list, table, filters]) => ({
    PromoList: list.default,
    PromoTable: table.default,
    PromoFilters: filters.default
  })),
  
  // Table components - table with row component
  table: () => Promise.all([
    import('./PromoTable'),
    import('./PromoTableRow')
  ]).then(([table, row]) => ({
    PromoTable: table.default,
    PromoTableRow: row.default
  })),
  
  // Management components - editing and bulk operations
  management: () => Promise.all([
    import('./BulkActions'),
    import('./PromoEditModal')
  ]).then(([bulk, edit]) => ({
    BulkActions: bulk.default,
    PromoEditModal: edit.default
  })),
  
  // Complete list functionality - all components
  complete: () => Promise.all([
    import('./PromoList'),
    import('./PromoTable'),
    import('./PromoTableRow'),
    import('./PromoFilters'),
    import('./BulkActions'),
    import('./PromoEditModal')
  ]).then(([list, table, row, filters, bulk, edit]) => ({
    PromoList: list.default,
    PromoTable: table.default,
    PromoTableRow: row.default,
    PromoFilters: filters.default,
    BulkActions: bulk.default,
    PromoEditModal: edit.default
  }))
} as const;

// ✅ LIST FUNCTIONALITY: Grouped by functionality
export const PROMO_LIST_FUNCTIONALITY = {
  // Read-only list - viewing only
  readonly: () => PROMO_LIST_GROUPS.core(),
  
  // Interactive list - with row interactions
  interactive: () => PROMO_LIST_GROUPS.table(),
  
  // Full management - all operations
  fullManagement: () => PROMO_LIST_GROUPS.complete()
} as const;

// ✅ LIST UTILITIES: Helper functions for list management
export const PROMO_LIST_UTILS = {
  // Get components by use case
  getComponentsByUseCase: async (useCase: 'readonly' | 'interactive' | 'fullManagement') => {
    return await PROMO_LIST_FUNCTIONALITY[useCase]();
  },
  
  // Check if component is essential for basic list
  isEssentialComponent: (componentName: string): boolean => {
    const essentialComponents = ['PromoList', 'PromoTable', 'PromoFilters'];
    return essentialComponents.includes(componentName);
  },
  
  // Get component loading priority
  getComponentPriority: (componentName: string): 'critical' | 'important' | 'optional' => {
    const priorityMap: Record<string, 'critical' | 'important' | 'optional'> = {
      PromoList: 'critical',
      PromoTable: 'critical',
      PromoFilters: 'important',
      PromoTableRow: 'important',
      BulkActions: 'optional',
      PromoEditModal: 'optional'
    };
    
    return priorityMap[componentName] || 'optional';
  },
  
  // Preload components based on user permissions
  preloadByPermissions: async (permissions: { canEdit: boolean; canBulkAction: boolean }) => {
    const baseComponents = await PROMO_LIST_GROUPS.core();
    
    if (!permissions.canEdit && !permissions.canBulkAction) {
      return baseComponents;
    }
    
    const additionalComponents: any = {};
    
    if (permissions.canEdit) {
      const editModal = await import('./PromoEditModal');
      additionalComponents.PromoEditModal = editModal.default;
    }
    
    if (permissions.canBulkAction) {
      const bulkActions = await import('./BulkActions');
      additionalComponents.BulkActions = bulkActions.default;
    }
    
    return {
      ...baseComponents,
      ...additionalComponents
    };
  }
} as const;

// ✅ LIST CONSTANTS: List-specific configurations
export const LIST_CONSTANTS = {
  // Component roles
  roles: {
    PromoList: 'container',
    PromoTable: 'display',
    PromoFilters: 'filter',
    PromoTableRow: 'item',
    BulkActions: 'action',
    PromoEditModal: 'dialog'
  },
  
  // Default configurations
  defaults: {
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
    filterBy: 'all' as const
  },
  
  // Loading messages
  loading: {
    PromoList: 'Memuat daftar promo...',
    PromoTable: 'Memuat tabel promo...',
    PromoFilters: 'Memuat filter...',
    PromoEditModal: 'Memuat editor promo...',
    BulkActions: 'Memuat aksi bulk...'
  },
  
  // Component dependencies
  dependencies: {
    PromoList: ['PromoTable', 'PromoFilters'],
    PromoTable: ['PromoTableRow'],
    BulkActions: ['PromoTable'],
    PromoEditModal: []
  }
} as const;

// ✅ MIGRATION HELPER: For promo list usage patterns  
export const PROMO_LIST_MIGRATION = {
  instructions: `
    // CURRENT (essential components - still exported):
    import { PromoList, PromoTable, PromoFilters } from '@/components/promoCalculator/promoList';
    
    // FOR REMOVED COMPONENTS (direct import - better performance):
    import BulkActions from '@/components/promoCalculator/promoList/BulkActions';
    import PromoEditModal from '@/components/promoCalculator/promoList/PromoEditModal';
    import PromoTableRow from '@/components/promoCalculator/promoList/PromoTableRow';
    
    // OR (group loading - batch imports):
    const coreComponents = await PROMO_LIST_GROUPS.core();
    const managementComponents = await PROMO_LIST_GROUPS.management();
    
    // OR (by functionality):
    const readonlyList = await PROMO_LIST_FUNCTIONALITY.readonly();
    const fullManagement = await PROMO_LIST_FUNCTIONALITY.fullManagement();
    
    // OR (by permissions):
    const components = await PROMO_LIST_UTILS.preloadByPermissions({
      canEdit: true,
      canBulkAction: false
    });
  `,
  
  // Migration impact checker
  checkMigrationImpact: (currentComponents: string[]) => {
    const removedComponents = ['BulkActions', 'PromoEditModal', 'PromoTableRow'];
    const affectedComponents = currentComponents.filter(comp => removedComponents.includes(comp));
    
    return {
      needsMigration: affectedComponents.length > 0,
      affectedComponents,
      severity: affectedComponents.length > 2 ? 'high' : affectedComponents.length > 0 ? 'medium' : 'low',
      recommendation: affectedComponents.length > 0 
        ? `Use direct imports or group loading for: ${affectedComponents.join(', ')}`
        : 'No migration needed'
    };
  },
  
  // Get setup for common use cases
  getCommonSetups: async () => {
    const [readonly, interactive, full] = await Promise.all([
      PROMO_LIST_FUNCTIONALITY.readonly(),
      PROMO_LIST_FUNCTIONALITY.interactive(), 
      PROMO_LIST_FUNCTIONALITY.fullManagement()
    ]);
    
    return {
      readonly,
      interactive,
      fullManagement: full,
      utils: PROMO_LIST_UTILS,
      constants: LIST_CONSTANTS
    };
  }
} as const;