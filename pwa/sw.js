// Service worker for offline support

const CACHE_NAME = 'marathon-tracker-v1';
// Get base path for GitHub Pages
const getBasePath = () => {
    // If we're on GitHub Pages, the path includes the repo name
    const path = self.location.pathname;
    if (path.includes('/marath0n/')) {
        return '/marath0n/';
    }
    return '/';
};

const BASE_PATH = getBasePath();

const STATIC_ASSETS = [
    BASE_PATH + 'index.html',
    BASE_PATH + 'styles.css',
    BASE_PATH + 'app.js',
    BASE_PATH + 'db.js',
    BASE_PATH + 'plan.js',
    BASE_PATH + 'stats.js',
    BASE_PATH + 'workouts.js',
    BASE_PATH + 'ui.js',
    BASE_PATH + 'pwa/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Only handle GET requests for our app files
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request).then((fetchResponse) => {
                    // Don't cache non-successful responses
                    if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                        return fetchResponse;
                    }
                    
                    // Clone the response for caching
                    const responseToCache = fetchResponse.clone();
                    
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    
                    return fetchResponse;
                });
            })
            .catch(() => {
                // If both cache and network fail, return offline page if it's a navigation request
                if (event.request.mode === 'navigate') {
                    return caches.match(BASE_PATH + 'index.html');
                }
            })
    );
});

