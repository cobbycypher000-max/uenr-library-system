const CACHE_NAME = 'uenr-library-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
  // Add links to your CSS or main JS files here if you want them cached
];

// Install Service Worker
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Fetch network first, fallback to cache if offline
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});