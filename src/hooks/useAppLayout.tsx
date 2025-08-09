// src/hooks/useAppLayout.tsx - Layout Logic Hook
import React, { useCallback } from 'react';
import { logger } from "@/utils/logger";

interface UseAppLayoutProps {
  isPaid: boolean;
  showOrderPopup: boolean;
  setShowOrderPopup: (show: boolean) => void;
  refetchPayment: () => void;
  unlinkedPaymentCount: number;
  needsOrderLinking: boolean;
  currentUser: any;
  setShowAutoLinkPopup: (show: boolean) => void;
  autoLinkCount: number;
}

export const useAppLayout = ({
  isPaid,
  showOrderPopup,
  setShowOrderPopup,
  refetchPayment,
  unlinkedPaymentCount,
  needsOrderLinking,
  currentUser,
  setShowAutoLinkPopup,
  autoLinkCount
}: UseAppLayoutProps) => {

  const handleOrderLinked = useCallback((payment: any) => {
    logger.success('useAppLayout: Order linked successfully:', payment?.order_id);
    refetchPayment();
  }, [refetchPayment]);

  const handleAutoLinked = useCallback((payments: any[]) => {
    logger.success('useAppLayout: Auto-linked payments:', payments.map(p => p.order_id));
    refetchPayment();
  }, [refetchPayment]);

  const renderOrderLinkButton = useCallback((isMobileVersion = false) => {
    if (isPaid) return null;

    const baseClasses = isMobileVersion 
      ? "text-xs bg-blue-600 text-white px-2 py-1 rounded"
      : "text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors";

    const urgentClasses = needsOrderLinking || unlinkedPaymentCount > 0
      ? isMobileVersion
        ? "bg-orange-600 animate-pulse"
        : "bg-orange-600 hover:bg-orange-700 animate-pulse"
      : "";

    const buttonText = isMobileVersion
      ? unlinkedPaymentCount > 0 ? `Link (${unlinkedPaymentCount})` : "Link Order"
      : unlinkedPaymentCount > 0 ? `Hubungkan Order (${unlinkedPaymentCount})` : "Hubungkan Order";

    return (
      <button
        onClick={() => setShowOrderPopup(true)}
        className={`${baseClasses} ${urgentClasses}`}
        title={unlinkedPaymentCount > 0 ? `${unlinkedPaymentCount} pembayaran menunggu untuk dihubungkan` : "Hubungkan pembayaran Anda"}
      >
        {buttonText}
      </button>
    );
  }, [isPaid, needsOrderLinking, unlinkedPaymentCount, setShowOrderPopup]);

  const renderAutoLinkIndicator = useCallback((isMobileVersion = false) => {
    if (!currentUser || autoLinkCount === 0) return null;

    const baseClasses = isMobileVersion
      ? "text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded"
      : "text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded-md transition-colors";

    const buttonText = isMobileVersion
      ? `🔗 ${autoLinkCount}`
      : `🔗 Auto (${autoLinkCount})`;

    return (
      <button
        onClick={() => setShowAutoLinkPopup(true)}
        className={`${baseClasses} relative animate-pulse`}
        title={`${autoLinkCount} webhook payments ready for auto-linking`}
      >
        <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        {buttonText}
      </button>
    );
  }, [currentUser, autoLinkCount, setShowAutoLinkPopup]);

  return {
    handleOrderLinked,
    handleAutoLinked,
    renderOrderLinkButton,
    renderAutoLinkIndicator
  };
};