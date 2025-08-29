// src/contexts/ActivityContext.tsx - REFACTORED with React Query & Fixed Real-time Issues
import React, { createContext, useContext, useEffect, ReactNode, useCallback, useRef, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Activity } from '@/types/activity'; 
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useAuth } from './AuthContext';
// ✅ UPDATED: Import unified date handler for consistency
import { UnifiedDateHandler } from '@/utils/unifiedDateHandler';
import { safeParseDate } from '@/utils/unifiedDateUtils'; // Keep for transition
import { enhancedDateUtils } from '@/utils/enhancedDateUtils';

// ===== QUERY KEYS =====
export const activityQueryKeys = {
  all: ['activities'] as const,
  lists: () => [...activityQueryKeys.all, 'list'] as const,
  list: (userId?: string) => [...activityQueryKeys.lists(), userId] as const,
  stats: (userId?: string) => [...activityQueryKeys.all, 'stats', userId] as const,
} as const;

// ===== DATABASE TYPES =====
interface DatabaseActivity {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: string;
  value: string | null;
  created_at: string;
  updated_at?: string | null;
}

// ===== API FUNCTIONS =====
const activityApi = {
  async getActivities(userId: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('id, user_id, title, description, type, value, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      logger.error("Error fetching activities:", error);
      throw new Error('Gagal memuat riwayat aktivitas: ' + error.message);
    }

    // Helper function to safely parse dates using enhancedDateUtils
    const safeParseDateUnified = (dateInput: any): Date => {
      const result = enhancedDateUtils.parseAndValidateTimestamp(dateInput);
      return result.isValid && result.date ? result.date : enhancedDateUtils.getCurrentTimestamp();
    };

    return data ? data.map((item) => ({
       id: item.id,
       title: item.title,
       description: item.description,
       type: item.type as Activity['type'],
       value: item.value,
       timestamp: safeParseDateUnified(item.created_at),
       userId: item.user_id,
       createdAt: safeParseDateUnified(item.created_at),
       updatedAt: null,
     })) : [];
  },

  async getActivitiesPaginated(userId: string, page: number = 1, limit: number = 20): Promise<{ activities: Activity[], totalCount: number, totalPages: number }> {
    const offset = (page - 1) * limit;
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      logger.error("Error counting activities:", countError);
      throw new Error('Gagal menghitung total aktivitas: ' + countError.message);
    }

    // Get paginated data
    const { data, error } = await supabase
      .from('activities')
      .select('id, user_id, title, description, type, value, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Error fetching paginated activities:", error);
      throw new Error('Gagal memuat riwayat aktivitas: ' + error.message);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    // Helper function to safely parse dates using enhancedDateUtils
    const safeParseDateUnified = (dateInput: any): Date => {
      const result = enhancedDateUtils.parseAndValidateTimestamp(dateInput);
      return result.isValid && result.date ? result.date : enhancedDateUtils.getCurrentTimestamp();
    };

    const activities = data ? data.map((item): Activity => ({
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type as Activity['type'],
      value: item.value,
      timestamp: safeParseDateUnified(item.created_at),
      userId: item.user_id,
      createdAt: safeParseDateUnified(item.created_at),
      updatedAt: null,
    })) : [];

    return {
      activities,
      totalCount,
      totalPages
    };
  },

  async createActivity(activityData: Omit<Activity, 'id' | 'timestamp' | 'createdAt' | 'updatedAt' | 'userId'>, userId: string): Promise<Activity> {
    const activityToInsert = {
      title: activityData.title,
      description: activityData.description,
      type: activityData.type,
      value: activityData.value ?? null,
      user_id: userId,
      // created_at and updated_at will be handled by database defaults
    };

    const { data, error } = await supabase
      .from('activities')
      .insert(activityToInsert)
      .select()
      .single();
    
    if (error) {
      logger.error('Gagal mengirim aktivitas ke DB:', error.message);
      throw new Error('Gagal menambahkan aktivitas: ' + error.message);
    }

    // Helper function to safely parse dates using enhancedDateUtils
    const safeParseDateUnified = (dateInput: any): Date => {
      const result = enhancedDateUtils.parseAndValidateTimestamp(dateInput);
      return result.isValid && result.date ? result.date : enhancedDateUtils.getCurrentTimestamp();
    };

    return {
       id: data.id,
       title: data.title,
       description: data.description,
       type: data.type as Activity['type'],
       value: data.value,
       timestamp: safeParseDateUnified(data.created_at),
       userId: data.user_id,
       createdAt: safeParseDateUnified(data.created_at),
       updatedAt: null,
     };
  }
};

