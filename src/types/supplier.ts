// src/types/supplier.ts
// TypeScript type definitions for supplier module

export interface Supplier {
  id: string;
  nama: string;
  kontak: string;
  email?: string;
  telepon?: string;
  alamat?: string;
  catatan?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierFormData {
  nama: string;
  kontak: string;
  email: string;
  telepon: string;
  alamat: string;
  catatan: string;
}

export interface SupplierCreateInput extends Omit<Supplier, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {}

export interface SupplierUpdateInput extends Partial<Omit<Supplier, 'id' | 'userId'>> {}

export interface SupplierFilters {
  searchTerm?: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
  sortBy?: 'nama' | 'kontak' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SupplierStats {
  total: number;
  withEmail: number;
  withPhone: number;
  withAddress: number;
  completionRate: number;
}

// Database-related types
export interface SupplierDbRow {
  id: string;
  nama: string;
  kontak: string;
  email: string | null;
  telepon: string | null;
  alamat: string | null;
  catatan: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierDbInsert {
  nama: string;
  kontak: string;
  email?: string | null;
  telepon?: string | null;
  alamat?: string | null;
  catatan?: string | null;
  user_id: string;
}

export interface SupplierDbUpdate {
  nama?: string;
  kontak?: string;
  email?: string | null;
  telepon?: string | null;
  alamat?: string | null;
  catatan?: string | null;
}

// Component props types
export interface SupplierTableProps {
  suppliers: Supplier[];
  isLoading: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  isSelectionMode: boolean;
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onAddFirst: () => void;
  searchTerm: string;
}

export interface SupplierFormProps {
  supplier: Supplier | null;
  onSuccess?: (supplier: Supplier) => void;
  onCancel?: () => void;
  className?: string;
}

export interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSuccess?: (supplier: Supplier) => void;
}

export interface SupplierFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (count: number) => void;
  isSelectionMode: boolean;
  onSelectionModeChange: (enabled: boolean) => void;
}

export interface BulkActionsProps {
  isVisible: boolean;
  selectedCount: number;
  totalFilteredCount: number;
  onCancel: () => void;
  onSelectAll: () => void;
  onBulkDelete: () => void;
  suppliers: Supplier[];
}

// Hook return types
export interface UseSupplierFormReturn {
  formData: SupplierFormData;
  formErrors: Record<string, string>;
  handleSubmit: () => Promise<boolean>;
  resetForm: () => void;
  updateField: (field: keyof SupplierFormData, value: string) => void;
  isEditing: boolean;
}

export interface UseSupplierTableReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  selectedSupplierIds: string[];
  setSelectedSupplierIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  isSelectionMode: boolean;
  setIsSelectionMode: (enabled: boolean) => void;
  filteredSuppliers: Supplier[];
  currentSuppliers: Supplier[];
  totalPages: number;
}

// Error types
export interface SupplierError {
  code: string;
  message: string;
  field?: string;
}

export interface SupplierValidationError extends SupplierError {
  field: keyof SupplierFormData;
}

// API response types
export interface SupplierApiResponse<T = Supplier> {
  data: T | null;
  error: SupplierError | null;
  success: boolean;
}

export interface SupplierListResponse {
  data: Supplier[];
  total: number;
  page: number;
  limit: number;
  error: SupplierError | null;
  success: boolean;
}

// Event types for realtime updates
export type SupplierRealtimeEvent = 
  | { type: 'INSERT'; payload: Supplier }
  | { type: 'UPDATE'; payload: Supplier }
  | { type: 'DELETE'; payload: { id: string } };

// Utility types
export type SupplierSortField = keyof Pick<Supplier, 'nama' | 'kontak' | 'createdAt' | 'updatedAt'>;
export type SortOrder = 'asc' | 'desc';

// Form validation types
export interface SupplierFormValidation {
  nama: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  kontak: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  email: {
    required: boolean;
    pattern: RegExp;
  };
  telepon: {
    required: boolean;
    pattern: RegExp;
  };
}

// Default validation rules
export const SUPPLIER_VALIDATION: SupplierFormValidation = {
  nama: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  kontak: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  email: {
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  telepon: {
    required: false,
    pattern: /^[\d\s\-\+\(\)]+$/,
  },
};

// Constants
export const SUPPLIER_TABLE_COLUMNS = [
  { key: 'nama', label: 'Nama Supplier', sortable: true },
  { key: 'kontak', label: 'Kontak', sortable: true },
  { key: 'email', label: 'Email', sortable: false },
  { key: 'telepon', label: 'Telepon', sortable: false },
  { key: 'actions', label: 'Aksi', sortable: false },
] as const;

export const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50] as const;

export const SUPPLIER_FORM_FIELDS = [
  'nama',
  'kontak',
  'email',
  'telepon',
  'alamat',
  'catatan',
] as const;

// Export types for external use
export type SupplierFormField = typeof SUPPLIER_FORM_FIELDS[number];
export type ItemsPerPageOption = typeof ITEMS_PER_PAGE_OPTIONS[number];
export type SupplierTableColumn = typeof SUPPLIER_TABLE_COLUMNS[number];