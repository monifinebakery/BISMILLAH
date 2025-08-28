import React, { useRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SwipeableToastProps {
  children: React.ReactNode;
  onDismiss: () => void;
  className?: string;
  swipeThreshold?: number;
  autoHideDelay?: number;
}

export const SwipeableToast: React.FC<SwipeableToastProps> = ({
  children,
  onDismiss,
  className = '',
  swipeThreshold = 100,
  autoHideDelay = 5000
}) => {
  const toastRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startTime, setStartTime] = useState(0);

  // Auto dismiss timer
  useEffect(() => {
    if (autoHideDelay > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [onDismiss, autoHideDelay]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartTime(Date.now());
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const currentX = touch.clientX;
    const distance = currentX - startX;

    // Only allow right swipe (positive distance)
    if (distance > 0) {
      setDragDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    const duration = Date.now() - startTime;
    const velocity = Math.abs(dragDistance) / duration;

    // Dismiss if swiped far enough or fast enough
    if (dragDistance > swipeThreshold || velocity > 0.5) {
      // Animate out
      if (toastRef.current) {
        toastRef.current.style.transform = `translateX(100%)`;
        toastRef.current.style.opacity = '0';
        setTimeout(() => {
          onDismiss();
        }, 200);
      }
    } else {
      // Snap back
      setDragDistance(0);
    }

    setIsDragging(false);
  };

  // Mouse events for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setStartTime(Date.now());
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const currentX = e.clientX;
    const distance = currentX - startX;

    if (distance > 0) {
      setDragDistance(distance);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    const duration = Date.now() - startTime;
    const velocity = Math.abs(dragDistance) / duration;

    if (dragDistance > swipeThreshold || velocity > 0.5) {
      if (toastRef.current) {
        toastRef.current.style.transform = `translateX(100%)`;
        toastRef.current.style.opacity = '0';
        setTimeout(() => {
          onDismiss();
        }, 200);
      }
    } else {
      setDragDistance(0);
    }

    setIsDragging(false);
  };

  // Prevent mouse events when dragging ends outside the element
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        setDragDistance(0);
      };

      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const currentX = e.clientX;
        const distance = currentX - startX;

        if (distance > 0) {
          setDragDistance(distance);
        }
      };

      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);

      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('mousemove', handleGlobalMouseMove);
      };
    }
  }, [isDragging, startX]);

  const opacity = Math.max(0, 1 - (dragDistance / (swipeThreshold * 2)));
  const scale = Math.max(0.95, 1 - (dragDistance / (swipeThreshold * 4)));

  return (
    <div
      ref={toastRef}
      className={`relative select-none cursor-pointer transition-all duration-200 ${className}`}
      style={{
        transform: `translateX(${dragDistance}px) scale(${scale})`,
        opacity: isDragging ? opacity : 1,
        touchAction: 'pan-y', // Allow vertical scrolling but prevent horizontal
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Dismiss indicator */}
      {isDragging && dragDistance > 20 && (
        <div 
          className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full mr-4 text-gray-400 transition-opacity"
          style={{ opacity: Math.min(1, dragDistance / swipeThreshold) }}
        >
          <div className="flex items-center gap-1 text-sm">
            <span>Swipe</span>
            <X className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors z-10"
        aria-label="Close notification"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>

      {children}
    </div>
  );
};

export default SwipeableToast;
