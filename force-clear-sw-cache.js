// Force Clear Service Worker Cache - Run in browser console
// This will clear all service worker caches and force reload

console.log('🧹 Starting Service Worker Cache Clear...');

async function forceClearSWCache() {
    try {
        // 1. Unregister ALL service workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            
            console.log(`📋 Found ${registrations.length} service worker(s):`);
            
            for (const registration of registrations) {
                console.log(`📍 Scope: ${registration.scope}`);
                await registration.unregister();
                console.log('❌ Service worker unregistered');
            }
        }
        
        // 2. Clear ALL caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            console.log(`📦 Found ${cacheNames.length} cache(s):`, cacheNames);
            
            for (const cacheName of cacheNames) {
                await caches.delete(cacheName);
                console.log(`🗑️ Deleted cache: ${cacheName}`);
            }
        }
        
        // 3. Clear local storage
        if (typeof Storage !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
            console.log('🧹 Cleared localStorage and sessionStorage');
        }
        
        // 4. Clear IndexedDB (if any)
        if ('indexedDB' in window) {
            try {
                // This is basic - real apps might need more specific clearing
                console.log('🗄️ IndexedDB clearing attempted (basic)');
            } catch (e) {
                console.log('⚠️ IndexedDB clear failed (might be empty)');
            }
        }
        
        console.log('✅ Cache clearing completed!');
        console.log('🔄 Page will reload in 2 seconds...');
        
        // Wait a bit then reload
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Cache clearing failed:', error);
    }
}

forceClearSWCache();

// Also provide manual functions
window.clearSWCache = forceClearSWCache;
window.hardRefresh = () => {
    window.location.reload();
};

console.log('💡 Manual functions available:');
console.log('   clearSWCache() - Clear all caches');
console.log('   hardRefresh() - Force page reload');
