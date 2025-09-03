// src/components/purchase/services/materialsHistoryService.ts

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { Purchase } from '../types/purchase.types';
import { transformPurchasesFromDB } from '../utils/purchaseTransformers';

export interface MaterialHistory {
  nama: string;
  lastUsed: Date;
  frequency: number;
  satuan?: string; // Most commonly used unit for this material
}

/**
 * Service untuk mengambil riwayat nama bahan baku dari purchases
 * untuk digunakan sebagai dropdown suggestions
 */
export class MaterialsHistoryService {
  
  /**
   * Mengambil semua nama bahan baku unik dari riwayat pembelian user
   */
  static async getUniqueMaterialNames(userId: string): Promise<string[]> {
    try {
      logger.info('Fetching unique material names for user:', userId);
      
      const { data, error } = await supabase
        .from('purchases')
        .select('items')
        .eq('user_id', userId)
        .not('items', 'is', null);

      if (error) {
        logger.error('Error fetching purchases for material names:', error);
        return [];
      }

      // Extract unique material names from all purchases
      const materialNamesSet = new Set<string>();
      
      data?.forEach(purchase => {
        if (purchase.items && Array.isArray(purchase.items)) {
          purchase.items.forEach((item: any) => {
            if (item.nama && typeof item.nama === 'string') {
              // Normalize the name (trim whitespace, standardize case)
              const normalizedName = item.nama.trim();
              if (normalizedName.length > 0) {
                materialNamesSet.add(normalizedName);
              }
            }
          });
        }
      });

      const uniqueNames = Array.from(materialNamesSet).sort();
      logger.info('Found unique material names:', { count: uniqueNames.length, sample: uniqueNames.slice(0, 5) });
      
      return uniqueNames;
      
    } catch (error) {
      logger.error('Error in getUniqueMaterialNames:', error);
      return [];
    }
  }

  /**
   * Mengambil riwayat detail bahan baku dengan informasi tambahan
   * (frekuensi penggunaan, terakhir dipakai, satuan yang sering digunakan)
   */
  static async getMaterialsHistory(userId: string): Promise<MaterialHistory[]> {
    try {
      logger.info('Fetching detailed materials history for user:', userId);
      
      const { data, error } = await supabase
        .from('purchases')
        .select('items, tanggal, updated_at')
        .eq('user_id', userId)
        .not('items', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('Error fetching purchases for materials history:', error);
        return [];
      }

      // Process materials history
      const materialsMap = new Map<string, {
        frequency: number;
        lastUsed: Date;
        satuanCount: Map<string, number>;
      }>();

      data?.forEach(purchase => {
        if (purchase.items && Array.isArray(purchase.items)) {
          const purchaseDate = new Date(purchase.tanggal || purchase.updated_at);
          
          purchase.items.forEach((item: any) => {
            if (item.nama && typeof item.nama === 'string') {
              const normalizedName = item.nama.trim();
              if (normalizedName.length > 0) {
                const existing = materialsMap.get(normalizedName) || {
                  frequency: 0,
                  lastUsed: purchaseDate,
                  satuanCount: new Map<string, number>()
                };
                
                // Update frequency
                existing.frequency += 1;
                
                // Update last used date (keep the most recent)
                if (purchaseDate > existing.lastUsed) {
                  existing.lastUsed = purchaseDate;
                }
                
                // Count satuan usage
                if (item.satuan && typeof item.satuan === 'string') {
                  const satuanCount = existing.satuanCount.get(item.satuan) || 0;
                  existing.satuanCount.set(item.satuan, satuanCount + 1);
                }
                
                materialsMap.set(normalizedName, existing);
              }
            }
          });
        }
      });

      // Convert to MaterialHistory array
      const materialsHistory: MaterialHistory[] = Array.from(materialsMap.entries()).map(([nama, data]) => {
        // Find most commonly used satuan
        let mostCommonSatuan = '';
        let maxCount = 0;
        
        data.satuanCount.forEach((count, satuan) => {
          if (count > maxCount) {
            maxCount = count;
            mostCommonSatuan = satuan;
          }
        });

        return {
          nama,
          lastUsed: data.lastUsed,
          frequency: data.frequency,
          satuan: mostCommonSatuan || undefined
        };
      });

      // Sort by frequency (desc) then by last used (desc)
      materialsHistory.sort((a, b) => {
        if (a.frequency !== b.frequency) {
          return b.frequency - a.frequency;
        }
        return b.lastUsed.getTime() - a.lastUsed.getTime();
      });

      logger.info('Processed materials history:', { count: materialsHistory.length, sample: materialsHistory.slice(0, 3) });
      
      return materialsHistory;
      
    } catch (error) {
      logger.error('Error in getMaterialsHistory:', error);
      return [];
    }
  }

  /**
   * Search materials by name with fuzzy matching
   */
  static searchMaterials(materials: MaterialHistory[], query: string): MaterialHistory[] {
    if (!query.trim()) return materials;
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return materials.filter(material => 
      material.nama.toLowerCase().includes(normalizedQuery)
    ).sort((a, b) => {
      // Prioritize exact matches at the beginning
      const aStarts = a.nama.toLowerCase().startsWith(normalizedQuery);
      const bStarts = b.nama.toLowerCase().startsWith(normalizedQuery);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      // Then by frequency
      return b.frequency - a.frequency;
    });
  }

  /**
   * Get suggested satuan for a material name
   */
  static async getSuggestedSatuanForMaterial(userId: string, materialName: string): Promise<string | null> {
    try {
      const materialsHistory = await this.getMaterialsHistory(userId);
      const material = materialsHistory.find(m => 
        m.nama.toLowerCase() === materialName.toLowerCase().trim()
      );
      
      return material?.satuan || null;
    } catch (error) {
      logger.error('Error getting suggested satuan:', error);
      return null;
    }
  }
}

export default MaterialsHistoryService;
