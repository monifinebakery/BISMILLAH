// src/components/invoice/api/queryKeys.ts
export const invoiceQueryKeys = {
  all: ['invoice'] as const,
  orders: () => [...invoiceQueryKeys.all, 'orders'] as const,
  order: (orderId: string) => [...invoiceQueryKeys.orders(), orderId] as const,
  templates: () => [...invoiceQueryKeys.all, 'templates'] as const,
  template: (templateId: string) => [...invoiceQueryKeys.templates(), templateId] as const,
} as const;