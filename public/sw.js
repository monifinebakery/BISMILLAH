// Service Worker for HPP Calculator PWA
// Provides offline functionality and intelligent caching

const CACHE_NAME = 'hpp-calculator-v3';
const STATIC_CACHE = 'hpp-static-v3';
const DYNAMIC_CACHE = 'hpp-dynamic-v3';
const API_CACHE = 'hpp-api-v3';
const ASSETS_CACHE = 'hpp-assets-v3';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/pwa-192.png',
  '/pwa-512.png'
];

// Critical assets patterns to cache aggressively
const CRITICAL_ASSET_PATTERNS = [
  /\/assets\/index-[\w-]+\.js$/,
  /\/assets\/index-[\w-]+\.css$/,
  /\/assets\/vendor-[\w-]+\.js$/
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/warehouse',
  '/api/orders',
  '/api/recipes',
  '/api/suppliers'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE &&
                cacheName !== ASSETS_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Check if request is for static asset
function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

// Check if request is for API
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') || 
         url.hostname.includes('supabase') ||
         API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint));
}

// Check if request is navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const url = new URL(request.url);
  
  try {
    // Check if it's a critical asset
    const isCriticalAsset = CRITICAL_ASSET_PATTERNS.some(pattern => 
      pattern.test(url.pathname)
    );
    
    const cacheName = isCriticalAsset ? ASSETS_CACHE : STATIC_CACHE;
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', url.pathname);
      return cachedResponse;
    }
    
    console.log('[SW] Fetching from network:', url.pathname);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached asset:', url.pathname);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', url.pathname, error);
    
    // Try to find in any cache as fallback
    const cacheNames = [ASSETS_CACHE, STATIC_CACHE, DYNAMIC_CACHE];
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log('[SW] Fallback cache hit:', url.pathname);
        return cachedResponse;
      }
    }
    
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Network failed, trying cache for API request');
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Data not available offline',
        offline: true 
      }), 
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle navigation with cache-first, fallback to index.html
async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Navigation failed, serving cached index.html');
    
    const cachedResponse = await caches.match('/index.html');
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('App not available offline', { status: 503 });
  }
}

// Handle dynamic requests with network-first strategy
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Content not available offline', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Handle background sync
async function doBackgroundSync() {
  try {
    console.log('[SW] Performing background sync...');
    // Implement offline action sync here
    // For example: sync pending orders, warehouse updates, etc.
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Buka App',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Tutup',
        icon: '/favicon.ico'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('HPP Calculator', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then(cache => cache.addAll(event.data.payload))
    );
  }
});

console.log('[SW] Service worker script loaded');