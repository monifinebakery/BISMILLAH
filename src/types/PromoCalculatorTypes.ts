// types/PromoCalculatorTypes.ts

// 🎯 Base Entity Types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface AuditableEntity extends BaseEntity {
  created_by?: string;
  updated_by?: string;
  version: number;
}

// 🍽️ Recipe Types
export interface Recipe extends BaseEntity {
  namaResep: string;
  deskripsi?: string;
  hppPerPorsi: number;
  hargaJualPorsi: number;
  kategori?: string;
  isActive: boolean;
  ingredients?: RecipeIngredient[];
  nutritionalInfo?: NutritionalInfo;
  tags?: string[];
}

export interface RecipeIngredient {
  id: string;
  nama: string;
  jumlah: number;
  satuan: string;
  harga: number;
}

export interface NutritionalInfo {
  kalori: number;
  protein: number;
  karbohidrat: number;
  lemak: number;
  gula?: number;
  garam?: number;
}

// 🎯 Promo Types
export type PromoType = 'discount_percent' | 'discount_rp' | 'bogo' | 'bundle' | 'tiered';

export interface BasePromoDetails {
  type: PromoType;
  description?: string;
}

export interface DiscountPercentDetails extends BasePromoDetails {
  type: 'discount_percent';
  value: number; // 0-100
  maxDiscount?: number; // Maximum discount amount in Rp
}

export interface DiscountRpDetails extends BasePromoDetails {
  type: 'discount_rp';
  value: number; // Discount amount in Rp
  minPurchase?: number; // Minimum purchase required
}

export interface BOGODetails extends BasePromoDetails {
  type: 'bogo';
  buy: number;
  get: number;
  freeItemId?: string; // Specific item to give for free
}

export interface BundleDetails extends BasePromoDetails {
  type: 'bundle';
  items: Array<{
    recipeId: string;
    quantity: number;
  }>;
  bundlePrice: number;
}

export interface TieredDetails extends BasePromoDetails {
  type: 'tiered';
  tiers: Array<{
    minQuantity: number;
    discountPercent: number;
  }>;
}

export type PromoDetails = 
  | DiscountPercentDetails 
  | DiscountRpDetails 
  | BOGODetails 
  | BundleDetails 
  | TieredDetails;

// 📊 Promo Estimation
export interface PromoEstimation extends AuditableEntity {
  promo_name: string;
  promo_type: PromoType;
  base_recipe_id: string;
  base_recipe_name: string;
  promo_details: PromoDetails;
  original_price: number;
  original_hpp: number;
  promo_price_effective: number;
  estimated_margin_percent: number;
  estimated_margin_rp: number;
  status: EstimationStatus;
  tags?: string[];
  notes?: string;
}

export type EstimationStatus = 'draft' | 'active' | 'paused' | 'expired' | 'cancelled';

// 🔢 Calculation Types  
export interface CalculationInput {
  originalPrice: number;
  originalHpp: number;
  promoType: PromoType;
  promoDetails: PromoDetails;
}

export interface CalculationResult {
  effectivePrice: number;
  marginRp: number;
  marginPercent: number;
  discountAmount: number;
  discountPercent: number;
  isNegativeMargin: boolean;
  breakdown: CalculationBreakdown;
  warnings: CalculationWarning[];
}

export interface CalculationBreakdown {
  originalPrice: number;
  hpp: number;
  grossDiscount: number;
  netPrice: number;
  grossMargin: number;
  marginPercent: number;
  roi?: number; // Return on Investment
}

export interface CalculationWarning {
  type: 'margin' | 'pricing' | 'business';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion?: string;
}

// 📈 Analytics Types
export interface PromoAnalytics {
  estimationId: string;
  metrics: {
    calculationTime: number;
    userInteractions: number;
    modificationsCount: number;
    finalMarginPercent: number;
  };
  userBehavior: {
    timeSpent: number;
    clickEvents: AnalyticsEvent[];
    formFieldChanges: FormFieldChange[];
  };
  deviceInfo: DeviceInfo;
}

export interface AnalyticsEvent {
  type: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface FormFieldChange {
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
}

export interface DeviceInfo {
  userAgent: string;
  screenSize: { width: number; height: number };
  ismobile: boolean;
  connectionType?: string;
}

// 🔍 Filter & Search Types
export interface PromoFilter {
  promoTypes?: PromoType[];
  recipeIds?: string[];
  marginRange?: [number, number];
  priceRange?: [number, number];
  dateRange?: [string, string];
  status?: EstimationStatus[];
  tags?: string[];
  searchQuery?: string;
}

export interface SortOptions {
  field: keyof PromoEstimation;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total?: number;
}

// 🎛️ Component Props Types
export interface PromoCalculatorProps {
  initialRecipeId?: string;
  onSave?: (estimation: PromoEstimation) => void;
  onCancel?: () => void;
  readOnly?: boolean;
  showAnalytics?: boolean;
}

export interface PromoFormProps {
  promoType: PromoType;
  value: PromoDetails;
  onChange: (details: PromoDetails) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export interface PromoResultsProps {
  calculation: CalculationResult;
  recipe: Recipe;
  showBreakdown?: boolean;
  showWarnings?: boolean;
}

// 🚨 Error Types
export interface PromoError extends Error {
  code: string;
  context?: Record<string, any>;
  recoverable: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface FormErrors {
  [key: string]: ValidationError[];
}

// 🔄 State Management Types
export interface PromoCalculatorState {
  // Data
  recipes: Recipe[];
  estimations: PromoEstimation[];
  
