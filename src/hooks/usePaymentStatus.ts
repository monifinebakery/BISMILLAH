// src/hooks/usePaymentStatus.ts - FIXED Real-time Subscription Spam
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { getCurrentUser, isAuthenticated } from "@/services/auth";
import { safeParseDate } from "@/utils/unifiedDateUtils";
import {
  RealtimeChannel,
  AuthChangeEvent,
  Session,
} from "@supabase/supabase-js";
import { logger } from "@/utils/logger";
import { usePaymentDebounce } from "./usePaymentDebounce";
import { debounce } from "@/utils/debounce";

export interface PaymentStatus {
  id: string;
  user_id: string | null;
  order_id: string | null;
  pg_reference_id: string | null;
  name: string | null; // ✅ Use 'name' from actual schema
  email: string | null;
  payment_status: string | null;
  is_paid: boolean;
  created_at: Date | undefined;
  updated_at: Date | undefined;
  payment_date: Date | undefined;
  amount: number | null;
  marketing_channel: string | null;
  campaign_id: string | null;
  currency: string | null;
}

export const usePaymentStatus = () => {
  const queryClient = useQueryClient();
  const [showOrderPopup, setShowOrderPopup] = useState(false);

  // ✅ Refs to prevent subscription spam
  const channelRef = useRef<RealtimeChannel | null>(null);
  const authSubRef = useRef<any>(null);
  const currentUserRef = useRef<any>(null);
  const setupTimeoutRef = useRef<NodeJS.Timeout>();

  // ✅ OPTIMIZED: Use debounce hook untuk prevent spam
  const { smartInvalidatePayment, cleanup } = usePaymentDebounce({
    delay: 800, // Slight delay untuk better UX
    maxWait: 3000, // Max wait 3 seconds
    immediate: false,
  });

  // ✅ FIX: Additional debounced invalidation for subscription events
  const debouncedInvalidatePayment = useMemo(
    () =>
      debounce(() => {
        queryClient.invalidateQueries({ queryKey: ["paymentStatus"] });
      }, 1000), // Group multiple subscription events
    [queryClient],
  );

  const {
    data: paymentStatus,
    isLoading,
    error,
    refetch,
  } = useQuery<PaymentStatus | null, Error>({
    queryKey: ["paymentStatus"],
    queryFn: async (): Promise<PaymentStatus | null> => {
      const isAuth = await isAuthenticated();
      if (!isAuth) {
        if (process.env.NODE_ENV === "development") {
          logger.hook("usePaymentStatus", "User not authenticated");
        }
        return null;
      }

      const user = await getCurrentUser();
      if (!user) {
        if (process.env.NODE_ENV === "development") {
          logger.hook("usePaymentStatus", "No user found");
        }
        return null;
      }

      if (process.env.NODE_ENV === "development") {
        logger.hook(
          "usePaymentStatus",
          "Checking payment for user:",
          user.email,
        );
      }

      // ✅ STEP 1: Check for LINKED payments only (OPTIMIZED)
      const { data: linkedPayments, error: linkedError } = await supabase
        .from("user_payments")
        .select(
          "id,user_id,name,email,order_id,pg_reference_id,payment_status,is_paid,created_at,updated_at",
        ) // ✅ Use actual schema columns
        .eq("user_id", user.id)
        .eq("is_paid", true)
        .eq("payment_status", "settled")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!linkedError && linkedPayments?.length) {
        const payment = linkedPayments[0];
        if (process.env.NODE_ENV === "development") {
          logger.success("Found linked payment:", {
            orderId: payment.order_id,
            userId: payment.user_id,
            email: payment.email,
          });
        }

        return {
          ...payment,
          created_at: safeParseDate(payment.created_at),
          updated_at: safeParseDate(payment.updated_at),
          payment_date: safeParseDate(payment.updated_at), // ✅ Use updated_at as payment_date
          amount: null, // ✅ Not in schema, set null
          currency: "IDR", // ✅ Default currency
          marketing_channel: null, // ✅ Not in schema, set null
          campaign_id: null, // ✅ Not in schema, set null
        };
      }

      if (linkedError) {
        logger.error("Error checking linked payments:", linkedError);
      }

      // ✅ STEP 2: Check for UNLINKED payments (OPTIMIZED)
      if (process.env.NODE_ENV === "development") {
        logger.hook("usePaymentStatus", "Checking for unlinked payments...");
      }

      const { data: unlinkedPayments, error: unlinkedError } = await supabase
        .from("user_payments")
        .select(
          "id,user_id,name,email,order_id,pg_reference_id,payment_status,is_paid,created_at,updated_at",
        ) // ✅ Use actual schema columns
        .is("user_id", null)
        .eq("is_paid", true)
        .eq("payment_status", "settled")
        .eq("email", user.email) // ✅ SIMPLIFIED: Only check email field
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!unlinkedError && unlinkedPayments?.length) {
        const payment = unlinkedPayments[0];
        if (process.env.NODE_ENV === "development") {
          logger.success("Found unlinked payment via email:", {
            orderId: payment.order_id,
            email: payment.email,
          });
        }

        return {
          ...payment,
          created_at: safeParseDate(payment.created_at),
          updated_at: safeParseDate(payment.updated_at),
          payment_date: safeParseDate(payment.updated_at), // ✅ Use updated_at as payment_date
          amount: null, // ✅ Not in schema, set null
          currency: "IDR", // ✅ Default currency
          marketing_channel: null, // ✅ Not in schema, set null
          campaign_id: null, // ✅ Not in schema, set null
        };
      }

      if (unlinkedError) {
        logger.error("Error checking unlinked payments:", unlinkedError);
      }

      // ✅ STEP 3: No payments found
      if (process.env.NODE_ENV === "development") {
        logger.hook("usePaymentStatus", "No payment found for user");
      }
      return null;
    },
    enabled: true,
    staleTime: 60000, // ✅ OPTIMIZED: 1 minute (longer cache for better UX)
    cacheTime: 900000, // ✅ OPTIMIZED: 15 minutes (longer cache)
    refetchOnWindowFocus: false, // ✅ FIXED: Don't refetch on focus untuk speed
    refetchOnMount: false, // ✅ OPTIMIZED: Don't refetch on mount if data exists
    refetchOnReconnect: "always", // ✅ OPTIMIZED: Only refetch on reconnect if needed
    refetchInterval: false, // ✅ OPTIMIZED: No polling, rely on realtime only
    refetchIntervalInBackground: false,
    notifyOnChangeProps: ["data", "error"], // ✅ OPTIMIZED: Only notify on data/error changes
    retry: (failureCount, error) => {
      if (
        error.message?.includes("session missing") ||
        error.message?.includes("not authenticated")
      ) {
        return false;
      }
      return failureCount < 1; // ✅ FIXED: Only 1 retry instead of 2
    },
  });

  // ✅ REMOVED: Now using dedicated debounce hook instead
  // const debouncedInvalidate = useCallback(() => {
  //   queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
  //
  //   // Optional immediate refetch after slight delay
  //   setTimeout(() => {
  //     queryClient.refetchQueries({ queryKey: ['paymentStatus'] });
  //   }, 500);
  // }, [queryClient]);

  // ✅ Fixed real-time subscription - no more spam!
  useEffect(() => {
    let mounted = true;

    const setupSubscription = async () => {
      try {
        // ✅ Cleanup previous subscriptions first
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        if (authSubRef.current?.data?.subscription) {
          authSubRef.current.data.subscription.unsubscribe();
          authSubRef.current = null;
        }

        if (setupTimeoutRef.current) {
          clearTimeout(setupTimeoutRef.current);
        }

        const isAuth = await isAuthenticated();
        if (!isAuth || !mounted) return;

        const user = await getCurrentUser();
        if (!user || !mounted) return;

        // ✅ Check if user changed to prevent duplicate subscriptions
        if (currentUserRef.current?.id === user.id && channelRef.current) {
          return; // Same user, subscription already exists
        }

        currentUserRef.current = user;

        // ✅ Small delay to prevent rapid re-creation
        setupTimeoutRef.current = setTimeout(() => {
          if (!mounted) return;

          if (process.env.NODE_ENV === "development") {
            logger.hook(
              "usePaymentStatus",
              "Setting up realtime subscription for:",
              user.email,
            );
          }

          const channelName = `payment-changes-${user.id}-${Date.now()}`;

          channelRef.current = supabase
            .channel(channelName)
            // ✅ FIX: Use separate bindings to avoid server/client binding mismatch
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "user_payments",
                filter: `user_id=eq.${user.id}`,
              },
              (payload) => {
                if (!mounted) return;

                const record = payload.new || payload.old;
                if (process.env.NODE_ENV === "development") {
                  logger.hook(
                    "usePaymentStatus",
                    "Payment change (by user_id) detected:",
                    {
                      event: payload.eventType,
                      orderId: record?.order_id,
                      email: record?.email,
                      userId: record?.user_id,
                    },
                  );
                }

                // ✅ FIX: Use debounced invalidation instead of immediate
                debouncedInvalidatePayment();
              },
            )
            // Note: Realtime OR filters can cause binding mismatches. For unlinked payments by email,
            // we rely on useUnlinkedPayments which already subscribes to user_id IS NULL and filters by email in handler.
            .subscribe((status, err) => {
              if (!mounted) return;

              if (status === "SUBSCRIBED") {
                if (process.env.NODE_ENV === "development") {
                  logger.success(
                    "Realtime subscription active for payment changes",
                  );
                }
              } else if (
                status === "CHANNEL_ERROR" ||
                status === "TIMED_OUT" ||
                status === "CLOSED"
              ) {
                logger.warn(
                  `Payment realtime subscription ${status.toLowerCase()}:`,
                  err,
                );
              } else if (status === "SUBSCRIPTION_ERROR") {
                logger.error("Realtime subscription failed:", err);
              }
            });
        }, 200);
      } catch (error) {
        logger.error("Error setting up payment subscription:", error);
      }
    };

    // ✅ FIX: Stabilize auth change handler
    const handleAuthStateChange = useCallback(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        if (process.env.NODE_ENV === "development") {
          logger.hook("usePaymentStatus", "Auth state changed:", event);
        }

        if (event === "SIGNED_IN" && session?.user) {
          if (process.env.NODE_ENV === "development") {
            logger.hook(
              "usePaymentStatus",
              "User signed in, refreshing payment status",
            );
          }

          setTimeout(() => {
            if (mounted) {
              setupSubscription();
              // ✅ FIX: Use debounced invalidation
              debouncedInvalidatePayment();
            }
          }, 500);
        } else if (event === "SIGNED_OUT") {
          if (process.env.NODE_ENV === "development") {
            logger.hook("usePaymentStatus", "User signed out, cleaning up");
          }

          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }
          currentUserRef.current = null;
          queryClient.setQueryData(["paymentStatus"], null);
        }
      },
      [debouncedInvalidatePayment],
    );

    // ✅ Setup auth change listener (only once)
    if (!authSubRef.current) {
      authSubRef.current = supabase.auth.onAuthStateChange(
        handleAuthStateChange,
      );
    }

    // ✅ Initial setup
    setupSubscription();

    return () => {
      mounted = false;

      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      if (authSubRef.current?.data?.subscription) {
        authSubRef.current.data.subscription.unsubscribe();
        authSubRef.current = null;
      }

      // ✅ OPTIMIZED: Clean up debounce timers
      cleanup();

      currentUserRef.current = null;
    };
  }, [debouncedInvalidatePayment]); // ✅ FIX: Include debounced function in deps

  // ✅ Enhanced payment status logic with unlinked payment support
  const isLinkedToCurrentUser =
    paymentStatus?.user_id !== null && paymentStatus?.user_id !== undefined;

  // Check for valid linked payment
  const hasValidLinkedPayment =
    paymentStatus?.is_paid === true &&
    paymentStatus?.payment_status === "settled" &&
    isLinkedToCurrentUser;

  // Check for unlinked but valid payment (same email)
  const hasUnlinkedPayment =
    paymentStatus &&
    !paymentStatus.user_id &&
    paymentStatus.is_paid === true &&
    paymentStatus.payment_status === "settled";

  // 🔧 FIXED: Accept both linked and unlinked payments as valid
  // This fixes the issue where paid users see upgrade popup
  const hasValidPayment = hasValidLinkedPayment || hasUnlinkedPayment;

  const needsPayment = !hasValidPayment;
  const needsOrderLinking = !isLoading && hasUnlinkedPayment;

  // ✅ Enhanced debug logging with fix information
  useEffect(() => {
    if (!isLoading && process.env.NODE_ENV === "development") {
      logger.debug("Payment status computed:", {
        hasValidPayment,
        hasValidLinkedPayment,
        hasUnlinkedPayment,
        needsOrderLinking,
        isLinkedToCurrentUser,
        paymentRecord: paymentStatus?.order_id || "none",
        userEmail: paymentStatus?.email || "none",
        userId: paymentStatus?.user_id || "none",
        paymentStatus: paymentStatus?.payment_status || "none",
        isPaid: paymentStatus?.is_paid || false,
        needsPayment,
      });

      // 🚨 Alert if user has unlinked payment
      if (hasUnlinkedPayment) {
        logger.warn("UNLINKED PAYMENT DETECTED:", {
          message: "User has paid but payment is not linked to account",
          orderId: paymentStatus?.order_id,
          email: paymentStatus?.email,
          fix: "Run payment linking script or manual linking",
        });
      }
    }
  }, [
    hasValidPayment,
    hasValidLinkedPayment,
    hasUnlinkedPayment,
    needsOrderLinking,
    isLinkedToCurrentUser,
    isLoading,
    paymentStatus,
    needsPayment,
  ]);

  // ✅ Development bypass logic
  const isDev = import.meta.env.MODE === "development";
  const bypassAuth = isDev && import.meta.env.VITE_DEV_BYPASS_AUTH === "true";

  // Apply bypass logic to payment status
  const finalIsPaid = bypassAuth ? true : hasValidPayment;
  const finalNeedsPayment = bypassAuth ? false : needsPayment;
  const finalNeedsOrderLinking = bypassAuth ? false : needsOrderLinking;

  if (bypassAuth && process.env.NODE_ENV === "development") {
    logger.debug("usePaymentStatus: Development bypass active", {
      isDev,
      bypassAuth,
      finalIsPaid,
      finalNeedsPayment,
    });
  }

  return {
    paymentStatus,
    isLoading,
    error,
    refetch,
    isPaid: finalIsPaid, // ✅ Bypassed in development mode
    needsPayment: finalNeedsPayment,
    hasUnlinkedPayment: bypassAuth ? false : hasUnlinkedPayment,
    needsOrderLinking: finalNeedsOrderLinking,
    showOrderPopup,
    setShowOrderPopup,
    userName: paymentStatus?.name || null, // ✅ Use 'name' from schema
    hasValidPayment: finalIsPaid,
    hasValidLinkedPayment: bypassAuth ? true : hasValidLinkedPayment,
    isLinkedToCurrentUser: bypassAuth ? true : isLinkedToCurrentUser,
  };
};
