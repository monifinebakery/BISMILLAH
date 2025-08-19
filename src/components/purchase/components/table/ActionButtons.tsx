// src/components/purchase/components/table/ActionButtons.tsx
// Extracted action buttons section from PurchaseTable

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Purchase } from '../../types/purchase.types';

interface ActionButtonsProps {
  purchase: Purchase;
  onEdit: (purchase: Purchase) => void;
  onDelete: (purchase: Purchase) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  purchase,
  onEdit,
  onDelete,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          aria-label={`Actions for purchase ${purchase.id}`}
          type="button"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[140px] z-[9999] bg-white border border-gray-200 rounded-md"
        side="bottom"
        sideOffset={4}
        avoidCollisions={true}
        collisionPadding={8}
      >
        {/* Edit Menu Item */}
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(purchase);
          }}
          className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 px-3 py-2 text-sm"
          role="menuitem"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
        
        {/* Delete Menu Item */}
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(purchase);
          }}
          className="cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600 px-3 py-2 text-sm"
          role="menuitem"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
