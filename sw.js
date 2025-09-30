// Service Worker for minhtriet.online
// Provides offline caching and performance optimization

const CACHE_NAME = 'minhtriet-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/main.js',
    '/js/utils.js',
    '/js/translations.js',
    '/images/avatar.webp',
    '/images/favicon.svg',
    '/lang/vi.js',
    '/lang/en.js',
    '/lang/zh.js',
    '/lang/ko.js',
    '/lang/th.js',
    '/lang/de.js',
    '/lang/es.js',
    '/lang/fr.js',
    '/lang/ja.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Cache installation failed:', error);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                
                // Clone the request because it's a stream
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then((response) => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response because it's a stream
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                }).catch(() => {
                    // If network fails and no cache, return offline page
                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for form submissions
self.addEventListener('sync', (event) => {
    if (event.tag === 'contact-form-sync') {
        event.waitUntil(syncContactForm());
    }
});

async function syncContactForm() {
    // Handle offline form submissions when back online
    try {
        const pendingForms = await getPendingForms();
        for (const formData of pendingForms) {
            await submitForm(formData);
            await removePendingForm(formData.id);
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

async function getPendingForms() {
    // Implementation for getting pending form submissions
    return [];
}

async function submitForm(formData) {
    // Implementation for submitting form
    return fetch('/contact', {
        method: 'POST',
        body: formData
    });
}

async function removePendingForm(id) {
    // Implementation for removing pending form
    return Promise.resolve();
}
