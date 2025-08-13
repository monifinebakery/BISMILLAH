import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { AppUpdate, UpdateContextType } from './types';
import { UpdateNotification } from './UpdateNotification';
import { logger } from '@/utils/logger';

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isReady } = useAuth(); // Tambah isReady untuk pastikan auth siap
  const [latestUpdate, setLatestUpdate] = useState<AppUpdate | null>(null);
  const [unseenUpdates, setUnseenUpdates] = useState<AppUpdate[]>([]);
  const [hasUnseenUpdates, setHasUnseenUpdates] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seenUpdateIds, setSeenUpdateIds] = useState<Set<string>>(new Set());

  const fetchUpdates = useCallback(async () => {
    if (!user?.id || !isReady) {
      logger.debug('Skipping fetch: user.id or auth not ready', { userId: user?.id, isReady });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.debug('Fetching updates for user:', user.id);

      let isAdmin = false;
      try {
        const { data: isAdminData, error: adminError } = await supabase.rpc('is_user_admin');
        if (!adminError && isAdminData) isAdmin = true;
      } catch (adminCheckError) {
        logger.warn('Could not check admin status, assuming non-admin:', adminCheckError);
      }

      let query = supabase.from('app_updates').select('*');
      if (isAdmin) {
        query = query.order('release_date', { ascending: false });
      } else {
        query = query.eq('is_active', true).order('release_date', { ascending: false });
      }

      const { data: updates, error: updatesError } = await query;
      if (updatesError) {
        logger.error('Error fetching updates:', updatesError.message);
        setLatestUpdate(null);
        setUnseenUpdates([]);
        setHasUnseenUpdates(false);
        return;
      }

      if (!updates || updates.length === 0) {
        logger.debug('No updates found');
        setLatestUpdate(null);
        setUnseenUpdates([]);
        setHasUnseenUpdates(false);
        return;
      }

      setLatestUpdate(updates[0]);
      const newUnseen = updates.filter(update => !seenUpdateIds.has(update.id));
      setUnseenUpdates(newUnseen);
      setHasUnseenUpdates(newUnseen.length > 0);

      if (!isAdmin && newUnseen.length > 0) {
        const criticalUnseen = newUnseen.filter(update =>
          update.priority === 'critical' || update.priority === 'high'
        );
        if (criticalUnseen.length > 0) {
          logger.info('Triggering popup for critical/high update:', criticalUnseen[0]);
          setTimeout(() => showUpdateNotification(criticalUnseen[0]), 1000);
        } else {
          logger.debug('No critical/high updates to show');
        }
      } else {
        logger.debug('No popup: Admin or no unseen updates');
      }
    } catch (error) {
      logger.error('Error in fetchUpdates:', error);
      setTimeout(() => toast.error('Gagal memuat pembaruan terbaru'), 2000);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isReady, seenUpdateIds]);

  const showUpdateNotification = useCallback((update: AppUpdate) => {
    try {
      toast.custom((t) => (
        <UpdateNotification
          update={update}
          onDismiss={() => {
            toast.dismiss(t);
            markAsSeen(update.id);
          }}
        />
      ), {
        duration: update.priority === 'critical' ? 20000 : 15000,
        position: 'top-right',
      });
      logger.debug('Notification shown for:', update.title);
    } catch (error) {
      logger.error('Error showing notification:', error);
    }
  }, []);

  const markAsSeen = useCallback(async (updateId: string) => {
    if (!user?.id) return;

    try {
      setSeenUpdateIds(prev => new Set(prev).add(updateId));
      setUnseenUpdates(prev => prev.filter(update => update.id !== updateId));
      setHasUnseenUpdates(prev => {
        const newUnseen = unseenUpdates.filter(update => update.id !== updateId);
        return newUnseen.length > 0;
      });
      logger.debug('Marked as seen:', updateId);
    } catch (error) {
      logger.error('Error in markAsSeen:', error);
    }
  }, [user?.id, unseenUpdates]);

  const markAllAsSeen = useCallback(async () => {
    if (!user?.id || unseenUpdates.length === 0) return;

    try {
      const newSeenIds = new Set(seenUpdateIds);
      unseenUpdates.forEach(update => newSeenIds.add(update.id));
      setSeenUpdateIds(newSeenIds);
      setUnseenUpdates([]);
      setHasUnseenUpdates(false);
      toast.success('Semua pembaruan telah ditandai sebagai sudah dibaca');
      logger.debug('Marked all as seen');
    } catch (error) {
      logger.error('Error in markAllAsSeen:', error);
      toast.error('Gagal menandai semua pembaruan sebagai sudah dibaca');
    }
  }, [user?.id, unseenUpdates, seenUpdateIds]);

  const refreshUpdates = useCallback(async () => {
    await fetchUpdates();
  }, [fetchUpdates]);

  useEffect(() => {
    if (user?.id && isReady) {
      logger.debug('Auth ready, fetching updates...');
      fetchUpdates();
    } else {
      setLoading(false);
      setLatestUpdate(null);
      setUnseenUpdates([]);
      setHasUnseenUpdates(false);
      setSeenUpdateIds(new Set());
      logger.debug('Auth not ready or no user:', { userId: user?.id, isReady });
    }
  }, [user?.id, isReady, fetchUpdates]);

  useEffect(() => {
    if (!user?.id) return;

    let channel: any = null;
    try {
      channel = supabase
        .channel('app_updates_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'app_updates' },
          (payload) => {
            logger.debug('Real-time update received:', payload);
            setTimeout(() => fetchUpdates(), 500);
          }
        )
        .subscribe();
    } catch (error) {
      logger.error('Error setting up real-time subscription:', error);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          logger.error('Error removing channel:', error);
        }
      }
    };
  }, [user?.id, fetchUpdates]);

  const contextValue: UpdateContextType = {
    latestUpdate,
    unseenUpdates,
    hasUnseenUpdates,
    markAsSeen,
    markAllAsSeen,
    refreshUpdates,
    loading,
  };

  return (
    <UpdateContext.Provider value={contextValue}>
      {children}
    </UpdateContext.Provider>
  );
};

export const useUpdates = () => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdates must be used within UpdateProvider');
  }
  return context;
};
