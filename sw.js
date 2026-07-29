// sw.js - Service Worker for Christmas FESTA Web App

const CACHE_NAME = 'christmas-festa-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './index.css',
  './app.js',
  './data.js',
  './manifest.json',
  './images/icon-192.jpg',
  './images/icon-512.jpg',
  './images/circles/keion.jpg',
  './images/circles/game.jpg',
  './images/circles/photo.jpg',
  './images/circles/sado.jpg',
  './images/circles/nazotoki.jpg',
  './images/circles/handicraft.jpg',
  './images/circles/pc.jpg',
  './images/circles/art.jpg',
  './images/circles/cooking.jpg',
  './images/circles/drama.jpg'
];

// インストール時にキャッシュを生成
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// キャッシュ優先（オフライン対応）の読み込み
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュに存在すればそれを返し、なければネットワークへリクエスト
        return response || fetch(event.request).then((fetchResponse) => {
          // 動的に取得した新しいファイルをキャッシュに保存（オプション）
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      }).catch(() => {
        // オフラインかつキャッシュにない場合のフォールバック（例：index.htmlを返す）
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
