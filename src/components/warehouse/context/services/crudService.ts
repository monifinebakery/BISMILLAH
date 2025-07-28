// src/components/warehouse/context/services/crudService.ts
import { supabase } from '@/integrations/supabase/client';
import { BahanBaku } from '../../types/warehouse';
import { transformBahanBakuFromDB, transformBahanBakuToDB, validateBahanBakuData } from '../utils/transformers';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

interface CrudServiceDeps {
  userId: string;
  onError: (error: string) => Promise<void>;
}

export class CrudService {
  private deps: CrudServiceDeps;

  constructor(deps: CrudServiceDeps) {
    this.deps = deps;
  }

  async fetchBahanBaku(): Promise<BahanBaku[]> {
    if (!this.deps.userId) {
      return [];
    }

    logger.context('CrudService', 'Fetching data for user:', this.deps.userId);
    
    try {
      const { data, error } = await supabase
        .from('bahan_baku')
        .select('*')
        .eq('user_id', this.deps.userId)
        .order('nama', { ascending: true });

      if (error) {
        throw new Error(`Gagal mengambil data: ${error.message}`);
      }

      const transformedData = data
        .map(item => {
          try {
            return transformBahanBakuFromDB(item);
          } catch (transformError) {
            logger.error('CrudService', 'Error transforming individual item:', transformError, item);
            return null;
          }
        })
        .filter(Boolean) as BahanBaku[];

      logger.context('CrudService', 'Data loaded:', transformedData.length, 'items');
      return transformedData;

    } catch (error: any) {
      logger.error('CrudService', 'Error fetching bahan baku:', error);
      await this.deps.onError(`Gagal memuat data inventory: ${error.message}`);
      throw error;
    }
  }

  async addBahanBaku(bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> {
    if (!this.deps.userId) {
      toast.error('Anda harus login untuk menambahkan bahan baku');
      return false;
    }

    // Validate input data
    const validation = validateBahanBakuData(bahan);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return false;
    }

    try {
      const bahanToInsert = {
        user_id: this.deps.userId,
        ...transformBahanBakuToDB(bahan)
      };

      const { data, error } = await supabase
        .from('bahan_baku')
        .insert(bahanToInsert)
        .select()
        .single();

      if (error) throw error;

      logger.context('CrudService', 'Item added successfully:', data.id);
      toast.success(`${bahan.nama} berhasil ditambahkan ke inventory!`);
      return true;

    } catch (error: any) {
      logger.error('CrudService', 'Error adding bahan baku:', error);
      toast.error(`Gagal menambahkan: ${error.message}`);
      await this.deps.onError(`Gagal menambahkan ${bahan.nama}: ${error.message}`);
      return false;
    }
  }

  async updateBahanBaku(id: string, updatedBahan: Partial<BahanBaku>): Promise<boolean> {
    if (!this.deps.userId) {
      toast.error('Anda harus login untuk memperbarui bahan baku');
      return false;
    }

    // Enhanced validation
    if (!id || typeof id !== 'string') {
      logger.error('CrudService', 'Invalid ID for update:', id);
      toast.error('ID bahan baku tidak valid');
      return false;
    }

    if (!updatedBahan || typeof updatedBahan !== 'object') {
      logger.error('CrudService', 'Invalid update data:', updatedBahan);
      toast.error('Data update tidak valid');
      return false;
    }

    // Validate update data
    const validation = validateBahanBakuData(updatedBahan);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return false;
    }

