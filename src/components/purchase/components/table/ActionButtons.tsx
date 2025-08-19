// src/components/purchase/components/table/ActionButtons.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2 } from 'lucide-react';
import { Purchase } from '../../types/purchase.types';

interface ActionButtonsProps {
  purchase: Purchase;
  onEdit: (purchase: Purchase) => void;
  onDelete: (purchase: Purchase) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  purchase,
  onEdit,
  onDelete
}) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(purchase)}
        className="h-8 w-8 p-0"
        title="Edit"
      >
        <Edit3 className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDelete(purchase)}
        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        title="Hapus"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};