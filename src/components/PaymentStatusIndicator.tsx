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

  return (
    <Button
      // MODIFIED: Mengubah onClick handler untuk langsung membuka URL
      onClick={() => window.open(UPGRADE_URL, '_blank')}
      variant="outline"
      // MODIFIED: Menggunakan prop 'size' yang diterima
      size={size}
      className="border-orange-300 text-orange-600 hover:bg-orange-50"
    >
      <Zap className="h-3 w-3 mr-1" />
      Upgrade
    </Button>
  );
};

export default PaymentStatusIndicator;