// src/components/invoice/utils/invoiceExport.ts
// Utilitas untuk mengunduh invoice sebagai gambar tanpa dialog print

/**
 * Mengkloning node beserta seluruh gaya komputasi ke elemen baru
 */
function cloneWithStyles(node: HTMLElement): HTMLElement {
  const clone = node.cloneNode(false) as HTMLElement;
  const style = window.getComputedStyle(node);
  clone.setAttribute('style', style.cssText);
  Array.from(node.childNodes).forEach((child) => {
    if (child instanceof HTMLElement) {
      clone.appendChild(cloneWithStyles(child));
    }
  });
  return clone;
}

/**
 * Mengunduh elemen dengan id `invoice-content` sebagai gambar PNG atau JPEG
 */
export const downloadInvoiceImage = async (
  format: 'png' | 'jpg' = 'png'
): Promise<void> => {
  const element = document.getElementById('invoice-content');
  if (!element) {
    throw new Error('Elemen invoice tidak ditemukan');
  }

  const cloned = cloneWithStyles(element);
  const width = element.offsetWidth;
  const height = element.offsetHeight;

  const svg = `\n    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n      <foreignObject width="100%" height="100%">${
        new XMLSerializer().serializeToString(cloned)
      }</foreignObject>\n    </svg>\n  `;

  const img = new Image();
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
    img.src = src;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Gagal membuat konteks canvas');
  }
  ctx.drawImage(img, 0, 0);

  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mime);

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `invoice.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

