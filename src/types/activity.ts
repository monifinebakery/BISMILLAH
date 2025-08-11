// src/types/activity.ts - Activity Type Definitions (Business System)

/**
 * Core Activity interface that matches the database schema
 * for business management system
 */
export interface Activity {
  /** Unique identifier for the activity */
  id: string;
  
  /** User ID who owns this activity */
  userId: string;
  
  /** Activity title/name */
  title: string;
  
  /** Detailed description of the activity */
  description: string;
  
  /** Type/category of the business activity */
  type: ActivityType;
  
  /** Optional value associated with the activity (could be amount, quantity, etc.) */
  value?: string | null;
  
  /** Legacy timestamp field for backward compatibility */
  timestamp: Date;
  
  /** When the activity was created */
  createdAt: Date;
  
  /** When the activity was last updated */
  updatedAt: Date | null;
}

/**
 * Business activity types based on database constraint
 * These match the check constraint in the database
 */
export type ActivityType = 
  | 'hpp'        // Harga Pokok Penjualan
  | 'stok'       // Stock Management
  | 'resep'      // Recipe/Formula Management
  | 'purchase'   // Purchase Orders
  | 'supplier'   // Supplier Management
  | 'aset'       // Asset Management
  | 'keuangan'   // Financial Management
  | 'order'      // Order Management
  | 'promo';     // Promotion Management

/**
 * Activity creation payload - excludes auto-generated fields
 */
export type CreateActivityInput = Omit<Activity, 'id' | 'timestamp' | 'createdAt' | 'updatedAt' | 'userId'>;

/**
 * Activity update payload - all fields optional except id
 */
export type UpdateActivityInput = Partial<Omit<Activity, 'id' | 'userId' | 'createdAt'>> & {
  id: string;
};

/**
 * Database activity shape (mirrors Supabase schema exactly)
 * Used for transformations between API and app types
 */
