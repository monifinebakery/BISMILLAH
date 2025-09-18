// src/utils/notificationCleanup.ts
// ✅ UTILITY UNTUK MEMBERSIHKAN NOTIFIKASI DUPLIKAT

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface NotificationGroup {
  title: string;
  related_type?: string;
  related_id?: string;
  message: string;
  count: number;
  oldest_id: string;
  newest_id: string;
  ids: string[];
}

/**
 * Identifikasi dan hapus notifikasi duplikat berdasarkan kriteria tertentu
 * @param userId - ID user untuk membersihkan notifikasi
 * @param dryRun - Jika true, hanya menampilkan hasil tanpa menghapus
 */
export const cleanupDuplicateNotifications = async (
  userId: string, 
  dryRun: boolean = true
): Promise<{
  duplicatesFound: number;
  duplicatesRemoved: number;
  groups: NotificationGroup[];
}> => {
  try {
    logger.info('🧹 Starting notification cleanup for user:', userId);
    
    // Fetch all notifications untuk analisis
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('id, title, message, related_type, related_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
      
    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }
    
    if (!notifications || notifications.length === 0) {
      logger.info('ℹ️ No notifications found for cleanup');
      return { duplicatesFound: 0, duplicatesRemoved: 0, groups: [] };
    }
    
    logger.info(`📊 Analyzing ${notifications.length} notifications...`);
    
    // Group notifications berdasarkan similarity
    const groups = new Map<string, NotificationGroup>();
    
    notifications.forEach(notification => {
      // Create key untuk grouping (similar to deduplication logic)
      const key = [
        notification.title.toLowerCase().trim(),
        notification.related_type || '',
        notification.related_id || '',
        notification.message.substring(0, 50)
      ].join('|');
      
      if (groups.has(key)) {
        const group = groups.get(key)!;
        group.count++;
        group.ids.push(notification.id);
        group.newest_id = notification.id; // Last one in chronological order
      } else {
        groups.set(key, {
          title: notification.title,
          related_type: notification.related_type,
          related_id: notification.related_id,
          message: notification.message,
          count: 1,
          oldest_id: notification.id,
          newest_id: notification.id,
          ids: [notification.id]
        });
      }
    });
    
    // Filter groups yang memiliki duplikat (count > 1)
    const duplicateGroups: NotificationGroup[] = [];
    let totalDuplicatesFound = 0;
    const duplicateIdsToDelete: string[] = [];
    
    groups.forEach(group => {
      if (group.count > 1) {
        duplicateGroups.push(group);
        totalDuplicatesFound += (group.count - 1); // Exclude the one we keep
        
        // Keep the newest, delete the rest
        const idsToDelete = group.ids.slice(0, -1); // Remove last element (newest)
        duplicateIdsToDelete.push(...idsToDelete);
      }
    });
    
    logger.info(`🔍 Found ${duplicateGroups.length} groups with duplicates`);
    logger.info(`📈 Total duplicate notifications: ${totalDuplicatesFound}`);
    
    if (duplicateGroups.length > 0) {
      logger.info('📋 Duplicate Groups:');
      duplicateGroups.forEach((group, index) => {
        logger.info(`  ${index + 1}. "${group.title}" (${group.count} copies)`);
        logger.info(`     Related: ${group.related_type}/${group.related_id}`);
        logger.info(`     IDs to delete: ${group.ids.slice(0, -1).join(', ')}`);
        logger.info(`     Keeping: ${group.newest_id}`);
      });
    }
    
    let duplicatesRemoved = 0;
    
    if (!dryRun && duplicateIdsToDelete.length > 0) {
      logger.info('🗑️ Deleting duplicate notifications...');
      
      // Delete dalam batch untuk performa yang lebih baik
      const batchSize = 100;
      for (let i = 0; i < duplicateIdsToDelete.length; i += batchSize) {
        const batch = duplicateIdsToDelete.slice(i, i + batchSize);
        
        const { error: deleteError } = await supabase
          .from('notifications')
          .delete()
          .in('id', batch);
          
        if (deleteError) {
          logger.error('Error deleting notification batch:', deleteError);
          throw new Error(`Failed to delete notifications: ${deleteError.message}`);
        }
        
        duplicatesRemoved += batch.length;
        logger.info(`   Deleted ${batch.length} notifications (batch ${Math.floor(i / batchSize) + 1})`);
      }
      
      logger.info(`✅ Successfully removed ${duplicatesRemoved} duplicate notifications`);
    } else if (dryRun) {
      logger.info('🔍 DRY RUN: No notifications were actually deleted');
      logger.info(`   Would delete ${duplicateIdsToDelete.length} notifications`);
    }
    
    return {
      duplicatesFound: totalDuplicatesFound,
      duplicatesRemoved,
      groups: duplicateGroups
    };
    
  } catch (error) {
    logger.error('Error during notification cleanup:', error);
    throw error;
  }
};

/**
 * Quick cleanup untuk duplikat notifikasi berdasarkan timeframe
 * @param userId - User ID
 * @param hoursAgo - Hapus duplikat dalam X jam terakhir (default: 24)
 */
export const quickCleanupRecent = async (
  userId: string,
  hoursAgo: number = 24
): Promise<number> => {
  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursAgo);
    
    logger.info(`🧹 Quick cleanup: removing recent duplicates (last ${hoursAgo}h)`);
    
    // Get notifications yang dibuat dalam timeframe tertentu
    const { data: recentNotifications, error } = await supabase
      .from('notifications')
      .select('id, title, related_id, created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoffTime.toISOString())
      .order('created_at', { ascending: false });
      
    if (error || !recentNotifications) {
      throw new Error('Failed to fetch recent notifications');
    }
    
    // Simple deduplication based on title + related_id
    const seen = new Set<string>();
    const duplicateIds: string[] = [];
    
    recentNotifications.forEach(notif => {
      const key = `${notif.title}|${notif.related_id || ''}`;
      
      if (seen.has(key)) {
        duplicateIds.push(notif.id);
      } else {
        seen.add(key);
      }
    });
    
    if (duplicateIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .in('id', duplicateIds);
        
      if (deleteError) {
        throw new Error(`Failed to delete duplicates: ${deleteError.message}`);
      }
      
      logger.info(`✅ Quick cleanup removed ${duplicateIds.length} recent duplicates`);
    }
    
    return duplicateIds.length;
    
  } catch (error) {
    logger.error('Error during quick cleanup:', error);
    throw error;
  }
};

/**
 * Auto-cleanup untuk menghapus notifikasi yang sudah expired
 * @param userId - User ID
 */
export const cleanupExpiredNotifications = async (userId: string): Promise<number> => {
  try {
    const { data: deleted, error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .lt('expires_at', new Date().toISOString())
      .select('id');
      
    if (error) {
      throw new Error(`Failed to cleanup expired notifications: ${error.message}`);
    }
    
    const count = deleted?.length || 0;
    if (count > 0) {
      logger.info(`🗑️ Cleaned up ${count} expired notifications`);
    }
    
    return count;
  } catch (error) {
    logger.error('Error cleaning up expired notifications:', error);
    throw error;
  }
};

export default {
  cleanupDuplicateNotifications,
  quickCleanupRecent,
  cleanupExpiredNotifications
};
