// src/utils/browserApiSafeWrappers.ts
// Prevents "Illegal invocation" errors by properly binding browser API methods

/**
 * Safe wrapper for performance API methods
 * Prevents "Illegal invocation" errors when methods are called without proper context
 */
export const safePerformance = {
  now: () => performance.now.call(performance),
  mark: (name: string) => performance.mark.call(performance, name),
  measure: (name: string, startMark?: string, endMark?: string) => 
    performance.measure.call(performance, name, startMark, endMark),
  getEntriesByType: (type: string) => performance.getEntriesByType.call(performance, type),
  getEntriesByName: (name: string) => performance.getEntriesByName.call(performance, name),
  clearMarks: (name?: string) => performance.clearMarks.call(performance, name),
  clearMeasures: (name?: string) => performance.clearMeasures.call(performance, name),
};

/**
 * Safe wrapper for console methods (already implemented in logger but here for completeness)
 * Prevents context loss when methods are destructured or passed as callbacks
 */
export const safeConsole = {
  log: (...args: any[]) => console.log.call(console, ...args),
  debug: (...args: any[]) => console.debug.call(console, ...args),
  warn: (...args: any[]) => console.warn.call(console, ...args),
  error: (...args: any[]) => console.error.call(console, ...args),
  info: (...args: any[]) => console.info.call(console, ...args),
  trace: (...args: any[]) => console.trace.call(console, ...args),
  table: (data?: any) => console.table.call(console, data),
  group: (label?: string) => console.group.call(console, label),
  groupEnd: () => console.groupEnd.call(console),
  time: (label?: string) => console.time.call(console, label),
  timeEnd: (label?: string) => console.timeEnd.call(console, label),
  count: (label?: string) => console.count.call(console, label),
  clear: () => console.clear.call(console),
};

/**
 * Safe wrapper for setTimeout/setInterval
 * Although these typically don't have context issues, binding ensures consistency
 */
export const safeTimers = {
  setTimeout: (callback: () => void, delay?: number) => 
    setTimeout.call(window, callback, delay),
  setInterval: (callback: () => void, delay?: number) => 
    setInterval.call(window, callback, delay),
  clearTimeout: (timeoutId: number) => clearTimeout.call(window, timeoutId),
  clearInterval: (intervalId: number) => clearInterval.call(window, intervalId),
  requestAnimationFrame: (callback: FrameRequestCallback) => 
    requestAnimationFrame.call(window, callback),
  cancelAnimationFrame: (handle: number) => 
    cancelAnimationFrame.call(window, handle),
};

/**
 * Safe wrapper for DOM methods that commonly cause illegal invocation errors
 */
