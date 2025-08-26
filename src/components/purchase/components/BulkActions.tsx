// src/components/purchase/components/BulkActions.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  isProcessing: boolean;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount, onBulkDelete, onClearSelection, isProcessing
}) => (
  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 mb-6">
    <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="font-medium text-orange-900 text-sm sm:text-base">
          {selectedCount > 0 ? `${selectedCount} item dipilih` : 'Mode pilih aktif - Pilih item untuk operasi massal'}
        </span>
        {selectedCount === 0 && (
          <span className="text-xs sm:text-sm text-orange-700 bg-orange-100 px-2 py-1 rounded inline-block">
            Klik checkbox untuk memilih item
          </span>
        )}
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Button 
          onClick={onBulkDelete} 
          variant="outline" 
          size="sm" 
          className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 text-xs sm:text-sm h-8 sm:h-9" 
          disabled={isProcessing || selectedCount === 0}
        >
          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Hapus Semua</span>
          <span className="sm:hidden">Hapus</span>
        </Button>
        <Button 
          onClick={onClearSelection} 
          variant="ghost" 
          size="sm" 
          className="text-gray-600 text-xs sm:text-sm h-8 sm:h-9"
        >
          <span className="hidden sm:inline">
            {selectedCount > 0 ? 'Batal Pilihan' : 'Keluar Mode Pilih'}
          </span>
          <span className="sm:hidden">
            {selectedCount > 0 ? 'Batal' : 'Keluar'}
          </span>
        </Button>
      </div>
    </div>
  </div>
);

export default BulkActions;