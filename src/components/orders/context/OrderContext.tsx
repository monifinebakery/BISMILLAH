// 🎯 80 lines - Context definition dengan semua interface asli
import { createContext, useContext } from 'react';
import type { EnhancedOrderContextType } from '../types';

// Enhanced context interface dari kode asli
const OrderContext = createContext<EnhancedOrderContextType | undefined>(undefined);

// Enhanced useOrder hook dengan error handling dari kode asli
export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export default OrderContext;