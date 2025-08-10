// src/contexts/ActivityContext.tsx - REFACTORED with React Query
import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Activity } from '@/types/activity'; 
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useAuth } from './AuthContext';
import { safeParseDate } from '@/utils/unifiedDateUtils';

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
  updated_at: string | null;
}

// ===== API FUNCTIONS =====
const activityApi = {
  async getActivities(userId: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      logger.error("Error fetching activities:", error);
      throw new Error('Gagal memuat riwayat aktivitas: ' + error.message);
    }

    return data ? data.map(transformActivityFromDB) : [];
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

    return transformActivityFromDB(data);
  }
};

// ===== HELPER FUNCTIONS =====
const transformActivityFromDB = (dbItem: DatabaseActivity): Activity => ({
  id: dbItem.id,
  title: dbItem.title,
  description: dbItem.description,
  type: dbItem.type,
  value: dbItem.value,
  timestamp: safeParseDate(dbItem.created_at), // Map created_at to timestamp for backward compatibility
  userId: dbItem.user_id, // Map user_id to userId
  createdAt: safeParseDate(dbItem.created_at), // Map created_at to createdAt
  updatedAt: safeParseDate(dbItem.updated_at), // Map updated_at to updatedAt
});

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
      const optimisticActivity: Activity = {
        id: `temp-${Date.now()}`,
        userId: userId || '',
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
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

// ===== CONTEXT TYPE =====
interface ActivityContextType {
  activities: Activity[];
  loading: boolean;
  addActivity: (activityData: Omit<Activity, 'id' | 'timestamp' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  refreshActivities: () => Promise<void>;
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

  // ===== REAL-TIME SUBSCRIPTION =====
  useEffect(() => {
    if (!userId) {
      logger.context('ActivityContext', 'No user ID, skipping real-time subscription');
      return;
    }

    logger.context('ActivityContext', 'Setting up real-time subscription for user:', userId);
    
    const channel = supabase
      .channel(`realtime-activities-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'activities',
          filter: `user_id=eq.${userId}`, 
        },
        (payload) => {
          logger.context('ActivityContext', 'Real-time event detected:', payload.eventType, payload.new?.id || payload.old?.id);
          
          // ✅ RACE CONDITION FIX: Use invalidateQueries instead of direct state manipulation
          // This ensures the single source of truth is always the database
          queryClient.invalidateQueries({ 
            queryKey: activityQueryKeys.list(userId) 
          });
          
          queryClient.invalidateQueries({ 
            queryKey: activityQueryKeys.stats(userId) 
          });

          // ✅ Optional: Trigger background refetch for immediate updates
          queryClient.refetchQueries({ 
            queryKey: activityQueryKeys.list(userId),
            type: 'active' 
          });
        }
      )
      .subscribe((status, err) => {
        logger.context('ActivityContext', 'Subscription status:', status, err ? { error: err } : '');
        
        if (status === 'SUBSCRIBED') {
          logger.success('ActivityContext: Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.error('ActivityContext: Subscription error/timeout:', status, err);
        }
      });

    // ✅ Cleanup: Unsubscribe when component unmounts or user changes
    return () => {
      logger.context('ActivityContext', 'Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

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

  // ===== CONTEXT VALUE =====
  const value: ActivityContextType = {
    activities,
    loading: isLoading || addMutation.isPending,
    addActivity,
    refreshActivities,
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