// Flow PWA — Service Worker v1.2
const CACHE_NAME = 'flow-v1.2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// ── Install: cache app shell ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first, cache fallback ──
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── Push Notifications ──
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || '💧 Flow — זמן לשתות!';
  const options = {
    body: data.body || 'אל תשכח לשתות מים 💧',
    icon: data.icon || '/flow/icon.png',
    badge: '/flow/badge.png',
    vibrate: [100, 50, 100],
    data: { url: '/flow/' },
    actions: [
      { action: 'drink', title: '💧 שתיתי!', icon: './icon.png' },
      { action: 'later', title: 'אחר כך' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'drink') {
    // Post message to app to log 250ml
    e.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        if (clients.length > 0) {
          clients[0].postMessage({ type: 'QUICK_DRINK', ml: 250 });
          clients[0].focus();
        } else {
          self.clients.openWindow('./');
        }
      })
    );
  } else {
    e.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        if (clients.length > 0) clients[0].focus();
        else self.clients.openWindow('./');
      })
    );
  }
});
