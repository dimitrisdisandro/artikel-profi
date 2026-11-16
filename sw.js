// sw.js — Service Worker (Offline-Betrieb)
// Strategie: zuerst das Netz, bei Fehler der Cache. So erscheinen Updates
// sofort, und die App läuft trotzdem offline.
const CACHE = 'artikel-profi-v1';
const ASSETS = [
  './', './index.html', './manifest.json',
  './core/core.css', './core/dom.js', './core/core.js',
  './app/nouns.js', './app/grammar.js', './app/modes.js', './app/config.js', './app/main.js',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
