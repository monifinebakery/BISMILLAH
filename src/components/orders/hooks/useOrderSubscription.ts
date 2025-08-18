import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface ConnectionControls {
  shouldAttemptConnection: () => boolean;
  recordConnectionFailure: () => void;
  setIsConnected: (v: boolean) => void;
}

export const useOrderSubscription = (
  userId: string | undefined,
  handleEvent: (payload: any) => void,
  { shouldAttemptConnection, recordConnectionFailure, setIsConnected }: ConnectionControls
) => {
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const setupLockRef = useRef(false);

  const cleanupSubscription = useCallback(async () => {
    const sub = subscriptionRef.current;
    subscriptionRef.current = null;
    if (sub) {
      try {
        await sub.unsubscribe();
        await supabase.removeChannel(sub);
      } catch (e) {
        logger.warn('useOrderSubscription', 'Cleanup failed', e);
      }
    }
    setIsConnected(false);
  }, [setIsConnected]);

  const setupSubscription = useCallback(async () => {
    if (!userId || setupLockRef.current) return;
    if (!shouldAttemptConnection()) return;

    setupLockRef.current = true;
    await cleanupSubscription();

    const channelName = `orders_${userId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` }, handleEvent)
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          subscriptionRef.current = channel;
          setupLockRef.current = false;
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          recordConnectionFailure();
          setupLockRef.current = false;
        }
      });
  }, [userId, handleEvent, shouldAttemptConnection, recordConnectionFailure, cleanupSubscription, setIsConnected]);

  return { setupSubscription, cleanupSubscription };
};
