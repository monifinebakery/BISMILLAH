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
      if (!order.telefonPelanggan) return null;
      
      const statusToUse = specificStatus || order.status;
      const message = getMessage(order, statusToUse) ||
        `Halo ${order.namaPelanggan}, saya ingin menanyakan status pesanan #${order.nomorPesanan}`;
      
      const cleanPhone = order.telefonPelanggan.replace(/\D/g, '');
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
