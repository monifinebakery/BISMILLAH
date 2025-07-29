// src/components/purchase/types/purchase.types.ts

export interface PurchaseItem {
  bahanBakuId: string;
  nama: string;
  kuantitas: number;
  satuan: string;
  hargaSatuan: number;
  subtotal: number;
  keterangan?: string;
}

export interface Purchase {
  id: string;
  userId: string;
  supplier: string;
  tanggal: Date;
  totalNilai: number;
  items: PurchaseItem[];
  status: PurchaseStatus;
  metodePerhitungan: CalculationMethod;
  createdAt: Date;
  updatedAt: Date;
}

export type PurchaseStatus = 'pending' | 'completed' | 'cancelled';
export type CalculationMethod = 'FIFO' | 'LIFO' | 'AVERAGE';

// Form types
export interface PurchaseFormData {
  supplier: string;
  tanggal: Date;
  items: PurchaseItem[];
  metodePerhitungan: CalculationMethod;
}

// Context types
export interface PurchaseContextType {
  purchases: Purchase[];
  isLoading: boolean;
  error: string | null;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<boolean>;
  deletePurchase: (id: string) => Promise<boolean>;
  refreshPurchases: () => Promise<void>;
}

// Table context types
export interface PurchaseTableContextType {
  selectedItems: string[];
  setSelectedItems: (items: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isAllSelected: boolean;
  bulkDelete: () => Promise<void>;
  isBulkDeleting: boolean;
  showBulkDeleteDialog: boolean;
  setShowBulkDeleteDialog: (show: boolean) => void;
}

// Stats types
export interface PurchaseStats {
  total: number;
  totalValue: number;
  byStatus: {
    pending: number;
    completed: number;
    cancelled: number;
  };
}

// API types
export interface PurchaseApiResponse {
  data: Purchase[] | null;
  error: string | null;
}

export interface CreatePurchaseRequest {
  user_id: string;
  supplier: string;
  tanggal: string;
  total_nilai: number;
  items: PurchaseItem[];
  status?: PurchaseStatus;
  metode_perhitungan?: CalculationMethod;
}

// Hook types
export interface UsePurchaseReturn extends PurchaseContextType {}

export interface UsePurchaseTableReturn extends PurchaseTableContextType {
  filteredPurchases: Purchase[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: PurchaseStatus | 'all';
  setStatusFilter: (status: PurchaseStatus | 'all') => void;
}

export interface UsePurchaseStatsReturn {
  stats: PurchaseStats;
  isCalculating: boolean;
}

// Component props types
export interface PurchaseDialogProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  purchase?: Purchase | null;
  suppliers: Array<{ id: string; nama: string }>;
  bahanBaku: Array<{ id: string; nama: string; satuan: string }>;
  onClose: () => void;
}

export interface PurchaseTableProps {
  onEdit: (purchase: Purchase) => void;
}

export interface PurchaseHeaderProps {
  totalPurchases: number;
  totalValue: number;
  pendingCount: number;
  onAddPurchase: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  className?: string;
}

export interface DataWarningBannerProps {
  missingSuppliers: boolean;
  missingBahanBaku: boolean;
  onDismiss: () => void;
}

// Export all types
export type {
  PurchaseItem,
  Purchase,
  PurchaseStatus,
  CalculationMethod,
  PurchaseFormData,
  PurchaseContextType,
  PurchaseTableContextType,
  PurchaseStats,
  PurchaseApiResponse,
  CreatePurchaseRequest,
  UsePurchaseReturn,
  UsePurchaseTableReturn,
  UsePurchaseStatsReturn,
  PurchaseDialogProps,
  PurchaseTableProps,
  PurchaseHeaderProps,
  DataWarningBannerProps,
};