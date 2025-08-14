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
import { Purchase, PurchaseStatus } from '../types/purchase.types';
import { getStatusColor, getStatusDisplayText } from '../utils/purchaseHelpers';
import { STATUS_OPTIONS } from '../constants/statusOptions';
import { ChevronDown } from 'lucide-react';

interface StatusDropdownProps {
  purchase: Purchase;
  isEditing: boolean;
  onStartEdit: () => void;
  onChange: (purchaseId: string, status: PurchaseStatus) => void;
}

const StatusDropdownComponent: React.FC<StatusDropdownProps> = ({
  purchase,
  isEditing,
  onStartEdit,
  onChange,
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
      onValueChange={(value: PurchaseStatus) => onChange(purchase.id, value)}
      defaultOpen
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

export default React.memo(StatusDropdownComponent);

