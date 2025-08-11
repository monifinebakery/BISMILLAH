// src/components/invoice/utils/invoiceExport.ts
export const exportToHTML = (invoiceNumber: string, elementId: string = 'invoice-content'): void => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Elemen invoice tidak ditemukan');
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .invoice-header { border-bottom: 2px solid #ddd; padding-bottom: 20px; margin-bottom: 20px; }
        .customer-info { margin-bottom: 20px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f5f5f5; }
        .totals { float: right; width: 300px; }
        .grand-total { background-color: #f0f8ff; padding: 10px; font-weight: bold; font-size: 18px; }
        @media print { 
          body { margin: 0; } 
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      ${element.innerHTML}
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice_${invoiceNumber.replace(/\//g, '-')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (elementId: string = 'invoice-content'): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Elemen invoice tidak ditemukan');
  }

  const textContent = element.innerText;
  await navigator.clipboard.writeText(textContent);
};

export const printInvoice = (): void => {
  window.print();
};