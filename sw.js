// Lelo Sab Kuchh — service worker
// Caches static shell assets so the app is installable and loads fast.
// Live data (Firebase Auth / Firestore) always goes to the network —
// never cached — so menus, orders, and users stay accurate.

const CACHE_NAME = "lelo-sab-kuchh-v2";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/app.html",
  "/manifest.json",
  "/lelo-logo.jpg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-192-maskable.png",
  "/icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => console.warn("Precache failed:", err))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isLiveDataRequest(url) {
  return (
    url.includes("googleapis.com") ||
    url.includes("gstatic.com") ||
    url.includes("firestore") ||
    url.includes("identitytoolkit") ||
    url.includes("recaptcha")
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (isLiveDataRequest(event.request.url)) return; // let the browser handle these normally

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
