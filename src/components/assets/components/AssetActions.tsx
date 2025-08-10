// src/components/assets/components/AssetActions.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Asset } from '../types';

interface AssetActionsProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string, name: string) => void;
  isDeleting?: boolean;
  size?: 'sm' | 'md';
  showLabels?: boolean;
}

export const AssetActions: React.FC<AssetActionsProps> = ({
  asset,
  onEdit,
  onDelete,
  isDeleting = false,
  size = 'sm',
  showLabels = false,
}) => {
  const buttonSize = size === 'sm' ? 'sm' : 'default';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div className="flex gap-1 justify-end">
      <Button
        size={buttonSize}
        variant="outline"
        onClick={() => onEdit(asset)}
        className="border-orange-300 hover:bg-orange-50"
        title="Edit Aset"
        disabled={isDeleting}
      >
        <Edit className={`${iconSize} text-orange-600`} />
        {showLabels && <span className="ml-1">Edit</span>}
      </Button>
      
      <Button
        size={buttonSize}
        variant="destructive"
        onClick={() => onDelete(asset.id, asset.nama)}
        className="bg-red-600 hover:bg-red-700"
        title="Hapus Aset"
        disabled={isDeleting}
      >
        <Trash2 className={iconSize} />
        {showLabels && <span className="ml-1">Hapus</span>}
      </Button>
    </div>
  );
};