// src/types/activity.ts - Activity Type Definitions

/**
 * Core Activity interface that matches the database schema
 * and provides type safety throughout the application
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
  
  /** Type/category of the activity */
  type: ActivityType;
  
  /** Optional value associated with the activity (could be amount, duration, etc.) */
  value?: string | null;
  
  /** Legacy timestamp field for backward compatibility */
  timestamp: Date;
  
  /** When the activity was created */
  createdAt: Date;
  
  /** When the activity was last updated */
  updatedAt: Date | null;
}

/**
 * Predefined activity types for consistency
 * Add new types here as needed
 */
export type ActivityType = 
  | 'workout'
  | 'study'
  | 'work'
  | 'meal'
  | 'sleep'
  | 'social'
  | 'hobby'
  | 'travel'
  | 'shopping'
  | 'health'
  | 'finance'
  | 'entertainment'
  | 'other';

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
 * Database activity shape (mirrors Supabase schema)
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
 * Activity statistics interface for analytics
 */
export interface ActivityStats {
  totalActivities: number;
  activitiesByType: Record<ActivityType, number>;
  activitiesThisWeek: number;
  activitiesThisMonth: number;
  mostActiveDay: string;
  averageActivitiesPerDay: number;
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
export type ActivitySortBy = 'createdAt' | 'title' | 'type' | 'updatedAt';
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
    'workout', 'study', 'work', 'meal', 'sleep', 'social', 
    'hobby', 'travel', 'shopping', 'health', 'finance', 
    'entertainment', 'other'
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
 * Export default activity type configuration
 */
export const ACTIVITY_TYPES: { value: ActivityType; label: string; icon?: string }[] = [
  { value: 'workout', label: 'Workout', icon: '💪' },
  { value: 'study', label: 'Study', icon: '📚' },
  { value: 'work', label: 'Work', icon: '💼' },
  { value: 'meal', label: 'Meal', icon: '🍽️' },
  { value: 'sleep', label: 'Sleep', icon: '😴' },
  { value: 'social', label: 'Social', icon: '👥' },
  { value: 'hobby', label: 'Hobby', icon: '🎨' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'shopping', label: 'Shopping', icon: '🛒' },
  { value: 'health', label: 'Health', icon: '🏥' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'other', label: 'Other', icon: '📋' },
];

/**
 * Default activity values for forms
 */
export const DEFAULT_ACTIVITY: CreateActivityInput = {
  title: '',
  description: '',
  type: 'other',
  value: null,
};

/**
 * Activity validation constants
 */
export const ACTIVITY_VALIDATION = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MIN_LENGTH: 0,
  DESCRIPTION_MAX_LENGTH: 500,
  VALUE_MAX_LENGTH: 100,
} as const;