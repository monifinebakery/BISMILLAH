#!/usr/bin/env node

// cleanup-notifications.js
// ✅ SCRIPT UNTUK MEMBERSIHKAN NOTIFIKASI DUPLIKAT

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// ⚠️ GANTI DENGAN KONFIGURASI SUPABASE ANDA
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Ganti dengan URL Supabase Anda
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Ganti dengan anon key Anda

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fungsi untuk menanyakan input pengguna
const question = (query) => new Promise(resolve => rl.question(query, resolve));

// Fungsi utama untuk cleanup
async function cleanupDuplicateNotifications(userId, dryRun = true) {
  try {
    console.log('🧹 Starting notification cleanup for user:', userId);
    
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
      console.log('ℹ️ No notifications found for cleanup');
      return { duplicatesFound: 0, duplicatesRemoved: 0 };
    }
    
    console.log(`📊 Analyzing ${notifications.length} notifications...`);
    
    // Group notifications berdasarkan similarity
    const groups = new Map();
    
    notifications.forEach(notification => {
      // Create key untuk grouping (similar to deduplication logic)
      const key = [
        notification.title.toLowerCase().trim(),
        notification.related_type || '',
        notification.related_id || '',
        notification.message.substring(0, 50)
      ].join('|');
      
      if (groups.has(key)) {
        const group = groups.get(key);
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
    const duplicateGroups = [];
    let totalDuplicatesFound = 0;
    let duplicateIdsToDelete = [];
    
    groups.forEach(group => {
      if (group.count > 1) {
        duplicateGroups.push(group);
        totalDuplicatesFound += (group.count - 1); // Exclude the one we keep
        
        // Keep the newest, delete the rest
        const idsToDelete = group.ids.slice(0, -1); // Remove last element (newest)
        duplicateIdsToDelete.push(...idsToDelete);
      }
    });
    
    console.log(`\n🔍 Found ${duplicateGroups.length} groups with duplicates`);
    console.log(`📈 Total duplicate notifications: ${totalDuplicatesFound}`);
    
    if (duplicateGroups.length > 0) {
      console.log('\n📋 Duplicate Groups:');
      duplicateGroups.forEach((group, index) => {
        console.log(`  ${index + 1}. "${group.title}" (${group.count} copies)`);
        console.log(`     Related: ${group.related_type}/${group.related_id}`);
        console.log(`     IDs to delete: ${group.ids.slice(0, -1).join(', ')}`);
        console.log(`     Keeping: ${group.newest_id}`);
      });
    }
    
    let duplicatesRemoved = 0;
    
    if (!dryRun && duplicateIdsToDelete.length > 0) {
      console.log('\n🗑️ Deleting duplicate notifications...');
      
      // Delete dalam batch untuk performa yang lebih baik
      const batchSize = 100;
      for (let i = 0; i < duplicateIdsToDelete.length; i += batchSize) {
        const batch = duplicateIdsToDelete.slice(i, i + batchSize);
        
        const { error: deleteError } = await supabase
          .from('notifications')
          .delete()
          .in('id', batch);
          
        if (deleteError) {
          console.error('Error deleting notification batch:', deleteError);
          throw new Error(`Failed to delete notifications: ${deleteError.message}`);
        }
        
        duplicatesRemoved += batch.length;
        console.log(`   Deleted ${batch.length} notifications (batch ${Math.floor(i / batchSize) + 1})`);
      }
      
      console.log(`✅ Successfully removed ${duplicatesRemoved} duplicate notifications`);
    } else if (dryRun) {
      console.log('\n🔍 DRY RUN: No notifications were actually deleted');
      console.log(`   Would delete ${duplicateIdsToDelete.length} notifications`);
    }
    
    return {
      duplicatesFound: totalDuplicatesFound,
      duplicatesRemoved,
      groups: duplicateGroups
    };
    
  } catch (error) {
    console.error('Error during notification cleanup:', error);
    throw error;
  }
}

// Script utama
async function main() {
  try {
    console.log('🔧 NOTIFICATION DUPLICATE CLEANUP TOOL');
    console.log('=====================================\n');
    
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      console.error('❌ ERROR: Please update SUPABASE_URL and SUPABASE_ANON_KEY in this script first!');
      process.exit(1);
    }
    
    const userId = await question('Enter your User ID: ');
    
    if (!userId || !userId.trim()) {
      console.error('❌ User ID is required');
      process.exit(1);
    }
    
    console.log(`\n🔍 Running analysis for user: ${userId.trim()}`);
    
    // Run dry run first
    const dryRunResults = await cleanupDuplicateNotifications(userId.trim(), true);
    
    if (dryRunResults.duplicatesFound === 0) {
      console.log('\n🎉 No duplicate notifications found! Your notifications are clean.');
      rl.close();
      return;
    }
    
    console.log(`\n⚠️ Found ${dryRunResults.duplicatesFound} duplicate notifications`);
    const confirm = await question('Do you want to DELETE these duplicates? (yes/no): ');
    
    if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
      console.log('\n🚀 Proceeding with cleanup...');
      const cleanupResults = await cleanupDuplicateNotifications(userId.trim(), false);
      console.log(`\n🎉 CLEANUP COMPLETE!`);
      console.log(`   Duplicates removed: ${cleanupResults.duplicatesRemoved}`);
    } else {
      console.log('\n❌ Cleanup cancelled by user');
    }
    
  } catch (error) {
    console.error('\n💥 CLEANUP FAILED:', error.message);
  } finally {
    rl.close();
  }
}

// Jalankan script
main();
