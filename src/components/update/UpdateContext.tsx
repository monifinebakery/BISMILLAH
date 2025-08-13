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

  const fetchUpdates = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // ✅ FIXED: Use RPC call to check admin status first
      const { data: isAdminData, error: adminError } = await supabase
        .rpc('is_user_admin');

      if (adminError) {
        console.warn('Could not check admin status:', adminError);
      }

      const isAdmin = isAdminData || false;

      // ✅ UPDATED: Fetch updates based on admin status
      let query = supabase.from('app_updates').select('*');
      
      if (isAdmin) {
        // Admin can see all updates
        query = query.order('release_date', { ascending: false });
      } else {
        // Regular users only see active updates
        query = query.eq('is_active', true).order('release_date', { ascending: false });
      }

      const { data: updates, error: updatesError } = await query;

      if (updatesError) throw updatesError;

      if (!updates || updates.length === 0) {
        setLatestUpdate(null);
        setUnseenUpdates([]);
        setHasUnseenUpdates(false);
        setLoading(false);
        return;
      }

      // Fetch user seen updates
      const { data: seenUpdates, error: seenError } = await supabase
        .from('user_seen_updates')
        .select('update_id')
        .eq('user_id', user.id);

      if (seenError) throw seenError;

      const seenUpdateIds = new Set(seenUpdates?.map(seen => seen.update_id) || []);
      const unseen = updates.filter(update => !seenUpdateIds.has(update.id));

      setLatestUpdate(updates[0]);
      setUnseenUpdates(unseen);
      setHasUnseenUpdates(unseen.length > 0);

      // Show popup for critical or high priority unseen updates (only for non-admin users)
      if (!isAdmin) {
        const criticalUnseen = unseen.filter(update => 
          update.priority === 'critical' || update.priority === 'high'
        );

        if (criticalUnseen.length > 0) {
          showUpdateNotification(criticalUnseen[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching updates:', error);
      toast.error('Gagal memuat pembaruan terbaru');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const showUpdateNotification = (update: AppUpdate) => {
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
  };

  const markAsSeen = useCallback(async (updateId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_seen_updates')
        .upsert({
          user_id: user.id,
          update_id: updateId,
          seen_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state
      setUnseenUpdates(prev => prev.filter(update => update.id !== updateId));
      setHasUnseenUpdates(prev => {
        const remaining = unseenUpdates.filter(update => update.id !== updateId);
        return remaining.length > 0;
      });
    } catch (error) {
      console.error('Error marking update as seen:', error);
    }
  }, [user, unseenUpdates]);

  const markAllAsSeen = useCallback(async () => {
    if (!user || unseenUpdates.length === 0) return;

    try {
      const insertData = unseenUpdates.map(update => ({
        user_id: user.id,
        update_id: update.id,
        seen_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('user_seen_updates')
        .upsert(insertData);

      if (error) throw error;

      setUnseenUpdates([]);
      setHasUnseenUpdates(false);
      toast.success('Semua pembaruan telah ditandai sebagai sudah dibaca');
    } catch (error) {
      console.error('Error marking all updates as seen:', error);
      toast.error('Gagal menandai semua pembaruan sebagai sudah dibaca');
    }
  }, [user, unseenUpdates]);

  const refreshUpdates = useCallback(async () => {
    setLoading(true);
    await fetchUpdates();
  }, [fetchUpdates]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  // Listen for real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('app_updates_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_updates'
        },
        () => {
          fetchUpdates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchUpdates]);

  return (
    <UpdateContext.Provider value={{
      latestUpdate,
      unseenUpdates,
      hasUnseenUpdates,
      markAsSeen,
      markAllAsSeen,
      refreshUpdates,
      loading
    }}>
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