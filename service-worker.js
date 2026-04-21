const CACHE_NAME = 'cyberpwa-v1';
const OFFLINE_URL = 'offline.html';

// Pliki do cachowania
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-144x144.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalacja Service Workera
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache otwarty');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('Błąd cachowania:', err);
      })
  );
  self.skipWaiting();
});

// Aktywacja Service Workera
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Usuwanie starego cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - obsługa zapytań
self.addEventListener('fetch', (event) => {
  // Pomijamy zapytania do API - nie cachujemy ich
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // Pomijamy zapytania do zewnętrznych API (Anime)
  if (event.request.url.includes('animechan.xyz') || 
      event.request.url.includes('anime-facts-rest-api.herokuapp.com') ||
      event.request.url.includes('api.jikan.moe')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Zwróć z cache jeśli znaleziono
        if (response) {
          return response;
        }
        
        // Spróbuj pobrać z sieci
        return fetch(event.request)
          .then((networkResponse) => {
            // Sprawdź czy odpowiedź jest poprawna
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Skopiuj odpowiedź i zapisz w cache
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch(() => {
            // Jeśli to żądanie strony HTML, zwróć offline.html
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
            
            return new Response('Offline - brak połączenia z internetem', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
