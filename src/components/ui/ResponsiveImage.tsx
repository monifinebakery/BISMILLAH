// src/components/ui/ResponsiveImage.tsx - Responsive Image Component with Advanced Optimization
import React, { useState, useRef, useEffect } from 'react';
import { useImageOptimization, useImagePerformanceMonitor } from '@/hooks/useImageOptimization';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty' | string;
  blurDataURL?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  sizes,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  quality = 75,
  onLoad,
  onError,
  objectFit = 'cover',
  objectPosition = 'center',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const { getOptimizedImageUrl, browserSupport, getResponsiveSizes } = useImageOptimization({
    compressionQuality: quality / 100,
  });
  
  const { trackImageLoad } = useImagePerformanceMonitor();

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || (width ? getResponsiveSizes(width) : '100vw');

  // Generate srcSet for different screen densities and sizes
  const generateSrcSet = () => {
    if (!width) return undefined;
    
    const densities = [1, 1.5, 2, 3];
    const breakpoints = [320, 640, 768, 1024, 1280, 1536];
    
    const srcSetEntries: string[] = [];
    
    // Add density-based variants
    densities.forEach(density => {
      const scaledWidth = Math.round(width * density);
      const optimizedUrl = getOptimizedImageUrl(src, { 
        width: scaledWidth, 
        height: height ? Math.round(height * density) : undefined,
        quality: quality / 100 
      });
      srcSetEntries.push(`${optimizedUrl} ${density}x`);
    });
    
    // Add width-based variants for responsive design
    breakpoints.forEach(breakpoint => {
      if (breakpoint <= (width || 1920)) {
        const optimizedUrl = getOptimizedImageUrl(src, { 
          width: breakpoint, 
          quality: quality / 100 
        });
        srcSetEntries.push(`${optimizedUrl} ${breakpoint}w`);
      }
    });
    
    return srcSetEntries.join(', ');
  };

  // Default blur placeholder
  const defaultBlurDataURL = blurDataURL || 
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+';

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setLoadStartTime(performance.now());
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  // Start timing for priority images
  useEffect(() => {
    if (priority) {
      setLoadStartTime(performance.now());
    }
  }, [priority]);

  const handleLoad = () => {
    const loadTime = performance.now() - loadStartTime;
    setIsLoaded(true);
    trackImageLoad(loadTime, true);
    onLoad?.();
  };

  const handleError = () => {
    const loadTime = performance.now() - loadStartTime;
    setHasError(true);
    trackImageLoad(loadTime, false);
    onError?.();
  };

  const containerStyle = {
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
  };

  const imageStyle = {
    objectFit,
    objectPosition,
  };

  return (
    <div 
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-gray-100',
        className
      )}
      style={containerStyle}
    >
      {/* Blur Placeholder */}
      {placeholder === 'blur' && !isLoaded && !hasError && (
        <img
          src={defaultBlurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
          style={imageStyle}
          aria-hidden="true"
        />
      )}

      {/* Empty Placeholder */}
      {placeholder === 'empty' && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Custom Placeholder */}
      {typeof placeholder === 'string' && placeholder !== 'blur' && placeholder !== 'empty' && !isLoaded && !hasError && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={imageStyle}
          aria-hidden="true"
        />
      )}

      {/* Main Image */}
      {isInView && (
        <picture>
          {/* AVIF format for modern browsers */}
          {browserSupport.avif && (
            <source 
              srcSet={generateSrcSet()?.replace(/\.(jpg|jpeg|png|webp)/gi, '.avif')} 
              sizes={responsiveSizes}
              type="image/avif" 
            />
          )}
          
          {/* WebP format for most browsers */}
          {browserSupport.webp && (
            <source 
              srcSet={generateSrcSet()?.replace(/\.(jpg|jpeg|png)/gi, '.webp')} 
              sizes={responsiveSizes}
              type="image/webp" 
            />
          )}
          
          {/* Fallback to original format */}
          <img
            src={getOptimizedImageUrl(src, { width, height, quality: quality / 100 })}
            srcSet={generateSrcSet()}
            sizes={responsiveSizes}
            alt={alt}
            className={cn(
              'w-full h-full transition-opacity duration-500 ease-out',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            style={imageStyle}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
          />
        </picture>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <div className="text-center p-4">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">Gagal memuat gambar</p>
            <p className="text-xs text-gray-400 mt-1">Periksa koneksi internet Anda</p>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {!isLoaded && !hasError && isInView && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            <p className="text-xs text-gray-500">Memuat gambar...</p>
          </div>
        </div>
      )}

      {/* Progressive Enhancement: Show image format being used */}
      {process.env.NODE_ENV === 'development' && isLoaded && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {browserSupport.avif ? 'AVIF' : browserSupport.webp ? 'WebP' : 'Original'}
        </div>
      )}
    </div>
  );
};

export default ResponsiveImage;

// Higher-order component for image optimization
export const withImageOptimization = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => {
    const { preloadImages } = useImageOptimization();
    
    // Preload critical images on component mount
    useEffect(() => {
      // You can customize this logic based on your needs
      const criticalImages: string[] = [];
      if (criticalImages.length > 0) {
        preloadImages(criticalImages);
      }
    }, [preloadImages]);
    
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `withImageOptimization(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Image gallery component with optimized loading
export const ImageGallery: React.FC<{
  images: Array<{ src: string; alt: string; width?: number; height?: number }>;
  className?: string;
  itemClassName?: string;
}> = ({ images, className, itemClassName }) => {
  const { preloadImages } = useImageOptimization();
  
  // Preload first few images
  useEffect(() => {
    const firstThreeImages = images.slice(0, 3).map(img => img.src);
    preloadImages(firstThreeImages);
  }, [images, preloadImages]);
  
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {images.map((image, index) => (
        <ResponsiveImage
          key={`${image.src}-${index}`}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          priority={index < 3} // Prioritize first 3 images
          className={cn('rounded-lg', itemClassName)}
        />
      ))}
    </div>
  );
};