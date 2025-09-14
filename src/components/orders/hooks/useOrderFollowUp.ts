import { useCallback } from 'react';
import { useFollowUpTemplate, useProcessTemplate } from '@/contexts/FollowUpTemplateContext';
import type { Order } from '../types';

/**
 * Hook untuk menghasilkan pesan follow up dan URL WhatsApp
 * berdasarkan status pesanan dengan dukungan template yang lebih baik.
 */
export const useOrderFollowUp = () => {
  const { getTemplate, getTemplateForCurrentStatus, getAvailableStatuses } = useFollowUpTemplate();
  const { processTemplate } = useProcessTemplate();

  // Get message for specific status
  const getMessage = useCallback(
    (order: Order, specificStatus?: string): string | null => {
      const statusToUse = specificStatus || order.status;
      const template = getTemplate(statusToUse);
      if (!template) return null;
      return processTemplate(template, order);
    },
    [getTemplate, processTemplate]
  );

  // Get template for current order status
  const getCurrentStatusTemplate = useCallback(
    (order: Order) => {
      return getTemplateForCurrentStatus(order.status);
    },
    [getTemplateForCurrentStatus]
  );

  // Get WhatsApp URL with optional specific status
  const getWhatsappUrl = useCallback(
    (order: Order, specificStatus?: string): string | null => {
      const phone = (order as any).telepon_pelanggan || (order as any).customer_phone || (order as any)['teleponPelanggan'] || (order as any)['telefonPelanggan'];
      if (!phone) return null;
      
      const statusToUse = specificStatus || order.status;
      const nomor = (order as any).nomor_pesanan || (order as any).order_number || (order as any)['nomorPesanan'];
      const nama = (order as any).nama_pelanggan || (order as any).customer_name || (order as any)['namaPelanggan'];
      const message = getMessage(order, statusToUse) ||
        `Halo ${nama}, saya ingin menanyakan status pesanan #${nomor}`;
      
      const cleanPhone = String(phone).replace(/\D/g, '');
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    },
    [getMessage]
  );

  // Check if template is available for given status
  const hasTemplateForStatus = useCallback(
    (status: string): boolean => {
      const template = getTemplate(status);
      return !!template && template.trim().length > 0;
    },
    [getTemplate]
  );

  // Get available statuses that have templates
  const getStatusesWithTemplates = useCallback(
    (): string[] => {
      return getAvailableStatuses().filter(status => hasTemplateForStatus(status));
    },
    [getAvailableStatuses, hasTemplateForStatus]
  );

  return { 
    getMessage, 
    getWhatsappUrl, 
    getCurrentStatusTemplate,
    hasTemplateForStatus,
    getStatusesWithTemplates
  };
};

export default useOrderFollowUp;
