// src/components/warehouse/hooks/useBulkOperations.ts
import { useState, useCallback } from 'react';
import { BahanBaku, BulkEditData } from '../types/warehouse';
import { toast } from 'sonner';

interface UseBulkOperationsProps {
  updateBahanBaku: (id: string, updates: Partial<BahanBaku>) => Promise<boolean>;
  bulkDeleteBahanBaku: (ids: string[]) => Promise<boolean>;
  selectedItems: string[];
  clearSelection: () => void;
}

interface UseBulkOperationsReturn {
  isBulkEditing: boolean;
  isBulkDeleting: boolean;
  bulkEditData: BulkEditData;
  setBulkEditData: (data: Partial<BulkEditData>) => void;
  handleBulkEdit: (selectedItemsData: BahanBaku[]) => Promise<boolean>;
  handleBulkDelete: () => Promise<boolean>;
  resetBulkEditData: () => void;
  validateBulkEditData: () => { isValid: boolean; errors: string[] };
}

const defaultBulkEditData: BulkEditData = {
  kategori: undefined,
  supplier: undefined,
  minimum: undefined,
  hargaSatuan: undefined,
  tanggalKadaluwarsa: undefined,
};

export const useBulkOperations = ({
  updateBahanBaku,
  bulkDeleteBahanBaku,
  selectedItems,
  clearSelection,
}: UseBulkOperationsProps): UseBulkOperationsReturn => {
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkEditData, setBulkEditDataState] = useState<BulkEditData>(defaultBulkEditData);

  const setBulkEditData = useCallback((data: Partial<BulkEditData>) => {
    setBulkEditDataState(prev => ({ ...prev, ...data }));
  }, []);

  const resetBulkEditData = useCallback(() => {
    setBulkEditDataState(defaultBulkEditData);
  }, []);

  const validateBulkEditData = useCallback((): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check if at least one field is being updated
    const hasChanges = Object.values(bulkEditData).some(value => 
      value !== undefined && value !== null && value !== ''
    );

    if (!hasChanges) {
      errors.push('Pilih minimal satu field untuk diubah');
    }

    // Validate minimum stock
    if (bulkEditData.minimum !== undefined && bulkEditData.minimum < 0) {
      errors.push('Stok minimum tidak boleh negatif');
    }

    // Validate price
    if (bulkEditData.hargaSatuan !== undefined && bulkEditData.hargaSatuan < 0) {
      errors.push('Harga satuan tidak boleh negatif');
    }

    // Validate expiry date
    if (bulkEditData.tanggalKadaluwarsa !== undefined && bulkEditData.tanggalKadaluwarsa !== null) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(bulkEditData.tanggalKadaluwarsa);
      expiryDate.setHours(0, 0, 0, 0);
      
      if (expiryDate <= today) {
        errors.push('Tanggal kadaluwarsa harus lebih dari hari ini');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [bulkEditData]);

  const handleBulkEdit = useCallback(async (selectedItemsData: BahanBaku[]): Promise<boolean> => {
    if (selectedItems.length === 0) {
      toast.error('Pilih item yang ingin diedit terlebih dahulu');
      return false;
    }

    const validation = validateBulkEditData();
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return false;
    }

    setIsBulkEditing(true);

    try {
      // Prepare updates object - only include fields that have values
      const updates: Partial<BahanBaku> = {};
      
      if (bulkEditData.kategori !== undefined && bulkEditData.kategori !== '') {
        updates.kategori = bulkEditData.kategori;
      }
      
      if (bulkEditData.supplier !== undefined && bulkEditData.supplier !== '') {
        updates.supplier = bulkEditData.supplier;
      }
      
      if (bulkEditData.minimum !== undefined) {
        updates.minimum = bulkEditData.minimum;
      }
      
      if (bulkEditData.hargaSatuan !== undefined) {
        updates.hargaSatuan = bulkEditData.hargaSatuan;
      }
      
      if (bulkEditData.tanggalKadaluwarsa !== undefined) {
        updates.tanggalKadaluwarsa = bulkEditData.tanggalKadaluwarsa;
      }

      // Apply updates to all selected items
      const updatePromises = selectedItems.map(id => updateBahanBaku(id, updates));
      const results = await Promise.allSettled(updatePromises);

      // Count successful and failed updates
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value === true
      ).length;
      const failed = results.length - successful;

      if (successful > 0) {
        toast.success(`${successful} item berhasil diperbarui${failed > 0 ? `, ${failed} gagal` : ''}`);
        clearSelection();
        resetBulkEditData();
        
        if (failed === 0) {
          return true;
        }
      }

      if (failed > 0) {
        toast.error(`${failed} item gagal diperbarui`);
      }

      return successful > 0;
    } catch (error) {
      console.error('Bulk edit error:', error);
      toast.error('Terjadi kesalahan saat melakukan bulk edit');
      return false;
    } finally {
      setIsBulkEditing(false);
    }
  }, [selectedItems, bulkEditData, validateBulkEditData, updateBahanBaku, clearSelection, resetBulkEditData]);

  const handleBulkDelete = useCallback(async (): Promise<boolean> => {
    if (selectedItems.length === 0) {
      toast.error('Pilih item yang ingin dihapus terlebih dahulu');
      return false;
    }

    setIsBulkDeleting(true);

    try {
      const success = await bulkDeleteBahanBaku(selectedItems);
      
      if (success) {
        toast.success(`${selectedItems.length} item berhasil dihapus`);
        clearSelection();
        return true;
      } else {
        toast.error('Gagal menghapus item');
        return false;
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Terjadi kesalahan saat menghapus item');
      return false;
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedItems, bulkDeleteBahanBaku, clearSelection]);

  return {
    isBulkEditing,
    isBulkDeleting,
    bulkEditData,
    setBulkEditData,
    handleBulkEdit,
    handleBulkDelete,
    resetBulkEditData,
    validateBulkEditData,
  };
};