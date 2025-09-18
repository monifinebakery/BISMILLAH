// src/utils/supplierUtils.ts
// Utility functions and constants for supplier management

import type { 
  Supplier, 
  SupplierFormData, 
  SupplierValidationError,
  SupplierDbRow,
  SupplierDbInsert,
  SupplierDbUpdate
} from '@/types/supplier';
import { safeDom } from '@/utils/browserApiSafeWrappers';

// ================================================================
// VALIDATION UTILITIES
// ================================================================

export const validateSupplierForm = (formData: SupplierFormData): SupplierValidationError[] => {
  const errors: SupplierValidationError[] = [];

  // Nama validation
  if (!formData.nama.trim()) {
    errors.push({
      code: 'REQUIRED_FIELD',
      message: 'Nama supplier wajib diisi',
      field: 'nama'
    });
  } else if (formData.nama.trim().length < 2) {
    errors.push({
      code: 'MIN_LENGTH',
      message: 'Nama supplier minimal 2 karakter',
      field: 'nama'
    });
  } else if (formData.nama.trim().length > 100) {
    errors.push({
      code: 'MAX_LENGTH',
      message: 'Nama supplier maksimal 100 karakter',
      field: 'nama'
    });
  }

  // Kontak validation
  if (!formData.kontak.trim()) {
    errors.push({
      code: 'REQUIRED_FIELD',
      message: 'Nama kontak wajib diisi',
      field: 'kontak'
    });
  } else if (formData.kontak.trim().length < 2) {
    errors.push({
      code: 'MIN_LENGTH',
      message: 'Nama kontak minimal 2 karakter',
      field: 'kontak'
    });
  } else if (formData.kontak.trim().length > 100) {
    errors.push({
      code: 'MAX_LENGTH',
      message: 'Nama kontak maksimal 100 karakter',
      field: 'kontak'
    });
  }

  // Email validation (optional)
  if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.push({
      code: 'INVALID_FORMAT',
      message: 'Format email tidak valid',
      field: 'email'
    });
  }

  // Phone validation (optional)
  if (formData.telepon.trim() && !/^[\d\s()+-]+$/.test(formData.telepon)) {
    errors.push({
      code: 'INVALID_FORMAT',
      message: 'Format nomor telepon tidak valid',
      field: 'telepon'
    });
  }

  // Address validation (optional)
  if (formData.alamat.trim() && formData.alamat.trim().length > 500) {
    errors.push({
      code: 'MAX_LENGTH',
      message: 'Alamat maksimal 500 karakter',
      field: 'alamat'
    });
  }

  // Notes validation (optional)
  if (formData.catatan.trim() && formData.catatan.trim().length > 1000) {
    errors.push({
      code: 'MAX_LENGTH',
      message: 'Catatan maksimal 1000 karakter',
      field: 'catatan'
    });
  }

  return errors;
};

// ================================================================
// DATA TRANSFORMATION UTILITIES
// ================================================================

export const transformSupplierFromDB = (dbRow: SupplierDbRow): Supplier => ({
  id: dbRow.id,
  nama: dbRow.nama,
  kontak: dbRow.kontak,
  email: dbRow.email || undefined,
  telepon: dbRow.telepon || undefined,
  alamat: dbRow.alamat || undefined,
  catatan: dbRow.catatan || undefined,
  userId: dbRow.user_id,
  createdAt: new Date(dbRow.created_at),
  updatedAt: new Date(dbRow.updated_at),
});

export const transformSupplierToDBInsert = (
  supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
  userId: string
): SupplierDbInsert => ({
  nama: supplier.nama.trim(),
  kontak: supplier.kontak.trim(),
  email: supplier.email?.trim() || null,
  telepon: supplier.telepon?.trim() || null,
  alamat: supplier.alamat?.trim() || null,
  catatan: supplier.catatan?.trim() || null,
  user_id: userId,
});

export const transformSupplierToDBUpdate = (
  supplier: Partial<Omit<Supplier, 'id' | 'userId'>>
): SupplierDbUpdate => {
  const update: SupplierDbUpdate = {};
  
  if (supplier.nama !== undefined) {
    update.nama = supplier.nama.trim();
  }
  if (supplier.kontak !== undefined) {
    update.kontak = supplier.kontak.trim();
  }
  if (supplier.email !== undefined) {
    update.email = supplier.email?.trim() || null;
  }
  if (supplier.telepon !== undefined) {
    update.telepon = supplier.telepon?.trim() || null;
  }
  if (supplier.alamat !== undefined) {
    update.alamat = supplier.alamat?.trim() || null;
  }
  if (supplier.catatan !== undefined) {
    update.catatan = supplier.catatan?.trim() || null;
  }
  
  return update;
};

export const cleanFormData = (formData: SupplierFormData): SupplierFormData => ({
  nama: formData.nama.trim(),
  kontak: formData.kontak.trim(),
  email: formData.email.trim(),
  telepon: formData.telepon.trim(),
  alamat: formData.alamat.trim(),
  catatan: formData.catatan.trim(),
});

// ================================================================
// SEARCH AND FILTER UTILITIES
// ================================================================

export const searchSuppliers = (suppliers: Supplier[], searchTerm: string): Supplier[] => {
  if (!searchTerm.trim()) {
    return suppliers;
  }

  const term = searchTerm.toLowerCase().trim();
  
  return suppliers.filter(supplier => {
    const searchableFields = [
      supplier.nama,
      supplier.kontak,
      supplier.email || '',
      supplier.telepon || '',
      supplier.alamat || '',
    ];

    return searchableFields.some(field => 
      field.toLowerCase().includes(term)
    );
  });
};