export const safeDom = {
  getElementById: (id: string) => document.getElementById.call(document, id),
  querySelector: (selector: string) => document.querySelector.call(document, selector),
  querySelectorAll: (selector: string) => document.querySelectorAll.call(document, selector),
  createElement: <K extends keyof HTMLElementTagNameMap>(tagName: K) => document.createElement.call(document, tagName) as HTMLElementTagNameMap[K],
  createTextNode: (text: string) => document.createTextNode.call(document, text),
  addEventListener: (element: EventTarget, type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) => 
    element.addEventListener.call(element, type, listener, options),
  removeEventListener: (element: EventTarget, type: string, listener: EventListener, options?: boolean | EventListenerOptions) => 
    element.removeEventListener.call(element, type, listener, options),
  
  /**
   * Safe element removal that prevents removeChild errors
   * Handles cases where element might not be connected to DOM
   */
  safeRemoveElement: (element: Element | HTMLElement | null) => {
    if (!element) return false;
    
    try {
      // Method 1: Use modern remove() if available
      if (typeof element.remove === 'function') {
        element.remove();
        return true;
      }
      
      // Method 2: Check if element is still connected to DOM
      if (element.parentNode && element.parentNode.contains(element)) {
        element.parentNode.removeChild(element);
        return true;
      }
      
      // Method 3: Fallback for edge cases
      if (element.parentElement) {
        element.parentElement.removeChild(element);
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Safe element removal failed:', error);
      return false;
    }
  },
  
  /**
   * Safe appendChild that checks if element exists and is valid
   */
  safeAppendChild: (parent: Element | HTMLElement, child: Element | HTMLElement) => {
    try {
      if (parent && child && typeof parent.appendChild === 'function') {
        parent.appendChild(child);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Safe appendChild failed:', error);
      return false;
    }
  }
};

/**
 * Safe wrapper for navigator methods
 */
export const safeNavigator = {
  getUserMedia: (constraints: MediaStreamConstraints) => 
    navigator.mediaDevices.getUserMedia.call(navigator.mediaDevices, constraints),
  clipboard: {
    writeText: (text: string) => navigator.clipboard.writeText.call(navigator.clipboard, text),
    readText: () => navigator.clipboard.readText.call(navigator.clipboard),
  },
  share: (data: ShareData) => navigator.share?.call(navigator, data),
  vibrate: (pattern: number | number[]) => {
    if (navigator.vibrate) {
      return Array.isArray(pattern) 
        ? navigator.vibrate.call(navigator, pattern)
        : navigator.vibrate.call(navigator, [pattern]);
    }
    return false;
  },
};

/**
 * Safe wrapper for window methods
 */
export const safeWindow = {
  open: (url?: string, target?: string, features?: string) => 
    window.open.call(window, url, target, features),
  close: () => window.close.call(window),
  focus: () => window.focus.call(window),
  blur: () => window.blur.call(window),
  scrollTo: (x: number, y: number) => window.scrollTo.call(window, x, y),
  scroll: (x: number, y: number) => window.scroll.call(window, x, y),
  getComputedStyle: (element: Element, pseudoElt?: string) => 
    window.getComputedStyle.call(window, element, pseudoElt),
  getSelection: () => window.getSelection?.call(window),
};

/**
 * Safe wrapper for local/session storage
 */
export const safeStorage = {
  localStorage: {
    getItem: (key: string) => localStorage.getItem.call(localStorage, key),
    setItem: (key: string, value: string) => localStorage.setItem.call(localStorage, key, value),
    removeItem: (key: string) => localStorage.removeItem.call(localStorage, key),
    clear: () => localStorage.clear.call(localStorage),
    key: (index: number) => localStorage.key.call(localStorage, index),
    get length() { return localStorage.length; },
  },
  sessionStorage: {
    getItem: (key: string) => sessionStorage.getItem.call(sessionStorage, key),
    setItem: (key: string, value: string) => sessionStorage.setItem.call(sessionStorage, key, value),
    removeItem: (key: string) => sessionStorage.removeItem.call(sessionStorage, key),
    clear: () => sessionStorage.clear.call(sessionStorage),
    key: (index: number) => sessionStorage.key.call(sessionStorage, index),
    get length() { return sessionStorage.length; },
  },
};

/**
 * Utility function to bind any method to its proper context
 * Use this for any browser API method that might be destructured or passed as a callback
 */
export function bindMethod<T extends object, K extends keyof T>(
  obj: T, 
  methodName: K
): T[K] {
  const method = obj[methodName];
  if (typeof method === 'function') {
    return method.bind(obj) as T[K];
  }
  return method;
}

/**
 * Utility to safely destructure methods from an object
 * Example: const { log, error } = safeDestructure(console, ['log', 'error']);
 */
export function safeDestructure<T extends object, K extends keyof T>(
  obj: T,
  methods: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const method of methods) {
    result[method] = bindMethod(obj, method);
  }
  return result;
}

// Export default safe wrappers for commonly problematic APIs
export default {
  performance: safePerformance,
  console: safeConsole,
  timers: safeTimers,
  dom: safeDom,
  navigator: safeNavigator,
  window: safeWindow,
  storage: safeStorage,
  bindMethod,
  safeDestructure,
};
