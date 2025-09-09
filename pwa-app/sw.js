// LingoToday PWA Service Worker
// Handles push notifications, offline caching, and background sync

const CACHE_NAME = 'lingotoday-pwa-v1';
const API_BASE = 'https://lingotoday.replit.app';

// Files to cache for offline use
const STATIC_CACHE_URLS = [
    '/',
    '/simple-pwa.html',
    '/manifest.json'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('Service Worker: Installation complete');
                return self.skipWaiting();
            })
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activation complete');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip chrome-extension and non-http requests
    if (!event.request.url.startsWith('http')) return;
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
            .catch(() => {
                // If both cache and network fail, return offline page for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match('/simple-pwa.html');
                }
            })
    );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');
    
    let notificationData = {
        title: 'LingoToday',
        body: 'Time for your daily language lesson!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'lesson-reminder',
        data: {
            url: '/simple-pwa.html',
            action: 'lesson'
        }
    };
    
    // Parse push data if available
    if (event.data) {
        try {
            const pushData = event.data.json();
            notificationData = {
                ...notificationData,
                ...pushData
            };
        } catch (e) {
            console.log('Service Worker: Push data is not JSON');
            notificationData.body = event.data.text() || notificationData.body;
        }
    }
    
    // Show the notification
    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            data: notificationData.data,
            actions: [
                {
                    action: 'start-lesson',
                    title: 'Start Lesson',
                    icon: '/icons/icon-72x72.png'
                },
                {
                    action: 'dismiss',
                    title: 'Not Now'
                }
            ],
            requireInteraction: false,
            silent: false
        })
    );
});

// Notification click event - handle user interaction with notifications
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked', event);
    
    event.notification.close();
    
    // Handle action buttons
    if (event.action === 'dismiss') {
        return;
    }
    
    // Default action and 'start-lesson' action - open the app
    const urlToOpen = event.notification.data?.url || '/simple-pwa.html';
    
    event.waitUntil(
        self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // Check if app is already open
            for (const client of clientList) {
                if (client.url.includes('simple-pwa.html') && 'focus' in client) {
                    // Focus existing window and send message
                    client.focus();
                    client.postMessage({
                        type: 'NOTIFICATION_CLICK',
                        action: event.action || 'start-lesson'
                    });
                    return;
                }
            }
            
            // Open new window if app is not open
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

// Background sync event - sync data when connection is restored
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered', event.tag);
    
    if (event.tag === 'lesson-progress-sync') {
        event.waitUntil(
            syncLessonProgress()
        );
    }
});

// Sync lesson progress when back online
async function syncLessonProgress() {
    try {
        // Get cached progress data
        const cache = await caches.open(CACHE_NAME);
        const cachedData = await cache.match('/offline-progress');
        
        if (cachedData) {
            const progressData = await cachedData.json();
            
            // Send to server
            const response = await fetch(`${API_BASE}/api/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(progressData)
            });
            
            if (response.ok) {
                // Remove cached data after successful sync
                await cache.delete('/offline-progress');
                console.log('Service Worker: Progress synced successfully');
            }
        }
    } catch (error) {
        console.error('Service Worker: Failed to sync progress', error);
    }
}

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CACHE_LESSON_PROGRESS') {
        // Cache lesson progress for offline sync
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.put('/offline-progress', 
                    new Response(JSON.stringify(event.data.progress))
                );
            })
        );
    }
});

console.log('Service Worker: Loaded and ready');