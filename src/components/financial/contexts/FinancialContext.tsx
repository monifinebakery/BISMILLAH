// src/contexts/FinancialContext.tsx
// ✅ FIXED RENDER LOOPS - Debounced real-time subscriptions and memoized context value

import React, {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { realtimeMonitor } from "@/utils/realtimeMonitor";
import { debounce } from "@/utils/asyncUtils";
import { getFinancialTransactions } from "../services/financialApi";

// Type imports only (no circular deps)
import {
  FinancialTransaction,
  FinancialContextType,
  CreateTransactionData,
  UpdateTransactionData,
} from "../types/financial";

// Hook imports (clean dependencies)
import {
  useFinancialData,
  useFinancialOperations,
  financialQueryKeys,
} from "../hooks/useFinancialHooks";

// Context imports
import { useAuth } from "@/contexts/AuthContext";

// ===========================================
// ✅ CONTEXT SETUP
// ===========================================

const FinancialContext = createContext<FinancialContextType | undefined>(
  undefined,
);

// ===========================================
// ✅ PROVIDER COMPONENT (Minimal)
// ===========================================

export const FinancialProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get data and operations from hooks
  const { data: financialTransactions = [], isLoading: dataLoading } =
    useFinancialData();
  const {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    isLoading: operationLoading,
  } = useFinancialOperations();

  // ===========================================
  // ✅ DEBOUNCED CACHE INVALIDATION - Prevent excessive invalidations
  // ===========================================

  const debouncedCacheInvalidation = useMemo(() => {
    return debounce(() => {
      try {
        logger.context(
          "FinancialContext",
          "Executing debounced cache invalidation",
        );

        // Invalidate specific queries only
        queryClient.invalidateQueries({
          queryKey: financialQueryKeys.transactions(user?.id || ""),
        });

        // Don't invalidate ALL financial queries at once - too aggressive
        logger.context(
          "FinancialContext",
          "Cache invalidation completed successfully",
        );
      } catch (cacheError) {
        logger.error("Debounced cache invalidation error:", cacheError);
      }
    }, 1000); // 1 second debounce - group multiple rapid changes
  }, [queryClient, user?.id]);

  // ===========================================
  // ✅ REAL-TIME SUBSCRIPTION (Enhanced with Debouncing)
  // ===========================================

  useEffect(() => {
    if (!user?.id) {
      logger.context("FinancialContext", "No user ID, skipping subscription");
      return;
    }

    logger.context(
      "FinancialContext",
      "Setting up real-time subscription for user:",
      user.id,
    );

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
              presence: { key: user.id },
            },
          })
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "financial_transactions",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              try {
                logger.context(
                  "FinancialContext",
                  "Real-time update received:",
                  {
                    event: payload.eventType,
                    table: payload.table,
                    hasNew: !!payload.new,
                    hasOld: !!payload.old,
                  },
                );

                // ✅ DEBOUNCED: Use debounced invalidation instead of immediate
                switch (payload.eventType) {
                  case "INSERT":
                  case "UPDATE":
                  case "DELETE":
                    debouncedCacheInvalidation();
                    break;
                  default:
                    logger.context(
                      "FinancialContext",
                      "Unknown event type:",
                      payload.eventType,
                    );
                }
              } catch (error) {
                logger.error("Real-time update processing error:", error);
              }
            },
          )
          .subscribe((status, err) => {
            logger.context("FinancialContext", "Subscription status:", status, {
              retryCount,
              maxRetries,
            });

            if (err) {
              logger.error("Financial real-time subscription error:", {
                error: err,
                message: err.message || "Unknown subscription error",
                code: err.code || "NO_CODE",
                retryCount,
                willRetry: retryCount < maxRetries,
              });
            }

            // ✅ ENHANCED: Better error handling with controlled retry logic
            switch (status) {
              case "SUBSCRIBED":
                retryCount = 0; // Reset retry count on successful connection
                realtimeMonitor.resetRetryCount();
                logger.info("✅ Financial real-time subscription active");
                break;

              case "CHANNEL_ERROR":
                if (retryCount < maxRetries) {
                  retryCount++;
                  realtimeMonitor.incrementRetryCount();
                  logger.warn(
                    `⚠️ Financial subscription connection issue (attempt ${retryCount}/${maxRetries}) - retrying in 5 seconds...`,
                  );

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
                  logger.error(
                    "❌ Financial subscription failed after maximum retries. Operating in offline mode.",
                  );
                  // Reset retry count for future attempts
                  retryCount = 0;
                }
                break;

              case "TIMED_OUT":
                logger.warn(
                  "⏰ Financial subscription timed out - reconnecting...",
                );
                // Supabase will handle automatic reconnection
                break;

              case "CLOSED":
                logger.info("🔒 Financial subscription closed");
                break;

              default:
                logger.context(
                  "FinancialContext",
                  "Unknown subscription status:",
                  status,
                );
            }
          });
      } catch (setupError) {
        logger.error(
          "Failed to setup financial real-time subscription:",
          setupError,
        );
        // Don't throw error, just log it and retry if within limits
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => setupSubscription(), 3000);
        }
      }
    };

    // Initialize subscription
    setupSubscription();

    return () => {
      try {
        // Clear any retry timer
        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }

        // Unsubscribe from channel
        if (channel) {
          logger.context(
            "FinancialContext",
            "Unsubscribing from real-time updates",
          );
          channel.unsubscribe();
          realtimeMonitor.decrementSubscriptionCount();
        }

        // Cancel any pending debounced calls
        debouncedCacheInvalidation.cancel?.();
      } catch (unsubError) {
        logger.error("Error unsubscribing from financial channel:", unsubError);
      }
    };
  }, [user?.id, debouncedCacheInvalidation]);

  // ===========================================
  // ✅ MEMOIZED REFETCH FUNCTION
  // ===========================================

  const refetch = useCallback(async () => {
    if (!user?.id) {
      logger.warn("FinancialContext: Cannot refetch without user ID");
      return;
    }

    try {
      logger.info("FinancialContext: Manual refetch triggered");
      await queryClient.invalidateQueries({
        queryKey: financialQueryKeys.transactions(user.id),
      });
      logger.success("FinancialContext: Manual refetch completed");
    } catch (error) {
      logger.error("FinancialContext: Manual refetch failed:", error);
    }
  }, [user?.id, queryClient]);

  // ===========================================
  // ✅ MEMOIZED CONTEXT VALUE - Prevent unnecessary re-renders
  // ===========================================

  const contextValue = useMemo(
    (): FinancialContextType => ({
      // Data
      financialTransactions,
      isLoading: dataLoading || operationLoading,

      // Operations
      addTransaction,
      updateTransaction,
      deleteTransaction,

      // Utils
      refetch,
    }),
    [
      financialTransactions,
      dataLoading,
      operationLoading,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      refetch,
    ],
  );

  return (
    <FinancialContext.Provider value={contextValue}>
      {children}
    </FinancialContext.Provider>
  );
};

// ===========================================
// CONTEXT HOOK
// ===========================================

export const useFinancial = (): FinancialContextType => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error("useFinancial must be used within a FinancialProvider");
  }
  return context;
};

export default FinancialContext;
