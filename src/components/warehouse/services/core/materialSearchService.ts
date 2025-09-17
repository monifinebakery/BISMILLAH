// src/components/warehouse/services/core/materialSearchService.ts
// Material search and unit normalization service

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Normalize common unit synonyms to a canonical form
 */
export const normalizeUnit = (raw: string | undefined | null): string => {
  const u = String(raw || '').toLowerCase().trim();
  if (!u) return '';
  
  const unitMap: Record<string, string> = {
    gr: 'gram', g: 'gram', gram: 'gram',
    kg: 'kg', kilogram: 'kg',
    l: 'liter', liter: 'liter', litre: 'liter',
    ml: 'ml', mililiter: 'ml', milliliter: 'ml',
    pcs: 'pcs', buah: 'pcs', piece: 'pcs',
    bungkus: 'bungkus', sachet: 'sachet',
  };
  
  return unitMap[u] || u;
};

/**
 * Helper function to find existing material by name and satuan
 * This enables stock accumulation for the same material from different suppliers
 */
export const findExistingMaterialByName = async (
  materialName: string,
  rawSatuan: string,
  userId: string
): Promise<any | null> => {
  try {
    // Normalize name for better matching
    const normalizedName = materialName.toLowerCase().trim();
    const normalizedUnit = normalizeUnit(rawSatuan);
    
    logger.debug('🔍 [MATERIAL SEARCH] Searching for existing material:', {
      originalName: materialName,
      normalizedName,
      satuan: normalizedUnit,
      userId
    });
    
    const { data: materials, error } = await supabase
      .from('bahan_baku')
      .select('id, nama, satuan, stok, harga_rata_rata, harga_satuan, supplier')
      .eq('user_id', userId)
      .ilike('nama', normalizedName); // Case-insensitive search by name only (unit filtered locally)
    
    if (error) {
      logger.error('❌ [MATERIAL SEARCH] Error searching materials by name:', error);
      return null;
    }
    
    // If multiple matches, prefer exact name match first
    if (materials && materials.length > 0) {
      // Filter by normalized unit first
      const unitMatches = materials.filter(m => normalizeUnit(m.satuan) === normalizedUnit);
      if (unitMatches.length > 0) {
        // Prefer exact name match among unit matches
        const exactUnitMatch = unitMatches.find(m => m.nama.toLowerCase().trim() === normalizedName);
        if (exactUnitMatch) {
          logger.debug('✅ [MATERIAL SEARCH] Found exact name+unit match:', exactUnitMatch);
          return exactUnitMatch;
        }
        logger.debug('✅ [MATERIAL SEARCH] Found unit-normalized match:', unitMatches[0]);
        return unitMatches[0];
      }
      
      // First try exact match (case insensitive)
      const exactMatch = materials.find(m => 
        m.nama.toLowerCase().trim() === normalizedName
      );
      
      if (exactMatch) {
        logger.debug('✅ [MATERIAL SEARCH] Found exact name match:', exactMatch);
        return exactMatch;
      }
      
      // If no exact match, use the first similar match
      const similarMatch = materials[0];
      logger.debug('⚠️ [MATERIAL SEARCH] Found similar name match:', similarMatch);
      return similarMatch;
    }
    
    logger.debug('ℹ️ [MATERIAL SEARCH] No existing material found by name');
    return null;
  } catch (error) {
    logger.error('❌ [MATERIAL SEARCH] Error in findExistingMaterialByName:', error);
    return null;
  }
};

/**
 * Find material by ID with user validation
 */
export const findMaterialById = async (
  itemId: string,
  userId: string
): Promise<any | null> => {
  try {
    const { data: exactMatch, error: fetchError } = await supabase
      .from('bahan_baku')
      .select('id, nama, satuan, stok, harga_rata_rata, harga_satuan, supplier')
      .eq('id', itemId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (fetchError) {
      logger.error('❌ [MATERIAL SEARCH] Error fetching by ID:', fetchError);
      return null;
    }
    
    if (exactMatch) {
      logger.debug('✅ [MATERIAL SEARCH] Found exact ID match:', exactMatch);
      return exactMatch;
    }
    
    return null;
  } catch (error) {
    logger.error('❌ [MATERIAL SEARCH] Error in findMaterialById:', error);
    return null;
  }
};

/**
 * Get all materials for a user
 */
export const getAllMaterials = async (userId: string): Promise<any[]> => {
  try {
    const { data: materials, error } = await supabase
      .from('bahan_baku')
      .select('id, user_id, nama, kategori, stok, satuan, minimum, harga_satuan, harga_rata_rata, supplier, tanggal_kadaluwarsa, created_at, updated_at')
      .eq('user_id', userId);
    
    if (error) {
      logger.error('❌ [MATERIAL SEARCH] Error fetching all materials:', error);
      return [];
    }
    
    return materials || [];
  } catch (error) {
    logger.error('❌ [MATERIAL SEARCH] Error in getAllMaterials:', error);
    return [];
  }
};