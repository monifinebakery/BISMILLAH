import { useRef, useCallback } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

interface NotificationData {
  title: string;
  message: string;
  type: string;
  related_type?: string;
  related_id?: string;
}

// Hook untuk mencegah duplicate notifications
export const useNotificationDeduplicator = () => {
  const { addNotification: originalAddNotification } = useNotification();
  
  // Track recent notifications untuk prevent duplicates
  const recentNotificationsRef = useRef<Map<string, number>>(new Map());
  const DUPLICATE_THRESHOLD = 60000; // 1 minute

  // Generate unique key untuk notification
  const generateNotificationKey = (data: NotificationData): string => {
    const keyParts = [
      data.title,
      data.related_type || '',
      data.related_id || ''
    ];
    return keyParts.join('|');
  };

  // Clean up expired notifications dari tracking
  const cleanupExpiredNotifications = useCallback(() => {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    recentNotificationsRef.current.forEach((timestamp, key) => {
      if (now - timestamp > DUPLICATE_THRESHOLD) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => {
      recentNotificationsRef.current.delete(key);
    });
  }, []);

  // Deduplicated add notification function
  const addNotification = useCallback(async (data: NotificationData) => {
    const notificationKey = generateNotificationKey(data);
    const now = Date.now();
    
    // Clean up expired notifications
    cleanupExpiredNotifications();
    
    // Check if similar notification was sent recently
    const lastSent = recentNotificationsRef.current.get(notificationKey);
    if (lastSent && (now - lastSent) < DUPLICATE_THRESHOLD) {
      console.log(`Duplicate notification prevented: ${data.title}`);
      return false;
    }
    
    try {
      // Send notification
      await originalAddNotification(data);
      
      // Track this notification
      recentNotificationsRef.current.set(notificationKey, now);
      
      console.log(`Notification sent: ${data.title}`);
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }, [originalAddNotification, cleanupExpiredNotifications]);

  // Clear all tracking (untuk reset)
  const clearTracking = useCallback(() => {
    recentNotificationsRef.current.clear();
  }, []);

  // Check if notification would be duplicate
  const wouldBeDuplicate = useCallback((data: NotificationData): boolean => {
    const notificationKey = generateNotificationKey(data);
    const lastSent = recentNotificationsRef.current.get(notificationKey);
    const now = Date.now();
    
    return lastSent ? (now - lastSent) < DUPLICATE_THRESHOLD : false;
  }, []);

  return {
    addNotification,
    clearTracking,
    wouldBeDuplicate
  };
};