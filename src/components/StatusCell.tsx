// components/StatusCell.jsx
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { orderStatusList, getStatusText, getStatusColor } from '@/constants/orderConstants';
import { useFollowUpTemplate, useProcessTemplate } from '@/contexts/FollowUpTemplateContext';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const StatusCell = ({ order, onStatusChange, onTemplateManagerOpen }) => {
  const { getTemplate } = useFollowUpTemplate();
  const { processTemplate } = useProcessTemplate();
  const { sendWhatsAppForOrder } = useWhatsApp();

  const handleQuickWhatsApp = (e) => {
    e.stopPropagation();
    
    if (!order) {
      toast.error('Data pesanan tidak tersedia');
      return;
    }

    const template = getTemplate(order.status);
    const processedMessage = processTemplate(template, order);
    
    sendWhatsAppForOrder(order, processedMessage, {
      onSuccess: () => {
        toast.success(`WhatsApp terkirim untuk pesanan #${order.nomorPesanan}`);
      },
      onError: (error) => {
        toast.error(`Gagal mengirim WhatsApp: ${error}`);
      }
    });
  };

  const handleOpenTemplateManager = (e) => {
    e.stopPropagation();
    if (onTemplateManagerOpen) {
      onTemplateManagerOpen(order);
    }
  };

  return (
    <div className="space-y-2">
      {/* Status Selector */}
      <Select 
        value={order.status} 
        onValueChange={(newStatus) => onStatusChange(order.id, newStatus)}
      >
        <SelectTrigger 
          className={cn(
            getStatusColor(order.status), 
            "h-8 border-none text-xs cursor-pointer transition-all duration-200 hover:shadow-md"
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {orderStatusList.map(s => (
            <SelectItem key={s.key} value={s.key}>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", {
                  'bg-yellow-500': s.key === 'pending',
                  'bg-blue-500': s.key === 'confirmed',
                  'bg-orange-500': s.key === 'shipping',
                  'bg-green-500': s.key === 'delivered',
                  'bg-red-500': s.key === 'cancelled',
                })} />
                {s.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Quick Actions */}
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 transition-colors"
          onClick={handleQuickWhatsApp}
          title={`Kirim WhatsApp untuk status ${getStatusText(order.status)}`}
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          WA
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors"
          onClick={handleOpenTemplateManager}
          title="Kelola template atau pilih status lain"
        >
          ⚙️
        </Button>
      </div>

      {/* Status Info */}
      <div className="flex items-center gap-1">
        <div className={cn("w-1.5 h-1.5 rounded-full", {
          'bg-yellow-500': order.status === 'pending',
          'bg-blue-500': order.status === 'confirmed',
          'bg-orange-500': order.status === 'shipping',
          'bg-green-500': order.status === 'delivered',
          'bg-red-500': order.status === 'cancelled',
        })} />
        <span className="text-xs text-gray-500 font-medium">
          {getStatusText(order.status)}
        </span>
      </div>
    </div>
  );
};

export default StatusCell;