// src/components/invoice/utils/invoicePDF.ts
// PDF generation utility for invoices using jsPDF and html2canvas

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { safeDom } from '@/utils/browserApiSafeWrappers';
import { logger } from '@/utils/logger';

// PDF generation options
interface PDFOptions {
  format?: 'a4' | 'a3' | 'letter';
  orientation?: 'portrait' | 'landscape';
  quality?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  filename?: string;
}

// Default PDF options
const DEFAULT_OPTIONS: PDFOptions = {
  format: 'a4',
  orientation: 'portrait',
  quality: 1.0,
  margin: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  filename: 'invoice.pdf'
};

/**
 * Generate PDF from HTML element ensuring single page output
 */
export const generateInvoicePDF = async (
  elementId: string = 'invoice-content',
  options: Partial<PDFOptions> = {}
): Promise<void> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    logger.context('InvoicePDF', 'Starting single-page PDF generation for element:', elementId);
    
    const element = safeDom.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }

    // Prepare element for PDF generation with single-page optimization
    await prepareElementForSinglePagePDF(element);
    
    // Generate high-quality canvas with optimized settings
    const canvas = await html2canvas(element, {
      scale: 2, // High DPI for better quality
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      removeContainer: false,
      logging: false,
      height: element.scrollHeight,
      width: element.scrollWidth,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        // Ensure proper styling in cloned document
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          // Apply single-page PDF-specific styles
          clonedElement.style.backgroundColor = 'white';
          clonedElement.style.color = 'black';
          clonedElement.style.minHeight = 'auto';
          clonedElement.style.maxHeight = 'none';
          clonedElement.style.overflow = 'visible';
          
          // Compact spacing for single page
          const allElements = clonedElement.querySelectorAll('*');
          allElements.forEach(el => {
            const htmlEl = el as HTMLElement;
            // Reduce excessive padding and margins
            const styles = window.getComputedStyle(htmlEl);
            if (parseInt(styles.paddingTop) > 16) htmlEl.style.paddingTop = '8px';
            if (parseInt(styles.paddingBottom) > 16) htmlEl.style.paddingBottom = '8px';
            if (parseInt(styles.marginTop) > 16) htmlEl.style.marginTop = '8px';
            if (parseInt(styles.marginBottom) > 16) htmlEl.style.marginBottom = '8px';
          });
          
          // Hide interactive elements
          const hideElements = clonedElement.querySelectorAll('button, input, select, textarea, .print\\:hidden');
          hideElements.forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });
          
          // Show print-friendly text
          const showElements = clonedElement.querySelectorAll('.pdf-text');
          showElements.forEach(el => {
            (el as HTMLElement).style.display = 'block';
          });
        }
      }
    });

    // Calculate PDF dimensions for single page fit
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    
    // A4 dimensions in mm
    const pdfWidth = opts.format === 'a4' ? 210 : 279;
    const pdfHeight = opts.format === 'a4' ? 297 : 216;
    
    // Calculate content dimensions with smaller margins for more space
    const margin = 10; // Smaller margins for single page
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = pdfHeight - (margin * 2);
    
    // Always scale to fit within single page - prioritize fitting everything
    let finalWidth = contentWidth;
    let finalHeight = contentWidth / ratio;
    
    // If content is too tall, scale down to fit height instead
    if (finalHeight > contentHeight) {
      finalHeight = contentHeight;
      finalWidth = contentHeight * ratio;
    }
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: opts.orientation,
      unit: 'mm',
      format: opts.format
    });
    
    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png', opts.quality);
    
    // Add image to PDF - always single page
    pdf.addImage(
      imgData,
      'PNG',
      margin,
      margin,
      finalWidth,
      finalHeight,
      undefined,
      'FAST'
    );
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = opts.filename || `invoice-${timestamp}.pdf`;
    
    // Download the PDF
    pdf.save(filename);
    
    logger.success('InvoicePDF', 'Single-page PDF generated successfully:', filename);
    
  } catch (error) {
    logger.error('InvoicePDF', 'Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    // Clean up element modifications
    await cleanupElementAfterPDF();
  }
};

/**
 * Prepare element for single-page PDF generation with compact styling
 */
