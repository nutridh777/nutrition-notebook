// バージョン番号を上げると、古いキャッシュが自動的に破棄され、
// 次回起動時に新しいファイルへ切り替わります。
// ファイルを更新したときは、この数字を1つ増やしてください（v1 → v2 など）。
const CACHE_VERSION = "v18";
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

// 今のバージョンのキャッシュだけを見る（古いキャッシュの削除が中断されても
// 誤って古い内容を返さないようにするため）。無ければネットワークから取得する。
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request)
            .then((response) => {
              // ネットワークから取れたら今のバージョンのキャッシュにも保存しておく
              if (response && response.ok && event.request.method === "GET") {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // オフラインかつキャッシュにも無い場合は index.html を返す
              if (event.request.mode === "navigate") {
                return cache.match("./index.html");
              }
            })
        );
      })
    )
  );
});
