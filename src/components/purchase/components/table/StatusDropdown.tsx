// src/components/purchase/components/table/StatusDropdown.tsx
// Extracted status dropdown section from PurchaseTable

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';
import { Purchase, PurchaseStatus } from '../../types/purchase.types';
import { getStatusColor, getStatusDisplayText } from '../../utils/purchaseHelpers';

// Constants
const STATUS_OPTIONS: { value: PurchaseStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'completed', label: 'Selesai', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'cancelled', label: 'Dibatalkan', color: 'bg-red-100 text-red-800 border-red-200' },
];

interface StatusDropdownProps {
  purchase: Purchase;
  isEditing: boolean;
  onStartEdit: () => void;
  onStatusChange: (purchaseId: string, newStatus: PurchaseStatus) => Promise<void>;
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  purchase,
  isEditing,
  onStartEdit,
  onStatusChange,
}) => {
  if (!isEditing) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onStartEdit}
        className="h-auto p-1 justify-start hover:bg-gray-50"
      >
        <Badge 
          variant="outline" 
          className={`${getStatusColor(purchase.status)} cursor-pointer hover:opacity-80`}
        >
          {getStatusDisplayText(purchase.status)}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Badge>
      </Button>
    );
  }

  return (
    <Select
      value={purchase.status}
      onValueChange={(value: PurchaseStatus) => onStatusChange(purchase.id, value)}
      defaultOpen={true}
    >
      <SelectTrigger className="w-[120px] h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${option.color.split(' ')[0]}`} />
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
