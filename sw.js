const CACHE_NAME = 'products-app-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install - حفظ الملفات في الكاش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // تفعيل SW الجديد فوراً
  );
});

// Activate - حذف الكاش القديم
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
    }).then(() => self.clients.claim()) // السيطرة على جميع الصفحات
  );
});

// Fetch - استرجاع من الكاش أولاً، ثم الشبكة
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // إرجاع من الكاش إذا وُجد
        if (response) {
          return response;
        }
        
        // وإلا جلب من الشبكة
        return fetch(event.request).then((response) => {
          // لا نحفظ الطلبات غير GET
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // حفظ نسخة في الكاش
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => {
        // يمكن إرجاع صفحة offline هنا
        return caches.match('./index.html');
      })
  );
});
