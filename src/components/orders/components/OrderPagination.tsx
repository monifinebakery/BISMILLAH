// src/components/orders/components/OrderPagination.tsx
import React from 'react';
import { Button } from '@/components/ui/button';

interface OrderPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
}

const OrderPagination: React.FC<OrderPaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  onPrev,
  onNext,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 p-4 bg-white rounded-lg border">
      <div className="text-sm text-gray-600">
        Halaman {currentPage} dari {totalPages} ({totalCount} total pesanan)
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={onPrev}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
        >
          Sebelumnya
        </Button>
        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm font-medium">
          {currentPage}
        </span>
        <Button
          onClick={onNext}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
        >
          Selanjutnya
        </Button>
      </div>
    </div>
  );
};

export default OrderPagination;

