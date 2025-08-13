import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { AppUpdate, UpdateContextType } from './types';
import { UpdateNotification } from './UpdateNotification';

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [latestUpdate, setLatestUpdate] = useState<AppUpdate | null>(null);
  const [unseenUpdates, setUnseenUpdates] = useState<AppUpdate[]>([]);
  const [hasUnseenUpdates, setHasUnseenUpdates] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ SAFE: Memoize fetch function to prevent infinite re-renders
  const fetchUpdates = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // ✅ SAFE: Check admin status with error handling
      let isAdmin = false;
      try {
        const { data: isAdminData, error: adminError } = await supabase
          .rpc('is_user_admin');

        if (!adminError && isAdminData) {
          isAdmin = true;
        }
      } catch (adminCheckError) {
        console.warn('Could not check admin status:', adminCheckError);
        // Continue as regular user
      }

      // ✅ SAFE: Fetch updates with proper error handling
      let query = supabase.from('app_updates').select('*');
      
      if (isAdmin) {
        // Admin can see all updates
        query = query.order('release_date', { ascending: false });
      } else {
        // Regular users only see active updates
        query = query.eq('is_active', true).order('release_date', { ascending: false });
      }

      const { data: updates, error: updatesError } = await query;

      if (updatesError) {
        console.error('Error fetching updates:', updatesError);
        setLatestUpdate(null);
        setUnseenUpdates([]);
        setHasUnseenUpdates(false);
        return;
      }

      if (!updates || updates.length === 0) {
        setLatestUpdate(null);
        setUnseenUpdates([]);
        setHasUnseenUpdates(false);
        return;
      }

      // ✅ SAFE: Fetch user seen updates with error handling
      const { data: seenUpdates, error: seenError } = await supabase
        .from('user_seen_updates')
        .select('update_id')
        .eq('user_id', user.id);

      if (seenError) {
        console.error('Error fetching seen updates:', seenError);
        // Continue without seen updates data
      }

      const seenUpdateIds = new Set(seenUpdates?.map(seen => seen.update_id) || []);
      const unseen = updates.filter(update => !seenUpdateIds.has(update.id));

      setLatestUpdate(updates[0]);
      setUnseenUpdates(unseen);
      setHasUnseenUpdates(unseen.length > 0);

      // ✅ SAFE: Show popup only for non-admin users and critical updates
      if (!isAdmin && unseen.length > 0) {
        const criticalUnseen = unseen.filter(update => 
          update.priority === 'critical' || update.priority === 'high'
        );

        if (criticalUnseen.length > 0) {
          // ✅ SAFE: Add delay to prevent immediate popup
          setTimeout(() => {
            showUpdateNotification(criticalUnseen[0]);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error in fetchUpdates:', error);
      // ✅ SAFE: Don't show toast error immediately to prevent spam
      setTimeout(() => {
        toast.error('Gagal memuat pembaruan terbaru');
      }, 2000);
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // ✅ SAFE: Only depend on user.id, not entire user object

  // ✅ SAFE: Separate notification function
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
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, []);

  // ✅ SAFE: Mark as seen with proper error handling
  const markAsSeen = useCallback(async (updateId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_seen_updates')
        .upsert({
          user_id: user.id,
          update_id: updateId,
          seen_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error marking update as seen:', error);
        return;
      }

      // ✅ SAFE: Update local state safely
      setUnseenUpdates(prev => prev.filter(update => update.id !== updateId));
      setHasUnseenUpdates(prev => {
        const newUnseen = unseenUpdates.filter(update => update.id !== updateId);
        return newUnseen.length > 0;
      });
    } catch (error) {
      console.error('Error in markAsSeen:', error);
    }
  }, [user?.id, unseenUpdates]);

  // ✅ SAFE: Mark all as seen
  const markAllAsSeen = useCallback(async () => {
    if (!user?.id || unseenUpdates.length === 0) return;

    try {
      const insertData = unseenUpdates.map(update => ({
        user_id: user.id,
        update_id: update.id,
        seen_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('user_seen_updates')
        .upsert(insertData);

      if (error) {
        console.error('Error marking all updates as seen:', error);
        toast.error('Gagal menandai semua pembaruan sebagai sudah dibaca');
        return;
      }

      setUnseenUpdates([]);
      setHasUnseenUpdates(false);
      toast.success('Semua pembaruan telah ditandai sebagai sudah dibaca');
    } catch (error) {
      console.error('Error in markAllAsSeen:', error);
      toast.error('Gagal menandai semua pembaruan sebagai sudah dibaca');
    }
  }, [user?.id, unseenUpdates]);

  // ✅ SAFE: Refresh function
  const refreshUpdates = useCallback(async () => {
    await fetchUpdates();
  }, [fetchUpdates]);

  // ✅ SAFE: Initial fetch with proper dependency
  useEffect(() => {
    if (user?.id) {
      fetchUpdates();
    } else {
      setLoading(false);
      setLatestUpdate(null);
      setUnseenUpdates([]);
      setHasUnseenUpdates(false);
    }
  }, [user?.id, fetchUpdates]);

  // ✅ SAFE: Real-time subscription with cleanup
  useEffect(() => {
    if (!user?.id) return;

    let channel: any = null;

    try {
      channel = supabase
        .channel('app_updates_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'app_updates'
          },
          (payload) => {
            console.log('Real-time update received:', payload);
            // ✅ SAFE: Add delay to prevent rapid updates
            setTimeout(() => {
              fetchUpdates();
            }, 500);
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

  // ✅ SAFE: Provide context value
  const contextValue: UpdateContextType = {
    latestUpdate,
    unseenUpdates,
    hasUnseenUpdates,
    markAsSeen,
    markAllAsSeen,
    refreshUpdates,
    loading
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