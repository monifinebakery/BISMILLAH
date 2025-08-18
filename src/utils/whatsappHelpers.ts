import { toast } from 'sonner';
import type { Order } from '@/components/orders/types';

export const formatWhatsAppNumber = (phoneNumber: string): string => {
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

interface WhatsAppOptions {
  showSuccessToast?: boolean;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export const sendWhatsApp = (
  phoneNumber: string,
  message: string,
  options: WhatsAppOptions = {}
): boolean => {
  const { showSuccessToast = true, onSuccess, onError } = options;

  try {
    const formattedNumber = formatWhatsAppNumber(phoneNumber);

    if (!formattedNumber) {
      const errorMsg = 'Nomor telepon tidak valid atau kosong';
      onError?.(errorMsg);
      toast.error(errorMsg);
      return false;
    }

    if (!message || message.trim() === '') {
      const errorMsg = 'Pesan tidak boleh kosong';
      onError?.(errorMsg);
      toast.error(errorMsg);
      return false;
    }

    // Create WhatsApp URL
    const whatsappURL = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(
      message.trim()
    )}`;

    // Open WhatsApp
    const newWindow = window.open(whatsappURL, '_blank', 'noopener,noreferrer');

    if (!newWindow) {
      const errorMsg = 'Pop-up diblokir. Harap izinkan pop-up untuk mengirim WhatsApp';
      onError?.(errorMsg);
      toast.error(errorMsg);
      return false;
    }

    // Success callback
    onSuccess?.();
    if (showSuccessToast) {
      toast.success('WhatsApp berhasil dibuka dengan pesan template');
    }

    return true;
  } catch (error) {
    console.error('Error opening WhatsApp:', error);
    const errorMsg = 'Gagal membuka WhatsApp';
    onError?.(errorMsg);
    toast.error(errorMsg);
    return false;
  }
};

export const sendWhatsAppForOrder = (
  order: Order,
  template: string,
  options: WhatsAppOptions = {}
): boolean => {
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
      options.onSuccess?.();
      // Optional: Log activity or update order status
      console.log('WhatsApp sent for order:', order.nomorPesanan);
    },
  });
};

export const isValidWhatsAppNumber = (phoneNumber: string): boolean => {
  if (!phoneNumber) return false;
  const formatted = formatWhatsAppNumber(phoneNumber);
  return formatted.length >= 10 && formatted.length <= 15;
};

export const getWhatsAppChatURL = (phoneNumber: string): string | null => {
  const formattedNumber = formatWhatsAppNumber(phoneNumber);
  if (!formattedNumber) return null;
  return `https://wa.me/${formattedNumber}`;
};

