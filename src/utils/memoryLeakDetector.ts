// src/utils/memoryLeakDetector.ts
import React from 'react';
import { logger } from '@/utils/logger';

interface ComponentMemoryInfo {
  componentName: string;
  mountTime: number;
  unmountTime?: number;
  memoryAtMount?: number | null;
  memoryAtUnmount?: number | null;
  isLeaked: boolean;
}

interface MemoryLeakDetectorOptions {
  enabled?: boolean;
  maxComponentLifetime?: number; // in milliseconds
  memoryThreshold?: number; // in bytes
  reportInterval?: number; // in milliseconds
}

class MemoryLeakDetector {
  private components: Map<string, ComponentMemoryInfo> = new Map();
  private options: Required<MemoryLeakDetectorOptions>;
  private reportTimer: NodeJS.Timeout | null = null;

  constructor(options: MemoryLeakDetectorOptions = {}) {
    this.options = {
      enabled: options.enabled ?? (process.env.NODE_ENV === 'development'),
      maxComponentLifetime: options.maxComponentLifetime ?? 300000, // 5 minutes
      memoryThreshold: options.memoryThreshold ?? 10 * 1024 * 1024, // 10MB
      reportInterval: options.reportInterval ?? 60000 // 1 minute
    };

    if (this.options.enabled) {
      this.startReporting();
    }
  }