export interface DatabaseActivity {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: string;
  value: string | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Activity statistics interface for business analytics
 */
export interface ActivityStats {
  totalActivities: number;
  activitiesByType: Record<ActivityType, number>;
  activitiesThisWeek: number;
  activitiesThisMonth: number;
  mostActiveDay: string;
  averageActivitiesPerDay: number;
  // Business specific stats
  hppActivities: number;
  orderActivities: number;
  stockActivities: number;
  financialActivities: number;
}

/**
 * Activity filter options for querying
 */
export interface ActivityFilters {
  type?: ActivityType | ActivityType[];
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

/**
 * Activity sort options
 */
export type ActivitySortBy = 'created_at' | 'title' | 'type' | 'updated_at';
export type ActivitySortOrder = 'asc' | 'desc';

export interface ActivitySortOptions {
  sortBy: ActivitySortBy;
  sortOrder: ActivitySortOrder;
}

/**
 * Real-time event types from Supabase
 */
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeActivityEvent {
  eventType: RealtimeEventType;
  new?: DatabaseActivity;
  old?: DatabaseActivity;
  timestamp: string;
}

/**
 * Activity form validation schema type
 */
export interface ActivityFormData {
  title: string;
  description: string;
  type: ActivityType;
  value?: string;
}

/**
 * Activity context state interface
 */
export interface ActivityContextState {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  isRealtimeConnected: boolean;
  realtimeRetryCount: number;
}

/**
 * Activity actions for context/reducer pattern
 */
export type ActivityAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVITIES'; payload: Activity[] }
  | { type: 'ADD_ACTIVITY'; payload: Activity }
  | { type: 'UPDATE_ACTIVITY'; payload: Activity }
  | { type: 'DELETE_ACTIVITY'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_REALTIME_STATUS'; payload: { connected: boolean; retryCount: number } };

/**
 * Type guards for runtime type checking
 */
export const isValidActivityType = (type: string): type is ActivityType => {
  const validTypes: ActivityType[] = [
    'hpp', 'stok', 'resep', 'purchase', 'supplier', 
    'aset', 'keuangan', 'order', 'promo'
  ];
  return validTypes.includes(type as ActivityType);
};

export const isActivity = (obj: any): obj is Activity => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    isValidActivityType(obj.type) &&
    obj.timestamp instanceof Date &&
    obj.createdAt instanceof Date &&
    (obj.updatedAt === null || obj.updatedAt instanceof Date)
  );
};

/**
 * Utility types for better type safety
 */
export type ActivityWithoutDates = Omit<Activity, 'timestamp' | 'createdAt' | 'updatedAt'>;
export type ActivityDates = Pick<Activity, 'timestamp' | 'createdAt' | 'updatedAt'>;

/**
 * API response types
 */
export interface ActivityApiResponse {
  data: Activity[];
  count: number;
  error: string | null;
}

export interface SingleActivityApiResponse {
  data: Activity | null;
  error: string | null;
}

/**
 * Pagination types for activity lists
 */
export interface ActivityPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedActivities {
  activities: Activity[];
  pagination: ActivityPagination;
}

/**
 * Business activity type configurations with Indonesian labels
 */
export const ACTIVITY_TYPES: { value: ActivityType; label: string; description: string; icon?: string }[] = [
  { 
    value: 'hpp', 
    label: 'HPP', 
    description: 'Harga Pokok Penjualan',
    icon: '💰' 
  },
  { 
    value: 'stok', 
    label: 'Stok', 
    description: 'Manajemen Stok/Inventori',
    icon: '📦' 
  },
  { 
    value: 'resep', 
    label: 'Resep', 
    description: 'Manajemen Resep/Formula',
    icon: '📋' 
  },
  { 
    value: 'purchase', 
    label: 'Purchase', 
    description: 'Pembelian/Purchase Order',
    icon: '🛒' 
  },
  { 
    value: 'supplier', 
    label: 'Supplier', 
    description: 'Manajemen Supplier',
    icon: '🏪' 
  },
  { 
    value: 'aset', 
    label: 'Aset', 
    description: 'Manajemen Aset',
    icon: '🏢' 
  },
  { 
    value: 'keuangan', 
    label: 'Keuangan', 
    description: 'Manajemen Keuangan',
    icon: '💳' 
  },
  { 
    value: 'order', 
    label: 'Order', 
    description: 'Manajemen Pesanan',
    icon: '📝' 
  },
  { 
    value: 'promo', 
    label: 'Promo', 
    description: 'Manajemen Promosi',
    icon: '🎯' 
  },
];

/**
 * Default activity values for forms
 */
export const DEFAULT_ACTIVITY: CreateActivityInput = {
  title: '',
  description: '',
  type: 'order',
  value: null,
};

/**
 * Activity validation constants
 */
export const ACTIVITY_VALIDATION = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 255,
  DESCRIPTION_MIN_LENGTH: 0,
  DESCRIPTION_MAX_LENGTH: 1000,
  VALUE_MAX_LENGTH: 255,
} as const;

/**
 * Business-specific activity categorization
 */
export const ACTIVITY_CATEGORIES = {
  FINANCIAL: ['hpp', 'keuangan'] as ActivityType[],
  INVENTORY: ['stok', 'purchase', 'supplier'] as ActivityType[],
  OPERATIONS: ['resep', 'order', 'aset'] as ActivityType[],
  MARKETING: ['promo'] as ActivityType[],
} as const;

/**
 * Helper functions for business logic
 */
export const getActivityCategory = (type: ActivityType): keyof typeof ACTIVITY_CATEGORIES | 'OTHER' => {
  for (const [category, types] of Object.entries(ACTIVITY_CATEGORIES)) {
    if (types.includes(type)) {
      return category as keyof typeof ACTIVITY_CATEGORIES;
    }
  }
  return 'OTHER';
};

export const getActivityTypeLabel = (type: ActivityType): string => {
  const activityType = ACTIVITY_TYPES.find(at => at.value === type);
  return activityType?.label || type;
};

export const getActivityTypeDescription = (type: ActivityType): string => {
  const activityType = ACTIVITY_TYPES.find(at => at.value === type);
  return activityType?.description || type;
};