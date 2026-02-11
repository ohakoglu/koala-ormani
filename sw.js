const CACHE = "koala-ormani-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;

  // HTML: network-first (güncelleme gelsin), offline olursa cache
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put("./index.html", fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match("./index.html");
        return cached || new Response("Offline", { status: 200 });
      }
    })());
    return;
  }

  // Diğerleri: cache-first
  e.respondWith(
    caches.match(req).then((r) => r || fetch(req))
  );
});
