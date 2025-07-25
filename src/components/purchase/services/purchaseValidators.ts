import { Purchase, PurchaseItem } from '@/types/supplier';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PurchaseFormData {
  supplier: string;
  tanggal: Date | string;
  items: PurchaseItem[];
  status: string;
}

export interface ItemFormData {
  namaBarang: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
}

/**
 * Validate purchase form data
 */
export const validatePurchaseForm = (data: PurchaseFormData): ValidationResult => {
  const errors: string[] = [];

  // Validate supplier
  if (!data.supplier || data.supplier.trim() === '') {
    errors.push('Supplier wajib dipilih');
  }

  // Validate date
  if (!data.tanggal) {
    errors.push('Tanggal wajib diisi');
  } else {
    const date = data.tanggal instanceof Date ? data.tanggal : new Date(data.tanggal);
    if (isNaN(date.getTime())) {
      errors.push('Format tanggal tidak valid');
    }
  }

  // Validate items
  if (!data.items || data.items.length === 0) {
    errors.push('Minimal satu item wajib ditambahkan');
  } else {
    // Validate each item
    data.items.forEach((item, index) => {
      const itemErrors = validatePurchaseItem(item);
      if (!itemErrors.isValid) {
        itemErrors.errors.forEach(error => {
          errors.push(`Item ${index + 1}: ${error}`);
        });
      }
    });
  }

  // Validate status
  const validStatuses = ['pending', 'completed', 'cancelled'];
  if (!data.status || !validStatuses.includes(data.status)) {
    errors.push('Status tidak valid');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate individual purchase item
 */
export const validatePurchaseItem = (item: PurchaseItem): ValidationResult => {
  const errors: string[] = [];

  // Validate item name
  if (!item.namaBarang || item.namaBarang.trim() === '') {
    errors.push('Nama barang wajib diisi');
  }

  // Validate quantity
  if (!item.jumlah || item.jumlah <= 0) {
    errors.push('Jumlah harus lebih dari 0');
  }

  // Validate unit price
  if (!item.hargaSatuan || item.hargaSatuan <= 0) {
    errors.push('Harga satuan harus lebih dari 0');
  }

  // Validate unit (optional but recommended)
  if (!item.satuan || item.satuan.trim() === '') {
    errors.push('Satuan wajib diisi');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate item form data before adding to purchase
 */
export const validateItemForm = (data: ItemFormData): ValidationResult => {
  const errors: string[] = [];

  if (!data.namaBarang || data.namaBarang.trim() === '') {
    errors.push('Nama barang wajib dipilih');
  }

  if (!data.jumlah || data.jumlah <= 0) {
    errors.push('Jumlah harus lebih dari 0');
  }

  if (!data.hargaSatuan || data.hargaSatuan <= 0) {
    errors.push('Harga satuan harus lebih dari 0');
  }

  if (!data.satuan || data.satuan.trim() === '') {
    errors.push('Satuan wajib diisi');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate bulk operations
 */
export const validateBulkDelete = (selectedIds: string[]): ValidationResult => {
  const errors: string[] = [];

  if (!selectedIds || selectedIds.length === 0) {
    errors.push('Pilih minimal satu item untuk dihapus');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate purchase status change
 */
export const validateStatusChange = (currentStatus: string, newStatus: string): ValidationResult => {
  const errors: string[] = [];
  const validStatuses = ['pending', 'completed', 'cancelled'];

  if (!validStatuses.includes(newStatus)) {
    errors.push('Status baru tidak valid');
  }

  // Business rules for status transitions
  if (currentStatus === 'completed' && newStatus === 'pending') {
    errors.push('Tidak dapat mengubah status dari "Selesai" ke "Menunggu"');
  }

  if (currentStatus === 'cancelled' && newStatus !== 'cancelled') {
    errors.push('Tidak dapat mengubah status pembelian yang sudah dibatalkan');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate search term
 */
export const validateSearchTerm = (searchTerm: string): boolean => {
  // Allow empty search (show all)
  if (!searchTerm) return true;
  
  // Check minimum length
  if (searchTerm.trim().length < 1) return false;
  
  // Check maximum length
  if (searchTerm.length > 100) return false;
  
  return true;
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (page: number, itemsPerPage: number, totalItems: number): ValidationResult => {
  const errors: string[] = [];

  if (page < 1) {
    errors.push('Halaman harus dimulai dari 1');
  }

  if (itemsPerPage < 1 || itemsPerPage > 100) {
    errors.push('Jumlah item per halaman harus antara 1-100');
  }

  const maxPage = Math.ceil(totalItems / itemsPerPage) || 1;
  if (page > maxPage) {
    errors.push(`Halaman tidak boleh lebih dari ${maxPage}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};