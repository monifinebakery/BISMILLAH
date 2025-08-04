// src/components/warehouse/types.ts
/**
 * Complete Warehouse Type Definitions
 * Updated to match exact Supabase database schema with consistent BahanBakuFrontend usage
 * Enhanced with last update tracking and helper types
 */

import { ReactNode } from 'react';

// Core Data Types (Database format - snake_case)
export interface BahanBaku {
  id: string;
  user_id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  minimum: number;
  harga_satuan: number;
  supplier: string;
  tanggal_kadaluwarsa?: string;
  created_at: string;
  updated_at: string;
  jumlah_beli_kemasan?: number;
  satuan_kemasan?: string;
  harga_total_beli_kemasan?: number;
}

// Frontend interface (camelCase for frontend usage)
export interface BahanBakuFrontend {
  id: string;
  userId: string; // maps to user_id
  nama: string;
  kategori: string;
  stok: number;
  minimum: number;
  satuan: string;
  harga: number; // maps to harga_satuan
  supplier: string;
  expiry?: string; // maps to tanggal_kadaluwarsa
  createdAt: string; // maps to created_at
  updatedAt: string; // maps to updated_at
  // Additional fields
  jumlahBeliKemasan?: number; // maps to jumlah_beli_kemasan
  satuanKemasan?: string; // maps to satuan_kemasan
  hargaTotalBeliKemasan?: number; // maps to harga_total_beli_kemasan
  
  // NEW: Optional metadata for enhanced functionality
  lastModifiedBy?: string; // Track who made the last change
  notes?: string; // Additional notes
  location?: string; // Storage location
  barcode?: string; // Barcode/SKU
  imageUrl?: string; // Product image
}

// Filter & Sort Types
export interface FilterState {
  category: string;
  supplier: string;
  stockLevel: 'all' | 'low' | 'out';
  expiry: 'all' | 'expiring' | 'expired';
}

export interface SortConfig {
  key: keyof BahanBakuFrontend;  // ✅ Updated to use BahanBakuFrontend
  direction: 'asc' | 'desc';
}

// NEW: Stock level types for better type safety
export type StockLevel = 'out' | 'low' | 'medium' | 'good';

export interface StockLevelInfo {
  level: StockLevel;
  color: string;
  label: string;
}

// NEW: Alert types for item status
export type AlertType = 'expiring' | 'outOfStock' | 'lowStock';

export interface ItemAlert {
  type: AlertType;
  message: string;
  color: string;
  priority: number; // 1 = highest, 3 = lowest
}

// NEW: Enhanced filter options
export interface EnhancedFilterOptions {
  categories: string[];
  suppliers: string[];
  stockLevels: StockLevel[];
  expiryStatus: ('expiring' | 'expired' | 'good')[];
  lastUpdated: ('today' | 'week' | 'month' | 'all')[];
}

// NEW: Table configuration
export interface TableConfig {
  itemsPerPage: number;
  showLastUpdate: boolean;
  showStockAlerts: boolean;
  compactMode: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
}

// Dialog Types
export interface DialogState {
  addItem: boolean;
  editItem: boolean;
  bulkEdit: boolean;
  bulkDelete: boolean;
  import: boolean;
  export: boolean;
}

// NEW: Validation types
export interface ValidationError {
  field: keyof BahanBakuFrontend;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[]; // Keep simple for existing compatibility
}

// NEW: Enhanced validation result
export interface DetailedValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Context Types (using BahanBakuFrontend for frontend consistency)
export interface WarehouseContextType {
  // State
  bahanBaku: BahanBakuFrontend[];  // ✅ Updated to use BahanBakuFrontend
  loading: boolean;
  isConnected: boolean;
  isBulkDeleting: boolean;
  
