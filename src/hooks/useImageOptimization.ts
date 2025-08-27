// src/hooks/useImageOptimization.ts - Image Optimization Hook
import { useState, useEffect, useCallback } from 'react';

interface ImageOptimizationConfig {
  enableWebP: boolean;
  enableAVIF: boolean;
  lazyLoading: boolean;
  compressionQuality: number;
  maxWidth: number;
  maxHeight: number;
}

interface BrowserSupport {
  webp: boolean;
  avif: boolean;
  lazyLoading: boolean;
}

const defaultConfig: ImageOptimizationConfig = {
  enableWebP: true,
  enableAVIF: true,
  lazyLoading: true,
  compressionQuality: 0.8,
  maxWidth: 1920,
  maxHeight: 1080,
};

export const useImageOptimization = (config: Partial<ImageOptimizationConfig> = {}) => {
  const [browserSupport, setBrowserSupport] = useState<BrowserSupport>({
    webp: false,
    avif: false,
    lazyLoading: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const finalConfig = { ...defaultConfig, ...config };

  // Detect browser support for modern image formats
  const detectBrowserSupport = useCallback(async () => {
    const support: BrowserSupport = {
      webp: false,
      avif: false,
      lazyLoading: 'loading' in HTMLImageElement.prototype,
    };

    // Test WebP support
    try {
      const webpTestImage = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
      const webpImg = new Image();
      support.webp = await new Promise((resolve) => {
        webpImg.onload = () => resolve(webpImg.width === 2);
        webpImg.onerror = () => resolve(false);
        webpImg.src = webpTestImage;
      });
    } catch {
      support.webp = false;
    }

    // Test AVIF support
    try {
      const avifTestImage = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
      const avifImg = new Image();
      support.avif = await new Promise((resolve) => {
        avifImg.onload = () => resolve(avifImg.width === 2);
        avifImg.onerror = () => resolve(false);
        avifImg.src = avifTestImage;
      });
    } catch {
      support.avif = false;
    }

    setBrowserSupport(support);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    detectBrowserSupport();
  }, [detectBrowserSupport]);

  // Generate optimized image URL based on browser support
  const getOptimizedImageUrl = useCallback((originalUrl: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  } = {}) => {
    if (!originalUrl || originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) {
      return originalUrl;
    }

    const {
      width = finalConfig.maxWidth,
      height = finalConfig.maxHeight,
      quality = finalConfig.compressionQuality,
      format = 'auto'
    } = options;

    // Determine best format based on browser support
    let targetFormat = format;
    if (format === 'auto') {
      if (finalConfig.enableAVIF && browserSupport.avif) {
        targetFormat = 'avif';
      } else if (finalConfig.enableWebP && browserSupport.webp) {
        targetFormat = 'webp';
      } else {
        targetFormat = 'jpeg';
      }
    }

    // For now, return original URL
    // In production, you would integrate with image optimization services
    // like Cloudinary, ImageKit, or your own image processing service
    return originalUrl;
  }, [browserSupport, finalConfig]);

  // Preload critical images
  const preloadImages = useCallback(async (urls: string[]) => {
    const preloadPromises = urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
        img.src = getOptimizedImageUrl(url);
      });
    });

    try {
      await Promise.allSettled(preloadPromises);
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  }, [getOptimizedImageUrl]);

  // Compress image file
  const compressImageFile = useCallback(async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        const maxWidth = finalConfig.maxWidth;
        const maxHeight = finalConfig.maxHeight;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        }, 'image/jpeg', finalConfig.compressionQuality);
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = URL.createObjectURL(file);
    });
  }, [finalConfig]);

  // Get image dimensions without loading the full image
  const getImageDimensions = useCallback((url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }, []);

  // Calculate responsive image sizes
  const getResponsiveSizes = useCallback((containerWidth: number) => {
    const breakpoints = [320, 640, 768, 1024, 1280, 1536];
    const sizes: string[] = [];

    breakpoints.forEach((breakpoint, index) => {
      if (containerWidth <= breakpoint) {
        sizes.push(`(max-width: ${breakpoint}px) ${containerWidth}px`);
      } else if (index === breakpoints.length - 1) {
        sizes.push(`${containerWidth}px`);
      }
    });

    return sizes.join(', ');
  }, []);

  return {
    browserSupport,
    isLoading,
    config: finalConfig,
    getOptimizedImageUrl,
    preloadImages,
    compressImageFile,
    getImageDimensions,
    getResponsiveSizes,
  };
};

// Utility function to create responsive image srcSet
export const createResponsiveSrcSet = (
  baseUrl: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1536]
): string => {
  return widths
    .map(width => `${baseUrl}?w=${width} ${width}w`)
    .join(', ');
};

// Utility to check if image format is supported
export const isImageFormatSupported = (format: string): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    return canvas.toDataURL(`image/${format}`).indexOf(`data:image/${format}`) === 0;
  } catch {
    return false;
  }
};

// Performance monitoring for images
export const useImagePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    averageLoadTime: 0,
    totalLoadTime: 0,
  });

  const trackImageLoad = useCallback((loadTime: number, success: boolean) => {
    setMetrics(prev => ({
      totalImages: prev.totalImages + 1,
      loadedImages: success ? prev.loadedImages + 1 : prev.loadedImages,
      failedImages: success ? prev.failedImages : prev.failedImages + 1,
      totalLoadTime: prev.totalLoadTime + loadTime,
      averageLoadTime: (prev.totalLoadTime + loadTime) / (prev.totalImages + 1),
    }));
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics({
      totalImages: 0,
      loadedImages: 0,
      failedImages: 0,
      averageLoadTime: 0,
      totalLoadTime: 0,
    });
  }, []);

  return {
    metrics,
    trackImageLoad,
    resetMetrics,
  };
};