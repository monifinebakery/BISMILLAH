// hooks/useWhatsApp.js
import { toast } from 'sonner';

export const useWhatsApp = () => {
  // Format phone number for WhatsApp
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Indonesian numbers
    if (cleaned.startsWith('0')) {
      // Replace leading 0 with 62 for Indonesian numbers
      cleaned = '62' + cleaned.substring(1);
    } else if (!cleaned.startsWith('62')) {
      // Add 62 prefix if not already present
      cleaned = '62' + cleaned;
    }
    
    return cleaned;
  };

  // Send WhatsApp message
  const sendWhatsApp = (phoneNumber, message, options = {}) => {
    const { 
      showSuccessToast = true, 
      onSuccess = null, 
      onError = null 
    } = options;
    
    try {
      const formattedNumber = formatPhoneNumber(phoneNumber);
      
      if (!formattedNumber) {
        const errorMsg = 'Nomor telepon tidak valid atau kosong';
        if (onError) onError(errorMsg);
        toast.error(errorMsg);
        return false;
      }

      if (!message || message.trim() === '') {
        const errorMsg = 'Pesan tidak boleh kosong';
        if (onError) onError(errorMsg);
        toast.error(errorMsg);
        return false;
      }

      // Create WhatsApp URL
      const whatsappURL = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message.trim())}`;
      
      // Open WhatsApp
      const newWindow = window.open(whatsappURL, '_blank', 'noopener,noreferrer');
      
      if (!newWindow) {
        const errorMsg = 'Pop-up diblokir. Harap izinkan pop-up untuk mengirim WhatsApp';
        if (onError) onError(errorMsg);
        toast.error(errorMsg);
        return false;
      }

      // Success callback
      if (onSuccess) onSuccess();
      if (showSuccessToast) {
        toast.success('WhatsApp berhasil dibuka dengan pesan template');
      }
      
      return true;
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      const errorMsg = 'Gagal membuka WhatsApp';
      if (onError) onError(errorMsg);
      toast.error(errorMsg);
      return false;
    }
  };

  // Send WhatsApp with order data
  const sendWhatsAppForOrder = (order, template, options = {}) => {
    if (!order) {
      toast.error('Data pesanan tidak tersedia');
      return false;
    }

    if (!order.teleponPelanggan) {
      toast.error('Nomor telepon pelanggan tidak tersedia');
      return false;
    }

    return sendWhatsApp(order.teleponPelanggan, template, {
      ...options,
      onSuccess: () => {
        if (options.onSuccess) options.onSuccess();
        // Optional: Log activity or update order status
        console.log('WhatsApp sent for order:', order.nomorPesanan);
      }
    });
  };

  // Validate WhatsApp number
  const isValidWhatsAppNumber = (phoneNumber) => {
    if (!phoneNumber) return false;
    const formatted = formatPhoneNumber(phoneNumber);
    return formatted.length >= 10 && formatted.length <= 15;
  };

  // Get WhatsApp chat URL (without message)
  const getWhatsAppChatURL = (phoneNumber) => {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    if (!formattedNumber) return null;
    return `https://wa.me/${formattedNumber}`;
  };

  return {
    sendWhatsApp,
    sendWhatsAppForOrder,
    formatPhoneNumber,
    isValidWhatsAppNumber,
    getWhatsAppChatURL
  };
};

export default useWhatsApp;