// src/components/supplier/index.ts
// Export barrel for clean imports
export { default as SupplierManagement } from './SupplierManagement';
export { default as SupplierTable } from './SupplierTable';
export { default as SupplierForm } from './SupplierForm';
export { default as SupplierDialog } from './SupplierDialog';
export { default as SupplierFilters } from './SupplierFilters';
export { default as BulkActions } from './BulkActions';

// Re-export hooks
export { useSupplierForm } from './hooks/useSupplierForm';
export { useSupplierTable } from './hooks/useSupplierTable';

// Types
export interface SupplierFormData {
  nama: string;
  kontak: string;
  email: string;
  telepon: string;
  alamat: string;
  catatan: string;
}

// Note: Props interfaces akan didefinisikan di komponen yang membutuhkannya
// untuk menghindari dependency circular dan error tipe