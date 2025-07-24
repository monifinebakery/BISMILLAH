// Services exports with dynamic imports for code splitting

// Core service
export { PurchaseService } from './purchaseService';
export type { 
  PurchaseServiceConfig,
  CreatePurchaseData,
  UpdatePurchaseData 
} from './purchaseService';

// Data transformers
export {
  transformPurchaseFromDB,
  transformPurchaseToDB,
  transformPurchasesFromDB,
  getStatusDisplayText,
  getStatusColorClass,
  getSupplierName,
  calculateTotalItems,
  formatPurchaseSummary
} from './purchaseTransformers';

// Validators
export {
  validatePurchaseForm,
  validatePurchaseItem,
  validateItemForm,
  validateBulkDelete,
  validateStatusChange,
  validateSearchTerm,
  validatePagination
} from './purchaseValidators';

export type {
  ValidationResult,
  PurchaseFormData,
  ItemFormData
} from './purchaseValidators';

// Dynamic imports for lazy loading
export const PurchaseServices = {
  // Service factory with lazy loading
  createService: (config: { userId: string }) => 
    import('./purchaseService').then(m => new m.PurchaseService(config)),
    
  // Transformer utilities
  transformers: () => import('./purchaseTransformers'),
  
  // Validation utilities  
  validators: () => import('./purchaseValidators'),
};

// Utility function to create configured service instance
export const createPurchaseService = async (userId: string) => {
  const { PurchaseService } = await import('./purchaseService');
  return new PurchaseService({ userId });
};

// Batch operations utility
export const createBatchOperations = async (userId: string) => {
  const service = await createPurchaseService(userId);
  
  return {
    // Batch create multiple purchases
    batchCreate: async (purchases: any[]) => {
      const results = await Promise.allSettled(
        purchases.map(purchase => service.createPurchase(purchase))
      );
      
      return {
        successful: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        errors: results
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map(r => r.reason)
      };
    },
    
    // Batch update multiple purchases
    batchUpdate: async (updates: Array<{ id: string; data: any }>) => {
      const results = await Promise.allSettled(
        updates.map(({ id, data }) => service.updatePurchase(id, data))
      );
      
      return {
        successful: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        errors: results
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map(r => r.reason)
      };
    },
    
    // Batch delete multiple purchases
    batchDelete: async (ids: string[]) => {
      return await service.bulkDeletePurchases(ids);
    }
  };
};