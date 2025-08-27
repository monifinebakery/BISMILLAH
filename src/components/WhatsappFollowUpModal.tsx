import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Define the props interface for the component
interface WhatsappFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    nomorPesanan: string;
    namaPelanggan: string;
    status: string;
    teleponPelanggan: string | null;
    [key: string]: any;
  } | null;
  getWhatsappTemplateByStatus: (status: string, orderData: any) => string;
}

const WhatsappFollowUpModal: React.FC<WhatsappFollowUpModalProps> = ({
  isOpen,
  onClose,
  order,
  getWhatsappTemplateByStatus
}) => {
  const [message, setMessage] = useState('');

  // Effect to set the initial message template when the modal is opened or the order changes
  useEffect(() => {
    if (order && isOpen) {
      const template = getWhatsappTemplateByStatus(order.status, order);
      setMessage(template);
    }
  }, [order, isOpen, getWhatsappTemplateByStatus]);

  // --- STEP 1 & 2: Process and memoize the phone number ---
  // useMemo ensures this logic only runs when `order.teleponPelanggan` changes.
  const processedPhoneNumber = useMemo(() => {
    // Return empty string if there's no order or phone number
    if (!order?.teleponPelanggan) {
      return '';
    }

    // Start with a clean string, removing all whitespace
    let number = (order.teleponPelanggan ?? '').replace(/\s+/g, '');

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
  }, [order?.teleponPelanggan]); // Dependency array ensures this only re-runs when the phone number changes

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

      // Construct the WhatsApp URL
      const whatsappUrl = `https://wa.me/${processedPhoneNumber}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');

      toast.success('WhatsApp follow-up initiated');

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
          {/* Order Details Section */}
          <div className="space-y-1 border-b pb-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">Nomor Pesanan:</span>
              <span className="text-gray-800 font-mono">{order.nomorPesanan}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">Pelanggan:</span>
              <span className="text-gray-800">{order.namaPelanggan}</span>
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
              className="min-h-[150px] w-full rounded-md border-gray-500 focus:ring-green-500 focus:border-green-500"
              placeholder="Masukkan pesan WhatsApp..."
            />
            <p className="text-xs text-gray-500">
              Anda dapat mengedit pesan ini sebelum mengirim.
            </p>
          </div>

          </div>
          
          <DialogFooter className="dialog-footer-pad pt-4">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              onClick={handleSendWhatsapp}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!processedPhoneNumber || message.trim() === ''}
            >
              Follow-up Sekarang
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsappFollowUpModal;
