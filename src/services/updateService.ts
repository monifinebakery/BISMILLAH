// updateService.ts - Auto-update detection service
// ==============================================

import { logger } from '@/utils/logger';

export interface VersionInfo {
  version: string;
  buildId: string;
  commitHash: string;
  buildTime: string;
  deploymentId?: string;
  environment: 'development' | 'production' | 'preview';
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: VersionInfo;
  latestVersion?: VersionInfo;
  updateType: 'major' | 'minor' | 'patch' | 'hotfix' | 'none';
  forceUpdate: boolean;
}

class UpdateService {
  private currentVersion: VersionInfo;
  private checkInterval: number = 5 * 60 * 1000; // 5 menit
  private isChecking = false;
  private intervalId: NodeJS.Timeout | null = null;
  
  // GitHub API endpoints
  private readonly GITHUB_API_BASE = 'https://api.github.com';
  private readonly REPO_OWNER = 'monifinebakery';
  private readonly REPO_NAME = 'BISMILLAH';
  private readonly BRANCH = 'main';
  
  // Feature flag: enable/disable polling Supabase Edge Function
  private readonly ENABLE_DEPLOYMENT_POLLING = Boolean(import.meta.env.VITE_ENABLE_DEPLOYMENT_POLLING);
  // Supabase Edge Function for deployment status (only when enabled)
  private readonly DEPLOYMENT_STATUS_ENDPOINT = (import.meta.env.VITE_SUPABASE_URL && this.ENABLE_DEPLOYMENT_POLLING)
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vercel-deployments`
    : undefined;

  constructor() {
    this.currentVersion = this.getCurrentVersion();
    logger.info('🔄 UpdateService initialized', { currentVersion: this.currentVersion });
  }

  // Get current app version info
  private getCurrentVersion(): VersionInfo {
    // Try to get build info from environment variables (set by Vercel)
    const buildId = import.meta.env.VITE_BUILD_ID || this.generateBuildId();
    const commitHash = import.meta.env.VITE_COMMIT_HASH || import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA || 'local';
    const buildTime = import.meta.env.VITE_BUILD_TIME || new Date().toISOString();
    const environment = import.meta.env.PROD ? 'production' : 'development';
    
    // Generate version from package.json or build time
    const version = this.generateVersionString();

    return {
      version,
      buildId,
      commitHash: commitHash.slice(0, 8), // Short hash
      buildTime,
      environment
    };
  }

  // Generate version string
  private generateVersionString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    
    return `${year}.${month}.${day}.${hour}`;
  }

  // Generate build ID if not available
  private generateBuildId(): string {
    return `build_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  // Check Vercel deployment status
  private async checkDeploymentStatus(commitSha: string): Promise<boolean> {
    try {
      // If polling disabled or no endpoint, assume deployment is ready (fallback)
      if (!this.ENABLE_DEPLOYMENT_POLLING || !this.DEPLOYMENT_STATUS_ENDPOINT) {
        logger.debug('🟡 Deployment status polling disabled, assuming deployment ready');
        return true;
      }

      const params = new URLSearchParams({
        commit: commitSha,
        limit: '1'
      });

      const response = await fetch(`${this.DEPLOYMENT_STATUS_ENDPOINT}?${params.toString()}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        logger.warn('⚠️ Failed to check Vercel deployment status, assuming ready');
        return true; // Fallback to true if can't check
      }

      const data = await response.json();
      const deployment = data.deployments?.[0];

      if (!deployment) {
        logger.debug('🟡 No deployment found for commit, assuming ready');
        return true;
      }

      const state = deployment.readyState ?? deployment.state;
      const isReady = state === 'READY';

      logger.info('🌐 Deployment status check:', {
        commitSha: commitSha.slice(0, 8),
        status: state,
        isReady,
        url: deployment.url
      });

      return isReady;
      
    } catch (error) {
      logger.warn('⚠️ Error checking deployment status, assuming ready:', error);
      return true; // Fallback to true on error
    }
  }

  // Check for updates from GitHub
  async checkForUpdates(): Promise<UpdateCheckResult> {
    if (this.isChecking) {
      logger.debug('🔄 Update check already in progress, skipping...');
      return this.noUpdateResult();
    }

    this.isChecking = true;
    
    try {
      logger.info('🔍 Checking for updates...');
      
      // Get latest commit from GitHub
      const latestCommit = await this.getLatestCommit();
      if (!latestCommit) {
        return this.noUpdateResult();
      }

      // Compare with current version
      const hasUpdate = this.compareVersions(this.currentVersion.commitHash, latestCommit.sha.slice(0, 8));
      
      if (hasUpdate) {
        // 🆕 NEW: Check if deployment is ready before showing update
        const isDeploymentReady = await this.checkDeploymentStatus(latestCommit.sha);
        
        if (!isDeploymentReady) {
          logger.info('🕑 Update found but deployment not ready yet, waiting...');
          return this.noUpdateResult();
        }
        
        const latestVersion: VersionInfo = {
          version: this.generateVersionString(),
          buildId: `build_${latestCommit.sha.slice(0, 8)}`,
          commitHash: latestCommit.sha.slice(0, 8),
          buildTime: latestCommit.commit.author.date,
          environment: 'production'
        };

        logger.success('✨ Update available and deployment ready!', { 
          current: this.currentVersion.commitHash,
          latest: latestVersion.commitHash 
        });

        return {
          hasUpdate: true,
          currentVersion: this.currentVersion,
          latestVersion,
          updateType: this.determineUpdateType(latestCommit),
          forceUpdate: this.shouldForceUpdate(latestCommit)
        };
      }

      logger.info('✅ App is up to date');
      return this.noUpdateResult();

    } catch (error) {
      logger.error('❌ Failed to check for updates:', error);
      return this.noUpdateResult();
    } finally {
      this.isChecking = false;
    }
  }

  // Get latest commit from GitHub API
  private async getLatestCommit(): Promise<any> {
    try {
      const url = `${this.GITHUB_API_BASE}/repos/${this.REPO_OWNER}/${this.REPO_NAME}/commits/${this.BRANCH}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          // Add GitHub token if available (required for private repos)
          ...(import.meta.env.VITE_GITHUB_TOKEN && {
            'Authorization': `token ${import.meta.env.VITE_GITHUB_TOKEN}`
          })
        }
      });

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404) {
          logger.warn('⚠️ Repository not found or private. Auto-update disabled.', {
            repo: `${this.REPO_OWNER}/${this.REPO_NAME}`,
            status: response.status,
            needsToken: !import.meta.env.VITE_GITHUB_TOKEN
          });
          return null;
        }
        
        if (response.status === 403) {
          logger.warn('⚠️ GitHub API rate limit exceeded or access denied:', response.status);
          return null;
        }
        
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const commit = await response.json();
      return commit;
    } catch (error) {
      logger.error('❌ Failed to fetch latest commit:', error);
      return null;
    }
  }

  // Compare version hashes
  private compareVersions(current: string, latest: string): boolean {
    return current !== latest;
  }

  // Determine update type based on commit message
  private determineUpdateType(commit: any): UpdateCheckResult['updateType'] {
    const message = commit.commit.message.toLowerCase();
    
    if (message.includes('breaking change') || message.includes('major:')) {
      return 'major';
    }
    if (message.includes('feat:') || message.includes('feature:')) {
      return 'minor';
    }
    if (message.includes('fix:') || message.includes('hotfix:')) {
      return message.includes('hotfix:') ? 'hotfix' : 'patch';
    }
    
    return 'patch';
  }

  // Determine if update should be forced
  private shouldForceUpdate(commit: any): boolean {
    const message = commit.commit.message.toLowerCase();
    return message.includes('[force-update]') || 
           message.includes('breaking change') || 
           message.includes('security fix');
  }

  // Return no update result
  private noUpdateResult(): UpdateCheckResult {
    return {
      hasUpdate: false,
      currentVersion: this.currentVersion,
      updateType: 'none',
      forceUpdate: false
    };
  }

  // Start periodic update checking
  startPeriodicCheck(callback?: (result: UpdateCheckResult) => void): void {
    if (this.intervalId) {
      this.stopPeriodicCheck();
    }

    logger.info('🔄 Starting periodic update check', { 
      interval: `${this.checkInterval / 1000 / 60} minutes` 
    });

    // Initial check
    this.checkForUpdates().then(result => {
      if (callback && result.hasUpdate) {
        callback(result);
      }
    });

    // Set up periodic checking
    this.intervalId = setInterval(async () => {
      const result = await this.checkForUpdates();
      if (callback && result.hasUpdate) {
        callback(result);
      }
    }, this.checkInterval);
  }

  // Stop periodic checking
  stopPeriodicCheck(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('🛑 Stopped periodic update check');
    }
  }

  // Set check interval
  setCheckInterval(minutes: number): void {
    this.checkInterval = minutes * 60 * 1000;
    logger.info('⏰ Update check interval set to', { minutes });
    
    // Restart if currently running
    if (this.intervalId) {
      this.stopPeriodicCheck();
      this.startPeriodicCheck();
    }
  }

  // Get current version info
  getCurrentVersionInfo(): VersionInfo {
    return this.currentVersion;
  }

  // Manual version check (for testing)
  async forceCheck(): Promise<UpdateCheckResult> {
    logger.info('🔄 Force checking for updates...');
    return await this.checkForUpdates();
  }

  // Check if running in development
  isDevelopment(): boolean {
    return this.currentVersion.environment === 'development';
  }

  // Get app build info for display
  getBuildInfo(): string {
    const { version, commitHash, buildTime } = this.currentVersion;
    return `v${version} (${commitHash}) - ${new Date(buildTime).toLocaleDateString()}`;
  }
}

// Export singleton instance
export const updateService = new UpdateService();
export default updateService;