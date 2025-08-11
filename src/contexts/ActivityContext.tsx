// src/contexts/ActivityContext.tsx - REFACTORED with React Query & Fixed Real-time Issues
import React, { createContext, useContext, useEffect, ReactNode, useCallback, useRef, useState } from 'react';
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

// ===== DEBOUNCE UTILITY =====
const useDebounceCallback = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastCallRef = useRef<number>(0);
  
  return useCallback((...args: any[]) => {
    const now = Date.now();
    
    // Prevent spam calls - minimum 1 second between actual executions
    if (now - lastCallRef.current < 1000) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay);
      return;
    }
    
    // If enough time has passed, execute immediately
    lastCallRef.current = now;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    callback(...args);
  }, [callback, delay]);
};

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

// ===== REAL-TIME SUBSCRIPTION HOOK =====
const useRealtimeSubscription = (userId?: string) => {
  const queryClient = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const mountedRef = useRef(true);
  const channelRef = useRef<any>(null);
  
  const MAX_RETRIES = 5;
  const RETRY_DELAY_BASE = 2000; // 2 seconds

  // ✅ Debounced invalidation to prevent race conditions and spam
  const debouncedInvalidate = useDebounceCallback(() => {
    if (!mountedRef.current || !userId) return;
    
    // Only log if in development mode
    if (process.env.NODE_ENV === 'development') {
      logger.context('ActivityContext', 'Invalidating queries due to real-time event');
    }
    
    queryClient.invalidateQueries({ 
      queryKey: activityQueryKeys.list(userId) 
    });
    
    queryClient.invalidateQueries({ 
      queryKey: activityQueryKeys.stats(userId) 
    });
  }, 500); // Increased delay to 500ms

  const setupSubscription = useCallback(() => {
    if (!userId || !mountedRef.current || retryCount >= MAX_RETRIES) {
      if (retryCount >= MAX_RETRIES) {
        logger.error('ActivityContext: Max retries reached, stopping subscription attempts');
        toast.error('Koneksi real-time gagal, data akan di-refresh secara manual');
      }
      return null;
    }

    // ✅ Cleanup previous channel if exists
    if (channelRef.current) {
      logger.context('ActivityContext', 'Cleaning up previous channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // ✅ Generate unique channel name to prevent collisions
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    const channelName = `activities-${userId.slice(-8)}-${random}`; // Shorter userId
    
    // Only log setup in development or on first attempt
    if (process.env.NODE_ENV === 'development' || retryCount === 0) {
      logger.context('ActivityContext', 'Setting up subscription:', {
        channelName,
        retryCount,
        timestamp: new Date().toISOString()
      });
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'activities',
          filter: `user_id=eq.${userId}`, 
        },
        (payload) => {
          if (!mountedRef.current) {
            return; // Silent return, no logging
          }

          // Only log in development mode and not too frequently
          if (process.env.NODE_ENV === 'development') {
            logger.context('ActivityContext', 'Real-time event:', {
              eventType: payload.eventType,
              recordId: payload.new?.id || payload.old?.id
            });
          }
          
          // ✅ Use debounced invalidation to prevent race conditions
          debouncedInvalidate();
        }
      )
      .subscribe((status, err) => {
        if (!mountedRef.current) return;

        // Reduce logging noise - only log important status changes
        if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.context('ActivityContext', 'Subscription status:', {
            status,
            error: err ? { message: err.message } : null,
            retryCount
          });
        }
        
        switch (status) {
          case 'SUBSCRIBED':
            logger.success('ActivityContext: Real-time connected');
            setIsConnected(true);
            setRetryCount(0); // Reset retry count on successful connection
            break;
            
          case 'CHANNEL_ERROR':
            logger.error('ActivityContext: Channel error:', err?.message || 'Unknown error');
            setIsConnected(false);
            
            // ✅ Implement exponential backoff retry
            if (retryCount < MAX_RETRIES) {
              const delay = Math.min(RETRY_DELAY_BASE * Math.pow(2, retryCount), 30000);
              logger.context('ActivityContext', `Retrying in ${delay}ms (${retryCount + 1}/${MAX_RETRIES})`);
              
              setTimeout(() => {
                if (mountedRef.current) {
                  setRetryCount(prev => prev + 1);
                }
              }, delay);
            }
            break;
            
          case 'TIMED_OUT':
            logger.error('ActivityContext: Connection timeout');
            setIsConnected(false);
            
            // ✅ Retry on timeout
            if (retryCount < MAX_RETRIES) {
              setTimeout(() => {
                if (mountedRef.current) {
                  setRetryCount(prev => prev + 1);
                }
              }, RETRY_DELAY_BASE);
            }
            break;
            
          case 'CLOSED':
            if (process.env.NODE_ENV === 'development') {
              logger.warn('ActivityContext: Subscription closed');
            }
            setIsConnected(false);
            break;
        }
      });

    channelRef.current = channel;
    return channel;
  }, [userId, retryCount, debouncedInvalidate]);

  // ✅ Setup subscription effect
  useEffect(() => {
    mountedRef.current = true;
    
    if (!userId) {
      if (process.env.NODE_ENV === 'development') {
        logger.context('ActivityContext', 'No user ID, skipping real-time subscription');
      }
      setIsConnected(false);
      return;
    }

    const channel = setupSubscription();

    return () => {
      mountedRef.current = false;
      setIsConnected(false);
      
      if (channel) {
        if (process.env.NODE_ENV === 'development') {
          logger.context('ActivityContext', 'Cleaning up real-time subscription');
        }
        supabase.removeChannel(channel);
      }
      
      if (channelRef.current && channelRef.current !== channel) {
        supabase.removeChannel(channelRef.current);
      }
      
      channelRef.current = null;
    };
  }, [userId, setupSubscription]);

  // ✅ Retry effect
  useEffect(() => {
    if (retryCount > 0 && retryCount < MAX_RETRIES && userId && mountedRef.current) {
      if (process.env.NODE_ENV === 'development') {
        logger.context('ActivityContext', `Retry attempt ${retryCount}/${MAX_RETRIES}`);
      }
      setupSubscription();
    }
  }, [retryCount, userId, setupSubscription]);

  return { isConnected, retryCount };
};

