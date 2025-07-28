// src/components/warehouse/types/warehouse.ts
export interface BahanBaku {
  id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  minimum: number;
  hargaSatuan: number;
  supplier: string;
  tanggalKadaluwarsa: Date | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  jumlahBeliKemasan: number;
  satuanKemasan: string;
  hargaTotalBeliKemasan: number;
}

export interface WarehouseContextType {
  bahanBaku: BahanBaku[];
  loading: boolean;
  addBahanBaku: (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateBahanBaku: (id: string, updates: Partial<BahanBaku>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  bulkDeleteBahanBaku: (ids: string[]) => Promise<boolean>;
  
  // Selection
  selectedItems: string[];
  isSelectionMode: boolean;
  isBulkDeleting: boolean;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleSelectionMode: () => void;
  isSelected: (id: string) => boolean;
  getSelectedItems: () => BahanBaku[];
}

export interface TableColumn {
  key: keyof BahanBaku | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
  className?: string;
  render?: (item: BahanBaku) => React.ReactNode;
}

export interface FilterOptions {
  kategori: string[];
  supplier: string[];
  stokRendah: boolean;
  hampirExpired: boolean;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export interface SortConfig {
  key: keyof BahanBaku | null;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  page: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface BulkEditData {
  kategori?: string;
  supplier?: string;
  minimum?: number;
  hargaSatuan?: number;
  tanggalKadaluwarsa?: Date | null;
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
  totalValue: number;
  categories: Record<string, number>;
}

export interface MobileViewMode {
  view: 'table' | 'card' | 'list';
  showFilters: boolean;
  showActions: boolean;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeImages: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  selectedOnly: boolean;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  duplicates: number;
}