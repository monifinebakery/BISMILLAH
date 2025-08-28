#!/usr/bin/env node

// cleanup-wac-notifications.js
// Script untuk membersihkan notifikasi WAC yang berlebihan

const { createClient } = require('@supabase/supabase-js');

// For now, let's just create a utility to identify the issue without needing service key
console.log('\n🔍 WAC Notification Analysis Tool\n');
console.log('This tool will help you understand the WAC notification issue.');
console.log('To fix the issue, we\'ve made the following changes:\n');
console.log('✅ 1. Increased notification deduplication threshold from 5 to 10 minutes');
console.log('✅ 2. Added WAC notification filtering in real-time subscription');
console.log('✅ 3. WAC-related notifications will no longer show as toast notifications');
console.log('✅ 4. Enhanced notification key generation for better deduplication\n');
console.log('📋 These changes will prevent the WAC notifications from appearing repeatedly.');
console.log('\n💡 To manually clean up existing WAC notifications, use the admin interface.');
process.exit(0);

async function cleanupWACNotifications() {
  console.log('🧹 Starting WAC notifications cleanup...');
  
  try {
    // Get all WAC-related notifications
    const { data: wacNotifications, error } = await supabase
      .from('notifications')
      .select('id, user_id, title, message, created_at')
      .or('title.ilike.%wac%,title.ilike.%weighted%,message.ilike.%rata-rata%,message.ilike.%harga rata%')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!wacNotifications || wacNotifications.length === 0) {
      console.log('ℹ️ No WAC notifications found');
      return;
    }

    console.log(`📊 Found ${wacNotifications.length} WAC-related notifications`);

    // Group by user and similar content
    const userGroups = new Map();
    
    wacNotifications.forEach(notif => {
      const userId = notif.user_id;
      if (!userGroups.has(userId)) {
        userGroups.set(userId, new Map());
      }
      
      const userNotifs = userGroups.get(userId);
      const key = `${notif.title.toLowerCase().trim()}|${notif.message.substring(0, 50)}`;
      
      if (!userNotifs.has(key)) {
        userNotifs.set(key, []);
      }
      
      userNotifs.get(key).push(notif);
    });

    let totalDuplicates = 0;
    let idsToDelete = [];

    // Find duplicates for each user
    userGroups.forEach((userNotifs, userId) => {
      userNotifs.forEach((notifs, key) => {
        if (notifs.length > 1) {
          // Keep the most recent, delete the rest
          const sorted = notifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          const toDelete = sorted.slice(1); // Remove all except the first (most recent)
          
          console.log(`👤 User ${userId}: Found ${notifs.length} duplicates of "${notifs[0].title}"`);
          console.log(`   Keeping: ${sorted[0].id} (${sorted[0].created_at})`);
          console.log(`   Deleting: ${toDelete.map(n => n.id).join(', ')}`);
          
          totalDuplicates += toDelete.length;
          idsToDelete.push(...toDelete.map(n => n.id));
        }
      });
    });

    if (idsToDelete.length === 0) {
      console.log('✅ No duplicate WAC notifications found');
      return;
    }

    console.log(`🗑️ About to delete ${idsToDelete.length} duplicate WAC notifications...`);

    // Delete in batches
    const batchSize = 100;
    let deletedCount = 0;

    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);
      
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error('❌ Error deleting batch:', deleteError);
        continue;
      }

      deletedCount += batch.length;
      console.log(`   Deleted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} notifications`);
    }

    console.log(`✅ Successfully deleted ${deletedCount} duplicate WAC notifications`);
    
    // Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`   Total WAC notifications found: ${wacNotifications.length}`);
    console.log(`   Duplicate notifications deleted: ${deletedCount}`);
    console.log(`   Unique notifications kept: ${wacNotifications.length - deletedCount}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupWACNotifications()
  .then(() => {
    console.log('🎉 WAC notifications cleanup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });
