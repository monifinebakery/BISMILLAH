// src/components/purchase/services/purchaseWarehouseService.ts

import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import type { Purchase, PurchaseItem, PurchaseStatus } from '../types/purchase.types';
import type { BahanBaku } from '@/components/warehouse/types';

/**
 * Service untuk integrasi Purchase dengan Warehouse
 * Handles automatic stock updates when purchase status changes to 'completed'
 */

interface PurchaseWarehouseServiceConfig {
  warehouseContext: {
    updateBahanBaku: (id: string, updates: Partial<BahanBaku>) => Promise<boolean>;
    getBahanBakuByName: (nama: string) => BahanBaku | undefined;
    addBahanBaku: (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
    bahanBaku: BahanBaku[];
  };
  userId: string;
  enableDebugLogs?: boolean;
}

interface StockUpdateResult {
  success: boolean;
  updatedItems: number;
  createdItems: number;
  errors: string[];
  details: Array<{
    itemName: string;
    action: 'updated' | 'created' | 'error';
    oldStock?: number;
    newStock?: number;
    error?: string;
  }>;
}

export class PurchaseWarehouseService {
  private config: PurchaseWarehouseServiceConfig;
  private serviceId: string;

  constructor(config: PurchaseWarehouseServiceConfig) {
    this.config = config;
    this.serviceId = `PurchaseWarehouseService-${Date.now()}`;
    
    if (this.config.enableDebugLogs) {
      logger.debug(`[${this.serviceId}] 🔄 Service initialized`);
    }
  }

  /**
   * Main method: Handle purchase status change and update warehouse accordingly
   */
  async handlePurchaseStatusChange(
    purchase: Purchase,
    oldStatus: PurchaseStatus,
    newStatus: PurchaseStatus
  ): Promise<boolean> {
    if (this.config.enableDebugLogs) {
      logger.debug(`[${this.serviceId}] 📦 Status change: ${oldStatus} → ${newStatus} for purchase ${purchase.id}`);
    }

    try {
      // If status changed to 'completed', add stock to warehouse
      if (newStatus === 'completed' && oldStatus !== 'completed') {
        const result = await this.addStockFromPurchase(purchase);
        return this.handleStockUpdateResult(result, 'added');
      }

      // If status changed from 'completed' to something else, remove stock
      if (oldStatus === 'completed' && newStatus !== 'completed') {
        const result = await this.removeStockFromPurchase(purchase);
        return this.handleStockUpdateResult(result, 'removed');
      }

      return true; // No stock changes needed
    } catch (error) {
      logger.error(`[${this.serviceId}] ❌ Status change handling failed:`, error);
      toast.error('Gagal mengupdate stok warehouse');
      return false;
    }
  }

  /**
   * Add stock to warehouse from completed purchase
   */
  private async addStockFromPurchase(purchase: Purchase): Promise<StockUpdateResult> {
    const result: StockUpdateResult = {
      success: true,
      updatedItems: 0,
      createdItems: 0,
      errors: [],
      details: []
    };

    if (this.config.enableDebugLogs) {
      logger.debug(`[${this.serviceId}] ➕ Adding stock from purchase ${purchase.id} with ${purchase.items.length} items`);
    }

    for (const item of purchase.items) {
      try {
        const updateResult = await this.addSingleItemStock(item, purchase);
        result.details.push(updateResult);
        
        if (updateResult.action === 'updated') {
          result.updatedItems++;
        } else if (updateResult.action === 'created') {
          result.createdItems++;
        } else if (updateResult.action === 'error') {
          result.errors.push(updateResult.error!);
          result.success = false;
        }
      } catch (error) {
        const errorMsg = `Error processing ${item.nama}: ${error}`;
        result.errors.push(errorMsg);
        result.details.push({
          itemName: item.nama,
          action: 'error',
          error: errorMsg
        });
        result.success = false;
      }
    }

    return result;
  }

