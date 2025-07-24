// src/components/orders/components/OrderStatusCell.tsx
import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Order } from '../types';
import { orderStatusList, getStatusColor } from '../constants/orderConstants';

interface OrderStatusCellProps {
  order: Order;
  onStatusChange?: (orderId: string, newStatus: string) => void;
  onFollowUpClick?: (order: Order) => void;
  disabled?: boolean;
}

const OrderStatusCell: React.FC<OrderStatusCellProps> = ({
  order,
  onStatusChange,
  onFollowUpClick,
  disabled = false
}) => {
  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange && !disabled) {
      onStatusChange(order.id, newStatus);
    }
  };

  const handleFollowUpClick = () => {
    if (onFollowUpClick && !disabled) {
      onFollowUpClick(order);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        {onStatusChange && !disabled ? (
          <Select 
            value={order.status} 
            onValueChange={handleStatusChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full h-8 text-xs border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orderStatusList.map((statusOption) => (
                <SelectItem 
                  key={statusOption.key} 
                  value={statusOption.key}
                  className="text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-2 h-2 rounded-full ${statusOption.bgColor.replace('bg-', 'bg-')}`}
                    />
                    {statusOption.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge 
            variant="outline" 
            className={`${getStatusColor(order.status)} text-xs font-medium px-2 py-1`}
          >
            {orderStatusList.find(s => s.key === order.status)?.label || order.status}
          </Badge>
        )}
      </div>
      
      {onFollowUpClick && !disabled && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 flex-shrink-0"
          onClick={handleFollowUpClick}
          title="Follow Up WhatsApp"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default OrderStatusCell;