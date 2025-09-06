// src/utils/preload-optimizer.ts
// Optimizes preloading of Cloudflare Turnstile resources to prevent unused preload warnings

import { logger } from './logger';

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
    this.checkInterval = window.setInterval(() => {
      this.cleanupUnusedPreloads();
    }, 10000); // Check every 10 seconds
  }

  private startUsageMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor script loading
    const originalAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function(newChild: any) {
      if (newChild.tagName === 'SCRIPT' && newChild.src) {
        this.markResourceAsUsed(newChild.src);
      }
      return originalAppendChild.call(this, newChild);
    }.bind(this);

    // Monitor CSS loading
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName: string) {
      const element = originalCreateElement.call(this, tagName);
      if (tagName.toLowerCase() === 'link') {
        const linkElement = element as HTMLLinkElement;
        const originalSetAttribute = linkElement.setAttribute;
        linkElement.setAttribute = function(name: string, value: string) {
          if (name === 'href' && (this.rel === 'stylesheet' || this.as === 'style')) {
            this.markResourceAsUsed(value);
          }
          return originalSetAttribute.call(this, name, value);
        }.bind(this);
      }
      return element;
    }.bind(this);
  }

  public preloadTurnstileResources() {
    if (typeof window === 'undefined') return;

    const resources: PreloadResource[] = [
      {
        href: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
        as: 'script',
        crossorigin: 'anonymous'
      },
      {
        href: 'https://challenges.cloudflare.com/cdn-cgi/challenge-platform/',
        as: 'fetch',
        crossorigin: 'anonymous'
      }
    ];

    resources.forEach(resource => {
      this.preloadResource(resource);
    });
  }

  private preloadResource(resource: PreloadResource) {
    if (this.preloadedResources.has(resource.href)) {
      return; // Already preloaded
    }

    const link = document.createElement('link');
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

    // Add onload handler to mark as used
    link.onload = () => {
      this.markResourceAsUsed(resource.href);
      logger.debug('Preloaded resource loaded:', resource.href);
    };

    link.onerror = () => {
      logger.warn('Failed to preload resource:', resource.href);
      this.preloadedResources.delete(resource.href);
    };

    document.head.appendChild(link);
    logger.debug('Preloading resource:', resource.href);
  }

  private markResourceAsUsed(url: string) {
    this.usedResources.add(url);
    logger.debug('Resource marked as used:', url);
  }

  private cleanupUnusedPreloads() {
    const preloadLinks = document.querySelectorAll('link[rel="preload"]');
    
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

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      // Delay preloading on mobile to prioritize critical resources
      setTimeout(() => {
        this.preloadTurnstileResources();
      }, 1000);
    } else {
      this.preloadTurnstileResources();
    }
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Create singleton instance
export const preloadOptimizer = new PreloadOptimizer();

// Auto-optimize on module load
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      preloadOptimizer.optimizeForMobile();
    });
  } else {
    preloadOptimizer.optimizeForMobile();
  }
}

export default preloadOptimizer;
