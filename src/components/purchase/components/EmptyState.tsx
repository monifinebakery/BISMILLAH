// src/components/purchase/components/EmptyState.tsx

import React, { useState } from 'react';
import { EmptyState as SharedEmptyState } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Users } from 'lucide-react';
import { SupplierDialog } from '@/components/supplier';

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
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);

  // If suppliers exist, show simple empty state
  if (hasSuppliers) {
    return (
      <div className={className}>
        <SharedEmptyState
          illustration="cart"
          title="Belum Ada Pembelian"
          description="Mulai dengan membuat pembelian pertama dari supplier Anda. Semua transaksi pembelian akan muncul di sini."
          actionText="Buat Pembelian Pertama"
          onAction={onAddPurchase}
        />
      </div>
    );
  }

  // If no suppliers, show custom empty state with supplier creation option
  return (
    <div className={className}>
      <SharedEmptyState
        icon={ShoppingCart}
        title="Belum Ada Pembelian"
        description="Mulai dengan membuat pembelian pertama dari supplier Anda."
        actionText="Buat Pembelian Pertama"
        onAction={onAddPurchase}
        customIllustration={
          <div className="space-y-4">
            {/* Warning about missing suppliers */}
            <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              <Users className="h-4 w-4" />
              <span>Data supplier belum ada</span>
            </div>
            
            {/* Add supplier button */}
            <Button
              variant="outline"
              onClick={() => setSupplierDialogOpen(true)}
              className="inline-flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Tambah Supplier Dulu
            </Button>
          </div>
        }
      />
      
      <SupplierDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        supplier={null}
      />
    </div>
  );
};

export default EmptyState;