  // CRUD Operations
  addBahanBaku: (bahan: Omit<BahanBakuFrontend, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateBahanBaku: (id: string, updates: Partial<BahanBakuFrontend>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  bulkDeleteBahanBaku: (ids: string[]) => Promise<boolean>;
  refreshData: () => Promise<void>;
  
  // Utilities
  getBahanBakuByName: (nama: string) => BahanBakuFrontend | undefined;
  reduceStok: (nama: string, jumlah: number) => Promise<boolean>;
  
  // Analysis
  getLowStockItems: () => BahanBakuFrontend[];
  
  // NEW: Enhanced utilities for last update tracking
  getRecentlyUpdatedItems: (hours?: number) => BahanBakuFrontend[];
  getItemsUpdatedBy: (userId: string) => BahanBakuFrontend[];
}

// NEW: Component prop types for better reusability
export interface BaseWarehouseComponentProps {
  items: BahanBakuFrontend[];
  isLoading?: boolean;
  searchTerm?: string;
}

export interface SelectableWarehouseComponentProps extends BaseWarehouseComponentProps {
  isSelectionMode: boolean;
  selectedItems: string[];
  onToggleSelection: (id: string) => void;
  onSelectAllCurrent: () => void;
  isSelected: (id: string) => boolean;
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
}

export interface SortableWarehouseComponentProps extends BaseWarehouseComponentProps {
  sortConfig: SortConfig;
  onSort: (key: keyof BahanBakuFrontend) => void;
}

export interface ActionableWarehouseComponentProps {
  onEdit: (item: BahanBakuFrontend) => void;
  onDelete: (id: string, nama: string) => void;
}

// Complete props interface for main table component
export interface WarehouseTableProps extends 
  SelectableWarehouseComponentProps,
  SortableWarehouseComponentProps,
  ActionableWarehouseComponentProps {
  emptyStateAction: () => void;
}

// NEW: Props for individual components
export interface MobileWarehouseCardProps {
  item: BahanBakuFrontend;
  isSelectionMode: boolean;
  searchTerm: string;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onEdit: (item: BahanBakuFrontend) => void;
  onDelete: (id: string, nama: string) => void;
}

export interface DesktopWarehouseTableProps extends 
  SelectableWarehouseComponentProps,
  SortableWarehouseComponentProps,
  ActionableWarehouseComponentProps {
  // No additional props needed, inherits everything from base interfaces
}

export interface MobileSelectionHeaderProps {
  isSelectionMode: boolean;
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
  selectedItems: string[];
  onSelectAllCurrent: () => void;
}

export interface WarehouseEmptyStateProps {
  searchTerm: string;
  onEmptyStateAction: () => void;
}

// NEW: API response types
export interface BahanBakuApiResponse {
  id: string;
  user_id: string;
  nama: string;
  kategori: string;
  supplier: string;
  stok: number;
  minimum: number;
  satuan: string;
  harga_satuan: number;
  tanggal_kadaluwarsa?: string;
  jumlah_beli_kemasan?: number;
  satuan_kemasan?: string;
  harga_total_beli_kemasan?: number;
  created_at: string;
  updated_at: string;
  last_modified_by?: string;
}

// NEW: Transformation utility types
export type ApiToBahanBakuFrontend = (api: BahanBakuApiResponse) => BahanBakuFrontend;
export type BahanBakuFrontendToApi = (frontend: BahanBakuFrontend) => Partial<BahanBakuApiResponse>;

// NEW: Data transformation helpers
export interface DataTransformers {
  apiToFrontend: ApiToBahanBakuFrontend;
  frontendToApi: BahanBakuFrontendToApi;
}

// NEW: Pagination types
export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationResult<T> {
  items: T[];
  totalPages: number;
  startIndex: number;
  endIndex: number;
  currentPage: number;
  totalItems: number;
}

// NEW: Report generation types
export interface StockReportSummary {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
  recentlyUpdatedCount: number;
  totalValue: number;
  averageStockLevel: number;
}

export interface StockReportAlerts {
  lowStock: BahanBakuFrontend[];
  outOfStock: BahanBakuFrontend[];
  expiring: BahanBakuFrontend[];
  recentlyUpdated: BahanBakuFrontend[];
}

export interface StockReport {
  summary: StockReportSummary;
  categories: Record<string, number>;
  alerts: StockReportAlerts;
}

// NEW: Time-based filtering types
export type TimeRange = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export interface TimeFilter {
  range: TimeRange;
  startDate?: Date;
  endDate?: Date;
}

// NEW: Advanced search types
export interface SearchOptions {
  fields: (keyof BahanBakuFrontend)[];
  caseSensitive: boolean;
  exactMatch: boolean;
  includeNotes: boolean;
}

export interface AdvancedSearchConfig {
  term: string;
  options: SearchOptions;
  filters: EnhancedFilterOptions;
  timeFilter: TimeFilter;
}

// NEW: Export/Import types
export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  includeImages: boolean;
  includeMetadata: boolean;
  selectedOnly: boolean;
  dateRange?: TimeFilter;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  warnings: string[];
  duplicates: BahanBakuFrontend[];
}

// NEW: Audit log types (for tracking changes)
export interface AuditLogEntry {
  id: string;
  itemId: string;
  itemName: string;
  action: 'create' | 'update' | 'delete' | 'bulk_delete';
  changes: Record<string, { old: any; new: any }>;
  userId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// NEW: Performance monitoring types
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  searchTime: number;
  totalItems: number;
  filteredItems: number;
  memoryUsage?: number;
}

// NEW: Theme and UI customization types
export interface TableTheme {
  compact: boolean;
  showBorders: boolean;
  alternateRows: boolean;
  highlightSelection: boolean;
  showIcons: boolean;
  colorScheme: 'light' | 'dark' | 'auto';
}

export interface UIPreferences {
  defaultView: 'table' | 'cards' | 'auto';
  itemsPerPage: number;
  showLastUpdate: boolean;
  showStockAlerts: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  theme: TableTheme;
}

// NEW: Notification types
export interface NotificationConfig {
  lowStockAlert: boolean;
  expiryWarning: boolean;
  outOfStockAlert: boolean;
  updateConfirmation: boolean;
  bulkActionConfirmation: boolean;
}

// NEW: Integration types (for external systems)
export interface IntegrationConfig {
  autoSync: boolean;
  syncInterval: number;
  externalSystemId?: string;
  webhookUrl?: string;
  apiKey?: string;
}

// NEW: Form state types
export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
}

// NEW: Bulk operation types
export interface BulkOperationConfig {
  maxItems: number;
  batchSize: number;
  showProgress: boolean;
  confirmationRequired: boolean;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
  affectedItems: string[];
}

// NEW: Keyboard shortcut types
export interface KeyboardShortcuts {
  search: string;
  addNew: string;
  selectAll: string;
  delete: string;
  edit: string;
  refresh: string;
  export: string;
  import: string;
}

// Re-export React types for convenience
export type { ReactNode, MouseEvent, ChangeEvent, KeyboardEvent } from 'react';