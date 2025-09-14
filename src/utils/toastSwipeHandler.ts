// Toast swipe gesture handler
import { safeDom } from '@/utils/browserApiSafeWrappers';

let isSwipeListenerAdded = false;

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  isDragging: boolean;
  element: HTMLElement;
}

const swipeThreshold = 100; // pixels
const velocityThreshold = 0.5; // pixels per ms

export const initToastSwipeHandlers = () => {
  if (isSwipeListenerAdded) return;

  let swipeState: SwipeState | null = null;

  const handleTouchStart = (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    const toastElement = target.closest('[data-sonner-toast]') as HTMLElement;
    
    if (!toastElement) return;

    const touch = e.touches[0];
    swipeState = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      currentX: touch.clientX,
      isDragging: false,
      element: toastElement
    };

    toastElement.style.transition = 'none';
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!swipeState) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const deltaY = Math.abs(touch.clientY - swipeState.startY);

    // Only handle horizontal swipes (not vertical scrolling)
    if (!swipeState.isDragging && deltaY > Math.abs(deltaX)) {
      swipeState = null;
      return;
    }

    // Start dragging if moved horizontally enough
    if (!swipeState.isDragging && Math.abs(deltaX) > 10) {
      swipeState.isDragging = true;
      e.preventDefault();
    }

    if (swipeState.isDragging && deltaX > 0) {
      swipeState.currentX = touch.clientX;
      const distance = deltaX;
      
      // Apply transform and opacity
      const opacity = Math.max(0.3, 1 - (distance / (swipeThreshold * 2)));
      const scale = Math.max(0.9, 1 - (distance / (swipeThreshold * 4)));
      
      swipeState.element.style.transform = `translateX(${distance}px) scale(${scale})`;
      swipeState.element.style.opacity = opacity.toString();

      // Show swipe indicator
      showSwipeIndicator(swipeState.element, distance);
    }
  };

  const handleTouchEnd = () => {
    if (!swipeState) return;

    const deltaX = swipeState.currentX - swipeState.startX;
    const duration = Date.now() - swipeState.startTime;
    const velocity = Math.abs(deltaX) / duration;

    // Reset transition
    swipeState.element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';

    // Dismiss if swiped far enough or fast enough
    if (deltaX > swipeThreshold || velocity > velocityThreshold) {
      dismissToast(swipeState.element);
    } else {
      // Snap back
      swipeState.element.style.transform = 'translateX(0) scale(1)';
      swipeState.element.style.opacity = '1';
      hideSwipeIndicator(swipeState.element);
    }

    swipeState = null;
  };

  // Mouse events for desktop
  const handleMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const toastElement = target.closest('[data-sonner-toast]') as HTMLElement;
    
    if (!toastElement) return;

    swipeState = {
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      currentX: e.clientX,
      isDragging: false,
      element: toastElement
    };

    toastElement.style.transition = 'none';
    toastElement.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!swipeState) return;

    const deltaX = e.clientX - swipeState.startX;
    const deltaY = Math.abs(e.clientY - swipeState.startY);

    if (!swipeState.isDragging && deltaY > Math.abs(deltaX)) {
      swipeState = null;
      return;
    }

    if (!swipeState.isDragging && Math.abs(deltaX) > 5) {
      swipeState.isDragging = true;
    }

    if (swipeState.isDragging && deltaX > 0) {
      swipeState.currentX = e.clientX;
      const distance = deltaX;
      
      const opacity = Math.max(0.3, 1 - (distance / (swipeThreshold * 2)));
      const scale = Math.max(0.9, 1 - (distance / (swipeThreshold * 4)));
      
      swipeState.element.style.transform = `translateX(${distance}px) scale(${scale})`;
      swipeState.element.style.opacity = opacity.toString();

      showSwipeIndicator(swipeState.element, distance);
    }
  };

  const handleMouseUp = () => {
    if (!swipeState) return;

    const deltaX = swipeState.currentX - swipeState.startX;
    const duration = Date.now() - swipeState.startTime;
    const velocity = Math.abs(deltaX) / duration;

    swipeState.element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    swipeState.element.style.cursor = 'grab';

    if (deltaX > swipeThreshold || velocity > velocityThreshold) {
      dismissToast(swipeState.element);
    } else {
      swipeState.element.style.transform = 'translateX(0) scale(1)';
      swipeState.element.style.opacity = '1';
      hideSwipeIndicator(swipeState.element);
    }

    swipeState = null;
  };

  // Add event listeners with safe DOM methods
  safeDom.addEventListener(document, 'touchstart', handleTouchStart as EventListener, { passive: true });
  safeDom.addEventListener(document, 'touchmove', handleTouchMove as EventListener, { passive: false });
  safeDom.addEventListener(document, 'touchend', handleTouchEnd as EventListener, { passive: true });
  safeDom.addEventListener(document, 'mousedown', handleMouseDown as EventListener, undefined);
  safeDom.addEventListener(document, 'mousemove', handleMouseMove as EventListener, undefined);
  safeDom.addEventListener(document, 'mouseup', handleMouseUp as EventListener, undefined);

  // Cleanup mouse events on mouse leave
  safeDom.addEventListener(document, 'mouseleave', () => {
    if (swipeState) {
      swipeState.element.style.transform = 'translateX(0) scale(1)';
      swipeState.element.style.opacity = '1';
      swipeState.element.style.cursor = 'grab';
      hideSwipeIndicator(swipeState.element);
      swipeState = null;
    }
  }, undefined);

  isSwipeListenerAdded = true;
};

const showSwipeIndicator = (element: HTMLElement, distance: number) => {
  let indicator = element.querySelector('.toast-swipe-indicator') as HTMLElement;
  
  if (!indicator) {
    indicator = safeDom.createElement('div') as HTMLElement;
    indicator.className = 'toast-swipe-indicator';
    indicator.innerHTML = `
      <span style="font-size: 12px;">Swipe</span>
      <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    `;
    element.appendChild(indicator);
  }

  const opacity = Math.min(1, distance / swipeThreshold);
  indicator.style.opacity = opacity.toString();
};

const hideSwipeIndicator = (element: HTMLElement) => {
  const indicator = element.querySelector('.toast-swipe-indicator');
  if (indicator) {
    safeDom.removeElement(indicator);
  }
};

const dismissToast = (element: HTMLElement) => {
  // Animate out
  element.style.transform = 'translateX(100%) scale(0.8)';
  element.style.opacity = '0';
  
  // Find and click the close button, or remove after animation
  setTimeout(() => {
    const closeButton = element.querySelector('[data-close-button]') as HTMLElement;
    if (closeButton) {
      closeButton.click();
    } else {
      safeDom.removeElement(element);
    }
  }, 300);
};

// Initialize on DOM ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToastSwipeHandlers);
  } else {
    initToastSwipeHandlers();
  }
}
