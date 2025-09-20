// src/components/warehouse/services/warehouseSyncService.ts
// Refactored modular WarehouseSyncService using smaller service modules

import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { toNumber } from '../utils/typeUtils';

// Import service modules
import { calculateEnhancedWac, calculateNewWac } from './core/wacCalculationService';
import { getAllMaterials } from './core/materialSearchService';
import { 
  validateWarehouseIntegrity, 
  checkWarehouseConsistency,
  type WarehouseConsistencyCheck,
  type ValidationResult
} from './core/warehouseValidationService';
import { 
  applyPurchaseToWarehouse, 
  reversePurchaseFromWarehouse 
} from './core/purchaseSyncService';

// Import types
import type { 
  SyncResult, 
  SyncSummary, 
  WarehouseServiceConfig,
  WacRecalculationOptions 
} from './types/serviceTypes';

// Re-export types for backward compatibility  
export interface WACCalculationResult {
  newWac: number;
  newStock: number;
  preservedPrice?: number;
  validationWarnings: string[];
}

export { type SyncResult, type SyncSummary, type WarehouseConsistencyCheck };

/**
 * Main WarehouseSyncService class - refactored to use modular services
 */
export class WarehouseSyncService {
  private config: WarehouseServiceConfig;

  constructor(userId: string, options?: Partial<WarehouseServiceConfig>) {
    this.config = {
      userId,
      enableLogging: true,
      validateWac: true,
      strictMode: false,
      ...options
    };
  }

  get userId(): string {
    return this.config.userId;
  }

  /**
   * Apply purchase to warehouse using the modular service
   */
  async applyPurchase(purchase: any): Promise<void> {
    return applyPurchaseToWarehouse(purchase);
  }

  /**
   * Reverse purchase from warehouse using the modular service
   */
  async reversePurchase(purchase: any): Promise<void> {
    return reversePurchaseFromWarehouse(purchase);
  }