// ===== CONTEXT TYPE =====
interface ActivityContextType {
  activities: Activity[];
  loading: boolean;
  addActivity: (activityData: Omit<Activity, 'id' | 'timestamp' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  refreshActivities: () => Promise<void>;
  isRealtimeConnected: boolean;
  realtimeRetryCount: number;
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

  // ✅ Setup real-time subscription
  const { isConnected: isRealtimeConnected, retryCount: realtimeRetryCount } = useRealtimeSubscription(userId);

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
    if (!userId || isRealtimeConnected || realtimeRetryCount < 5) return;

    if (process.env.NODE_ENV === 'development') {
      logger.context('ActivityContext', 'Real-time failed, setting up fallback polling');
    }
    
    const pollInterval = setInterval(() => {
      if (process.env.NODE_ENV === 'development') {
        logger.context('ActivityContext', 'Polling activities (fallback)');
      }
      queryClient.invalidateQueries({ 
        queryKey: activityQueryKeys.list(userId) 
      });
    }, 30000); // Poll every 30 seconds

    return () => {
      if (process.env.NODE_ENV === 'development') {
        logger.context('ActivityContext', 'Cleaning up fallback polling');
      }
      clearInterval(pollInterval);
    };
  }, [userId, isRealtimeConnected, realtimeRetryCount, queryClient]);

  // ===== CONTEXT VALUE =====
  const value: ActivityContextType = {
    activities,
    loading: isLoading || addMutation.isPending,
    addActivity,
    refreshActivities,
    isRealtimeConnected,
    realtimeRetryCount,
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