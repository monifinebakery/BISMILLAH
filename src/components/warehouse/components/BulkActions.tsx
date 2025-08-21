// src/components/warehouse/components/BulkActions.tsx  
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, AlertTriangle } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  isProcessing: boolean;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount, onBulkEdit, onBulkDelete, onClearSelection, isProcessing
}) => (
  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="font-medium text-orange-900">
          {selectedCount > 0 ? `${selectedCount} item dipilih` : 'Mode pilih aktif - Pilih item untuk operasi massal'}
        </span>
        {selectedCount === 0 && (
          <span className="text-sm text-orange-700 bg-orange-100 px-2 py-1 rounded">
            Klik checkbox untuk memilih item
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button 
          onClick={onBulkEdit} 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2" 
          disabled={isProcessing || selectedCount === 0}
        >
          <Settings className="h-4 w-4" />
          Edit Bulk
        </Button>
        <Button 
          onClick={onBulkDelete} 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 text-red-600 hover:text-red-700" 
          disabled={isProcessing || selectedCount === 0}
        >
          <AlertTriangle className="h-4 w-4" />
          Hapus Semua
        </Button>
        <Button onClick={onClearSelection} variant="ghost" size="sm" className="text-gray-600">
          {selectedCount > 0 ? 'Batal Pilihan' : 'Keluar Mode Pilih'}
        </Button>
      </div>
    </div>
  </div>
);

export default BulkActions;