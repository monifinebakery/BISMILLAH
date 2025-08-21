import { useCallback } from 'react';
import { useFollowUpTemplate, useProcessTemplate } from '@/contexts/FollowUpTemplateContext';
import type { Order } from '../types';

/**
 * Hook untuk menghasilkan pesan follow up dan URL WhatsApp
 * berdasarkan status pesanan.
 */
export const useOrderFollowUp = () => {
  const { getTemplate } = useFollowUpTemplate();
  const { processTemplate } = useProcessTemplate();

  const getMessage = useCallback(
    (order: Order): string | null => {
      const template = getTemplate(order.status);
      if (!template) return null;
      return processTemplate(template, order);
    },
    [getTemplate, processTemplate]
  );

  const getWhatsappUrl = useCallback(
    (order: Order): string | null => {
      if (!order.teleponPelanggan) return null;
      const message =
        getMessage(order) ||
        `Halo ${order.namaPelanggan}, saya ingin menanyakan status pesanan #${order.nomorPesanan}`;
      const cleanPhone = order.teleponPelanggan.replace(/\D/g, '');
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    },
    [getMessage]
  );

  return { getMessage, getWhatsappUrl };
};

export default useOrderFollowUp;
