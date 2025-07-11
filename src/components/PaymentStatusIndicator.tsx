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
  const { isPaid, needsPayment, setShowUpgradePopup, isLoading } = usePaymentContext();

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
      onClick={() => setShowUpgradePopup(true)}
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