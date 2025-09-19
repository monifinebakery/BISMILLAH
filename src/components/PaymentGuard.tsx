import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import MandatoryUpgradeModal from "@/components/MandatoryUpgradeModal";
import PaymentVerificationLoader from "@/components/PaymentVerificationLoader";
import { logger } from "@/utils/logger";

interface PaymentGuardProps {
  children: React.ReactNode;
}

// Persist first-check completion across remounts during provider stage changes
let __paymentInitialCheckDone = false;

const PaymentGuard: React.FC<PaymentGuardProps> = ({ children }) => {
  const { paymentStatus, isLoading, isPaid, error, refetch } =
    usePaymentStatus();
  const [timedOut, setTimedOut] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(
    () => __paymentInitialCheckDone || safeReadInitialFlag(),
  );

  // ✅ FIX: Use ref to prevent timeout loop
  const timeoutRef = useRef<NodeJS.Timeout>();

  function safeReadInitialFlag(): boolean {
    try {
      return (
        window.sessionStorage.getItem("payment-initial-check-done") === "1"
      );
    } catch {
      return false;
    }
  }

  function markInitialDone() {
    __paymentInitialCheckDone = true;
    try {
      window.sessionStorage.setItem("payment-initial-check-done", "1");
    } catch (error) {
      logger.warn("PaymentGuard: Failed to persist initial check flag", error);
    }
    setInitialCheckDone(true);
  }

  // ✅ FIX: Stabilize timeout handler
  const handleTimeout = useCallback(() => {
    logger.debug(
      "PaymentGuard: Payment verification timeout - proceeding with fallback UI",
    );
    setTimedOut(true);
    if (!initialCheckDone) markInitialDone();
    // ✅ FIX: Don't refetch immediately, use setTimeout
    setTimeout(() => refetch?.(), 1000);
  }, [initialCheckDone, refetch]);

  // After the first check completes (or we timeout), avoid blocking loaders on subsequent refetches
  useEffect(() => {
    if (!isLoading || timedOut) {
      if (!initialCheckDone) {
        markInitialDone();
      }
    }

    // ✅ FIX: Clear timeout on cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, timedOut, initialCheckDone]);

  // Error state
  if (error) {
    logger.error("PaymentGuard: Payment status error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-orange-200">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <span className="text-orange-600 text-2xl">💳</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Masalah Status Pembayaran
            </h1>
            <p className="text-gray-600 mb-6">
              Tidak dapat memuat status pembayaran. Silakan coba lagi.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Coba Lagi
              </button>
              <button
                onClick={() => (window.location.href = "/auth")}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg transition-colors"
              >
                Kembali ke Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state - use unified modern loader
  if (!initialCheckDone && isLoading && !timedOut) {
    logger.debug("PaymentGuard: Loading payment status...");
    return (
      <PaymentVerificationLoader
        stage="checking"
        timeout={6000}
        onTimeout={handleTimeout} // ✅ FIX: Use stable reference
      />
    );
  }

  logger.debug("PaymentGuard: Payment status checked", {
    paymentStatus,
    isPaid,
  });

  // Render children with upgrade modal
  // Note: Removed duplicate PaymentProvider as it's already in AppProviders
  return (
    <>
      {children}
      <MandatoryUpgradeModal />
    </>
  );
};

export default PaymentGuard;