  /**
   * Manually recalculate WAC for all warehouse items
   */
  async recalculateAllWAC(options?: WacRecalculationOptions): Promise<SyncSummary> {
    const startTime = Date.now();
    const results: SyncResult[] = [];

    try {
      logger.info('Starting manual WAC recalculation for user:', this.userId);

      // Get all warehouse items
      const warehouseItems = await getAllMaterials(this.userId);

      // Get all completed purchases
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('items')
        .eq('user_id', this.userId)
        .eq('status', 'completed');

      if (purchaseError) throw purchaseError;

      // Process each warehouse item (or single item if specified)
      const itemsToProcess = options?.itemId 
        ? warehouseItems.filter(item => item.id === options.itemId)
        : warehouseItems;

      for (const item of itemsToProcess) {
        try {
          const result = await this.recalculateItemWAC(item, purchases || []);
          results.push(result);
        } catch (error) {
          logger.error('Error processing item WAC:', error);
          results.push({
            itemId: item.id,
            itemName: item.nama,
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'error').length;
      const skipped = results.filter(r => r.status === 'skipped').length;

      return {
        totalItems: results.length,
        successful,
        failed,
        skipped,
        results,
        duration: Date.now() - startTime
      };

    } catch (error) {
      logger.error('Error in recalculateAllWAC:', error);
      throw error;
    }
  }

  /**
   * Recalculate WAC for a single item
   */
  private async recalculateItemWAC(item: any, purchases: any[]): Promise<SyncResult> {
    const oldWac = item.harga_rata_rata || 0;
    const oldVersion = item.version || 1;
    
    // Calculate new WAC from purchase history
    let totalQuantity = 0;
    let totalValue = 0;

    purchases?.forEach(purchase => {
      if (purchase.items && Array.isArray(purchase.items)) {
        purchase.items.forEach((purchaseItem: any) => {
          // Flexible ID matching - handle all possible ID field names
          const itemId = purchaseItem.bahanBakuId || purchaseItem.bahan_baku_id || purchaseItem.id;
          
          if (itemId === item.id) {
            // Standardized field matching - use consistent field names
            const qty = toNumber(purchaseItem.quantity || 0);
            const price = toNumber(purchaseItem.unitPrice || 0);
            totalQuantity += qty;
            totalValue += qty * price;
          }
        });
      }
    });

    const newWac = totalQuantity > 0 ? totalValue / totalQuantity : item.harga_satuan;

    // Update the item with new WAC if it changed significantly
    if (Math.abs(newWac - oldWac) > 0.01) {
      const { data: updatedItem, error: updateError } = await supabase
        .from('bahan_baku')
        .update({ 
          harga_rata_rata: newWac,
          version: oldVersion + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
        .eq('user_id', this.userId)
        .eq('version', oldVersion) // Optimistic locking - only update if version matches
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Check if update was successful (affected rows > 0)
      if (!updatedItem) {
        // Version mismatch - another process updated the item, retry or fail
        throw new Error(`WAC update failed due to concurrent modification. Please retry.`);
      }

      return {
        itemId: item.id,
        itemName: item.nama,
        oldWac,
        newWac,
        status: 'success',
        message: `WAC updated from ${oldWac.toFixed(4)} to ${newWac.toFixed(4)}`
      };
    } else {
      return {
        itemId: item.id,
        itemName: item.nama,
        oldWac,
        newWac,
        status: 'skipped',
        message: 'WAC unchanged (difference < 0.01)'
      };
    }
  }

  /**
   * Fix a single warehouse item by recalculating its WAC
   */
  async fixWarehouseItem(itemId: string): Promise<SyncResult> {
    try {
      // Get current item
      const { data: currentItem, error: itemError } = await supabase
        .from('bahan_baku')
        .select('id, nama, stok, harga_rata_rata, harga_satuan')
        .eq('id', itemId)
        .eq('user_id', this.userId)
        .single();

      if (itemError || !currentItem) {
        return {
          itemId,
          itemName: 'Unknown',
          status: 'error',
          message: 'Item tidak ditemukan'
        };
      }

      const oldWac = currentItem.harga_rata_rata;

      // Calculate new WAC from purchase history
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('items')
        .eq('user_id', this.userId)
        .eq('status', 'completed');

      if (purchaseError) {
        throw purchaseError;
      }

      return this.recalculateItemWAC(currentItem, purchases || []);

    } catch (error) {
      logger.error('Error fixing warehouse item:', error);
      return {
        itemId,
        itemName: 'Unknown',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate warehouse data integrity using the modular service
   */
  async validateWarehouseIntegrity(): Promise<ValidationResult> {
    return validateWarehouseIntegrity(this.userId);
  }

  /**
   * Check warehouse consistency using the modular service
   */
  async checkWarehouseConsistency(): Promise<WarehouseConsistencyCheck[]> {
    return checkWarehouseConsistency(this.userId);
  }

  /**
   * Generate detailed warehouse sync report
   */
  async generateSyncReport(): Promise<{
    summary: SyncSummary;
    consistencyIssues: WarehouseConsistencyCheck[];
    integrityReport: ValidationResult;
    timestamp: string;
  }> {
    const startTime = Date.now();

    logger.info('Generating comprehensive warehouse sync report');

    const [summary, consistencyIssues, integrityReport] = await Promise.all([
      this.recalculateAllWAC(),
      this.checkWarehouseConsistency(),
      this.validateWarehouseIntegrity()
    ]);

    const report = {
      summary,
      consistencyIssues,
      integrityReport,
      timestamp: new Date().toISOString()
    };

    const totalTime = Date.now() - startTime;
    logger.info(`Warehouse sync report generated in ${totalTime}ms`, {
      wacUpdates: summary.successful,
      consistencyIssues: consistencyIssues.length,
      integrityErrors: integrityReport.errors.length
    });

    return report;
  }

  /**
   * Get warehouse statistics
   */
  async getWarehouseStats(): Promise<{
    totalItems: number;
    lowStockItems: number;
    negativeStockItems: number;
    itemsWithoutWac: number;
    totalValue: number;
  }> {
    try {
      const materials = await getAllMaterials(this.userId);
      
      let totalItems = materials.length;
      let lowStockItems = 0;
      let negativeStockItems = 0;
      let itemsWithoutWac = 0;
      let totalValue = 0;

      materials.forEach(item => {
        // Low stock check
        if (item.stok <= item.minimum) {
          lowStockItems++;
        }

        // Negative stock check
        if (item.stok < 0) {
          negativeStockItems++;
        }

        // WAC check
        if (!item.harga_rata_rata || item.harga_rata_rata <= 0) {
          itemsWithoutWac++;
        }

        // Total value calculation
        const itemValue = (item.harga_rata_rata || item.harga_satuan || 0) * item.stok;
        if (itemValue > 0) {
          totalValue += itemValue;
        }
      });

      return {
        totalItems,
        lowStockItems,
        negativeStockItems,
        itemsWithoutWac,
        totalValue
      };
    } catch (error) {
      logger.error('Error getting warehouse stats:', error);
      throw error;
    }
  }
}

/**
 * Factory function to create WarehouseSyncService instance
 */
export const createWarehouseSyncService = (
  userId: string, 
  options?: Partial<WarehouseServiceConfig>
): WarehouseSyncService => {
  return new WarehouseSyncService(userId, options);
};

// Re-export the main functions for backward compatibility
export { 
  calculateNewWac,
  calculateEnhancedWac,
  applyPurchaseToWarehouse,
  reversePurchaseFromWarehouse
};

export default WarehouseSyncService;