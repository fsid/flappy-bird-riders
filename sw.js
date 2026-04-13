const CACHE_NAME = 'flappy-games-v1';
const APP_ASSETS = [
  './flappy-tahira.html',
  './flappy-eliza.html',
  './sw.js'
];

const getFallback = (requestUrl) =>
  requestUrl.includes('flappy-eliza.html') ? './flappy-eliza.html' : './flappy-tahira.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

const putInCache = async (request, response) => {
  if (!response || response.status !== 200) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
};

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      await putInCache(request, response.clone());
      return response;
    } catch (error) {
      if (request.mode === 'navigate') {
        return caches.match(getFallback(url.pathname));
      }
      return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    }
  })());
});
