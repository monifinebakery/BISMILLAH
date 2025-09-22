// src/components/warehouse/utils/warehouseItemUtils.ts
// Helper utilities related to mapping purchase items to warehouse items

import { logger } from '@/utils/logger';
import type { PurchaseItem } from '@/components/purchase/types/purchase.types';

interface EnsureOptions {
  bahanBaku: any[];
  addBahanBaku: (data: any) => Promise<boolean>;
}

/**
 * Ensure each purchase item has a corresponding warehouse item ID (bahanBakuId).
 * - Tries to match by name + unit + supplier; falls back to name + unit.
 * - Creates missing items sequentially with basic retry handling for duplicates.
 */
export const ensureBahanBakuIdsForItems = async (
  items: PurchaseItem[],
  supplierName: string, // Changed from supplierId to supplierName
  { bahanBaku, addBahanBaku }: EnsureOptions
): Promise<PurchaseItem[]> => {
  const results: PurchaseItem[] = [];

  for (const item of items) {
    if (item?.bahanBakuId?.trim()) {
      results.push(item);
      continue;
    }

    // Look for existing by name + unit + supplier first
    let existing = (bahanBaku as any[])?.find((bb: any) =>
      bb?.nama?.toLowerCase()?.trim() === item?.nama?.toLowerCase()?.trim() &&
      (bb?.satuan?.toLowerCase()?.trim() || '') === (item?.satuan?.toLowerCase()?.trim() || '') &&
      bb?.supplier === supplierName // Changed from supplierId to supplierName
    );

    // Fallback: name + unit regardless of supplier
    if (!existing) {
      existing = (bahanBaku as any[])?.find((bb: any) =>
        bb?.nama?.toLowerCase()?.trim() === item?.nama?.toLowerCase()?.trim() &&
        (bb?.satuan?.toLowerCase()?.trim() || '') === (item?.satuan?.toLowerCase()?.trim() || '')
      );
    }

    if (existing) {
      results.push({ ...item, bahanBakuId: existing.id });
      continue;
    }

    // Create new bahan baku with retry to avoid race errors
    let retry = 0;
    const maxRetries = 3;
    let created = false;
    let newId = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string;

    while (!created && retry < maxRetries) {
      try {
        logger.debug(`Creating new bahan baku #${retry + 1}: ${item.nama}`);
        await addBahanBaku({
          id: newId,
          nama: item.nama,
          kategori: 'Lainnya',
          stok: 0,
          minimum: 0,
          satuan: item.satuan || '-',
          harga: item.unitPrice || 0,
          supplier: supplierName, // Changed from supplierId to supplierName
        });
        created = true;
        results.push({ ...item, bahanBakuId: newId });
      } catch (e: any) {
        retry++;
        const msg = e?.message || '';
        logger.warn('Failed to create bahan baku, retrying...', { attempt: retry, error: msg });

        // Handle duplicate/race: find the existing record and use its id
        if (msg.includes('duplicate') || e?.code === '23505') {
          const found = (bahanBaku as any[])?.find((bb: any) =>
            bb?.nama?.toLowerCase()?.trim() === item?.nama?.toLowerCase()?.trim() &&
            bb?.supplier === supplierName // Changed from supplierId to supplierName
          );
          if (found) {
            results.push({ ...item, bahanBakuId: found.id });
            created = true;
            break;
          }
          newId = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string;
        }

        if (retry >= maxRetries) {
          logger.error('Giving up creating bahan baku after max retries', { name: item.nama });
          results.push(item); // fallback without id
        }
      }
    }
  }

  return results;
};

