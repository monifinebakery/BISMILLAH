// AutoUpdateDemo.tsx - Testing component for auto-update system
// ==============================================

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Github, Server, Clock, Hash, Package } from 'lucide-react';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';
import { updateService } from '@/services/updateService';
import { toast } from 'sonner';

export const AutoUpdateDemo: React.FC = () => {
  const autoUpdate = useAutoUpdate({
    checkInterval: 1, // Check every 1 minute for demo
    enableInDev: true, // Enable in development for testing
    showNotifications: true,
    onUpdateDetected: (result) => {
      toast.success('🎉 Update detected!', { 
        description: `New version ${result.latestVersion?.version} is available!` 
      });
    }
  });

  const currentVersion = autoUpdate.getCurrentVersion();
  const buildInfo = autoUpdate.getBuildInfo();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {/* Current Version Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Current Version Info
          </CardTitle>
          <CardDescription>
            Information about the current app build
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Version:</span>
            <Badge variant="outline">{currentVersion.version}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Build ID:</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {currentVersion.buildId.slice(-8)}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Commit:</span>
            <Badge variant="outline" className="font-mono">
              <Hash className="h-3 w-3 mr-1" />
              {currentVersion.commitHash}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Environment:</span>
            <Badge variant={currentVersion.environment === 'production' ? 'default' : 'destructive'}>
              <Server className="h-3 w-3 mr-1" />
              {currentVersion.environment}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Build Time:</span>
            <span className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1 inline" />
              {new Date(currentVersion.buildTime).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Update Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className={`h-5 w-5 ${autoUpdate.isEnabled ? 'animate-spin' : ''}`} />
            Auto-Update Status
          </CardTitle>
          <CardDescription>
            Current status of the auto-update system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Update Checking:</span>
            <Badge variant={autoUpdate.isEnabled ? 'default' : 'secondary'}>
              {autoUpdate.isEnabled ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Currently Checking:</span>
            <Badge variant={autoUpdate.isChecking ? 'destructive' : 'outline'}>
              {autoUpdate.isChecking ? 'Yes' : 'No'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Update Available:</span>
            <Badge variant={autoUpdate.hasUpdate ? 'destructive' : 'default'}>
              {autoUpdate.hasUpdate ? 'Yes' : 'No'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Check:</span>
            <span className="text-xs text-muted-foreground">
              {autoUpdate.lastCheck 
                ? autoUpdate.lastCheck.toLocaleTimeString()
                : 'Never'
              }
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Development Mode:</span>
            <Badge variant={autoUpdate.isDevelopment ? 'secondary' : 'default'}>
              {autoUpdate.isDevelopment ? 'Yes' : 'No'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Manual Controls */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Manual Controls & Testing
          </CardTitle>
          <CardDescription>
            Manually test the auto-update functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={autoUpdate.checkForUpdatesNow}
              disabled={autoUpdate.isChecking}
            >
              {autoUpdate.isChecking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check for Updates Now
                </>
              )}
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (autoUpdate.isEnabled) {
                  autoUpdate.stopUpdateChecking();
                  toast.info('Auto-update checking stopped');
                } else {
                  autoUpdate.startUpdateChecking();
                  toast.info('Auto-update checking started');
                }
              }}
            >
              {autoUpdate.isEnabled ? 'Stop Checking' : 'Start Checking'}
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Simulate update notification
                autoUpdate.showUpdateNotification({
                  newVersion: '2024.09.16.13',
                  currentVersion: currentVersion.version,
                  commitHash: 'abc12345',
                  updateAvailable: true
                });
                toast.success('Demo update notification shown!');
              }}
            >
              Show Demo Banner
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                autoUpdate.dismissUpdateNotification();
                toast.info('Update notification dismissed');
              }}
            >
              Dismiss Banner
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const info = updateService.getBuildInfo();
                navigator.clipboard.writeText(info);
                toast.success('Build info copied to clipboard!');
              }}
            >
              Copy Build Info
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="text-sm font-mono">
              <div className="text-xs text-muted-foreground mb-1">Full Build Info:</div>
              {buildInfo}
            </div>
          </div>

          {/* Update Result Debug */}
          {autoUpdate.updateResult && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <div className="text-xs text-muted-foreground mb-2">Latest Update Check Result:</div>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(autoUpdate.updateResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoUpdateDemo;