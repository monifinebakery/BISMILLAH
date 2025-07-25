// src/components/orders/components/OrderStatusCell.tsx
import React from 'react';
import { MessageSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Order } from '../types/order';
import { orderStatusList, getStatusText, getStatusColor, getStatusBgColor } from '../constants/orderConstants';
import { useFollowUpTemplate, useProcessTemplate } from '@/contexts/FollowUpTemplateContext';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Interface for the props of the OrderStatusCell component.
 */
interface OrderStatusCellProps {
  order: Order;
  onStatusChange?: (orderId: string, newStatus: string) => void;
  onTemplateManagerOpen?: (order: Order) => void;
  onFollowUpClick?: (order: Order) => void; // New prop for WhatsApp follow-up
  disabled?: boolean;
}

/**
 * A cell component for displaying and managing order status.
 * It combines a status selector with quick actions like sending a WhatsApp follow-up
 * and managing message templates, plus a status info display.
 */
const OrderStatusCell: React.FC<OrderStatusCellProps> = ({
  order,
  onStatusChange,
  onTemplateManagerOpen,
  onFollowUpClick,
  disabled = false,
}) => {
  // Hooks for handling templates and WhatsApp functionality
  const { getTemplate } = useFollowUpTemplate();
  const { processTemplate } = useProcessTemplate();
  const { sendWhatsAppForOrder } = useWhatsApp();

  /**
   * Handles the change of order status from the select dropdown.
   * @param newStatus - The new status key.
   */
  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange && !disabled) {
      onStatusChange(order.id, newStatus);
    }
  };

  /**
   * Handles the quick WhatsApp follow-up action.
   * Processes a template and sends it via WhatsApp.
   * @param e - The mouse event, used to stop propagation.
   */
  const handleQuickWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    if (!order) {
      toast.error('Order data is not available.');
      return;
    }

    const template = getTemplate(order.status);
    const processedMessage = processTemplate(template, order);

    sendWhatsAppForOrder(order, processedMessage, {
      onSuccess: () => {
        toast.success(`WhatsApp sent for order #${order.nomorPesanan}`);
      },
      onError: (error) => {
        toast.error(`Failed to send WhatsApp: ${error}`);
      },
    });
  };

  /**
   * Handles opening the template manager.
   * @param e - The mouse event, used to stop propagation.
   */
  const handleOpenTemplateManager = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTemplateManagerOpen && !disabled) {
      onTemplateManagerOpen(order);
    }
  };

  // If status change is not allowed, render a simple badge
  if (!onStatusChange) {
    return (
      <Badge
        variant="outline"
        className={cn(getStatusColor(order.status), 'text-xs font-medium px-2 py-1')}
      >
        {getStatusText(order.status)}
      </Badge>
    );
  }

  return (
    <div className="space-y-2">
      {/* Status Selector */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-[120px]">
          <Select
            value={order.status}
            onValueChange={handleStatusChange}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn(
                'w-full h-8 text-xs border-none',
                'transition-all duration-200 hover:shadow-md',
                getStatusBgColor(order.status),
                getStatusTextColor(order.status)
              )}
            >
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
                      className={cn(
                        'w-2 h-2 rounded-full',
                        getStatusBgColor(statusOption.key)
                      )}
                    />
                    {statusOption.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-shrink-0 gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 transition-colors"
            onClick={(e) => { e.stopPropagation(); onFollowUpClick ? onFollowUpClick(order) : handleQuickWhatsApp(e); }}
            disabled={disabled}
            title={`Send WhatsApp for status: ${getStatusText(order.status)}`}
          >
            <MessageSquare className="h-3 w-3" />
          </Button>
          {onTemplateManagerOpen && (
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors"
              onClick={handleOpenTemplateManager}
              disabled={disabled}
              title="Manage templates"
            >
              <Settings className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Status Info */}
      <div className="flex items-center gap-1">
        <div
          className={cn('w-1.5 h-1.5 rounded-full', getStatusBgColor(order.status))}
        />
        <span className={cn('text-xs font-medium', getStatusTextColor(order.status))}>
          {getStatusText(order.status)}
        </span>
      </div>
    </div>
  );
};

export default OrderStatusCell;