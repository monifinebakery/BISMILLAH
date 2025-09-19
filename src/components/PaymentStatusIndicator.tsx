import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Zap } from 'lucide-react';
import { usePaymentContext } from '@/contexts/PaymentContext';

// MODIFIED: Menambahkan interface untuk props
interface PaymentStatusIndicatorProps {
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const PaymentStatusIndicator = ({ size = 'sm' }: PaymentStatusIndicatorProps) => {
  // MODIFIED: Menghapus setShowUpgradePopup dari destructuring karena tidak lagi digunakan di sini
  const { isPaid, isLoading } = usePaymentContext(); // Menghapus needsPayment, showUpgradePopup, setShowUpgradePopup

  // URL yang akan dibuka saat tombol Upgrade diklik
  const UPGRADE_URL = 'https://monifine.my.id/checkout-page-growth-kit?discount_code=HPP2025';

  if (isLoading) {
    return null;
  }

  if (isPaid) {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
        <Crown className="h-3 w-3 mr-1" />
        Premium
      </Badge>
    );
  }

  // HIDE upgrade button for non-paid users (requested)
  return null;
};

export default PaymentStatusIndicator;