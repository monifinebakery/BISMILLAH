// src/components/purchase/components/table/StatusDropdown.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { StatusBadge } from '@/components/ui';
import { CheckCircle2, Clock, XCircle, ChevronDown } from 'lucide-react';
import { getStatusDisplayText } from '../../utils/purchaseHelpers';
import { Purchase, PurchaseStatus } from '../../types/purchase.types';

interface StatusDropdownProps {
  purchase: Purchase;
  isEditing: boolean;
  onStartEdit: () => void;
  onStatusChange: (purchaseId: string, newStatus: string) => Promise<void>;
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  purchase,
  isEditing,
  onStartEdit,
  onStatusChange
}) => {
  const [tempStatus, setTempStatus] = useState<PurchaseStatus>(purchase.status);

  const handleStatusSave = async () => {
    if (tempStatus !== purchase.status) {
      await onStatusChange(purchase.id, tempStatus);
    }
  };

  const handleStatusCancel = () => {
    setTempStatus(purchase.status);
    onStartEdit(); // This will close the edit mode
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Select
          value={tempStatus}
          onValueChange={(value) => setTempStatus(value as PurchaseStatus)}
        >
          <SelectTrigger className="h-8 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>{getStatusDisplayText('pending')}</span>
              </div>
            </SelectItem>
            <SelectItem value="completed">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{getStatusDisplayText('completed')}</span>
              </div>
            </SelectItem>
            <SelectItem value="cancelled">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>{getStatusDisplayText('cancelled')}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleStatusSave}
            className="h-8 px-2"
          >
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleStatusCancel}
            className="h-8 px-2"
          >
            <XCircle className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-1">
      <StatusBadge 
        status={getStatusDisplayText(purchase.status)}
        icon={
          purchase.status === 'completed' ? CheckCircle2 :
          purchase.status === 'pending' ? Clock :
          XCircle
        }
        size="sm"
      />
      
      <div className="flex items-center gap-1">
        {/* Quick Complete button for pending purchases */}
        {purchase.status === 'pending' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange(purchase.id, 'completed')}
            className="h-7 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            title="Selesaikan & Update Gudang"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Selesaikan
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onStartEdit}
          className="h-8 w-8 p-0"
          title="Ubah Status"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};