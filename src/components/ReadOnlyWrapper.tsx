
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown } from 'lucide-react';
import { usePaymentContext } from '@/contexts/PaymentContext';

interface ReadOnlyWrapperProps {
  children: React.ReactNode;
  feature?: string;
  className?: string;
}

const ReadOnlyWrapper: React.FC<ReadOnlyWrapperProps> = ({ 
  children, 
  feature = "fitur premium",
  className = ""
}) => {
  const { isPaid, needsPayment, setShowUpgradePopup } = usePaymentContext();

  if (isPaid) {
    return <>{children}</>;
  }

  const handleUpgradeClick = () => {
    setShowUpgradePopup(true);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`relative ${className}`}>
            <div className="pointer-events-none opacity-50 select-none">
              {children}
            </div>
            <div className="absolute inset-0 bg-gray-400/20 backdrop-blur-[0.5px] rounded-md flex items-center justify-center">
              <div 
                onClick={handleUpgradeClick}
                className="bg-white rounded-lg p-3 cursor-pointer hover:border-orange-300 transition-colors border border-orange-200"
              >
                <div className="flex items-center gap-2 text-orange-600">
                  <Crown className="h-4 w-4" />
                  <span className="text-sm font-medium">Premium</span>
                </div>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            Upgrade ke Premium untuk menggunakan {feature}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ReadOnlyWrapper;
