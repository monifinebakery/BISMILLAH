// src/components/warehouse/services/core/warehouseValidationService.ts
// Warehouse data validation and integrity checks

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { getAllMaterials } from './materialSearchService';

export interface WarehouseConsistencyCheck {
  itemId: string;
  itemName: string;
  issues: string[];
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Validate warehouse data integrity
 */
export const validateWarehouseIntegrity = async (userId: string): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  try {
    // Check for basic data integrity issues
    const warehouseData = await getAllMaterials(userId);

    if (!warehouseData || warehouseData.length === 0) {
      warnings.push('Tidak ada data warehouse');
      recommendations.push('Tambahkan bahan baku atau import data');
      return { isValid: true, errors, warnings, recommendations };
    }

    // Check for duplicate names
    const nameCount = new Map<string, number>();
    warehouseData.forEach(item => {
      const name = item.nama.toLowerCase().trim();
      nameCount.set(name, (nameCount.get(name) || 0) + 1);
    });

    const duplicates = Array.from(nameCount.entries())
      .filter(([name, count]) => count > 1)
      .map(([name]) => name);

    if (duplicates.length > 0) {
      warnings.push(`Terdapat ${duplicates.length} nama bahan yang duplikat`);
      recommendations.push('Gabungkan atau rename bahan yang duplikat');
    }

    // Check for items with unusual values
    warehouseData.forEach(item => {
      if (item.stok < 0) {
        errors.push(`${item.nama}: Stok negatif (${item.stok})`);
      }
      
      if (item.harga_satuan <= 0) {
        warnings.push(`${item.nama}: Harga satuan tidak valid`);
      }

      if (item.harga_rata_rata && item.harga_rata_rata <= 0) {
        warnings.push(`${item.nama}: WAC tidak valid`);
      }
    });

    if (errors.length === 0) {
      recommendations.push('Data warehouse dalam kondisi baik');
    } else {
      recommendations.push('Perbaiki error yang ditemukan sebelum melanjutkan');
    }

  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
};

/**
 * Check warehouse consistency against purchase history
 */
export const checkWarehouseConsistency = async (userId: string): Promise<WarehouseConsistencyCheck[]> => {
  const consistencyIssues: WarehouseConsistencyCheck[] = [];

  try {
    logger.info('Starting warehouse consistency check for user:', userId);

    // Get all warehouse items
    const warehouseItems = await getAllMaterials(userId);

    // Get all completed purchases
    const { data: purchases, error: purchaseError } = await supabase
      .from('purchases')
      .select('items')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (purchaseError) {
      logger.error('❌ [CONSISTENCY CHECK] Error fetching purchases:', purchaseError);
      return consistencyIssues;
    }

    // Check each warehouse item
    for (const item of warehouseItems) {
      const issues: string[] = [];
      const suggestions: string[] = [];
      let severity: 'low' | 'medium' | 'high' = 'low';

      // Basic data validation
      if (!item.nama || item.nama.trim().length === 0) {
        issues.push('Nama item kosong');
        severity = 'high';
        suggestions.push('Berikan nama yang valid untuk item');
      }

      if (item.stok < 0) {
        issues.push(`Stok negatif: ${item.stok}`);
        severity = 'high';
        suggestions.push('Perbaiki stok menjadi nilai positif');
      }

      if (item.harga_satuan <= 0) {
        issues.push('Harga satuan tidak valid');
        severity = 'medium';
        suggestions.push('Set harga satuan yang valid');
      }

      if (item.harga_rata_rata && item.harga_rata_rata <= 0) {
        issues.push('WAC (Weighted Average Cost) tidak valid');
        severity = 'medium';
        suggestions.push('Recalculate WAC dari purchase history');
      }

      // Check if item appears in purchase history
      let foundInPurchases = false;
      let totalPurchaseQty = 0;
      let totalPurchaseValue = 0;

      purchases?.forEach(purchase => {
        if (purchase.items && Array.isArray(purchase.items)) {
          purchase.items.forEach((purchaseItem: any) => {
            const purchaseItemId = purchaseItem.bahanBakuId || purchaseItem.bahan_baku_id || purchaseItem.id;
            
            if (purchaseItemId === item.id) {
              foundInPurchases = true;
              const qty = Number(purchaseItem.quantity || 0);
              const price = Number(purchaseItem.unitPrice || 0);
              totalPurchaseQty += qty;
              totalPurchaseValue += qty * price;
            }
          });
        }
      });

      // If item has stock but no purchase history
      if (item.stok > 0 && !foundInPurchases) {
        issues.push('Item memiliki stok tapi tidak ada di purchase history');
        severity = 'medium';
        suggestions.push('Verifikasi sumber stok atau tambahkan ke purchase history');
      }

      // If calculated WAC differs significantly from recorded WAC
      if (foundInPurchases && totalPurchaseQty > 0) {
        const calculatedWac = totalPurchaseValue / totalPurchaseQty;
        const recordedWac = item.harga_rata_rata || item.harga_satuan;
        
        if (recordedWac > 0) {
          const wacDifference = Math.abs(calculatedWac - recordedWac) / recordedWac;
          
          if (wacDifference > 0.1) { // 10% difference
            issues.push(`WAC mismatch: calculated ${calculatedWac.toFixed(2)}, recorded ${recordedWac.toFixed(2)}`);
            severity = severity === 'high' ? 'high' : 'medium';
            suggestions.push('Recalculate WAC untuk konsistensi data');
          }
        }
      }

      // Check for missing critical information
      if (!item.satuan || item.satuan.trim().length === 0) {
        issues.push('Satuan tidak didefinisikan');
        severity = severity === 'high' ? 'high' : 'medium';
        suggestions.push('Tambahkan satuan yang valid');
      }

      // Only add to issues if there are actual problems
      if (issues.length > 0) {
        consistencyIssues.push({
          itemId: item.id,
          itemName: item.nama || 'Unknown',
          issues,
          severity,
          suggestions
        });
      }
    }

    logger.info(`Warehouse consistency check completed. Found ${consistencyIssues.length} issues`);
    
  } catch (error) {
    logger.error('❌ [CONSISTENCY CHECK] Error during consistency check:', error);
    
    consistencyIssues.push({
      itemId: 'SYSTEM_ERROR',
      itemName: 'System Error',
      issues: [`Consistency check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      severity: 'high',
      suggestions: ['Contact system administrator']
    });
  }

  return consistencyIssues;
};

/**
 * Validate specific item data
 */
export const validateItemData = (item: any): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!item.nama || typeof item.nama !== 'string' || item.nama.trim().length === 0) {
    errors.push('Nama item wajib diisi');
  }

  if (!item.satuan || typeof item.satuan !== 'string' || item.satuan.trim().length === 0) {
    errors.push('Satuan wajib diisi');
  }

  // Numeric validations
  if (typeof item.stok !== 'number' || item.stok < 0) {
    errors.push('Stok harus berupa angka positif');
  }

  if (typeof item.harga_satuan !== 'number' || item.harga_satuan <= 0) {
    errors.push('Harga satuan harus berupa angka positif');
  }

  if (item.harga_rata_rata !== undefined && (typeof item.harga_rata_rata !== 'number' || item.harga_rata_rata <= 0)) {
    warnings.push('WAC (harga rata-rata) tidak valid');
  }

  if (typeof item.minimum !== 'number' || item.minimum < 0) {
    warnings.push('Minimum stock harus berupa angka positif');
  }

  // Business logic validations
  if (item.stok < item.minimum) {
    warnings.push('Stok di bawah minimum');
  }

  // Date validations
  if (item.tanggal_kadaluwarsa) {
    const expiryDate = new Date(item.tanggal_kadaluwarsa);
    if (isNaN(expiryDate.getTime())) {
      warnings.push('Format tanggal kadaluarsa tidak valid');
    } else if (expiryDate < new Date()) {
      warnings.push('Item sudah melewati tanggal kadaluarsa');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};