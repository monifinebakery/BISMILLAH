// src/components/orders/components/OrderHeader.tsx
import React from 'react';
import { FileText, Plus, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ImportButton from './ImportButton';

interface OrderHeaderProps {
  onNewOrder: () => void;
  showDebug?: boolean;
  onDebugStatus?: () => void;
}

const OrderHeader: React.FC<OrderHeaderProps> = ({
  onNewOrder,
  showDebug = false,
  onDebugStatus,
}) => {
  const navigate = useNavigate();
  
  const handleOpenTemplateManager = () => {
    navigate('/pesanan/template');
  };
  return (
    <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border">
      <div className="flex items-center gap-3 sm:gap-4 mb-4 lg:mb-0">
        <div className="flex-shrink-0 bg-white bg-opacity-20 p-2 sm:p-3 rounded-xl backdrop-blur-sm">
          <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Manajemen Pesanan</h1>
          <p className="text-xs sm:text-sm opacity-90 mt-1">
            Kelola semua pesanan dari pelanggan Anda dengan template WhatsApp otomatis.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
        {showDebug && (
          <Button
            onClick={onDebugStatus}
            variant="outline"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all duration-200"
          >
            🐛 Debug Status
          </Button>
        )}

        <ImportButton />

        <Button
          onClick={handleOpenTemplateManager}
          variant="outline"
          className="flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-all duration-200 border-orange-300 text-sm"
        >
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Kelola Template WhatsApp</span>
          <span className="sm:hidden">Template</span>
        </Button>

        <Button
          onClick={onNewOrder}
          className="flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 text-sm"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Pesanan Baru</span>
          <span className="sm:hidden">Baru</span>
        </Button>
      </div>
    </header>
  );
};

export default OrderHeader;

