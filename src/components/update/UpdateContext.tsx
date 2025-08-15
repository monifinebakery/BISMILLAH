import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { AppUpdate, UpdateContextType } from './types';
import { UpdateNotification } from './UpdateNotification';
import { logger } from '@/utils/logger';
import type { RealtimeChannel } from '@supabase/supabase-js';

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isReady } = useAuth();
  const [latestUpdate, setLatestUpdate] = useState<AppUpdate | null>(null);
  const [unseenUpdates, setUnseenUpdates] = useState<AppUpdate[]>([]);
  const [hasUnseenUpdates, setHasUnseenUpdates] = useState(false);
  const [loading, setLoading] = useState(true);
  // Track IDs we've already marked as seen. Using a ref keeps the set stable
  // across renders without triggering re-renders when it changes.
  const seenUpdateIdsRef = useRef<Set<string>>(new Set());

  const fetchUpdates = useCallback(async () => {
    if (!user?.id || !isReady) {
      logger.debug('Skipping fetch: user.id or auth not ready', { userId: user?.id, isReady });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.info('Fetching updates for user:', user.id);

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

      let seenIdsSet = new Set<string>();
      try {
        const { data: seenData, error: seenError } = await supabase
          .from('user_seen_updates')
          .select('update_id')
          .eq('user_id', user.id);
        if (seenError) throw seenError;
        const ids = (seenData ?? []).map((s: { update_id: string }) => s.update_id);
        seenIdsSet = new Set(ids);
        // Update the ref with the fetched seen IDs
        seenUpdateIdsRef.current = seenIdsSet;
      } catch (err) {
        const error = err as Error;
        logger.error('Error fetching seen updates:', error.message);
        toast.error('Gagal memuat status pembaruan');
        // Reset the ref to empty set on error
        seenUpdateIdsRef.current = new Set();
      }

      setLatestUpdate(updates[0]);
      const newUnseen = updates.filter(
        (update) => !seenUpdateIdsRef.current.has(update.id)
      );
        
      setUnseenUpdates(newUnseen);
      setHasUnseenUpdates(newUnseen.length > 0);

      if (!isAdmin && newUnseen.length > 0) {
        logger.info('Triggering popup for all unseen updates:', newUnseen.map(u => u.title));
        setTimeout(() => showUpdateNotification(newUnseen), 1000); // Tampilkan semua unseen updates
      } else {
        logger.debug('No popup: Admin or no unseen updates');
      }
    } catch (error) {
      logger.error('Error in fetchUpdates:', error);
      setTimeout(() => toast.error('Gagal memuat pembaruan terbaru'), 2000);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isReady]);

  const showUpdateNotification = useCallback((updates: AppUpdate[]) => {
    try {
      toast.custom((t) => (
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <h3 className="font-bold text-lg text-gray-900 mb-2">Pembaruan Baru Tersedia</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {updates.map((update) => (
              <div key={update.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                <UpdateNotification update={update} onDismiss={() => {}} />
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              markAllAsSeen();
              toast.dismiss(t);
            }}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tutup & Tandai Semua Dibaca
          </button>
        </div>
      ), {
        duration: 20000, // Durasi lebih lama karena menampilkan banyak update
        position: 'top-right',
      });
      console.log('Notification shown for all unseen updates:', updates.map(u => u.title));
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, []);

  const markAsSeen = useCallback(
    async (updateId: string) => {
      if (!user?.id) return;

      try {
        // Persist to database
        const { error } = await supabase
          .from('user_seen_updates')
          .upsert({
            user_id: user.id,
            update_id: updateId,
            seen_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error persisting seen status:', error);
          toast.error('Gagal menyimpan status pembaruan');
          return;
        }

        // Update local state
        seenUpdateIdsRef.current.add(updateId);
        setUnseenUpdates((prev) => {
          const filtered = prev.filter((update) => update.id !== updateId);
          setHasUnseenUpdates(filtered.length > 0);
          return filtered;
        });
        console.log('Marked as seen:', updateId);
      } catch (error) {
        console.error('Error in markAsSeen:', error);
        toast.error('Gagal menyimpan status pembaruan');
      }
    },
    [user?.id]
  );

  const markAllAsSeen = useCallback(async () => {
    if (!user?.id || unseenUpdates.length === 0) return;

    try {
      // Prepare data for bulk insert
      const unseenUpdateData = unseenUpdates.map(update => ({
        user_id: user.id,
        update_id: update.id,
        seen_at: new Date().toISOString()
      }));

      // Persist to database
      const { error } = await supabase
        .from('user_seen_updates')
        .upsert(unseenUpdateData);

      if (error) {
        console.error('Error persisting all seen status:', error);
        toast.error('Gagal menyimpan status pembaruan');
        return;
      }

      // Update local state
      unseenUpdates.forEach((update) => seenUpdateIdsRef.current.add(update.id));
      setUnseenUpdates([]);
      setHasUnseenUpdates(false);
      toast.success('Semua pembaruan telah ditandai sebagai sudah dibaca');
      console.log('Marked all as seen');
      
    } catch (error) {
      console.error('Error in markAllAsSeen:', error);
      toast.error('Gagal menandai semua pembaruan sebagai sudah dibaca');
    }
  }, [user?.id, unseenUpdates]);

  const refreshUpdates = useCallback(async () => {
    await fetchUpdates();
  }, [fetchUpdates]);

  useEffect(() => {
    if (user?.id && isReady) {
      console.log('Auth ready, fetching updates...', { userId: user.id });
      fetchUpdates();
    } else {
      setLoading(false);
      setLatestUpdate(null);
      setUnseenUpdates([]);
      setHasUnseenUpdates(false);
      seenUpdateIdsRef.current = new Set();

      console.log('Auth not ready or no user:', { userId: user?.id, isReady });
    }
  }, [user?.id, isReady, fetchUpdates]);

  useEffect(() => {
    if (!user?.id) return;

    let channel: RealtimeChannel | null = null;
    try {
      channel = supabase
        .channel('app_updates_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'app_updates' },
          (payload) => {
            console.log('Real-time update received:', payload);
            setTimeout(() => fetchUpdates(), 500);
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error removing channel:', error);
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