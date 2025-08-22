// src/components/orders/components/dialogs/index.ts - Optimized Dependencies (4 → 4)
/**
 * Orders Dialogs - Essential Dialog Components
 * 
 * Direct exports for better code splitting - no lazy loading at barrel level
 * Keep dependencies at 4 for essential dialog components
 */

// ✅ ESSENTIAL DIALOGS: Core dialog components
// Direct exports dihapus untuk mendorong pemuatan dinamis.
// Gunakan React.lazy di komponen induk:
// const OrderForm = React.lazy(() => import('./dialogs/OrderForm'));

// ✅ DIALOG GROUPS: For batch loading when needed
export const ORDERS_DIALOG_GROUPS = {
  // Form dialogs - order management
  forms: () => Promise.all([
    import('./OrderForm'),
    import('./FollowUpTemplateManager')
  ]).then(([form, template]) => ({
    OrderForm: form.default,
    FollowUpTemplateManager: template.default
  })),
  
  // Bulk operation dialogs
  bulk: () => Promise.all([
    import('./BulkDeleteDialog'),
    import('./BulkEditDialog')
  ]).then(([deleteDialog, editDialog]) => ({
    BulkDeleteDialog: deleteDialog.default,
    BulkEditDialog: editDialog.default
  })),
  
  // All dialogs
  all: () => Promise.all([
    import('./OrderForm'),
    import('./BulkDeleteDialog'),
    import('./BulkEditDialog'),
    import('./FollowUpTemplateManager')
  ]).then(([form, bulkDelete, bulkEdit, template]) => ({
    OrderForm: form.default,
    BulkDeleteDialog: bulkDelete.default,
    BulkEditDialog: bulkEdit.default,
    FollowUpTemplateManager: template.default
  }))
} as const;

// ✅ DIALOG UTILITIES: Helper functions for dialog management
export const ORDERS_DIALOG_UTILS = {
  // Check if dialog should be lazy loaded
  shouldLazyLoad: (dialogName: string): boolean => {
    const heavyDialogs = ['OrderForm', 'FollowUpTemplateManager'];
    return heavyDialogs.includes(dialogName);
  },
  
  // Get dialog component with lazy loading
  getLazyDialog: (dialogName: keyof typeof ORDERS_DIALOG_GROUPS) => {
    const importMap = {
      forms: () => ORDERS_DIALOG_GROUPS.forms(),
      bulk: () => ORDERS_DIALOG_GROUPS.bulk(),
      all: () => ORDERS_DIALOG_GROUPS.all()
    };
    
    return importMap[dialogName] || null;
  },
  
  // Preload critical dialogs
  preloadCriticalDialogs: async () => {
    // Preload most commonly used dialogs
    return await Promise.all([
      import('./OrderForm'),
      import('./FollowUpTemplateManager')
    ]);
  }
} as const;

// ✅ DIALOG CONSTANTS: Dialog-specific constants
export const DIALOG_CONSTANTS = {
  // Default props
  defaults: {
    maxWidth: 'max-w-2xl',
    backdrop: true,
    closeOnOutsideClick: false,
    closeOnEscape: true
  },
  
  // Dialog sizes
  sizes: {
    OrderForm: 'max-w-4xl',
    BulkDeleteDialog: 'max-w-md',
    BulkEditDialog: 'max-w-2xl',
    FollowUpTemplateManager: 'max-w-3xl'
  },
  
  // Loading messages
  loadingMessages: {
    OrderForm: 'Memuat form pesanan...',
    BulkDeleteDialog: 'Memuat dialog hapus...',
    BulkEditDialog: 'Memuat dialog edit...',
    FollowUpTemplateManager: 'Memuat template manager...'
  }
} as const;

// ✅ MIGRATION HELPER: For users upgrading import patterns
export const ORDERS_DIALOGS_MIGRATION = {
  instructions: `
    // CURRENT (direct import - recommended for dialogs):
    import { OrderForm, BulkDeleteDialog } from '@/components/orders/components/dialogs';
    
    // OR (lazy import - best for performance):
    const OrderForm = React.lazy(() => import('@/components/orders/components/dialogs/OrderForm'));
    const BulkDeleteDialog = React.lazy(() => import('@/components/orders/components/dialogs/BulkDeleteDialog'));
    
    // OR (group import - for batch loading):
    const { OrderForm, FollowUpTemplateManager } = await ORDERS_DIALOG_GROUPS.forms();
    const { BulkDeleteDialog, BulkEditDialog } = await ORDERS_DIALOG_GROUPS.bulk();
  `,
  
  // Quick access to dialog groups
  getDialogGroup: async (groupName: keyof typeof ORDERS_DIALOG_GROUPS) => {
    return await ORDERS_DIALOG_GROUPS[groupName]();
  }
} as const;