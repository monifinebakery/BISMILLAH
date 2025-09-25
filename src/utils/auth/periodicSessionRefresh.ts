// src/utils/auth/periodicSessionRefresh.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { silentRefreshSession } from './refreshSession';

class PeriodicSessionRefresh {
  private static instance: PeriodicSessionRefresh;
  private refreshInterval: NodeJS.Timeout | null = null;
  private lastActivity = Date.now();
  private readonly ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 menit sebelum dianggap tidak aktif
  private readonly REFRESH_INTERVAL = 25 * 60 * 1000; // Refresh setiap 25 menit saat aktif

  private constructor() {
    this.setupActivityTracking();
  }

  public static getInstance(): PeriodicSessionRefresh {
    if (!PeriodicSessionRefresh.instance) {
      PeriodicSessionRefresh.instance = new PeriodicSessionRefresh();
    }
    return PeriodicSessionRefresh.instance;
  }

  private setupActivityTracking() {
    // Event listener untuk aktivitas pengguna
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.updateLastActivity();
      }, { passive: true });
    });
  }

  private updateLastActivity() {
    this.lastActivity = Date.now();
  }

  public isUserInactive(): boolean {
    return Date.now() - this.lastActivity > this.ACTIVITY_TIMEOUT;
  }

  public startPeriodicRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(async () => {
      if (!this.isUserInactive()) {
        // Hanya refresh jika user aktif dalam 30 menit terakhir
        logger.debug('🔄 [PERIODIC REFRESH] Attempting silent refresh due to user activity');
        await silentRefreshSession();
      } else {
        logger.debug('🔄 [PERIODIC REFRESH] Skipping refresh - user inactive');
      }
    }, this.REFRESH_INTERVAL);
  }

  public stopPeriodicRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  public async checkAndRefreshIfNecessary(): Promise<boolean> {
    // Juga cek manual saat diperlukan (seperti sebelum permintaan penting)
    if (this.isUserInactive()) {
      // Jika user tidak aktif, lakukan validasi manual
      return await this.validateAndRefreshSession();
    }
    return true;
  }

  private async validateAndRefreshSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        logger.warn('⚠️ [VALIDATE & REFRESH] No valid session found');
        return false;
      }

      // Jika session hampir kadaluarsa (kurang dari 15 menit), refresh
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now + (15 * 60)) {
        logger.info('🔄 [VALIDATE & REFRESH] Session expiring soon, refreshing...');
        return await silentRefreshSession();
      }

      return true;
    } catch (error) {
      logger.warn('⚠️ [VALIDATE & REFRESH] Error validating session:', error);
      return false;
    }
  }
}

export const periodicSessionRefresh = PeriodicSessionRefresh.getInstance();