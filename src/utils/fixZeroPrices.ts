// src/utils/fixZeroPrices.ts
// Utility to diagnose and fix zero prices in bahan baku

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface ZeroPriceDiagnostic {
  totalItems: number;
  zeroPriceItems: number;
  missingWacItems: number;
  missingBaseItems: number;
  itemsWithPurchaseHistory: number;
  itemsWithoutPurchaseHistory: number;
  fixableItems: number;
}

export interface FixResults {
  totalFixed: number;
  fixedViaWacRecalculation: number;
  fixedViaDefaultPrice: number;
  errors: string[];
}

/**
 * Diagnose zero price issues in bahan baku
 */
export async function diagnoseZeroPrices(userId?: string): Promise<ZeroPriceDiagnostic> {
  try {
    // Get current user if not provided
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    // Get all bahan baku items
    const { data: items, error: itemsError } = await supabase
      .from('bahan_baku')
      .select('id, nama, harga_satuan')
      .eq('user_id', userId);

    if (itemsError) throw itemsError;

    if (!items || items.length === 0) {
      return {
        totalItems: 0,
        zeroPriceItems: 0,
        missingWacItems: 0,
        missingBaseItems: 0,
        itemsWithPurchaseHistory: 0,
        itemsWithoutPurchaseHistory: 0,
        fixableItems: 0
      };
    }

    // Analyze items
    const zeroPriceItems = items.filter(item => 
      (item.harga_satuan || 0) === 0
    );

    const missingBaseItems = items.filter(item => (item.harga_satuan || 0) === 0);

    // Check purchase history for each item
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('items')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (purchasesError) throw purchasesError;

    // Create set of items with purchase history
    const itemsWithHistory = new Set<string>();
    if (purchases) {
      purchases.forEach(purchase => {
        if (purchase.items && Array.isArray(purchase.items)) {
          purchase.items.forEach((item: any) => {
            if (item.bahan_baku_id) {
              itemsWithHistory.add(item.bahan_baku_id);
            }
          });
        }
      });
    }

    const itemsWithPurchaseHistory = items.filter(item => itemsWithHistory.has(item.id)).length;
    const itemsWithoutPurchaseHistory = items.length - itemsWithPurchaseHistory;

    // Items that can be fixed (have purchase history but zero price)
    const fixableItems = items.filter(item => 
      itemsWithHistory.has(item.id) && (item.harga_satuan || 0) === 0
    ).length;

    return {
      totalItems: items.length,
      zeroPriceItems: zeroPriceItems.length,
      missingWacItems: 0, // Not tracking WAC separately since column doesn't exist
      missingBaseItems: missingBaseItems.length,
      itemsWithPurchaseHistory,
      itemsWithoutPurchaseHistory,
      fixableItems
    };

  } catch (error) {
    logger.error('Error diagnosing zero prices:', error);
    throw error;
  }
}

/**
 * Fix zero price issues by recalculating WAC and setting default prices
 */
export async function fixZeroPrices(userId?: string): Promise<FixResults> {
  try {
    // Get current user if not provided
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    const results: FixResults = {
      totalFixed: 0,
      fixedViaWacRecalculation: 0,
      fixedViaDefaultPrice: 0,
      errors: []
    };

    // Get all bahan baku items with zero prices
    const { data: zeroPriceItems, error: itemsError } = await supabase
      .from('bahan_baku')
      .select('id, nama, harga_satuan')
      .eq('user_id', userId)
      .eq('harga_satuan', 0);

    if (itemsError) {
      results.errors.push(`Error fetching items: ${itemsError.message}`);
      return results;
    }

    if (!zeroPriceItems || zeroPriceItems.length === 0) {
      logger.info('No items with zero prices found');
      return results;
    }

    // Get purchase history
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('items')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (purchasesError) {
      results.errors.push(`Error fetching purchases: ${purchasesError.message}`);
      return results;
    }

    // Process each item
    for (const item of zeroPriceItems) {
      try {
        let fixed = false;

        // Try to calculate WAC from purchase history
        if (purchases && purchases.length > 0) {
          let totalQuantity = 0;
          let totalValue = 0;

          purchases.forEach(purchase => {
            if (purchase.items && Array.isArray(purchase.items)) {
              purchase.items.forEach((purchaseItem: any) => {
                if (purchaseItem.bahan_baku_id === item.id) {
                  const qty = Number(purchaseItem.jumlah || 0);
                  const price = Number(purchaseItem.harga_per_satuan || 0);
                  if (qty > 0 && price > 0) {
                    totalQuantity += qty;
                    totalValue += qty * price;
                  }
                }
              });
            }
          });

          // If we have purchase data, calculate average price and update
          if (totalQuantity > 0 && totalValue > 0) {
            const averagePrice = totalValue / totalQuantity;
            
            const { error: updateError } = await supabase
              .from('bahan_baku')
              .update({
                harga_satuan: averagePrice,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id)
              .eq('user_id', userId);

            if (updateError) {
              results.errors.push(`Error updating price for ${item.nama}: ${updateError.message}`);
            } else {
              results.fixedViaWacRecalculation++;
              results.totalFixed++;
              fixed = true;
              logger.info(`Fixed price for ${item.nama}: ${averagePrice}`);
            }
          }
        }

        // If not fixed via WAC and base price is still 0, set a default price
        if (!fixed && (item.harga_satuan || 0) === 0) {
          const defaultPrice = 1000; // Default 1000 IDR

          const { error: updateError } = await supabase
            .from('bahan_baku')
            .update({
              harga_satuan: defaultPrice,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)
            .eq('user_id', userId);

          if (updateError) {
            results.errors.push(`Error setting default price for ${item.nama}: ${updateError.message}`);
          } else {
            results.fixedViaDefaultPrice++;
            results.totalFixed++;
            logger.info(`Set default price for ${item.nama}: ${defaultPrice}`);
          }
        }

      } catch (error) {
        results.errors.push(`Error processing ${item.nama}: ${error}`);
      }
    }

    return results;

  } catch (error) {
    logger.error('Error fixing zero prices:', error);
    throw error;
  }
}

/**
 * Quick fix - run diagnosis and fix automatically
 */
export async function quickFixZeroPrices(): Promise<{
  diagnostic: ZeroPriceDiagnostic;
  fixResults: FixResults;
}> {
  const diagnostic = await diagnoseZeroPrices();
  const fixResults = await fixZeroPrices();
  
  return { diagnostic, fixResults };
}