// src/components/invoice/utils/invoiceExport.ts
// Utilitas sederhana untuk mengunduh invoice sebagai PDF melalui dialog print

export const downloadInvoicePdf = (): void => {
  window.print();
};
