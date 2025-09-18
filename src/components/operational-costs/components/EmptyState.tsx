// src/components/operational-costs/components/EmptyState.tsx

import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onStartQuickSetup: () => void;
  onOpenAddDialog: () => void;
  onSkipOnboarding: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  onStartQuickSetup,
  onOpenAddDialog,
  onSkipOnboarding
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6 text-center">
        <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
          🚀
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Selamat datang di Biaya Operasional!
        </h3>
        <p className="text-gray-600 mb-6">
          Mulai dengan menambahkan biaya operasional pertama Anda. Kami punya template siap pakai untuk berbagai jenis usaha.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onStartQuickSetup}
            className="bg-orange-600 hover:bg-orange-700"
          >
            🎆 Setup Cepat dengan Template
          </Button>
          <Button
            variant="outline"
            onClick={onOpenAddDialog}
          >
            + Tambah Manual
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkipOnboarding}
            className="text-gray-500"
          >
            Skip untuk sekarang
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;