const prepareElementForSinglePagePDF = async (element: HTMLElement): Promise<void> => {
  return new Promise(resolve => {
    // Add single-page PDF mode class
    element.classList.add('pdf-mode', 'single-page-pdf');
    
    // Apply single-page PDF-specific styles
    const style = safeDom.createElement('style');
    style.id = 'single-page-pdf-styles';
    style.textContent = `
      .single-page-pdf {
        background-color: white !important;
        color: black !important;
        font-family: 'Helvetica', 'Arial', sans-serif !important;
        line-height: 1.2 !important;
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        font-size: 12px !important;
        max-width: 100% !important;
        overflow: visible !important;
      }
      
      .single-page-pdf * {
        box-sizing: border-box !important;
      }
      
      /* Compact spacing for single page */
      .single-page-pdf .card,
      .single-page-pdf .bg-white {
        padding: 8px !important;
        margin: 4px 0 !important;
      }
      
      .single-page-pdf .p-4 {
        padding: 8px !important;
      }
      
      .single-page-pdf .p-6 {
        padding: 12px !important;
      }
      
      .single-page-pdf .space-y-4 > * + * {
        margin-top: 8px !important;
      }
      
      .single-page-pdf .space-y-6 > * + * {
        margin-top: 12px !important;
      }
      
      .single-page-pdf .mb-6 {
        margin-bottom: 12px !important;
      }
      
      .single-page-pdf .mb-4 {
        margin-bottom: 8px !important;
      }
      
      .single-page-pdf .mt-6 {
        margin-top: 12px !important;
      }
      
      .single-page-pdf .mt-4 {
        margin-top: 8px !important;
      }
      
      /* Compact text sizes */
      .single-page-pdf h1 {
        font-size: 18px !important;
        line-height: 1.2 !important;
        margin: 6px 0 !important;
      }
      
      .single-page-pdf h2 {
        font-size: 16px !important;
        line-height: 1.2 !important;
        margin: 4px 0 !important;
      }
      
      .single-page-pdf h3 {
        font-size: 14px !important;
        line-height: 1.2 !important;
        margin: 4px 0 !important;
      }
      
      .single-page-pdf .text-sm {
        font-size: 11px !important;
      }
      
      .single-page-pdf .text-xs {
        font-size: 10px !important;
      }
      
      /* Compact table styling */
      .single-page-pdf table {
        margin: 8px 0 !important;
      }
      
      .single-page-pdf th,
      .single-page-pdf td {
        padding: 4px 6px !important;
        font-size: 11px !important;
        line-height: 1.2 !important;
      }
      
      /* Color preservation */
      .single-page-pdf .bg-gradient-to-r,
      .single-page-pdf .bg-gradient-to-br,
      .single-page-pdf .bg-gradient-to-b {
        background: linear-gradient(135deg, #f97316 0%, #dc2626 100%) !important;
        color: white !important;
      }
      
      .single-page-pdf .text-white {
        color: white !important;
      }
      
      .single-page-pdf .text-gray-600 {
        color: #4b5563 !important;
      }
      
      .single-page-pdf .text-gray-500 {
        color: #6b7280 !important;
      }
      
      .single-page-pdf .border-gray-200 {
        border-color: #e5e7eb !important;
      }
      
      .single-page-pdf .bg-gray-50 {
        background-color: #f9fafb !important;
      }
      
      /* Hide interactive elements */
      .single-page-pdf button,
      .single-page-pdf input,
      .single-page-pdf select,
      .single-page-pdf textarea {
        display: none !important;
      }
      
      .single-page-pdf .pdf-text {
        display: block !important;
      }
      
      .pdf-text {
        display: none;
      }
      
      .single-page-pdf .print\\:hidden {
        display: none !important;
      }
      
      /* Ensure no page breaks */
      .single-page-pdf * {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    `;
    
    document.head.appendChild(style);
    
    // Wait for styles to apply
    requestAnimationFrame(() => {
      setTimeout(resolve, 150); // Slightly longer wait for complex styles
    });
  });
};

/**
 * Prepare element for PDF generation by applying PDF-specific styles
 */
