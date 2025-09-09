// AGGRESSIVE SERVICE WORKER FIX FOR BOOLEAN ITERATION ERROR
// Run this in browser console to completely clear all cached data

console.log('🚨 EMERGENCY FIX FOR BOOLEAN ITERATION ERROR');
console.log('================================================');

async function emergencyFix() {
    try {
        console.log('\n🔍 Step 1: Detecting Service Workers...');
        
        // 1. KILL ALL SERVICE WORKERS
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log(`   Found ${registrations.length} service worker(s)`);
            
            for (const registration of registrations) {
                console.log(`   🎯 Killing SW at: ${registration.scope}`);
                await registration.unregister();
            }
            console.log('   ✅ All service workers terminated');
        }
        
        // 2. DESTROY ALL CACHES
        console.log('\n🔍 Step 2: Destroying all caches...');
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            console.log(`   Found ${cacheNames.length} cache(s):`, cacheNames);
            
            for (const cacheName of cacheNames) {
                await caches.delete(cacheName);
                console.log(`   💥 Destroyed cache: ${cacheName}`);
            }
            console.log('   ✅ All caches destroyed');
        }
        
        // 3. CLEAR STORAGE
        console.log('\n🔍 Step 3: Clearing all storage...');
        
        // Clear localStorage
        if (localStorage) {
            const localStorageSize = localStorage.length;
            localStorage.clear();
            console.log(`   🗑️ Cleared localStorage (${localStorageSize} items)`);
        }
        
        // Clear sessionStorage
        if (sessionStorage) {
            const sessionStorageSize = sessionStorage.length;
            sessionStorage.clear();
            console.log(`   🗑️ Cleared sessionStorage (${sessionStorageSize} items)`);
        }
        
        // 4. CLEAR INDEXEDDB
        console.log('\n🔍 Step 4: Clearing IndexedDB...');
        if ('indexedDB' in window) {
            // Get all database names (this is a hack, not standard API)
            const databases = await indexedDB.databases?.() || [];
            
            for (const db of databases) {
                if (db.name) {
                    try {
                        indexedDB.deleteDatabase(db.name);
                        console.log(`   💥 Deleted IndexedDB: ${db.name}`);
                    } catch (e) {
                        console.log(`   ⚠️ Failed to delete IndexedDB: ${db.name}`);
                    }
                }
            }
            
            if (databases.length === 0) {
                console.log('   ℹ️ No IndexedDB databases found');
            }
        }
        
        // 5. CLEAR COOKIES (limited to same-origin)
        console.log('\n🔍 Step 5: Clearing cookies...');
        document.cookie.split(";").forEach(function(c) { 
            const eqPos = c.indexOf("=");
            const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname;
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.' + window.location.hostname;
        });
        console.log('   ✅ Cookies cleared');
        
        // 6. FORCE BROWSER TO FORGET EVERYTHING
        console.log('\n🔍 Step 6: Final cleanup...');
        
        // Try to clear cache storage
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            console.log(`   📊 Storage before clear: ${Math.round((estimate.usage || 0) / 1024 / 1024)} MB`);
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ EMERGENCY FIX COMPLETED!');
        console.log('='.repeat(50));
        console.log('\n⚠️ IMPORTANT NEXT STEPS:');
        console.log('1. Close this tab completely');
        console.log('2. Open a NEW incognito/private window');
        console.log('3. Navigate to the app URL');
        console.log('4. The error should be fixed!');
        console.log('\nAlternatively, the page will auto-reload in 3 seconds...');
        
        // Auto reload after 3 seconds
        setTimeout(() => {
            console.log('🔄 Reloading page...');
            window.location.reload(true); // Force reload from server
        }, 3000);
        
    } catch (error) {
        console.error('❌ EMERGENCY FIX FAILED:', error);
        console.log('\n🚨 MANUAL FIX REQUIRED:');
        console.log('1. Close all browser tabs');
        console.log('2. Clear browser data manually (Ctrl+Shift+Delete)');
        console.log('3. Restart browser');
        console.log('4. Try again in incognito mode');
    }
}

// Run the emergency fix
emergencyFix();

// Also provide manual trigger
window.emergencyFix = emergencyFix;