// ===== HELPER FUNCTIONS =====
// Removed transformActivityFromDB function as it's replaced with inline transformations

// ===== DEBOUNCE UTILITY (REMOVED - using simpler approach) =====

// ===== CUSTOM HOOKS =====

/**
 * Hook for fetching activities with React Query
 */
const useActivitiesQuery = (userId?: string) => {
  return useQuery({
    queryKey: activityQueryKeys.list(userId),
    queryFn: () => activityApi.getActivities(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for activity mutations
 */
const useActivityMutations = (userId?: string) => {
  const queryClient = useQueryClient();

  // Add activity mutation
  const addMutation = useMutation({
    mutationFn: (activityData: Omit<Activity, 'id' | 'timestamp' | 'createdAt' | 'updatedAt' | 'userId'>) => 
      activityApi.createActivity(activityData, userId!),
    onMutate: async (newActivity) => {
      // ✅ Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ 
        queryKey: activityQueryKeys.list(userId) 
      });

      // ✅ Snapshot previous value for rollback
      const previousActivities = queryClient.getQueryData(activityQueryKeys.list(userId));

      // ✅ Optimistic update
      const now = enhancedDateUtils.getCurrentTimestamp();
      const optimisticActivity: Activity = {
        id: `temp-${Date.now()}`,
        userId: userId || '',
        timestamp: now,
        createdAt: now,
        updatedAt: now,
        ...newActivity,
      };

      queryClient.setQueryData(
        activityQueryKeys.list(userId),
        (old: Activity[] = []) => [optimisticActivity, ...old].slice(0, 100) // Keep max 100
      );

      return { previousActivities };
    },
    onError: (error: any, variables, context) => {
      // ✅ Rollback on error
      if (context?.previousActivities) {
        queryClient.setQueryData(activityQueryKeys.list(userId), context.previousActivities);
      }
      
      logger.error('ActivityContext: Add mutation error:', error);
      // Don't show toast here as the API already handles it
    },
    onSuccess: (newActivity, variables) => {
      // ✅ Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: activityQueryKeys.list(userId) });
      queryClient.invalidateQueries({ queryKey: activityQueryKeys.stats(userId) });

      logger.context('ActivityContext', 'Activity added successfully:', newActivity.id);
    }
  });

  return { addMutation };
};

// ===== REAL-TIME SUBSCRIPTION HOOK =====
const useRealtimeSubscription = (userId?: string) => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);
  const setupTimeoutRef = useRef<NodeJS.Timeout>();
  
  // ✅ Single debounced invalidation function
  const invalidateQueries = useCallback(() => {
    if (!userId) return;
    
    queryClient.invalidateQueries({ 
      queryKey: activityQueryKeys.list(userId) 
    });
    queryClient.invalidateQueries({ 
      queryKey: activityQueryKeys.stats(userId) 
    });
  }, [queryClient, userId]);

  // ✅ Debounced version with 1 second minimum interval
  const debouncedInvalidate = useMemo(() => {
    let lastCall = 0;
    let timeoutId: NodeJS.Timeout;
    
    return () => {
      const now = Date.now();
      
      clearTimeout(timeoutId);
      
      if (now - lastCall > 1000) {
        // Execute immediately if enough time has passed
        lastCall = now;
        invalidateQueries();
      } else {
        // Debounce if called too frequently
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          invalidateQueries();
        }, 1000);
      }
    };
  }, [invalidateQueries]);

  useEffect(() => {
    // ✅ Cleanup previous subscription first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    if (setupTimeoutRef.current) {
      clearTimeout(setupTimeoutRef.current);
    }

    if (!userId) {
      setIsConnected(false);
      return;
    }

    // ✅ Delay subscription setup to prevent rapid re-creation
    setupTimeoutRef.current = setTimeout(() => {
      const channelName = `activities-${userId.slice(-8)}-${Date.now()}`;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ActivityContext] Setting up subscription: ${channelName}`);
      }

      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `user_id=eq.${userId}`,
        }, (payload) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[ActivityContext] Real-time event: ${payload.eventType}`);
          }
          debouncedInvalidate();
        })
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            if (process.env.NODE_ENV === 'development') {
              console.log('[ActivityContext] Real-time connected');
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setIsConnected(false);
            if (process.env.NODE_ENV === 'development') {
              console.error(`[ActivityContext] Connection ${status}:`, err?.message);
            }
          }
        });

      channelRef.current = channel;
    }, 100); // Small delay to prevent rapid re-creation

    return () => {
      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      setIsConnected(false);
    };
  }, [userId, debouncedInvalidate]); // ✅ Simplified dependencies

  return { isConnected };
};

