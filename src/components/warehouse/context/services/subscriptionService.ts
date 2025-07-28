// src/components/warehouse/context/services/subscriptionService.ts
import { supabase } from '@/integrations/supabase/client';
import { BahanBaku } from '../../types/warehouse';
import { transformBahanBakuFromDB } from '../utils/transformers';
import { logger } from '@/utils/logger';

interface SubscriptionServiceDeps {
  userId: string;
  onDataChange: (items: BahanBaku[]) => void;
  onItemAdded: (item: BahanBaku) => void;
  onItemUpdated: (item: BahanBaku) => void;
  onItemDeleted: (itemId: string) => void;
  onConnectionStatusChange: (status: string) => void;
  isMountedRef: React.MutableRefObject<boolean>;
}

export class SubscriptionService {
  private deps: SubscriptionServiceDeps;
  private subscription: ReturnType<typeof supabase.channel> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(deps: SubscriptionServiceDeps) {
    this.deps = deps;
  }

  async setupSubscription(): Promise<void> {
    if (!this.deps.userId || !this.deps.isMountedRef.current) return;

    // Clean up existing subscription
    this.cleanupSubscription();

    logger.context('SubscriptionService', 'Setting up new subscription for user:', this.deps.userId);

    try {
      const channelName = `bahan_baku_changes_${this.deps.userId}_${Date.now()}`;
      
      this.subscription = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bahan_baku',
          filter: `user_id=eq.${this.deps.userId}`,
        }, (payload) => {
          if (!this.deps.isMountedRef.current) return;
          
          this.handleRealtimeEvent(payload);
        })
        .subscribe((status) => {
          if (!this.deps.isMountedRef.current) return;
          
          this.handleSubscriptionStatus(status);
        });

    } catch (error) {
      logger.error('SubscriptionService', 'Error setting up subscription:', error);
      this.handleConnectionError();
    }
  }

  private handleRealtimeEvent(payload: any): void {
    logger.context('SubscriptionService', 'Real-time event:', payload.eventType, payload.new?.id || payload.old?.id);
    
    try {
      switch (payload.eventType) {
        case 'INSERT':
          if (payload.new) {
            const newItem = transformBahanBakuFromDB(payload.new);
            this.deps.onItemAdded(newItem);
            logger.context('SubscriptionService', 'Item added via real-time:', newItem.id);
          }
          break;

        case 'UPDATE':
          if (payload.new) {
            const updatedItem = transformBahanBakuFromDB(payload.new);
            this.deps.onItemUpdated(updatedItem);
            logger.context('SubscriptionService', 'Item updated via real-time:', updatedItem.id);
          }
          break;

        case 'DELETE':
          if (payload.old?.id) {
            this.deps.onItemDeleted(payload.old.id);
            logger.context('SubscriptionService', 'Item deleted via real-time:', payload.old.id);
          }
          break;

        default:
          logger.warn('SubscriptionService', 'Unknown real-time event type:', payload.eventType);
      }
    } catch (error) {
      logger.error('SubscriptionService', 'Error processing real-time event:', error, payload);
    }
  }

  private handleSubscriptionStatus(status: string): void {
    logger.context('SubscriptionService', 'Subscription status:', status);
    
    this.deps.onConnectionStatusChange(status);

    switch (status) {
      case 'SUBSCRIBED':
        this.reconnectAttempts = 0;
        break;
        
      case 'CHANNEL_ERROR':
      case 'TIMED_OUT':
      case 'CLOSED':
        logger.error('SubscriptionService', 'Subscription error:', status);
        this.handleConnectionError();
        break;
        
      default:
        break;
    }
  }

  private handleConnectionError(): void {
    this.subscription = null;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      logger.context('SubscriptionService', `Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.deps.isMountedRef.current) {
          this.setupSubscription();
        }
      }, delay);
    } else {
      logger.error('SubscriptionService', 'Max reconnection attempts reached');
    }
  }

  cleanupSubscription(): void {
    if (this.subscription) {
      logger.context('SubscriptionService', 'Cleaning up subscription');
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
  }

  isConnected(): boolean {
    return this.subscription !== null;
  }

  forceReconnect(): void {
    this.reconnectAttempts = 0;
    this.setupSubscription();
  }
}