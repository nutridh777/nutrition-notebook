// バージョン番号を上げると、古いキャッシュが自動的に破棄され、
// 次回起動時に新しいファイルへ切り替わります。
// ファイルを更新したときは、この数字を1つ増やしてください（v1 → v2 など）。
const CACHE_VERSION = "v2";
const CACHE_NAME = `nutrition-notebook-${CACHE_VERSION}`;

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("nutrition-notebook-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// キャッシュ優先、なければネットワークから取得（オフライン対応の要）
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          // オフラインかつキャッシュにも無い場合は index.html を返す
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        })
      );
    })
  );
});