// ===== CONTEXT TYPE =====
interface ActivityContextType {
  activities: Activity[];
  loading: boolean;
  addActivity: (activityData: Omit<Activity, 'id' | 'timestamp' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  refreshActivities: () => Promise<void>;
  isRealtimeConnected: boolean;
  fetchActivitiesPaginated: (userId: string, page: number, limit: number) => Promise<{ activities: Activity[], totalCount: number, totalPages: number }>;
}

// ===== CONTEXT SETUP =====
const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

// ===== PROVIDER COMPONENT =====
export const ActivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  // ✅ Fetch activities using React Query
  const {
    data: activities = [],
    isLoading,
    error,
    refetch
  } = useActivitiesQuery(userId);

  // ✅ Get mutations
  const { addMutation } = useActivityMutations(userId);

  // ✅ Setup real-time subscription (simplified)
  const { isConnected: isRealtimeConnected } = useRealtimeSubscription(userId);

  // ===== CONTEXT FUNCTIONS =====
  const addActivity = useCallback(async (activityData: Omit<Activity, 'id' | 'timestamp' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<void> => {
    if (!userId) {
      logger.warn("Gagal menambah aktivitas: Pengguna tidak login.");
      toast.error('Anda harus login untuk menambahkan aktivitas');
      return;
    }

    try {
      await addMutation.mutateAsync(activityData);
    } catch (error) {
      // Error already handled in mutation
      throw error;
    }
  }, [userId, addMutation]);

  const refreshActivities = useCallback(async () => {
    logger.context('ActivityContext', 'Manual refresh requested');
    await refetch();
  }, [refetch]);

  // ===== ERROR HANDLING =====
  useEffect(() => {
    if (error) {
      logger.error('ActivityContext: Query error:', error);
      toast.error('Gagal memuat riwayat aktivitas');
    }
  }, [error]);

  // ===== FALLBACK POLLING (when real-time fails) =====
  useEffect(() => {
    if (!userId || isRealtimeConnected) return;

    // Simple fallback polling without complex retry logic
    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({ 
        queryKey: activityQueryKeys.list(userId) 
      });
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [userId, isRealtimeConnected, queryClient]);

  // ===== FETCH ACTIVITIES PAGINATED FUNCTION =====
  const fetchActivitiesPaginated = useCallback(async (userId: string, page: number, limit: number) => {
    return await activityApi.getActivitiesPaginated(userId, page, limit);
  }, []);

  // ===== CONTEXT VALUE =====
  const value: ActivityContextType = {
    activities,
    loading: isLoading || addMutation.isPending,
    addActivity,
    refreshActivities,
    isRealtimeConnected,
    fetchActivitiesPaginated,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};

// ===== CUSTOM HOOK =====
export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

// ===== ADDITIONAL HOOKS FOR REACT QUERY UTILITIES =====

/**
 * Hook for accessing React Query specific functions
 */
export const useActivityQuery = () => {
  const queryClient = useQueryClient();

  const invalidateActivities = useCallback((userId?: string) => {
    queryClient.invalidateQueries({ queryKey: activityQueryKeys.list(userId) });
    queryClient.invalidateQueries({ queryKey: activityQueryKeys.stats(userId) });
  }, [queryClient]);

  const prefetchActivities = useCallback((userId: string) => {
    queryClient.prefetchQuery({
      queryKey: activityQueryKeys.list(userId),
      queryFn: () => activityApi.getActivities(userId),
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient]);

  return {
    invalidateActivities,
    prefetchActivities,
  };
};

export default ActivityContext;