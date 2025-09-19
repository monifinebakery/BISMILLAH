// src/utils/auth/navigationLogger.ts - Navigation Logger untuk Monitor Auth Flow
import { logger } from '@/utils/logger';

interface NavigationEvent {
  from: string;
  to: string;
  reason: string;
  timestamp: number;
  source: 'AuthGuard' | 'AuthLifecycle' | 'Navigate' | 'Unknown';
  userId?: string;
  userEmail?: string;
}

class AuthNavigationLogger {
  private events: NavigationEvent[] = [];
  private readonly MAX_EVENTS = 20;

  logNavigation(event: Omit<NavigationEvent, 'timestamp'>) {
    const navigationEvent: NavigationEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.events.unshift(navigationEvent);
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(0, this.MAX_EVENTS);
    }

    // Log to console and logger
    const logMessage = `🧭 Navigation: ${event.from} → ${event.to} (${event.reason}) [${event.source}]`;
    console.log(logMessage, { userId: event.userId, userEmail: event.userEmail });
    logger.debug(logMessage, navigationEvent);
  }

  detectRedirectLoop(): { hasLoop: boolean; details?: string } {
    if (this.events.length < 3) return { hasLoop: false };

    const recent = this.events.slice(0, 5);
    const paths = recent.map(e => `${e.from}→${e.to}`);
    
    // Check for immediate back-and-forth
    for (let i = 0; i < paths.length - 2; i++) {
      const current = paths[i];
      const next = paths[i + 1];
      const afterNext = paths[i + 2];
      
      if (current === afterNext && current !== next) {
        const timeDiff = recent[i].timestamp - recent[i + 2].timestamp;
        if (timeDiff < 2000) { // Within 2 seconds
          return {
            hasLoop: true,
            details: `Redirect loop detected: ${current} ↔ ${next} within ${timeDiff}ms`
          };
        }
      }
    }

    // Check for same destination multiple times
    const sameDest = recent.filter(e => e.to === recent[0].to);
    if (sameDest.length >= 3) {
      const timeSpan = recent[0].timestamp - sameDest[2].timestamp;
      if (timeSpan < 3000) { // Within 3 seconds
        return {
          hasLoop: true,
          details: `Multiple navigations to ${recent[0].to} within ${timeSpan}ms`
        };
      }
    }

    return { hasLoop: false };
  }

  getRecentEvents(count: number = 10): NavigationEvent[] {
    return this.events.slice(0, count);
  }

  clearEvents() {
    this.events = [];
    console.log('🧭 Navigation history cleared');
  }

  // For debugging in development
  dumpNavigationHistory() {
    if (!import.meta.env.DEV) return;
    
    console.group('🧭 Navigation History');
    console.table(this.events.map(event => ({
      Time: new Date(event.timestamp).toLocaleTimeString(),
      From: event.from,
      To: event.to,
      Reason: event.reason,
      Source: event.source,
      User: event.userEmail || 'none'
    })));
    console.groupEnd();
  }
}

// Singleton instance
export const authNavigationLogger = new AuthNavigationLogger();

// Development debug helper
if (import.meta.env.DEV) {
  // @ts-expect-error - Development debugging tool
  window.__DEBUG_AUTH_NAVIGATION__ = {
    logger: authNavigationLogger,
    dumpHistory: () => authNavigationLogger.dumpNavigationHistory(),
    clearHistory: () => authNavigationLogger.clearEvents(),
    checkLoop: () => authNavigationLogger.detectRedirectLoop()
  };
}