  /**
   * Remove stock from warehouse when purchase is no longer completed
   */
  private async removeStockFromPurchase(purchase: Purchase): Promise<StockUpdateResult> {
    const result: StockUpdateResult = {
      success: true,
      updatedItems: 0,
      createdItems: 0,
      errors: [],
      details: []
    };

    if (this.config.enableDebugLogs) {
      logger.debug(`[${this.serviceId}] ➖ Removing stock from purchase ${purchase.id}`);
    }

    for (const item of purchase.items) {
      try {
        const bahanBaku = this.findBahanBakuForItem(item);
        if (!bahanBaku) {
          const errorMsg = `Bahan baku ${item.nama} tidak ditemukan di warehouse`;
          result.errors.push(errorMsg);
          result.details.push({
            itemName: item.nama,
            action: 'error',
            error: errorMsg
          });
          continue;
        }

        const oldStock = bahanBaku.stok;
        const newStock = Math.max(0, oldStock - item.kuantitas);

        const success = await this.config.warehouseContext.updateBahanBaku(bahanBaku.id, {
          stok: newStock
        });

        if (success) {
          result.updatedItems++;
          result.details.push({
            itemName: item.nama,
            action: 'updated',
            oldStock,
            newStock
          });

          if (this.config.enableDebugLogs) {
            logger.debug(`[${this.serviceId}] ✅ Stock reduced: ${item.nama} ${oldStock} → ${newStock}`);
          }
        } else {
          throw new Error('Update warehouse failed');
        }
      } catch (error) {
        const errorMsg = `Error reducing stock for ${item.nama}: ${error}`;
        result.errors.push(errorMsg);
        result.details.push({
          itemName: item.nama,
          action: 'error',
          error: errorMsg
        });
        result.success = false;
      }
    }

    return result;
  }

  /**
   * Add stock for a single purchase item
   */
  private async addSingleItemStock(
    item: PurchaseItem, 
    purchase: Purchase
  ): Promise<StockUpdateResult['details'][0]> {
    // Try to find existing bahan baku by bahanBakuId first, then by name
    let bahanBaku = this.config.warehouseContext.bahanBaku.find(b => b.id === item.bahanBakuId);
    
    if (!bahanBaku) {
      bahanBaku = this.findBahanBakuForItem(item);
    }

    if (bahanBaku) {
      // Update existing item stock
      return await this.updateExistingStock(bahanBaku, item);
    } else {
      // Create new bahan baku entry
      return await this.createNewBahanBaku(item, purchase);
    }
  }

  /**
   * Update stock for existing bahan baku
   */
  private async updateExistingStock(
    bahanBaku: BahanBaku, 
    item: PurchaseItem
  ): Promise<StockUpdateResult['details'][0]> {
    const oldStock = bahanBaku.stok;
    const newStock = oldStock + item.kuantitas;

    // Update with new stock and potentially new price (FIFO/LIFO calculation could be added here)
    const updates: Partial<BahanBaku> = {
      stok: newStock,
      harga_satuan: item.hargaSatuan, // Update with latest purchase price
      supplier: bahanBaku.supplier || 'Unknown' // Keep existing supplier if available
    };

    const success = await this.config.warehouseContext.updateBahanBaku(bahanBaku.id, updates);

    if (success) {
      if (this.config.enableDebugLogs) {
        logger.debug(`[${this.serviceId}] ✅ Stock updated: ${item.nama} ${oldStock} → ${newStock}`);
      }

      return {
        itemName: item.nama,
        action: 'updated',
        oldStock,
        newStock
      };
    } else {
      throw new Error('Failed to update warehouse item');
    }
  }

