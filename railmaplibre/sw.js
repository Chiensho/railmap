// Service Worker (MapLibre版)
// アプリ本体と路線データをキャッシュする。
// ベクタータイルはネット優先(量が多くキャッシュに溜め込まない)。

const CACHE = 'railmap-ml-v1';

const ASSETS = [
  './index.html',
  './manifest.json',
  './lines.geojson',
  './stations.geojson',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(
        ASSETS.map(function (url) {
          return cache.add(url).catch(function () {});
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  const url = event.request.url;

  // ベクタータイルとフォント/スプライトはネット優先(キャッシュしない)
  if (url.indexOf('openfreemap.org') !== -1) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request);
    })
  );
});
