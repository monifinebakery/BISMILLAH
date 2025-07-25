// Purchase utilities exports with dynamic imports for code splitting

// Purchase helper functions
export {
  calculatePurchaseStats,
  groupPurchasesBySupplier,
  filterPurchasesByDateRange,
  getCurrentMonthPurchases,
  getRecentPurchases,
  findDuplicatePurchases,
  calculateTotalItems,
  getMostPurchasedItems,
  generatePurchaseReport,
  exportPurchasesToCSV,
  comparePurchases,
  validatePurchaseConsistency
} from './purchaseHelpers';

// Table helper functions
export {
  sortPurchases,
  paginatePurchases,
  calculatePaginationInfo,
  generatePageNumbers,
  TableSelectionManager,
  createTableColumns,
  createDefaultPaginationConfig,
  updatePaginationConfig,
  calculateVisiblePageRange,
  formatTableCell
} from './tableHelpers';

// Form helper functions - lazy loaded
export const FormHelpers = {
  validators: () => import('./formHelpers').then(m => m.FormValidators),
  formatters: () => import('./formHelpers').then(m => m.FormFormatters),
  transformers: () => import('./formHelpers').then(m => m.FormTransformers),
};

// Dynamic imports for utilities
export const PurchaseUtilities = {
  // Purchase analysis tools
  analytics: () => import('./purchaseHelpers').then(m => ({
    calculateStats: m.calculatePurchaseStats,
    groupBySupplier: m.groupPurchasesBySupplier,
    findDuplicates: m.findDuplicatePurchases,
    generateReport: m.generatePurchaseReport,
  })),

  // Table management tools
  table: () => import('./tableHelpers').then(m => ({
    sort: m.sortPurchases,
    paginate: m.paginatePurchases,
    selection: m.TableSelectionManager,
    createColumns: m.createTableColumns,
    formatCell: m.formatTableCell,
  })),

  // Export utilities
  export: () => import('./purchaseHelpers').then(m => ({
    toCSV: m.exportPurchasesToCSV,
    toReport: m.generatePurchaseReport,
  })),

  // Validation utilities
  validation: () => import('./purchaseHelpers').then(m => ({
    checkConsistency: m.validatePurchaseConsistency,
    compare: m.comparePurchases,
  })),
};

// Convenience functions for common operations
export const createPurchaseAnalytics = async () => {
  const helpers = await import('./purchaseHelpers');
  
  return {
    /**
     * Analyze purchases for dashboard metrics
     */
    analyzeDashboard: (purchases: any[], suppliers: any[]) => ({
      stats: helpers.calculatePurchaseStats(purchases),
      recent: helpers.getRecentPurchases(purchases, 7),
      currentMonth: helpers.getCurrentMonthPurchases(purchases),
      topSuppliers: helpers.groupPurchasesBySupplier(purchases, suppliers).slice(0, 5),
      topItems: helpers.getMostPurchasedItems(purchases, 5),
    }),

    /**
     * Generate comprehensive report
     */
    generateFullReport: (purchases: any[], suppliers: any[]) => 
      helpers.generatePurchaseReport(purchases, suppliers),

    /**
     * Find data quality issues
     */
    findIssues: (purchases: any[]) => ({
      duplicates: helpers.findDuplicatePurchases(purchases),
      inconsistencies: purchases.map(p => ({
        id: p.id,
        errors: helpers.validatePurchaseConsistency(p)
      })).filter(item => item.errors.length > 0),
    }),
  };
};

export const createTableManager = async () => {
  const helpers = await import('./tableHelpers');
  
  return {
    /**
     * Create a complete table management instance
     */
    create: (initialData: any[] = []) => {
      const selectionManager = new helpers.TableSelectionManager();
      
      return {
        // Selection management
        selection: selectionManager,
        
        // Data operations
        sort: (data: any[], config: any) => helpers.sortPurchases(data, config),
        paginate: (data: any[], page: number, size: number) => 
          helpers.paginatePurchases(data, page, size),
        
        // UI helpers
        createColumns: (options: any) => helpers.createTableColumns(options),
        formatCell: (value: any, type: string) => helpers.formatTableCell(value, type as any),
        calculatePagination: (page: number, size: number, total: number) =>
          helpers.calculatePaginationInfo(page, size, total),
      };
    }
  };
};

// Export utilities as classes for better organization
export class PurchaseAnalyzer {
  constructor(private purchases: any[], private suppliers: any[]) {}

  getStats() {
    return calculatePurchaseStats(this.purchases);
  }

  groupBySupplier() {
    return groupPurchasesBySupplier(this.purchases, this.suppliers);
  }

  getRecentPurchases(days: number = 7) {
    return getRecentPurchases(this.purchases, days);
  }

  findDuplicates() {
    return findDuplicatePurchases(this.purchases);
  }

  generateReport() {
    return generatePurchaseReport(this.purchases, this.suppliers);
  }

  exportToCSV() {
    return exportPurchasesToCSV(this.purchases, this.suppliers);
  }
}

export class PurchaseTableManager {
  private selectionManager: TableSelectionManager;

  constructor(private data: any[] = []) {
    this.selectionManager = new TableSelectionManager();
  }

  // Selection methods
  toggleSelection(id: string) {
    return this.selectionManager.toggle(id);
  }

  selectAll() {
    return this.selectionManager.selectAll(this.data);
  }

  clearSelection() {
    return this.selectionManager.clear();
  }

  getSelected() {
    return this.selectionManager.getSelected();
  }

  // Data manipulation methods
  sort(config: any) {
    return sortPurchases(this.data, config);
  }

  paginate(page: number, size: number) {
    return paginatePurchases(this.data, page, size);
  }

  updateData(newData: any[]) {
    this.data = newData;
  }
}

// Default export with all utilities
export default {
  PurchaseAnalyzer,
  PurchaseTableManager,
  createPurchaseAnalytics,
  createTableManager,
  PurchaseUtilities,
};