export const sortSuppliers = (
  suppliers: Supplier[], 
  sortBy: keyof Supplier = 'nama', 
  sortOrder: 'asc' | 'desc' = 'asc'
): Supplier[] => {
  return [...suppliers].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle undefined values
    if (aValue === undefined) aValue = '';
    if (bValue === undefined) bValue = '';

    // Handle Date objects
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortOrder === 'asc' 
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }

    // Handle strings
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();

    if (sortOrder === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });
};

export const paginateSuppliers = (
  suppliers: Supplier[], 
  page: number, 
  itemsPerPage: number
): Supplier[] => {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return suppliers.slice(startIndex, endIndex);
};

// ================================================================
// STATISTICAL UTILITIES
// ================================================================

export const calculateSupplierStats = (suppliers: Supplier[]) => {
  const total = suppliers.length;
  
  if (total === 0) {
    return {
      total: 0,
      withEmail: 0,
      withPhone: 0,
      withAddress: 0,
      withNotes: 0,
      completionRate: 0,
      avgCompleteness: 0,
    };
  }

  const withEmail = suppliers.filter(s => s.email?.trim()).length;
  const withPhone = suppliers.filter(s => s.telepon?.trim()).length;
  const withAddress = suppliers.filter(s => s.alamat?.trim()).length;
  const withNotes = suppliers.filter(s => s.catatan?.trim()).length;

  // Calculate average completeness (email and phone are considered important)
  const totalCompleteness = suppliers.reduce((sum, supplier) => {
    let completeness = 2; // nama and kontak are always present
    if (supplier.email?.trim()) completeness += 1;
    if (supplier.telepon?.trim()) completeness += 1;
    if (supplier.alamat?.trim()) completeness += 0.5;
    if (supplier.catatan?.trim()) completeness += 0.5;
    return sum + (completeness / 5) * 100; // out of 5 possible points
  }, 0);

  return {
    total,
    withEmail,
    withPhone,
    withAddress,
    withNotes,
    completionRate: Math.round((withEmail / total) * 100),
    avgCompleteness: Math.round(totalCompleteness / total),
  };
};

// ================================================================
// EXPORT/IMPORT UTILITIES
// ================================================================

export const exportSuppliersToCSV = (suppliers: Supplier[]): string => {
  const headers = ['Nama Supplier', 'Kontak', 'Email', 'Telepon', 'Alamat', 'Catatan', 'Dibuat', 'Diupdate'];
  
  const csvContent = [
    headers.join(','),
    ...suppliers.map(supplier => [
      `"${supplier.nama}"`,
      `"${supplier.kontak}"`,
      `"${supplier.email || ''}"`,
      `"${supplier.telepon || ''}"`,
      `"${supplier.alamat || ''}"`,
      `"${supplier.catatan || ''}"`,
      `"${supplier.createdAt.toLocaleDateString('id-ID')}"`,
      `"${supplier.updatedAt.toLocaleDateString('id-ID')}"`,
    ].join(','))
  ].join('\n');

  return csvContent;
};

export const downloadCSV = (csvContent: string, filename: string = 'suppliers.csv') => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = safeDom.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    safeDom.safeAppendChild(document.body, link);
    link.click();
    // Safe cleanup
    safeDom.safeRemoveElement(link as any);
  }
};

// ================================================================
// CONSTANTS
// ================================================================

export const SUPPLIER_CONSTANTS = {
  MAX_NAME_LENGTH: 100,
  MAX_CONTACT_LENGTH: 100,
  MAX_ADDRESS_LENGTH: 500,
  MAX_NOTES_LENGTH: 1000,
  MIN_NAME_LENGTH: 2,
  MIN_CONTACT_LENGTH: 2,
  
  DEFAULT_ITEMS_PER_PAGE: 10,
  MAX_ITEMS_PER_PAGE: 100,
  
  SEARCH_DEBOUNCE_MS: 300,
  
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\d\s()+-]+$/,
  
  SORT_OPTIONS: [
    { value: 'nama', label: 'Nama Supplier' },
    { value: 'kontak', label: 'Nama Kontak' },
    { value: 'createdAt', label: 'Tanggal Dibuat' },
    { value: 'updatedAt', label: 'Terakhir Diupdate' }
  ] as const,
  
  ITEMS_PER_PAGE_OPTIONS: [5, 10, 20, 50, 100] as const,
} as const;

// ================================================================
// TYPE GUARDS
// ================================================================

export const isValidSupplier = (obj: any): obj is Supplier => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.nama === 'string' &&
    typeof obj.kontak === 'string' &&
    typeof obj.userId === 'string' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date &&
    (obj.email === undefined || typeof obj.email === 'string') &&
    (obj.telepon === undefined || typeof obj.telepon === 'string') &&
    (obj.alamat === undefined || typeof obj.alamat === 'string') &&
    (obj.catatan === undefined || typeof obj.catatan === 'string')
  );
};

export const isValidSupplierFormData = (obj: any): obj is SupplierFormData => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.nama === 'string' &&
    typeof obj.kontak === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.telepon === 'string' &&
    typeof obj.alamat === 'string' &&
    typeof obj.catatan === 'string'
  );
};

// ================================================================
// ERROR HANDLING UTILITIES
// ================================================================

export const handleSupplierError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  
  return 'Terjadi kesalahan yang tidak diketahui';
};

export const formatSupplierErrorMessage = (error: SupplierValidationError): string => {
  const fieldLabels: Record<keyof SupplierFormData, string> = {
    nama: 'Nama Supplier',
    kontak: 'Nama Kontak',
    email: 'Email',
    telepon: 'Telepon',
    alamat: 'Alamat',
    catatan: 'Catatan',
  };
  
  const fieldLabel = fieldLabels[error.field] || error.field;
  return `${fieldLabel}: ${error.message}`;
};