  /**
   * Create new bahan baku entry from purchase item
   */
  private async createNewBahanBaku(
    item: PurchaseItem, 
    purchase: Purchase
  ): Promise<StockUpdateResult['details'][0]> {
    // Get supplier name (you might need to resolve this from supplier ID)
    const supplierName = typeof purchase.supplier === 'string' ? purchase.supplier : 'Unknown';

    const newBahanBaku: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
      user_id: this.config.userId,
      nama: item.nama,
      kategori: 'Pembelian', // Default category, could be enhanced
      stok: item.kuantitas,
      satuan: item.satuan,
      minimum: Math.max(1, Math.floor(item.kuantitas * 0.1)), // Default minimum 10% of purchase quantity
      harga_satuan: item.hargaSatuan,
      supplier: supplierName,
      tanggal_kadaluwarsa: undefined, // Could be enhanced to include expiry from purchase
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const success = await this.config.warehouseContext.addBahanBaku(newBahanBaku);

    if (success) {
      if (this.config.enableDebugLogs) {
        logger.debug(`[${this.serviceId}] ✅ New item created: ${item.nama} with stock ${item.kuantitas}`);
      }

      return {
        itemName: item.nama,
        action: 'created',
        newStock: item.kuantitas
      };
    } else {
      throw new Error('Failed to create new warehouse item');
    }
  }

  /**
   * Find bahan baku by matching item properties
   */
  private findBahanBakuForItem(item: PurchaseItem): BahanBaku | undefined {
    // First try exact name match
    let bahanBaku = this.config.warehouseContext.getBahanBakuByName(item.nama);
    
    if (!bahanBaku) {
      // Try case-insensitive search
      bahanBaku = this.config.warehouseContext.bahanBaku.find(b => 
        b.nama.toLowerCase().trim() === item.nama.toLowerCase().trim()
      );
    }

    if (!bahanBaku && item.bahanBakuId) {
      // Try by ID if available
      bahanBaku = this.config.warehouseContext.bahanBaku.find(b => b.id === item.bahanBakuId);
    }

    return bahanBaku;
  }

  /**
   * Handle and display result of stock update operation
   */
  private handleStockUpdateResult(result: StockUpdateResult, action: 'added' | 'removed'): boolean {
    if (result.success) {
      const actionText = action === 'added' ? 'ditambahkan ke' : 'dikurangi dari';
      const totalItems = result.updatedItems + result.createdItems;
      
      if (totalItems > 0) {
        toast.success(
          `Stok berhasil ${actionText} warehouse`,
          {
            description: `${result.updatedItems} item diupdate${result.createdItems > 0 ? `, ${result.createdItems} item baru dibuat` : ''}`
          }
        );
      }

      if (this.config.enableDebugLogs) {
        logger.debug(`[${this.serviceId}] ✅ Stock ${action} completed:`, {
          updated: result.updatedItems,
          created: result.createdItems,
          errors: result.errors.length
        });
      }
    } else {
      toast.error(
        `Gagal ${action === 'added' ? 'menambahkan' : 'mengurangi'} stok`,
        {
          description: `${result.errors.length} error terjadi. Periksa log untuk detail.`
        }
      );

      if (this.config.enableDebugLogs) {
        logger.error(`[${this.serviceId}] ❌ Stock ${action} failed:`, result.errors);
      }
    }

    return result.success;
  }

  /**
   * Validate if purchase can be completed (optional validation)
   */
  async validatePurchaseCompletion(purchase: Purchase): Promise<{ canComplete: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    // Check if any items don't exist in warehouse (will be created)
    for (const item of purchase.items) {
      const bahanBaku = this.findBahanBakuForItem(item);
      if (!bahanBaku) {
        warnings.push(`${item.nama} akan dibuat sebagai item baru di warehouse`);
      }
    }

    // Check for potential price differences
    for (const item of purchase.items) {
      const bahanBaku = this.findBahanBakuForItem(item);
      if (bahanBaku && Math.abs(bahanBaku.harga_satuan - item.hargaSatuan) > (bahanBaku.harga_satuan * 0.1)) {
        warnings.push(`Harga ${item.nama} berbeda signifikan dari harga warehouse (${bahanBaku.harga_satuan} vs ${item.hargaSatuan})`);
      }
    }

    return {
      canComplete: true, // Generally allow completion
      warnings
    };
  }
}

// Factory function to create service instance
export const createPurchaseWarehouseService = (
  warehouseContext: PurchaseWarehouseServiceConfig['warehouseContext'],
  userId: string,
  enableDebugLogs = false
): PurchaseWarehouseService => {
  return new PurchaseWarehouseService({
    warehouseContext,
    userId,
    enableDebugLogs
  });
};