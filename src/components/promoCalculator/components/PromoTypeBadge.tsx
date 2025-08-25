import React from 'react';
import { Gift, Percent, Package } from 'lucide-react';
import { helpers } from '../utils/helpers';
import { PROMO_TYPES } from '@/components/promoCalculator/constants/constants';

const PromoTypeBadge = ({ type, showIcon = true, className = '' }: any) => {
  const typeConfig = helpers.getPromoTypeColor(type);
  
  const getIcon = (promoType) => {
    switch (promoType) {
      case PROMO_TYPES.BOGO:
        return <Gift className="h-3 w-3" />;
      case PROMO_TYPES.DISCOUNT:
        return <Percent className="h-3 w-3" />;
      case PROMO_TYPES.BUNDLE:
        return <Package className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <span className={`
      inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium
      ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border} border
      ${className}
    `}>
      {showIcon && getIcon(type)}
      <span>{helpers.formatters?.promoType ? helpers.formatters.promoType(type) : type}</span>
    </span>
  );
};

export default PromoTypeBadge;