// src/components/purchase/components/EmptyState.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShoppingCart, Plus, Users } from 'lucide-react';

interface EmptyStateProps {
  onAddPurchase: () => void;
  hasSuppliers: boolean;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  onAddPurchase,
  hasSuppliers,
  className = '',
}) => {
  const canCreatePurchase = hasSuppliers;

  return (
    <Card className={`p-12 text-center ${className}`}>
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-6">
          <ShoppingCart className="h-8 w-8 text-gray-400" />
        </div>

        {/* Content based on state */}
        {canCreatePurchase ? (
          <>
            {/* Ready to create purchases */}
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Belum Ada Pembelian
            </h3>
            <p className="text-gray-500 mb-6">
              Mulai dengan membuat pembelian pertama dari supplier Anda. 
              Semua transaksi pembelian akan muncul di sini.
            </p>
            <Button
              onClick={onAddPurchase}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Buat Pembelian Pertama
            </Button>
          </>
        ) : (
          <>
            {/* Missing prerequisites */}
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Siapkan Data Dasar Dulu
            </h3>
            <p className="text-gray-500 mb-6">
              Untuk membuat pembelian, Anda perlu menyiapkan data supplier terlebih dahulu.
            </p>

            {/* Missing data indicators */}
            <div className="space-y-3 mb-6">
              {!hasSuppliers && (
                <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <Users className="h-4 w-4" />
                  <span>Data supplier belum ada</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!hasSuppliers && (
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/supplier'}
                  className="inline-flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Tambah Supplier
                </Button>
              )}
            </div>

            {/* Helper text */}
            <div className="mt-6 text-xs text-gray-400">
              Setelah data supplier siap, Anda bisa mulai membuat pembelian
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default EmptyState;
