import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import type { BahanBakuImport } from '../types';

// Mapping of possible header names to our standard fields
export const headerMap: Record<string, keyof BahanBakuImport> = {
  // Name variations
  'nama_bahan_baku': 'nama',
  'nama bahan baku': 'nama',
  'nama': 'nama',
  'name': 'nama',
  'item_name': 'nama',

  // Category variations
  'kategori': 'kategori',
  'category': 'kategori',
  'jenis': 'kategori',

  // Supplier variations
  'supplier': 'supplier',
  'pemasok': 'supplier',
  'vendor': 'supplier',

  // Unit variations
  'satuan': 'satuan',
  'unit': 'satuan',
  'uom': 'satuan',

  // Expiry variations
  'tanggal_kadaluwarsa': 'expiry',
  'kadaluarsa': 'expiry',
  'expiry': 'expiry',
  'expiry_date': 'expiry',
  'exp_date': 'expiry',

  // Stock variations
  'stok_saat_ini': 'stok',
  'stok': 'stok',
  'stock': 'stok',
  'current_stock': 'stok',
  'qty': 'stok',
  'quantity': 'stok',

  // Minimum stock variations
  'minimum_stok': 'minimum',
  'minimum': 'minimum',
  'min_stock': 'minimum',
  'min': 'minimum',
  'reorder_point': 'minimum',
};

export const requiredFields: (keyof BahanBakuImport)[] = [
  'nama',
  'kategori',
  'supplier',
  'satuan',
  'stok',
  'minimum',
];

export const validate = (data: any): string[] => {
  const errors: string[] = [];

  if (!data.nama?.trim()) errors.push('Nama bahan baku kosong');
  if (!data.kategori?.trim()) errors.push('Kategori kosong');
  if (!data.supplier?.trim()) errors.push('Supplier kosong');
  if (!data.satuan?.trim()) errors.push('Satuan kosong');
  

  if (isNaN(data.stok) || data.stok < 0) {
    errors.push('Stok tidak valid (harus angka ≥ 0)');
  }
  if (isNaN(data.minimum) || data.minimum < 0) {
    errors.push('Minimum stok tidak valid (harus angka ≥ 0)');
  }
  

  if (data.expiry && data.expiry.trim()) {
    const expiryDate = new Date(data.expiry);
    if (isNaN(expiryDate.getTime())) {
      errors.push('Format tanggal kadaluarsa tidak valid');
    } else if (expiryDate < new Date()) {
      errors.push('Tanggal kadaluarsa sudah lewat');
    }
  }

  if (data.stok > 0 && data.minimum > 0 && data.stok < data.minimum) {
    errors.push('Stok saat ini lebih rendah dari minimum (akan muncul alert)');
  }

  return errors;
};

export const loadXLSX = async () => {
  try {
    const XLSX = await import('xlsx');
    return XLSX;
  } catch (error) {
    logger.error('Failed to load XLSX:', error);
    toast.error('Gagal memuat library Excel. Silakan refresh halaman.');
    throw error;
  }
};
