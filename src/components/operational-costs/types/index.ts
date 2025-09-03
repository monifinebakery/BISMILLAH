// src/components/operational-costs/types/index.ts
// Smart grouped re-exports based on usage patterns

// === CORE ENTITIES ===
// Main domain objects that most components need
export type {
  OperationalCost,
  AllocationSettings,
  OverheadCalculation
} from './operationalCost.types';

// === FORM DATA TYPES ===
// Types for forms and input handling
export type {
  CostFormData,
  AllocationFormData
} from './operationalCost.types';

// === UI & DISPLAY TYPES ===
// Types for UI components, filters, and summaries
export type {
  CostSummary,
  CostFilters
} from './operationalCost.types';

// === API & SERVICE TYPES ===
// Types for API communication
export type {
  ApiResponse,
  CostListResponse,
  PaginationParams
} from './operationalCost.types';

// === GROUPED TYPE BUNDLES ===
// Commonly used together type combinations

// For CRUD operations (Create, Read, Update, Delete)
export interface CostCRUD {
  entity: OperationalCost;
  formData: CostFormData;
  summary: CostSummary;
  filters: CostFilters;
}

// For allocation management
export interface AllocationBundle {
  settings: AllocationSettings;
  formData: AllocationFormData;
  calculation: OverheadCalculation;
}

// For API operations
export interface ApiBundle<T = any> {
  response: ApiResponse<T>;
  listResponse: CostListResponse;
  pagination: PaginationParams;
}

// === TYPE UTILITIES ===
// Helper types for better type safety

// Status and enum types
export type CostType = OperationalCost['jenis'];
export type CostStatus = OperationalCost['status'];
export type AllocationMethod = AllocationSettings['metode'];

// Partial types for updates
export type CostUpdate = Partial<CostFormData>;
export type AllocationUpdate = Partial<AllocationFormData>;

// Required field types
export type CostRequired = Pick<CostFormData, 'nama_biaya' | 'jumlah_per_bulan'>;
export type AllocationRequired = Pick<AllocationFormData, 'metode' | 'nilai'>;

// === VALIDATION TYPES ===
// Types for form validation
export interface CostValidationErrors {
  nama_biaya?: string;
  jumlah_per_bulan?: string;
  jenis?: string;
  status?: string;
  tanggal?: string; // NEW: Date field validation
}

export interface AllocationValidationErrors {
  metode?: string;
  nilai?: string;
}

// === LOADING STATES ===
// Types for loading states
export interface LoadingStates {
  costs: boolean;
  allocation: boolean;
  calculation: boolean;
  summary: boolean;
  delete: boolean;
  save: boolean;
}

// === COMPONENT PROP TYPES ===
// Common prop patterns
export interface CostComponentProps {
  cost?: OperationalCost;
  loading?: boolean;
  onSave?: (data: CostFormData) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
}

export interface AllocationComponentProps {
  settings?: AllocationSettings;
  loading?: boolean;
  onSave?: (data: AllocationFormData) => Promise<boolean>;
}

// === HOOK RETURN TYPES ===
// Return types for custom hooks (if you have them)
export interface UseOperationalCostReturn {
  costs: OperationalCost[];
  summary: CostSummary;
  loading: LoadingStates;
  error: string | null;
  createCost: (data: CostFormData) => Promise<boolean>;
  updateCost: (id: string, data: CostFormData) => Promise<boolean>;
  deleteCost: (id: string) => Promise<boolean>;
  setFilters: (filters: CostFilters) => void;
}

export interface UseCostAllocationReturn {
  settings: AllocationSettings | null;
  calculation: OverheadCalculation | null;
  loading: boolean;
  saveSettings: (data: AllocationFormData) => Promise<boolean>;
  calculateOverhead: () => Promise<void>;
}

// === TYPE GUARDS ===
// Runtime type checking utilities
export const isCostActive = (cost: OperationalCost): boolean => 
  cost.status === 'aktif';

export const isFixedCost = (cost: OperationalCost): boolean => 
  cost.jenis === 'tetap';

export const isVariableCost = (cost: OperationalCost): boolean => 
  cost.jenis === 'variabel';

export const isPerUnitAllocation = (settings: AllocationSettings): boolean =>
  settings.metode === 'per_unit';

export const isPercentageAllocation = (settings: AllocationSettings): boolean =>
  settings.metode === 'persentase';

// === CONSTANTS ===
// Related constants for better developer experience
export const COST_TYPES = {
  FIXED: 'tetap' as const,
  VARIABLE: 'variabel' as const
} as const;

export const COST_STATUSES = {
  ACTIVE: 'aktif' as const,  
  INACTIVE: 'nonaktif' as const
} as const;

export const ALLOCATION_METHODS = {
  PER_UNIT: 'per_unit' as const,
  PERCENTAGE: 'persentase' as const
} as const;

// === DEFAULT VALUES ===
// Default objects for forms and state
export const DEFAULT_COST_FORM: CostFormData = {
  nama_biaya: '',
  jumlah_per_bulan: 0,
  jenis: 'tetap',
  status: 'aktif'
};

export const DEFAULT_ALLOCATION_FORM: AllocationFormData = {
  metode: 'per_unit',
  nilai: 0
};

export const DEFAULT_FILTERS: CostFilters = {
  jenis: undefined,
  status: undefined,
  search: undefined
};

export const DEFAULT_LOADING_STATES: LoadingStates = {
  costs: false,
  allocation: false,
  calculation: false,
  summary: false,
  delete: false,
  save: false
};