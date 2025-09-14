// src/components/invoice/utils/invoiceExport.ts
// Utilitas untuk mengunduh invoice sebagai gambar tanpa dialog print

import { safeDom } from '@/utils/browserApiSafeWrappers';

// Alternative modern implementation for better browser compatibility
async function modernDomToImage(element: HTMLElement): Promise<string> {
  const rect = element.getBoundingClientRect();
  const scale = window.devicePixelRatio || 2;
  
  const canvas = safeDom.createElement('canvas');
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');
  
  ctx.scale(scale, scale);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, rect.width, rect.height);
  
  // Create a more comprehensive SVG with proper styling
  const cloned = cloneWithStyles(element);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}" viewBox="0 0 ${rect.width} ${rect.height}">
      <defs>
        <style type="text/css"><![CDATA[
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          body, html {
            margin: 0;
            padding: 0;
            background: white;
          }
          /* Hide form inputs and show static text during export */
          .export-mode input,
          .export-mode select,
          .export-mode button {
            display: none !important;
          }
          .export-mode .export-text {
            display: block !important;
          }
        ]]></style>
      </defs>
      <rect width="100%" height="100%" fill="white"/>
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="background: white; color: black; font-family: system-ui, -apple-system, sans-serif;">
          ${new XMLSerializer().serializeToString(cloned)}
        </div>
      </foreignObject>
    </svg>
  `;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    img.onerror = () => reject(new Error('Failed to create image from SVG'));
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  });
}

/**
 * Mengkloning node beserta seluruh gaya komputasi ke elemen baru
 */
function cloneWithStyles(node: HTMLElement): HTMLElement {
  const clone = node.cloneNode(false) as HTMLElement;
  const style = window.getComputedStyle(node);
  
  // Apply all computed styles to preserve appearance
  clone.setAttribute('style', style.cssText);
  
  // Explicitly set important properties that might be lost
  if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
    clone.style.backgroundColor = style.backgroundColor;
  }
  if (style.color) {
    clone.style.color = style.color;
  }
  if (style.fontFamily) {
    clone.style.fontFamily = style.fontFamily;
  }
  if (style.fontSize) {
    clone.style.fontSize = style.fontSize;
  }
  
  // Recursively clone child nodes
  Array.from(node.childNodes).forEach((child) => {
    if (child instanceof HTMLElement) {
      clone.appendChild(cloneWithStyles(child));
    } else if (child instanceof Text) {
      // Preserve text nodes
      clone.appendChild(child.cloneNode(true));
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
  const element = safeDom.getElementById('invoice-content');
  if (!element) {
    throw new Error('Elemen invoice tidak ditemukan');
  }

  try {
    // Add export mode class to hide form inputs and show static content
    element.classList.add('export-mode');
    
    // Wait for style changes to apply
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    let dataUrl: string;
    
    // Try modern implementation first
    try {
      dataUrl = await modernDomToImage(element);
    } catch (modernError) {
      console.warn('Modern implementation failed, falling back to original:', modernError);
      
      // Fallback to original implementation with improvements
      const cloned = cloneWithStyles(element);
      cloned.style.backgroundColor = 'white';
      cloned.style.color = 'black';
      
      const width = element.offsetWidth;
      const height = element.offsetHeight;

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <defs>
            <style>
              .invoice-content { background-color: white !important; color: black !important; }
              * { box-sizing: border-box; }
              .export-mode input, .export-mode select, .export-mode button { display: none !important; }
              .export-mode .export-text { display: block !important; }
            </style>
          </defs>
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="background-color: white; padding: 0; margin: 0;">
              ${new XMLSerializer().serializeToString(cloned)}
            </div>
          </foreignObject>
        </svg>
      `;

      const img = new Image();
      const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(new Error('Gagal memuat gambar'));
        img.src = src;
      });

      const canvas = safeDom.createElement('canvas');
      const scale = window.devicePixelRatio || 2;
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Gagal membuat konteks canvas');
      }
      
      ctx.scale(scale, scale);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);

      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const quality = format === 'jpg' ? 0.95 : undefined;
      dataUrl = canvas.toDataURL(mime, quality);
    }

    // Create download link
    const link = safeDom.createElement('a');
    link.href = dataUrl;
    link.download = `invoice-${new Date().toISOString().split('T')[0]}.${format}`;
    safeDom.safeAppendChild(document.body, link);
    link.click();
    // Safe cleanup (single, idempotent)
    safeDom.safeRemoveElement(link);
  } catch (error) {
    console.error('Error downloading invoice image:', error);
    throw new Error('Gagal mengunduh gambar invoice: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    // Remove export mode class
    element.classList.remove('export-mode');
  }
};
