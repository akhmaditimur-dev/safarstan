// ============ SAFARSTAN — SERVICE WORKER ============

const CACHE_VERSION = 'v4';
const CACHE_STATIC = `safarstan-static-${CACHE_VERSION}`;
const CACHE_RUNTIME = `safarstan-runtime-${CACHE_VERSION}`;
const CACHE_TILES = `safarstan-tiles-${CACHE_VERSION}`;

// Статика для кэша при установке
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',

    // Стили
    './styles/tokens.css',
    './styles/base.css',
    './styles/layout.css',
    './styles/responsive.css',
    './styles/components/buttons.css',
    './styles/components/cards.css',
    './styles/components/tabs.css',
    './styles/components/badges.css',
    './styles/components/modals.css',
    './styles/components/forms.css',
    './styles/components/toast.css',
    './styles/components/navigation.css',
    './styles/sections/hero.css',
    './styles/sections/city.css',
    './styles/sections/ratings.css',
    './styles/sections/quests.css',
    './styles/sections/map.css',
    './styles/sections/transport.css',
    './styles/sections/hotels.css',
    './styles/sections/services.css',
    './styles/sections/ugc.css',
    './styles/sections/profile.css',
    './styles/sections/reviews.css',
    './styles/sections/photos.css',
    './styles/sections/landing.css',
    './styles/sections/dashboard.css',
    './styles/sections/sections.css',

    // Данные
    './config.js',
    './data.js',
    './supabase.js',
    './storage.js',

    // API
    './js/api/auth.js',
    './js/api/player.js',
    './js/api/checkins.js',
    './js/api/cities.js',
    './js/api/ugc.js',
    './js/api/plans.js',
    './js/api/feed.js',
    './js/api/friends.js',
    './js/api/reviews.js',
    './js/api/photos.js',
    './js/api/gaps.js',
    './js/api/hashars.js',

    // Game
    './js/game/helpers.js',
    './js/game/checkin.js',
    './js/game/badges.js',
    './js/game/quests.js',
    './js/game/ugc.js',

    // UI
    './js/ui/toast.js',
    './js/ui/cards.js',
    './js/ui/sections.js',
    './js/ui/city-selector.js',
    './js/ui/ratings.js',
    './js/ui/quests.js',
    './js/ui/map.js',
    './js/ui/profile.js',
    './js/ui/header-search.js',
    './js/ui/dashboard.js',
    './js/ui/feed.js',
    './js/ui/friends.js',
    './js/ui/reviews.js',
    './js/ui/all.js',
    './js/ui/modules.js',
    './js/ui/gaps.js',
    './js/ui/hashars.js',

    // App
    './js/app/init.js',
    './js/app/events.js',
    './js/app/start.js',

    // Иконки
    './icons/icon-192.png',
    './icons/icon-512.png',
];

// ============ INSTALL ============
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_STATIC).then((cache) => {
            console.log('📦 Кэшируем статику...');
            // addAll падает при любой ошибке — используем allSettled
            return Promise.allSettled(
                STATIC_ASSETS.map(url =>
                    cache.add(url).catch(err => {
                        console.warn('Не удалось закэшировать:', url, err);
                    })
                )
            );
        }).then(() => self.skipWaiting())
    );
});

// ============ ACTIVATE ============
self.addEventListener('activate', (event) => {
    const VALID_CACHES = [CACHE_STATIC, CACHE_RUNTIME, CACHE_TILES];

    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (!VALID_CACHES.includes(key)) {
                        console.log('🗑 Удаляем старый кэш:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ============ FETCH ============
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Игнорируем не http(s)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

    // Игнорируем не-GET
    if (request.method !== 'GET') return;

    // === 1. Supabase API — не кэшируем, идём в сеть ===
    if (url.hostname.includes('supabase.co')) return;

    // === 2. Карта (OSM-тайлы) — кэш-первый с лимитом ===
    if (url.hostname.includes('tile.openstreetmap.org') ||
        url.hostname.includes('tile.osm.org')) {
        event.respondWith(cacheFirstWithLimit(request, CACHE_TILES, 500));
        return;
    }

    // === 3. Шрифты Google — stale-while-revalidate ===
    if (url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com')) {
        event.respondWith(staleWhileRevalidate(request, CACHE_RUNTIME));
        return;
    }

    // === 4. CDN (ol.js, lucide, supabase-js) — stale-while-revalidate ===
    if (url.hostname.includes('unpkg.com') ||
        url.hostname.includes('jsdelivr.net')) {
        event.respondWith(staleWhileRevalidate(request, CACHE_RUNTIME));
        return;
    }

    // === 5. Локальные файлы ===
    // HTML — network-first с фолбэком
    if (request.destination === 'document' ||
        url.pathname.endsWith('.html') ||
        url.pathname === '/' ||
        url.pathname.endsWith('/')) {
        event.respondWith(networkFirstHTML(request));
        return;
    }

    // CSS / JS / иконки — cache-first
    if (request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'image' ||
        url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|webp|woff2?|ttf)$/i)) {
        event.respondWith(cacheFirst(request, CACHE_STATIC));
        return;
    }

    // Остальное — идём в сеть
});

// ============================================
// СТРАТЕГИИ
// ============================================

// Cache-first: сначала кэш, потом сеть (и кэшируем)
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response && response.status === 200 && response.type === 'basic') {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        // Если нет ни кэша, ни сети
        return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
}

// Network-first для HTML: сеть, при ошибке — кэш
async function networkFirstHTML(request) {
    const cache = await caches.open(CACHE_STATIC);

    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        const cached = await cache.match(request);
        if (cached) return cached;
        // Fallback — index.html
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
        return new Response('<h1>Нет соединения</h1><p>Проверь интернет и обнови страницу.</p>', {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    }
}

// Stale-while-revalidate: отдаём кэш, в фоне обновляем
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request).then((response) => {
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => cached);

    return cached || fetchPromise;
}

// Cache-first с лимитом записей (для тайлов карты)
async function cacheFirstWithLimit(request, cacheName, maxEntries) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            cache.put(request, response.clone());
            // Чистим, если превышен лимит
            trimCache(cacheName, maxEntries);
        }
        return response;
    } catch (err) {
        return new Response('', { status: 503 });
    }
}

async function trimCache(cacheName, maxEntries) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
        // Удаляем самые старые
        const toDelete = keys.slice(0, keys.length - maxEntries);
        await Promise.all(toDelete.map(k => cache.delete(k)));
    }
}