const prepareElementForPDF = async (element: HTMLElement): Promise<void> => {
  return new Promise(resolve => {
    // Add PDF mode class
    element.classList.add('pdf-mode');
    
    // Apply PDF-specific styles
    const style = safeDom.createElement('style');
    style.id = 'pdf-generation-styles';
    style.textContent = `
      .pdf-mode {
        background-color: white !important;
        color: black !important;
        font-family: 'Helvetica', 'Arial', sans-serif !important;
        line-height: 1.4 !important;
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      .pdf-mode * {
        box-sizing: border-box !important;
      }
      
      .pdf-mode .bg-gradient-to-r,
      .pdf-mode .bg-gradient-to-br,
      .pdf-mode .bg-gradient-to-b {
        background: linear-gradient(135deg, #f97316 0%, #dc2626 100%) !important;
        color: white !important;
      }
      
      .pdf-mode .text-white {
        color: white !important;
      }
      
      .pdf-mode .text-gray-600 {
        color: #4b5563 !important;
      }
      
      .pdf-mode .text-gray-500 {
        color: #6b7280 !important;
      }
      
      .pdf-mode .border-gray-200 {
        border-color: #e5e7eb !important;
      }
      
      .pdf-mode .bg-gray-50 {
        background-color: #f9fafb !important;
      }
      
      .pdf-mode button,
      .pdf-mode input,
      .pdf-mode select,
      .pdf-mode textarea {
        display: none !important;
      }
      
      .pdf-mode .pdf-text {
        display: block !important;
      }
      
      .pdf-text {
        display: none;
      }
      
      .pdf-mode .print\\:hidden {
        display: none !important;
      }
    `;
    
    document.head.appendChild(style);
    
    // Wait for styles to apply
    requestAnimationFrame(() => {
      setTimeout(resolve, 100);
    });
  });
};

/**
 * Clean up after PDF generation
 */
const cleanupElementAfterPDF = async (): Promise<void> => {
  return new Promise(resolve => {
    // Remove PDF mode classes from all elements
    const pdfElements = document.querySelectorAll('.pdf-mode');
    pdfElements.forEach(el => {
      el.classList.remove('pdf-mode', 'single-page-pdf');
    });
    
    // Remove PDF styles
    const styleElement = document.getElementById('pdf-generation-styles');
    if (styleElement) {
      styleElement.remove();
    }
    
    // Remove single-page PDF styles
    const singlePageStyleElement = document.getElementById('single-page-pdf-styles');
    if (singlePageStyleElement) {
      singlePageStyleElement.remove();
    }
    
    requestAnimationFrame(resolve);
  });
};

/**
 * Advanced PDF generation with multiple pages support
 */
export const generateMultiPageInvoicePDF = async (
  elementId: string = 'invoice-content',
  options: Partial<PDFOptions> = {}
): Promise<void> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    logger.context('InvoicePDF', 'Starting multi-page PDF generation');
    
    const element = safeDom.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }

    await prepareElementForPDF(element);
    
    // Generate canvas with proper dimensions
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      height: element.scrollHeight,
      width: element.scrollWidth
    });

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // PDF dimensions
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    const margin = 20;
    
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = pdfHeight - (margin * 2);
    
    // Calculate how content fits on pages
    const ratio = imgWidth / imgHeight;
    const scaledWidth = contentWidth;
    const scaledHeight = scaledWidth / ratio;
    
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    
    if (scaledHeight <= contentHeight) {
      // Single page
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', margin, margin, scaledWidth, scaledHeight);
    } else {
      // Multiple pages needed
      const pages = Math.ceil(scaledHeight / contentHeight);
      const pageHeight = contentHeight;
      
      for (let i = 0; i < pages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        // Create a temporary canvas for this page
        const pageCanvas = safeDom.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        
        if (pageCtx) {
          pageCanvas.width = imgWidth;
          pageCanvas.height = (imgHeight / pages);
          
          // Draw portion of original canvas
          pageCtx.drawImage(
            canvas,
            0, (i * imgHeight / pages), // Source x, y
            imgWidth, (imgHeight / pages), // Source width, height
            0, 0, // Dest x, y
            imgWidth, (imgHeight / pages) // Dest width, height
          );
          
          const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
          pdf.addImage(pageImgData, 'PNG', margin, margin, scaledWidth, pageHeight);
        }
      }
    }
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = opts.filename || `invoice-${timestamp}.pdf`;
    
    pdf.save(filename);
    logger.success('InvoicePDF', 'Multi-page PDF generated successfully:', filename);
    
  } catch (error) {
    logger.error('InvoicePDF', 'Error generating multi-page PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await cleanupElementAfterPDF();
  }
};

/**
 * Optimized single-page PDF generation that ensures content fits in one page
 */
