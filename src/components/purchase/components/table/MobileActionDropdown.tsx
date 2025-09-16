// src/components/purchase/components/table/MobileActionDropdown.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit3, Trash2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Purchase, PurchaseStatus } from '../../types/purchase.types';
import { getStatusDisplayText } from '../../utils/purchaseHelpers';

interface MobileActionDropdownProps {
  purchase: Purchase;
  onEdit: (purchase: Purchase) => void;
  onDelete: (purchase: Purchase) => void;
  onStatusChange: (purchaseId: string, newStatus: string) => void;
}

export const MobileActionDropdown: React.FC<MobileActionDropdownProps> = ({
  purchase,
  onEdit,
  onDelete,
  onStatusChange
}) => {
  const handleStatusChange = (status: PurchaseStatus) => {
    onStatusChange(purchase.id, status);
  };

  const getStatusIcon = (status: PurchaseStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 data-[state=open]:bg-muted"
          aria-label="Open menu"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => onEdit(purchase)} className="cursor-pointer">
          <Edit3 className="h-4 w-4 mr-2 text-blue-500" />
          Edit
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Status change options */}
        {purchase.status !== 'pending' && (
          <DropdownMenuItem 
            onClick={() => handleStatusChange('pending')} 
            className="cursor-pointer"
          >
            {getStatusIcon('pending')}
            <span className="ml-2">Mark as {getStatusDisplayText('pending')}</span>
          </DropdownMenuItem>
        )}
        
        {purchase.status !== 'completed' && (
          <DropdownMenuItem 
            onClick={() => handleStatusChange('completed')} 
            className="cursor-pointer"
          >
            {getStatusIcon('completed')}
            <span className="ml-2">Mark as {getStatusDisplayText('completed')}</span>
          </DropdownMenuItem>
        )}
        
        {purchase.status !== 'cancelled' && (
          <DropdownMenuItem 
            onClick={() => handleStatusChange('cancelled')} 
            className="cursor-pointer"
          >
            {getStatusIcon('cancelled')}
            <span className="ml-2">Mark as {getStatusDisplayText('cancelled')}</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onDelete(purchase)} 
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};