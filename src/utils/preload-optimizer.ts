// src/utils/preload-optimizer.ts
// Optimizes preloading of Cloudflare Turnstile resources to prevent unused preload warnings

import { logger } from './logger';
import { safeDom, safeWindow, safeTimers } from './browserApiSafeWrappers';

interface PreloadResource {
  href: string;
  as: string;
  crossorigin?: string;
  integrity?: string;
}

class PreloadOptimizer {
  private preloadedResources = new Set<string>();
  private usedResources = new Set<string>();
  private checkInterval: number | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Monitor resource usage
    this.startUsageMonitoring();
    
    // Clean up unused preloads periodically
    this.checkInterval = safeTimers.setInterval(() => {
      this.cleanupUnusedPreloads();
    }, 10000); // Check every 10 seconds
  }

  private startUsageMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor script loading - using safe context binding
    const self = this;
    const originalAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function(newChild: any) {
      if (newChild.tagName === 'SCRIPT' && newChild.src) {
        self.markResourceAsUsed(newChild.src);
      }
      return originalAppendChild.call(this, newChild);
    };

    // Monitor CSS loading - using safe context binding
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = function(tagName: string) {
      const element = originalCreateElement(tagName);
      if (tagName.toLowerCase() === 'link') {
        const linkElement = element as HTMLLinkElement;
        const originalSetAttribute = linkElement.setAttribute.bind(linkElement);
        linkElement.setAttribute = function(name: string, value: string) {
          if (name === 'href' && (this.rel === 'stylesheet' || this.as === 'style')) {
            self.markResourceAsUsed(value);
          }
          return originalSetAttribute(name, value);
        };
      }
      return element;
    };
  }

  public preloadTurnstileResources() {
    if (typeof window === 'undefined') return;

    // Only preload if we actually need Turnstile (check for turnstile containers)
    const turnstileElements = document.querySelectorAll('[data-sitekey], .cf-turnstile, .turnstile');
    if (turnstileElements.length === 0) {
      logger.debug('No Turnstile elements found, skipping preload');
      return;
    }

    const resources: PreloadResource[] = [
      {
        href: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
        as: 'script',
        crossorigin: 'anonymous'
      }
      // Only preload actual Turnstile script, not challenge platform URLs
    ];

    resources.forEach(resource => {
      this.preloadResource(resource);
    });
  }

  private preloadResource(resource: PreloadResource) {
    if (this.preloadedResources.has(resource.href)) {
      return; // Already preloaded
    }

    // Validate resource URL before preloading
    if (!this.isValidResourceUrl(resource.href)) {
      logger.warn('Skipping invalid resource URL:', resource.href);
      return;
    }

    const link = safeDom.createElement('link') as HTMLLinkElement;
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    
    if (resource.crossorigin) {
      link.crossOrigin = resource.crossorigin;
    }
    
    if (resource.integrity) {
      link.integrity = resource.integrity;
    }

    // Mark as preloaded immediately to avoid duplicates
    this.preloadedResources.add(resource.href);

    // Event handlers are now added above with safeDom.addEventListener

    safeDom.addEventListener(link, 'load', () => {
      this.markResourceAsUsed(resource.href);
      logger.debug('Preloaded resource loaded:', resource.href);
    });

    safeDom.addEventListener(link, 'error', () => {
      logger.warn('Failed to preload resource:', resource.href);
      this.preloadedResources.delete(resource.href);
    });

    document.head.appendChild(link);
    logger.debug('Preloading resource:', resource.href);
  }

  private markResourceAsUsed(url: string) {
    this.usedResources.add(url);
    logger.debug('Resource marked as used:', url);
  }

  private isValidResourceUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Skip known problematic URLs
      const problematicPaths = [
        '/cdn-cgi/challenge-platform/',
        '/cdn-cgi/challenge-platform',
        '/challenge-platform/',
        '/h/b/cmg/',  // Dynamic challenge platform paths
        '/cmg/',      // Challenge manager paths
      ];
      
      if (problematicPaths.some(path => urlObj.pathname.includes(path))) {
        logger.warn('Blocking problematic URL:', url);
        return false;
      }
      
      // Only allow known safe Turnstile resources
      const allowedPaths = [
        '/turnstile/v0/api.js',
        '/turnstile/v0/api.js?onload=',
      ];
      
      // If it's a Cloudflare URL, must be in allowed paths
      if (urlObj.hostname.includes('cloudflare.com')) {
        const isAllowed = allowedPaths.some(path => urlObj.pathname.includes(path));
        if (!isAllowed) {
          logger.warn('Blocking non-whitelisted Cloudflare URL:', url);
          return false;
        }
      }
      
      // Only allow HTTPS for external resources
      if (urlObj.protocol !== 'https:' && urlObj.hostname !== 'localhost' && urlObj.hostname !== '127.0.0.1') {
        return false;
      }
      
      return true;
    } catch (error) {
      logger.warn('Invalid URL format:', url, error);
      return false;
    }
  }

  private cleanupUnusedPreloads() {
    const preloadLinks = safeDom.querySelectorAll('link[rel="preload"]');
    
    preloadLinks.forEach(link => {
      const href = (link as HTMLLinkElement).href;
      if (this.preloadedResources.has(href) && !this.usedResources.has(href)) {
        const timeSincePreload = Date.now() - (link as any).preloadTime || 0;
        
        // Remove unused preloads after 30 seconds
        if (timeSincePreload > 30000) {
          logger.debug('Removing unused preload:', href);
          link.remove();
          this.preloadedResources.delete(href);
        }
      }
    });
  }

  public optimizeForMobile() {
    if (typeof window === 'undefined') return;

    // Temporarily disable preloading to eliminate console warnings
    // Only enable when Turnstile is actually implemented
    logger.debug('Turnstile preloading disabled to prevent unused preload warnings');
    
    /* 
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      // Delay preloading on mobile to prioritize critical resources
      safeTimers.setTimeout(() => {
        this.preloadTurnstileResources();
      }, 1000);
    } else {
      this.preloadTurnstileResources();
    }
    */
  }

  public destroy() {
    if (this.checkInterval) {
      safeTimers.clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Create singleton instance
export const preloadOptimizer = new PreloadOptimizer();

// Auto-optimize on module load - DISABLED to prevent unused preload warnings
// if (typeof window !== 'undefined') {
//   // Wait for DOM to be ready
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', () => {
//       preloadOptimizer.optimizeForMobile();
//     });
//   } else {
//     preloadOptimizer.optimizeForMobile();
//   }
//}

export default preloadOptimizer;
