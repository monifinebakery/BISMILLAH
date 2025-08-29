// src/components/purchase/hooks/useSupplierAutoSave.ts

import { useCallback } from 'react';
import { useSupplier } from '@/contexts/SupplierContext';
import { Supplier } from '@/types/supplier';
import { logger } from '@/utils/logger';

interface UseSupplierAutoSaveReturn {
  /**
   * Auto-save supplier to database if it doesn't exist
   * @param supplierName - Name of the supplier
   * @returns supplier ID (existing or newly created)
   */
  autoSaveSupplier: (supplierName: string) => Promise<string | null>;
  
  /**
   * Check if supplier exists by name
   * @param supplierName - Name to check
   * @returns existing supplier or null
   */
  findSupplierByName: (supplierName: string) => Supplier | null;
  
  /**
   * Get supplier ID from name (existing or create new)
   * @param supplierName - Name of the supplier
   * @returns supplier ID
   */
  getOrCreateSupplierId: (supplierName: string) => Promise<string | null>;
}

export const useSupplierAutoSave = (): UseSupplierAutoSaveReturn => {
  const { suppliers, addSupplier, refreshSuppliers } = useSupplier();

  /**
   * Find existing supplier by name (case-insensitive)
   */
  const findSupplierByName = useCallback((supplierName: string): Supplier | null => {
    if (!supplierName.trim()) return null;
    
    const normalizedName = supplierName.trim().toLowerCase();
    return suppliers.find(supplier => 
      supplier.nama.toLowerCase() === normalizedName
    ) || null;
  }, [suppliers]);

  /**
   * Auto-save supplier if it doesn't exist
   */
  const autoSaveSupplier = useCallback(async (supplierName: string): Promise<string | null> => {
    try {
      const trimmedName = supplierName.trim();
      if (!trimmedName) {
        logger.warn('SupplierAutoSave', 'Empty supplier name provided');
        return null;
      }

      // Check if supplier already exists in local state
      const existingSupplier = findSupplierByName(trimmedName);
      if (existingSupplier) {
        logger.info('SupplierAutoSave', 'Supplier already exists in local state:', existingSupplier.nama);
        return existingSupplier.id;
      }

      // Create new supplier with minimal data
      logger.info('SupplierAutoSave', 'Creating new supplier:', trimmedName);
      const newSupplier = await addSupplier({
        nama: trimmedName,
        kontak: '', // Default empty - user can update later in supplier management
        email: undefined,
        telepon: undefined,
        alamat: undefined,
        catatan: 'Auto-created from purchase', // Mark as auto-created
      });

      if (newSupplier) {
        logger.info('SupplierAutoSave', 'Successfully created supplier:', newSupplier.nama, 'with ID:', newSupplier.id);
        return newSupplier.id;
      } else {
        logger.error('SupplierAutoSave', 'Failed to create supplier');
        return null;
      }
    } catch (error) {
      logger.error('SupplierAutoSave', 'Error in autoSaveSupplier:', error);
      
      // Handle duplicate key constraint violation
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('duplicate key value violates unique constraint') || 
          errorMessage.includes('suppliers_unique_user_nama')) {
        logger.warn('SupplierAutoSave', 'Supplier already exists in database (constraint violation), searching again:', trimmedName);
        
        // The supplier exists in database but not in local state
        // This can happen due to race conditions or stale local data
        // We need to refresh suppliers and try to find it
        try {
          // Force refresh suppliers from database
          logger.info('SupplierAutoSave', 'Refreshing suppliers after constraint violation');
          await refreshSuppliers();
          
          // Try to find supplier again after refresh
          const existingAfterError = findSupplierByName(trimmedName);
          if (existingAfterError) {
            logger.info('SupplierAutoSave', 'Found existing supplier after refresh:', existingAfterError.nama);
            return existingAfterError.id;
          }
          
          // If still not found, there might be a data sync issue
          logger.warn('SupplierAutoSave', 'Supplier exists in database but not found locally, returning null');
          return null;
        } catch (retryError) {
          logger.error('SupplierAutoSave', 'Error during retry after constraint violation:', retryError);
          return null;
        }
      }
      
      // For other errors, return null
      return null;
    }
  }, [findSupplierByName, addSupplier, refreshSuppliers]);

  /**
   * Get supplier ID from name, create if doesn't exist
   */
  const getOrCreateSupplierId = useCallback(async (supplierName: string): Promise<string | null> => {
    const existingSupplier = findSupplierByName(supplierName);
    if (existingSupplier) {
      return existingSupplier.id;
    }
    
    return await autoSaveSupplier(supplierName);
  }, [findSupplierByName, autoSaveSupplier]);

  return {
    autoSaveSupplier,
    findSupplierByName,
    getOrCreateSupplierId,
  };
};