  // Current Form State
  selectedRecipeId: string;
  promoDetails: PromoDetails;
  promoName: string;
  
  // UI State
  isCalculating: boolean;
  isSaving: boolean;
  isLoading: boolean;
  
  // Calculated Results
  currentCalculation?: CalculationResult;
  
  // Filters & Search
  filters: PromoFilter;
  sortOptions: SortOptions;
  pagination: PaginationOptions;
  
  // Error States
  errors: FormErrors;
  lastError?: PromoError;
}

export type PromoCalculatorAction = 
  | { type: 'SET_RECIPES'; payload: Recipe[] }
  | { type: 'SET_ESTIMATIONS'; payload: PromoEstimation[] }
  | { type: 'SELECT_RECIPE'; payload: string }
  | { type: 'UPDATE_PROMO_DETAILS'; payload: PromoDetails }
  | { type: 'SET_PROMO_NAME'; payload: string }
  | { type: 'SET_CALCULATION_RESULT'; payload: CalculationResult }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_CALCULATING'; payload: boolean }
  | { type: 'SET_FILTERS'; payload: Partial<PromoFilter> }
  | { type: 'SET_SORT'; payload: SortOptions }
  | { type: 'SET_PAGINATION'; payload: Partial<PaginationOptions> }
  | { type: 'SET_ERRORS'; payload: FormErrors }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_ERROR'; payload: PromoError }
  | { type: 'RESET_FORM' };

// 🎨 Theme & UI Types
export interface PromoTheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    neutral: string;
  };
  gradients: {
    header: string;
    card: string;
    button: string;
  };
  animations: {
    duration: number;
    easing: string;
  };
}

export interface UIPreferences {
  theme: 'light' | 'dark' | 'auto';
  animations: boolean;
  compactMode: boolean;
  showTooltips: boolean;
  language: 'id' | 'en';
}

// 🛠️ Service Types
export interface ServiceConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  cacheTTL: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    requestId: string;
    timestamp: string;
    duration: number;
    cached: boolean;
  };
}

// 🧪 Testing Types
export interface MockDataConfig {
  recipeCount: number;
  estimationCount: number;
  includeEdgeCases: boolean;
  scenario: 'normal' | 'high-volume' | 'error-prone';
}

export interface TestScenario {
  name: string;
  input: CalculationInput;
  expected: Partial<CalculationResult>;
  description: string;
}

// 🔧 Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

export type NonEmptyArray<T> = [T, ...T[]];

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type ValuesOfType<T, U> = T[KeysOfType<T, U>];

// 📊 Advanced Calculation Types
export type CalculationStrategy = 'conservative' | 'aggressive' | 'balanced';

export interface AdvancedCalculationOptions {
  strategy: CalculationStrategy;
  includeSeasonality: boolean;
  competitorPricing?: number[];
  demandElasticity?: number;
  costInflationRate?: number;
}

export interface SeasonalityFactor {
  month: number;
  multiplier: number;
  confidence: number;
}

export interface CompetitorAnalysis {
  competitorId: string;
  price: number;
  marginEstimate?: number;
  marketShare?: number;
  lastUpdated: string;
}

// 🎯 Performance Types
export interface PerformanceMetrics {
  renderTime: number;
  calculationTime: number;
  memoryUsage: number;
  bundleSize: number;
  cacheHitRate: number;
}

export interface OptimizationSettings {
  enableVirtualization: boolean;
  batchSize: number;
  debounceMs: number;
  maxConcurrentCalculations: number;
  preloadNextPage: boolean;
}

// 📱 Responsive Types
export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface ResponsiveValue<T> {
  [K in BreakpointKey]?: T;
}

export interface ViewportInfo {
  width: number;
  height: number;
  breakpoint: BreakpointKey;
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
}

// 🔐 Security Types
export interface SecurityContext {
  userId: string;
  permissions: Permission[];
  sessionId: string;
  expiresAt: string;
}

export interface Permission {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin';
  conditions?: Record<string, any>;
}

// 🌐 Internationalization Types
export interface LocalizedContent {
  [key: string]: {
    id: string;
    en: string;
  };
}

export interface CurrencyFormat {
  code: string;
  symbol: string;
  decimals: number;
  position: 'before' | 'after';
}

// 🔄 Integration Types
export interface ExternalSystemConfig {
  name: string;
  endpoint: string;
  apiKey?: string;
  enabled: boolean;
  syncInterval?: number;
}

export interface DataSyncStatus {
  lastSync: string;
  status: 'success' | 'error' | 'pending';
  recordsProcessed: number;
  errors?: string[];
}

// Type Guards
export const isDiscountPercent = (details: PromoDetails): details is DiscountPercentDetails => {
  return details.type === 'discount_percent';
};

export const isDiscountRp = (details: PromoDetails): details is DiscountRpDetails => {
  return details.type === 'discount_rp';
};

export const isBOGO = (details: PromoDetails): details is BOGODetails => {
  return details.type === 'bogo';
};

export const isBundle = (details: PromoDetails): details is BundleDetails => {
  return details.type === 'bundle';
};

export const isTiered = (details: PromoDetails): details is TieredDetails => {
  return details.type === 'tiered';
};

// Helper types for complex operations
export type PromoDetailsMap = {
  [K in PromoType]: Extract<PromoDetails, { type: K }>;
};

export type FormFieldMap<T> = {
  [K in keyof T]: {
    value: T[K];
    error?: string;
    touched: boolean;
    dirty: boolean;
  };
};

export default {};

// Export all types as a namespace for convenience
export * from './PromoCalculatorTypes';