  // Register component mount
  registerMount(componentName: string, instanceId?: string): string {
    if (!this.options.enabled) return '';

    const id = instanceId || `${componentName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const memoryAtMount = this.getCurrentMemoryUsage();

    const componentInfo: ComponentMemoryInfo = {
      componentName,
      mountTime: Date.now(),
      memoryAtMount,
      isLeaked: false
    };

    this.components.set(id, componentInfo);

    logger.debug(`Component mounted: ${componentName}`, {
      id,
      memoryAtMount: this.formatBytes(memoryAtMount || 0)
    });

    return id;
  }

  // Register component unmount
  registerUnmount(id: string): void {
    if (!this.options.enabled || !id) return;

    const componentInfo = this.components.get(id);
    if (!componentInfo) {
      logger.warn(`Component not found for unmount: ${id}`);
      return;
    }

    const memoryAtUnmount = this.getCurrentMemoryUsage();
    const lifetime = Date.now() - componentInfo.mountTime;

    componentInfo.unmountTime = Date.now();
    componentInfo.memoryAtUnmount = memoryAtUnmount;

    // Check for potential memory leak
    const memoryDiff = (memoryAtUnmount || 0) - (componentInfo.memoryAtMount || 0);
    const isLongLived = lifetime > this.options.maxComponentLifetime;
    const hasMemoryGrowth = memoryDiff > this.options.memoryThreshold;

    if (isLongLived || hasMemoryGrowth) {
      componentInfo.isLeaked = true;
      this.reportPotentialLeak(componentInfo, memoryDiff, lifetime);
    }

    logger.debug(`Component unmounted: ${componentInfo.componentName}`, {
      id,
      lifetime: `${lifetime}ms`,
      memoryDiff: this.formatBytes(memoryDiff),
      memoryAtUnmount: this.formatBytes(memoryAtUnmount || 0)
    });

    // Remove from tracking after a delay to allow for analysis
    setTimeout(() => {
      this.components.delete(id);
    }, 5000);
  }

  // Get current memory usage
  private getCurrentMemoryUsage(): number | null {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      return (window.performance as any).memory.usedJSHeapSize;
    }
    return null;
  }

  // Format bytes to human readable
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Report potential memory leak
  private reportPotentialLeak(componentInfo: ComponentMemoryInfo, memoryDiff: number, lifetime: number): void {
    logger.warn('Potential memory leak detected', {
      component: componentInfo.componentName,
      lifetime: `${lifetime}ms`,
      memoryGrowth: this.formatBytes(memoryDiff),
      memoryAtMount: this.formatBytes(componentInfo.memoryAtMount || 0),
      memoryAtUnmount: this.formatBytes(componentInfo.memoryAtUnmount || 0)
    });

    // In development, you might want to show a console warning
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `🚨 Potential memory leak in ${componentInfo.componentName}:\n` +
        `   Lifetime: ${lifetime}ms\n` +
        `   Memory growth: ${this.formatBytes(memoryDiff)}\n` +
        `   Consider checking for:\n` +
        `   - Unremoved event listeners\n` +
        `   - Uncanceled timers/intervals\n` +
        `   - Uncanceled network requests\n` +
        `   - Circular references\n` +
        `   - Large objects in closures`
      );
    }
  }

  // Start periodic reporting
  private startReporting(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }

    this.reportTimer = setInterval(() => {
      this.generateReport();
    }, this.options.reportInterval);
  }

  // Generate memory report
  private generateReport(): void {
    const activeComponents = Array.from(this.components.values()).filter(c => !c.unmountTime);
    const leakedComponents = Array.from(this.components.values()).filter(c => c.isLeaked);
    const currentMemory = this.getCurrentMemoryUsage();

    if (activeComponents.length > 0 || leakedComponents.length > 0) {
      logger.info('Memory leak detector report', {
        activeComponents: activeComponents.length,
        leakedComponents: leakedComponents.length,
        currentMemory: currentMemory ? this.formatBytes(currentMemory) : 'N/A',
        componentBreakdown: this.getComponentBreakdown(activeComponents)
      });
    }

    // Check for components that have been mounted too long
    const now = Date.now();
    activeComponents.forEach(component => {
      const lifetime = now - component.mountTime;
      if (lifetime > this.options.maxComponentLifetime) {
        logger.warn(`Long-lived component detected: ${component.componentName}`, {
          lifetime: `${lifetime}ms`,
          maxLifetime: `${this.options.maxComponentLifetime}ms`
        });
      }
    });
  }

  // Get component breakdown
  private getComponentBreakdown(components: ComponentMemoryInfo[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    components.forEach(component => {
      breakdown[component.componentName] = (breakdown[component.componentName] || 0) + 1;
    });
    return breakdown;
  }

  // Get statistics
  getStatistics() {
    const allComponents = Array.from(this.components.values());
    const activeComponents = allComponents.filter(c => !c.unmountTime);
    const leakedComponents = allComponents.filter(c => c.isLeaked);
    const currentMemory = this.getCurrentMemoryUsage();

    return {
      totalTracked: allComponents.length,
      activeComponents: activeComponents.length,
      leakedComponents: leakedComponents.length,
      currentMemory: currentMemory ? this.formatBytes(currentMemory) : 'N/A',
      componentBreakdown: this.getComponentBreakdown(activeComponents),
      leakBreakdown: this.getComponentBreakdown(leakedComponents)
    };
  }

  // Clear all tracking data
  clear(): void {
    this.components.clear();
    logger.info('Memory leak detector cleared');
  }

  // Stop the detector
  stop(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }
    this.clear();
    logger.info('Memory leak detector stopped');
  }

  // Enable/disable the detector
  setEnabled(enabled: boolean): void {
    this.options.enabled = enabled;
    if (enabled) {
      this.startReporting();
    } else {
      this.stop();
    }
  }
}

// Global instance
const memoryLeakDetector = new MemoryLeakDetector();

// React hook for automatic component tracking
export const useMemoryLeakDetection = (componentName: string) => {
  const [componentId] = React.useState(() => 
    memoryLeakDetector.registerMount(componentName)
  );

  React.useEffect(() => {
    return () => {
      memoryLeakDetector.registerUnmount(componentId);
    };
  }, [componentId]);

  return componentId;
};

// Export the detector instance and types
export { memoryLeakDetector };
export type { ComponentMemoryInfo, MemoryLeakDetectorOptions };

// Utility functions
export const getMemoryStatistics = () => memoryLeakDetector.getStatistics();
export const clearMemoryTracking = () => memoryLeakDetector.clear();
export const stopMemoryDetection = () => memoryLeakDetector.stop();
export const setMemoryDetectionEnabled = (enabled: boolean) => memoryLeakDetector.setEnabled(enabled);