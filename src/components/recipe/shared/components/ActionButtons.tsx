// src/components/recipe/shared/components/ActionButtons.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Edit, Trash2, Eye } from 'lucide-react';

interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  showView?: boolean;
  showEdit?: boolean;
  showDuplicate?: boolean;
  showDelete?: boolean;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  showView = false,
  showEdit = true,
  showDuplicate = true,
  showDelete = true,
  isLoading = false,
  size = 'md'
}) => {
  const buttonSize = size === 'sm' ? 'icon' : 'icon';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        {showView && onView && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size={buttonSize} 
                onClick={onView}
                disabled={isLoading}
                className="h-8 w-8"
              >
                <Eye className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Lihat Detail</TooltipContent>
          </Tooltip>
        )}

        {showDuplicate && onDuplicate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size={buttonSize} 
                onClick={onDuplicate}
                disabled={isLoading}
                className="h-8 w-8"
              >
                <Copy className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplikasi Resep</TooltipContent>
          </Tooltip>
        )}

        {showEdit && onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size={buttonSize} 
                onClick={onEdit}
                disabled={isLoading}
                className="h-8 w-8"
              >
                <Edit className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit Resep</TooltipContent>
          </Tooltip>
        )}

        {showDelete && onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size={buttonSize} 
                onClick={onDelete}
                disabled={isLoading}
                className="h-8 w-8 text-red-500 hover:text-red-700"
              >
                <Trash2 className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Hapus Resep</TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
};