    try {
      const bahanToUpdate = transformBahanBakuToDB(updatedBahan);

      const { data, error } = await supabase
        .from('bahan_baku')
        .update(bahanToUpdate)
        .eq('id', id)
        .eq('user_id', this.deps.userId)
        .select()
        .single();

      if (error) throw error;

      logger.context('CrudService', 'Item updated successfully:', id);
      toast.success(`Item berhasil diperbarui!`);
      return true;

    } catch (error: any) {
      logger.error('CrudService', 'Error updating bahan baku:', error);
      toast.error(`Gagal memperbarui: ${error.message}`);
      await this.deps.onError(`Gagal mengubah stok: ${error.message}`);
      return false;
    }
  }

  async deleteBahanBaku(id: string): Promise<boolean> {
    if (!this.deps.userId) {
      toast.error("Anda harus login untuk menghapus bahan baku.");
      return false;
    }

    // Enhanced validation
    if (!id || typeof id !== 'string') {
      logger.error('CrudService', 'Invalid ID for deletion:', id);
      toast.error('ID bahan baku tidak valid');
      return false;
    }

    try {
      const { error } = await supabase
        .from('bahan_baku')
        .delete()
        .eq('id', id)
        .eq('user_id', this.deps.userId);
        
      if (error) throw error;

      logger.context('CrudService', 'Item deleted successfully:', id);
      return true;

    } catch (error: any) {
      logger.error('CrudService', 'Error deleting bahan baku:', error);
      toast.error(`Gagal menghapus: ${error.message}`);
      await this.deps.onError(`Gagal menghapus item: ${error.message}`);
      return false;
    }
  }

  async bulkDeleteBahanBaku(ids: string[]): Promise<boolean> {
    if (!this.deps.userId || !Array.isArray(ids) || ids.length === 0) {
      toast.error('Tidak ada item yang dipilih');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('bahan_baku')
        .delete()
        .in('id', ids)
        .eq('user_id', this.deps.userId);
        
      if (error) throw error;

      logger.context('CrudService', 'Bulk delete successful:', ids.length, 'items');
      toast.success(`${ids.length} bahan baku berhasil dihapus!`);
      return true;

    } catch (error: any) {
      logger.error('CrudService', 'Error bulk deleting:', error);
      toast.error(`Gagal menghapus: ${error.message}`);
      await this.deps.onError(`Gagal bulk delete: ${error.message}`);
      return false;
    }
  }

  async bulkUpdateBahanBaku(updates: Array<{ id: string; data: Partial<BahanBaku> }>): Promise<{ success: number; failed: number }> {
    if (!this.deps.userId || !Array.isArray(updates) || updates.length === 0) {
      toast.error('Tidak ada data untuk diupdate');
      return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    for (const update of updates) {
      try {
        const success = await this.updateBahanBaku(update.id, update.data);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        failedCount++;
        logger.error('CrudService', 'Error in bulk update for item:', update.id, error);
      }
    }

    logger.context('CrudService', 'Bulk update completed:', { success: successCount, failed: failedCount });
    
    if (successCount > 0) {
      toast.success(`${successCount} item berhasil diperbarui${failedCount > 0 ? `, ${failedCount} gagal` : ''}`);
    }

    if (failedCount > 0 && successCount === 0) {
      toast.error(`Semua ${failedCount} item gagal diperbarui`);
    }

    return { success: successCount, failed: failedCount };
  }

  async reduceStok(nama: string, jumlah: number, currentItems: BahanBaku[]): Promise<boolean> {
    try {
      if (!nama || typeof nama !== 'string') {
        toast.error('Nama bahan baku tidak valid');
        return false;
      }

      if (!jumlah || jumlah <= 0) {
        toast.error('Jumlah pengurangan tidak valid');
        return false;
      }

      const bahan = currentItems.find(item => 
        item.nama.toLowerCase() === nama.toLowerCase()
      );

      if (!bahan) {
        toast.error(`Bahan baku ${nama} tidak ditemukan.`);
        return false;
      }
      
      if (bahan.stok < jumlah) {
        toast.error(`Stok ${nama} (${bahan.stok}) tidak cukup untuk dikurangi ${jumlah}.`);
        return false;
      }
      
      return await this.updateBahanBaku(bahan.id, { stok: bahan.stok - jumlah });

    } catch (error) {
      logger.error('CrudService', 'Error in reduceStok:', error);
      toast.error('Gagal mengurangi stok');
      return false;
    }
  }
}