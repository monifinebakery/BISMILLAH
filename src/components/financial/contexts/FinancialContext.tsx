// src/contexts/FinancialContext.tsx
// ✅ ENHANCED CONTEXT - Better error handling and retry logic for real-time subscriptions

import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { realtimeMonitor } from '@/utils/realtimeMonitor';
import { getFinancialTransactions } from '../services/financialApi';

// Type imports only (no circular deps)
import { 
  FinancialTransaction, 
  FinancialContextType,
  CreateTransactionData,
  UpdateTransactionData
} from '../types/financial';

// Hook imports (clean dependencies)
import { 
  useFinancialData, 
  useFinancialOperations,
  financialQueryKeys
} from '../hooks/useFinancialHooks';

// Context imports
import { useAuth } from '@/contexts/AuthContext';

// ===========================================
// ✅ CONTEXT SETUP
// ===========================================

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// ===========================================
// ✅ PROVIDER COMPONENT (Minimal)
// ===========================================

export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get data and operations from hooks
  const { data: financialTransactions = [], isLoading: dataLoading } = useFinancialData();
  const { addTransaction, updateTransaction, deleteTransaction, isLoading: operationLoading } = useFinancialOperations();

  // ===========================================
  // ✅ REAL-TIME SUBSCRIPTION (Enhanced with Better Error Handling)
  // ===========================================

  useEffect(() => {
    if (!user?.id) {
      logger.context('FinancialContext', 'No user ID, skipping subscription');
      return;
    }

    // 🚀 PERFORMANCE: Significantly defer real-time subscription to avoid blocking UI
    const timeoutId = setTimeout(() => {
      logger.context('FinancialContext', 'Setting up heavily deferred real-time subscription for user:', user.id);

    let channel: any = null;
    let retryCount = 0;
    const maxRetries = 3;
    let retryTimer: NodeJS.Timeout | null = null;

    const setupSubscription = () => {
      try {
        // Increment subscription count for monitoring
        realtimeMonitor.incrementSubscriptionCount();
        
        channel = supabase
          .channel(`realtime-financial-${user.id}`, {
            config: {
              broadcast: { self: false },
              presence: { key: user.id }
            }
          })
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'financial_transactions', 
              filter: `user_id=eq.${user.id}` 
            },
            (payload) => {
              try {
                logger.context('FinancialContext', 'Real-time update received:', {
                  event: payload.eventType,
                  table: payload.table,
                  hasNew: !!payload.new,
                  hasOld: !!payload.old
                });

                // ✅ SAFE: More granular cache updates with error handling
                switch (payload.eventType) {
                  case 'INSERT':
                  case 'UPDATE':
                  case 'DELETE':
                    try {
                      // Invalidate and refetch for immediate updates
                      queryClient.invalidateQueries({
                        queryKey: financialQueryKeys.transactions(user.id)
                      });
                      // Also invalidate related caches
                      queryClient.invalidateQueries({
                        queryKey: financialQueryKeys.all
                      });
                      logger.context('FinancialContext', 'Cache invalidated successfully');
                    } catch (cacheError) {
                      logger.error('Cache invalidation error:', cacheError);
                    }
                    break;
                  default:
                    logger.context('FinancialContext', 'Unknown event type:', payload.eventType);
                }

              } catch (error) {
                logger.error('Real-time update processing error:', error);
              }
            }
          )
          .subscribe((status, err) => {
            logger.context('FinancialContext', 'Subscription status:', status, {
              retryCount,
              maxRetries
            });
            
            if (err) {
              logger.error('Financial real-time subscription error:', {
                error: err,
                message: err.message || 'Unknown subscription error',
                code: err.code || 'NO_CODE',
                retryCount,
                willRetry: retryCount < maxRetries
              });
            }
            
            // ✅ ENHANCED: Better error handling with controlled retry logic
            switch (status) {
              case 'SUBSCRIBED':
                retryCount = 0; // Reset retry count on successful connection
                realtimeMonitor.resetRetryCount();
                logger.info('✅ Financial real-time subscription active');
                break;
                
              case 'CHANNEL_ERROR':
                if (retryCount < maxRetries) {
                  retryCount++;
                  realtimeMonitor.incrementRetryCount();
                  logger.warn(`⚠️ Financial subscription connection issue (attempt ${retryCount}/${maxRetries}) - retrying in 5 seconds...`);
                  
                  // Clear any existing retry timer
                  if (retryTimer) clearTimeout(retryTimer);
                  
                  // Retry after 5 seconds
                  retryTimer = setTimeout(() => {
                    if (channel) {
                      channel.unsubscribe();
                    }
                    setupSubscription();
                  }, 5000);
                } else {
                  logger.error('❌ Financial subscription failed after maximum retries. Operating in offline mode.');
                  // Reset retry count for future attempts
                  retryCount = 0;
                }
                break;
                
              case 'TIMED_OUT':
                logger.warn('⏰ Financial subscription timed out - reconnecting...');
                // Supabase will handle automatic reconnection
                break;
                
              case 'CLOSED':
                logger.info('🔒 Financial subscription closed');
                break;
                
              default:
                logger.context('FinancialContext', 'Unknown subscription status:', status);
            }
          });

      } catch (setupError) {
        logger.error('Failed to setup financial real-time subscription:', setupError);
        // Don't throw error, just log it and retry if within limits
        if (retryCount < maxRetries) {
          retryCount++;
          retryTimer = setTimeout(setupSubscription, 10000); // Retry in 10 seconds
        }
      }
    };

      // Initialize subscription
      setupSubscription();
    }, 5000); // Defer by 5s to significantly reduce initial loading block

    return () => {
      try {
        // Clear defer timeout
        clearTimeout(timeoutId);
        
        // Clear retry timer
        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
        
        // Unsubscribe from channel
        if (channel) {
          logger.context('FinancialContext', 'Unsubscribing from real-time updates');
          channel.unsubscribe();
          realtimeMonitor.decrementSubscriptionCount();
        }
      } catch (unsubError) {
        logger.error('Error unsubscribing from financial channel:', unsubError);
      }
    };
  }, [user?.id, queryClient]);

  // ===========================================
  // ✅ CONTEXT FUNCTIONS (Wrapper for compatibility)
  // ===========================================

  const addFinancialTransaction = useCallback(async (
    data: CreateTransactionData
  ): Promise<boolean> => {
    try {
      await addTransaction(data);
      return true;
    } catch (error) {
      logger.error('Context: Failed to add transaction:', error);
      return false;
    }
  }, [addTransaction]);

  const updateFinancialTransaction = useCallback(async (
    id: string,
    data: UpdateTransactionData
  ): Promise<boolean> => {
    try {
      await updateTransaction(id, data);
      return true;
    } catch (error) {
      logger.error('Context: Failed to update transaction:', error);
      return false;
    }
  }, [updateTransaction]);

  const deleteFinancialTransaction = useCallback(async (
    id: string
  ): Promise<boolean> => {
    try {
      await deleteTransaction(id);
      return true;
    } catch (error) {
      logger.error('Context: Failed to delete transaction:', error);
      return false;
    }
  }, [deleteTransaction]);

  // ===========================================
  // ✅ CONTEXT VALUE (Minimal interface)
  // ===========================================

  const contextValue: FinancialContextType = {
    // State
    financialTransactions,
    isLoading: dataLoading || operationLoading,

    // Actions
    addFinancialTransaction,
    updateFinancialTransaction,
    deleteFinancialTransaction,
  };

  return (
    <FinancialContext.Provider value={contextValue}>
      {children}
    </FinancialContext.Provider>
  );
};

// ===========================================
// ✅ HOOK
// ===========================================

export const useFinancial = (): FinancialContextType => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

// ===========================================
// ✅ UTILITY HOOKS
// ===========================================

/**
 * Hook for accessing React Query specific functions
 */
export const useFinancialQuery = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidateTransactions = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: financialQueryKeys.transactions(user?.id)
    });
  }, [queryClient, user?.id]);

  const prefetchTransactions = useCallback(() => {
    if (user?.id) {
      queryClient.prefetchQuery({
        queryKey: financialQueryKeys.transactions(user.id),
        queryFn: () => getFinancialTransactions(user.id),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [queryClient, user?.id]);

  const getTransactionsFromCache = useCallback(() => {
    return queryClient.getQueryData(
      financialQueryKeys.transactions(user?.id)
    ) as FinancialTransaction[] | undefined;
  }, [queryClient, user?.id]);

  return {
    invalidateTransactions,
    prefetchTransactions,
    getTransactionsFromCache,
  };
};

export default FinancialContext;