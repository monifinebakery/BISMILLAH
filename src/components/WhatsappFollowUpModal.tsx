import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ActionButtons } from '@/components/ui/action-buttons';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useFollowUpTemplate, useProcessTemplate } from '@/contexts/FollowUpTemplateContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { logger } from '@/utils/logger';
import { canFollowupOrder, getFollowupRecommendation, getStatusIndicator } from '@/utils/followupValidation';

// Define the props interface for the component
interface WhatsappFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber?: string;
    customerName?: string;
    status: string;
    customerPhone?: string;
    // Database field compatibility
    nomor_pesanan?: string;
    nama_pelanggan?: string;
    telepon_pelanggan?: string;
    // Other possible formats
    order_number?: string;
    customer_name?: string;
    customer_phone?: string;
    [key: string]: unknown;
  } | null;
  // ✅ FIXED: Remove dependency on legacy getWhatsappTemplateByStatus
  // getWhatsappTemplateByStatus: (status: string, orderData: any) => string;
}

const WhatsappFollowUpModal: React.FC<WhatsappFollowUpModalProps> = ({
  isOpen,
  onClose,
  order
  // ✅ FIXED: Remove getWhatsappTemplateByStatus parameter
}) => {
  const [message, setMessage] = useState('');
  
  // ✅ FIXED: Use FollowUpTemplateContext instead of legacy function
  const { getTemplate } = useFollowUpTemplate();
  const { processTemplate } = useProcessTemplate();
  
  // ✅ NEW: Get user settings to determine WhatsApp type
  const { settings } = useUserSettings();

  // ✅ FIXED: Generate template using the same system as FollowUpTemplateManager
  type OrderLike = NonNullable<WhatsappFollowUpModalProps['order']>;

  const generateWhatsAppTemplate = useMemo(() => {
    return (status: string, orderData: OrderLike): string => {
      try {
        logger.debug('WhatsappFollowUpModal: Generating template for status:', status);
        
        const rawTemplate = getTemplate(status);
        if (!rawTemplate) {
        logger.warn('WhatsappFollowUpModal: No template found for status:', status);
        const customerName = orderData?.customerName || orderData?.nama_pelanggan || orderData?.customer_name || 'Pelanggan';
        const orderNumber = orderData?.orderNumber || orderData?.nomor_pesanan || orderData?.order_number || 'N/A';
        return `Halo ${customerName}, saya ingin menanyakan status pesanan #${orderNumber}.`;
        }
        
        const processedTemplate = processTemplate(rawTemplate, orderData);
        logger.debug('WhatsappFollowUpModal: Template processed successfully');
        
        return processedTemplate;
      } catch (error) {
        logger.error('WhatsappFollowUpModal: Error generating template:', error);
        return `Halo ${orderData?.customerName || 'Pelanggan'}, saya ingin menanyakan status pesanan #${orderData?.orderNumber || 'N/A'}.`;
      }
    };
  }, [getTemplate, processTemplate]);

  // ✅ FIXED: Effect to set the initial message template using FollowUpTemplateContext
  useEffect(() => {
    if (order && isOpen) {
      logger.debug('WhatsappFollowUpModal: Setting message for order:', {
        orderId: order.id,
        status: order.status,
        orderNumber: order.orderNumber
      });
      
      const template = generateWhatsAppTemplate(order.status, order);
      setMessage(template);
    }
  }, [order, isOpen, generateWhatsAppTemplate]);

  // --- STEP 1 & 2: Process and memoize the phone number ---
  // useMemo ensures this logic only runs when phone number changes.
  const processedPhoneNumber = useMemo(() => {
    // Try multiple possible phone field names for compatibility
    const phoneNumber = order?.customerPhone 
                     ?? order?.customer_phone 
                     ?? order?.telepon_pelanggan;
    
    // Return empty string if there's no order or phone number
    if (!phoneNumber) {
      return '';
    }

    // Start with a clean string, removing all whitespace
    let number = phoneNumber.replace(/\s+/g, '');

    // Remove '+' prefix if present
    if (number.startsWith('+')) {
      number = number.substring(1);
    }

    // Standardize to '62' country code for Indonesian numbers
    if (number.startsWith('0')) {
      number = '62' + number.substring(1);
    }
    // If it doesn't start with '62', assume it's a local number needing the prefix
    else if (!number.startsWith('62')) {
      number = '62' + number;
    }

    // Basic validation: ensure it contains only digits and has a reasonable length.
    // If invalid, return an empty string.
    if (!/^\d+$/.test(number) || number.length < 9 || number.length > 15) {
        return '';
    }

    return number;
  }, [order?.customerPhone, order?.customer_phone, order?.telepon_pelanggan]); // Re-run when the phone fields change

  // Calculate order age for validation
  const orderAgeMinutes = useMemo(() => {
    if (!order?.created_at) return 0;
    const createdAt = new Date(order.created_at);
    const now = new Date();
    return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
  }, [order?.created_at]);

  // Status validation for followup
  const followupValidation = useMemo(() => {
    if (!order) return { canFollowup: false, reason: 'Order tidak tersedia' };
    return getFollowupRecommendation(order.status, orderAgeMinutes);
  }, [order, orderAgeMinutes]);

  const statusIndicator = useMemo(() => {
    if (!order) return null;
    return getStatusIndicator(order.status);
  }, [order?.status]);

  // Function to handle sending the WhatsApp message
  const handleSendWhatsapp = () => {
    if (!order) {
      toast.error('Data pesanan tidak ditemukan.');
      return;
    }

    // --- STEP 4: Use the processed phone number for validation ---
    if (!processedPhoneNumber) {
      toast.error('Nomor telepon pelanggan tidak valid atau tidak tersedia.');
      return;
    }

    try {
      // Encode the message to be safely used in a URL
      const encodedMessage = encodeURIComponent(message);

      // ✅ NEW: Construct different WhatsApp URLs based on user's preference
      let whatsappUrl: string;
      
      if (settings.whatsappType === 'business') {
        // WhatsApp Business Web URL
        whatsappUrl = `https://api.whatsapp.com/send/?phone=${processedPhoneNumber}&text=${encodedMessage}&type=phone_number&app_absent=0`;
      } else {
        // Standard WhatsApp Web URL (Personal)
        whatsappUrl = `https://wa.me/${processedPhoneNumber}?text=${encodedMessage}`;
      }
      
      window.open(whatsappUrl, '_blank');

      toast.success(`WhatsApp ${settings.whatsappType === 'business' ? 'Business' : 'Personal'} follow-up initiated`);

      // Close the modal on success
      onClose();
    } catch (error) {
      console.error('Error sending WhatsApp follow-up:', error);
      toast.error('Gagal membuka WhatsApp. Terjadi kesalahan.');
    }
  };

  // Do not render the component if there is no order data
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dialog-overlay-center">
        <div className="dialog-panel">
          <DialogHeader className="dialog-header-pad">
            <DialogTitle>Kirim Follow-up WhatsApp</DialogTitle>
          </DialogHeader>

          <div className="dialog-body space-y-4 py-4">
          {/* Status Validation Alert */}
          {!followupValidation.canFollowup && (
            <div className={`p-4 rounded-lg border ${
              followupValidation.urgency === 'none'
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  followupValidation.urgency === 'none' ? 'bg-red-500' : 'bg-yellow-500'
                }`}>
                  <span className="text-white text-xs">⚠️</span>
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold text-sm ${
                    followupValidation.urgency === 'none' ? 'text-red-900' : 'text-yellow-900'
                  }`}>
                    {followupValidation.urgency === 'none' ? 'Followup Tidak Dianjurkan' : 'Perhatian'}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    followupValidation.urgency === 'none' ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    {followupValidation.reason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status Recommendation */}
          {followupValidation.canFollowup && followupValidation.recommendation && (
            <div className={`p-4 rounded-lg border ${
              followupValidation.urgency === 'high'
                ? 'bg-red-50 border-red-200'
                : followupValidation.urgency === 'medium'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  followupValidation.urgency === 'high'
                    ? 'bg-red-500'
                    : followupValidation.urgency === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}>
                  <span className="text-white text-xs">
                    {followupValidation.urgency === 'high' ? '🔴' :
                     followupValidation.urgency === 'medium' ? '🟡' : '🟢'}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold text-sm ${
                    followupValidation.urgency === 'high'
                      ? 'text-red-900'
                      : followupValidation.urgency === 'medium'
                      ? 'text-yellow-900'
                      : 'text-green-900'
                  }`}>
                    Rekomendasi Followup
                  </h4>
                  <p className={`text-sm mt-1 ${
                    followupValidation.urgency === 'high'
                      ? 'text-red-700'
                      : followupValidation.urgency === 'medium'
                      ? 'text-yellow-700'
                      : 'text-green-700'
                  }`}>
                    {followupValidation.recommendation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Order Details Section */}
          <div className="space-y-1 border-b pb-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">Nomor Pesanan:</span>
              <span className="text-gray-800 font-mono">
                {order.orderNumber || order.nomor_pesanan || order.order_number || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">Pelanggan:</span>
              <span className="text-gray-800">
                {order.customerName || order.nama_pelanggan || order.customer_name || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">Status Saat Ini:</span>
              <span className="text-gray-800">{order.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">Nomor WhatsApp:</span>
              {/* Display the processed number or a fallback message */}
              <span className="font-semibold text-green-700">{processedPhoneNumber || 'Tidak Tersedia'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">Tipe WhatsApp:</span>
              <span className={`font-semibold ${
                settings.whatsappType === 'business' ? 'text-blue-700' : 'text-green-700'
              }`}>
                {settings.whatsappType === 'business' ? 'Business' : 'Personal'}
              </span>
            </div>
          </div>

          {/* Message Text Area */}
          <div className="space-y-2">
            <label htmlFor="whatsapp-message" className="text-sm font-medium text-gray-700">
              Pesan WhatsApp
            </label>
            <Textarea
              id="whatsapp-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[150px] w-full rounded-md border-gray-300 focus:ring-green-500 focus:border-green-500"
              placeholder="Masukkan pesan WhatsApp..."
            />
            <p className="text-xs text-gray-500">
              Anda dapat mengedit pesan ini sebelum mengirim.
            </p>
          </div>

          </div>
          
          <DialogFooter className="dialog-footer-pad pt-4">
            <ActionButtons
              onCancel={onClose}
              onSave={handleSendWhatsapp}
              cancelText="Batal"
              saveText="Follow-up Sekarang"
              isSaving={false}
              disabled={!processedPhoneNumber || message.trim() === ''}
            />
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsappFollowUpModal;
