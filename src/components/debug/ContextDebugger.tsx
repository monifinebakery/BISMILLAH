// src/components/debug/ContextDebugger.tsx - Debug All Contexts

import React, { useEffect, useState } from 'react';
import { logger } from '@/utils/logger';

// Import all contexts
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useFinancial } from '@/components/financial/contexts/FinancialContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useNotification } from '@/contexts/NotificationContext';

interface ContextStatus {
  name: string;
  status: 'loading' | 'ready' | 'error' | 'missing';
  details: any;
  loadTime?: number;
}

export const ContextDebugger: React.FC = () => {
  const [startTime] = useState(Date.now());
  const [contexts, setContexts] = useState<ContextStatus[]>([]);

  // Test all contexts
  useEffect(() => {
    const checkContexts = async () => {
      const results: ContextStatus[] = [];

      // 1. Auth Context
      try {
        const authContext = useAuth();
        results.push({
          name: 'AuthContext',
          status: authContext ? 'ready' : 'loading',
          details: {
            exists: !!authContext,
            user: authContext?.user?.id || 'no_user',
            email: authContext?.user?.email || 'no_email',
            loading: authContext?.isLoading,
            type: typeof authContext
          },
          loadTime: Date.now() - startTime
        });
      } catch (error) {
        results.push({
          name: 'AuthContext',
          status: 'error',
          details: { error: error instanceof Error ? error.message : String(error) },
          loadTime: Date.now() - startTime
        });
      }

      // 2. Activity Context
      try {
        const activityContext = useActivity();
        results.push({
          name: 'ActivityContext',
          status: activityContext ? 'ready' : 'loading',
          details: {
            exists: !!activityContext,
            hasAddActivity: !!activityContext?.addActivity,
            addActivityType: typeof activityContext?.addActivity,
            contextType: typeof activityContext
          },
          loadTime: Date.now() - startTime
        });
      } catch (error) {
        results.push({
          name: 'ActivityContext',
          status: 'error',
          details: { error: error instanceof Error ? error.message : String(error) },
          loadTime: Date.now() - startTime
        });
      }

      // 3. Financial Context (with defensive handling)
      try {
        let financialContext = null;
        try {
          financialContext = useFinancial();
        } catch (hookError) {
          // If useFinancial hook fails, it means provider is not available
          results.push({
            name: 'FinancialContext',
            status: 'error',
            details: { 
              error: hookError instanceof Error ? hookError.message : String(hookError),
              reason: 'Hook execution failed - provider likely not available'
            },
            loadTime: Date.now() - startTime
          });
          financialContext = null; // Continue with next context
        }
        
        if (financialContext !== null) {
          results.push({
            name: 'FinancialContext',
            status: financialContext ? 'ready' : 'loading',
            details: {
              exists: !!financialContext,
              hasAddTransaction: !!financialContext?.addFinancialTransaction,
              addTransactionType: typeof financialContext?.addFinancialTransaction,
              contextType: typeof financialContext
            },
            loadTime: Date.now() - startTime
          });
        }
      } catch (error) {
        results.push({
          name: 'FinancialContext',
          status: 'error',
          details: { error: error instanceof Error ? error.message : String(error) },
          loadTime: Date.now() - startTime
        });
      }

      // 4. User Settings Context
      try {
        const settingsContext = useUserSettings();
        results.push({
          name: 'UserSettingsContext',
          status: settingsContext ? 'ready' : 'loading',
          details: {
            exists: !!settingsContext,
            hasSettings: !!settingsContext?.settings,
            settingsType: typeof settingsContext?.settings,
            contextType: typeof settingsContext
          },
          loadTime: Date.now() - startTime
        });
      } catch (error) {
        results.push({
          name: 'UserSettingsContext',
          status: 'error',
          details: { error: error instanceof Error ? error.message : String(error) },
          loadTime: Date.now() - startTime
        });
      }

      // 5. Notification Context
      try {
        const notificationContext = useNotification();
        results.push({
          name: 'NotificationContext',
          status: notificationContext ? 'ready' : 'loading',
          details: {
            exists: !!notificationContext,
            hasAddNotification: !!notificationContext?.addNotification,
            addNotificationType: typeof notificationContext?.addNotification,
            contextType: typeof notificationContext
          },
          loadTime: Date.now() - startTime
        });
      } catch (error) {
        results.push({
          name: 'NotificationContext',
          status: 'error',
          details: { error: error instanceof Error ? error.message : String(error) },
          loadTime: Date.now() - startTime
        });
      }

      setContexts(results);

      // Log results
      logger.debug('ContextDebugger: Context check results:', results);
      
      // Log summary
      const ready = results.filter(c => c.status === 'ready').length;
      const total = results.length;
      const errors = results.filter(c => c.status === 'error');
      const loading = results.filter(c => c.status === 'loading');

      logger.context('ContextDebugger', `Context Status: ${ready}/${total} ready`, {
        ready: results.filter(c => c.status === 'ready').map(c => c.name),
        loading: loading.map(c => c.name),
        errors: errors.map(c => ({ name: c.name, error: c.details.error })),
        totalLoadTime: Date.now() - startTime
      });

      // Individual context logging
      results.forEach(context => {
        const emoji = context.status === 'ready' ? '✅' : 
                     context.status === 'error' ? '❌' : 
                     context.status === 'loading' ? '⏳' : '❓';
        
        logger.context('ContextDebugger', `${emoji} ${context.name}`, {
          status: context.status,
          loadTime: `${context.loadTime}ms`,
          details: context.details
        });
      });
    };

    checkContexts();

    // Re-check every 2 seconds if any are still loading
    const interval = setInterval(() => {
      const hasLoading = contexts.some(c => c.status === 'loading');
      if (hasLoading) {
        checkContexts();
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [startTime]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'loading': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return '✅';
      case 'error': return '❌';
      case 'loading': return '⏳';
      default: return '❓';
    }
  };

  const readyCount = contexts.filter(c => c.status === 'ready').length;
  const totalTime = Date.now() - startTime;

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg p-4 max-w-md z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Context Debugger</h3>
        <span className="text-sm text-gray-500">{Math.round(totalTime / 1000)}s</span>
      </div>
      
      <div className="mb-3">
        <div className="text-sm text-gray-600">
          Status: {readyCount}/{contexts.length} ready
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(readyCount / Math.max(contexts.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {contexts.map((context, index) => (
          <div key={index} className={`p-2 rounded text-xs ${getStatusColor(context.status)}`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {getStatusIcon(context.status)} {context.name}
              </span>
              <span>{context.loadTime}ms</span>
            </div>
            
            {context.status === 'error' && (
              <div className="mt-1 text-red-700 text-xs">
                Error: {context.details.error}
              </div>
            )}
            
            {context.status === 'loading' && (
              <div className="mt-1 text-yellow-700 text-xs">
                Still loading...
              </div>
            )}
            
            {context.status === 'ready' && (
              <div className="mt-1 text-green-700 text-xs">
                ✓ Ready - {JSON.stringify(context.details, null, 0).slice(0, 50)}...
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-orange-500 text-white text-xs px-3 py-2 rounded hover:bg-orange-600"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};

export default ContextDebugger;