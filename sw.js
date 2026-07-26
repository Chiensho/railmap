// Service Worker: アプリの表示に必要なファイルをキャッシュする。
// これがあるとホーム画面追加時に「アプリ」として扱われ、
// 一度開けばオフラインでも起動できる。

const CACHE = 'railmap-v1';

// キャッシュするファイル。データを更新したら CACHE の 'v1' を
// 'v2' などに上げると、次回アクセス時に取り直される。
const ASSETS = [
  './index.html',
  './manifest.json',
  './lines.geojson',
  './stations.geojson',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // 地図タイルは数が多く容量を食うのでここには入れない。
      // 失敗しても install を止めないよう個別に握りつぶす。
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

  // 地図タイルはネット優先(キャッシュに溜め込まない)
  if (url.indexOf('basemaps.cartocdn.com') !== -1) {
    return; // 既定のネット取得に任せる
  }

  // それ以外はキャッシュ優先、無ければネット取得
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request);
    })
  );
});