export const generateSinglePageInvoicePDF = async (
  elementId: string = 'invoice-content',
  options: Partial<PDFOptions> = {}
): Promise<void> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    logger.context('InvoicePDF', 'Starting optimized single-page PDF generation');
    
    const element = safeDom.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }

    // Store original styles
    const originalStyle = element.style.cssText;
    
    // Apply single-page optimization styles
    await prepareElementForSinglePagePDF(element);
    
    // Force compact layout
    element.style.transform = 'scale(0.85)';
    element.style.transformOrigin = 'top left';
    element.style.width = '117%'; // Compensate for scale
    
    // Generate canvas with single-page optimized settings
    const canvas = await html2canvas(element, {
      scale: 1.5, // Slightly lower scale for better fit
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      removeContainer: false,
      logging: false,
      height: element.scrollHeight * 0.85,
      width: element.scrollWidth,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          // Apply aggressive compression styles
          clonedElement.style.backgroundColor = 'white';
          clonedElement.style.color = 'black';
          clonedElement.style.fontSize = '11px';
          clonedElement.style.lineHeight = '1.2';
          clonedElement.style.letterSpacing = '-0.01em';
          
          // Compress all child elements
          const allElements = clonedElement.querySelectorAll('*');
          allElements.forEach(el => {
            const htmlEl = el as HTMLElement;
            const computedStyle = window.getComputedStyle(htmlEl);
            
            // Reduce padding and margins more aggressively
            if (parseInt(computedStyle.padding) > 8) {
              htmlEl.style.padding = '4px';
            }
            if (parseInt(computedStyle.margin) > 8) {
              htmlEl.style.margin = '2px 0';
            }
            
            // Compress font sizes
            const fontSize = parseInt(computedStyle.fontSize);
            if (fontSize > 12) {
              htmlEl.style.fontSize = Math.max(10, fontSize * 0.85) + 'px';
            }
          });
          
          // Hide all interactive elements
          const hideElements = clonedElement.querySelectorAll(
            'button, input, select, textarea, .print\\:hidden, .no-pdf'
          );
          hideElements.forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });
          
          // Show PDF-friendly text
          const showElements = clonedElement.querySelectorAll('.pdf-text, .print-only');
          showElements.forEach(el => {
            (el as HTMLElement).style.display = 'block';
          });
        }
      }
    });

    // Restore original styles
    element.style.cssText = originalStyle;

    // Calculate dimensions to ensure single page
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    
    // A4 dimensions with minimal margins for maximum space
    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 8; // Very small margins
    
    const maxContentWidth = pdfWidth - (margin * 2);
    const maxContentHeight = pdfHeight - (margin * 2);
    
    // Always fit to page - scale down if necessary
    let finalWidth = maxContentWidth;
    let finalHeight = maxContentWidth / ratio;
    
    // If still too tall, prioritize height and adjust width
    if (finalHeight > maxContentHeight) {
      finalHeight = maxContentHeight;
      finalWidth = maxContentHeight * ratio;
      
      // If width becomes too wide after height adjustment, scale everything down
      if (finalWidth > maxContentWidth) {
        const scaleDown = maxContentWidth / finalWidth;
        finalWidth = maxContentWidth;
        finalHeight = finalHeight * scaleDown;
      }
    }
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Convert to high-quality image
    const imgData = canvas.toDataURL('image/png', 0.95);
    
    // Center the image on the page
    const xOffset = (pdfWidth - finalWidth) / 2;
    const yOffset = (pdfHeight - finalHeight) / 2;
    
    // Add image ensuring it fits on single page
    pdf.addImage(
      imgData,
      'PNG',
      Math.max(margin, xOffset),
      Math.max(margin, yOffset),
      finalWidth,
      finalHeight,
      undefined,
      'FAST'
    );
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = opts.filename || `invoice-${timestamp}.pdf`;
    
    // Download
    pdf.save(filename);
    
    logger.success('InvoicePDF', 'Single-page PDF generated and scaled to fit:', filename);
    
  } catch (error) {
    logger.error('InvoicePDF', 'Error generating single-page PDF:', error);
    throw new Error(`Failed to generate single-page PDF: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await cleanupElementAfterPDF();
  }
};

/**
 * Quick PDF generation with preset optimizations for invoices
 * Now uses single-page optimization by default
 */
export const downloadInvoicePDF = async (
  filename?: string,
  elementId: string = 'invoice-content'
): Promise<void> => {
  const timestamp = new Date().toISOString().split('T')[0];
  const finalFilename = filename || `invoice-${timestamp}.pdf`;
  
  // Use single-page optimization by default
  return generateSinglePageInvoicePDF(elementId, {
    filename: finalFilename,
    quality: 0.95,
    format: 'a4',
    orientation: 'portrait'
  });
};
