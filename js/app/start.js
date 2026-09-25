// ============ APP: ФИНАЛЬНЫЙ ЗАПУСК ============

// Регистрация Service Worker
// ⚠️ На localhost (127.0.0.1 / localhost) SW НЕ регистрируется —
//    чтобы кэш не мешал при разработке.
if (
    'serviceWorker' in navigator
    && location.protocol !== 'file:'
    && location.hostname !== '127.0.0.1'
    && location.hostname !== 'localhost'
) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((reg) => console.log('✅ SW зарегистрирован:', reg.scope))
            .catch((err) => console.warn('⚠️ SW не зарегистрирован:', err));
    });
}

// Тема — не зависит от игрока
initTheme();

// Иконки Lucide для статики
if (typeof lucide !== 'undefined') lucide.createIcons();

// Запуск приложения
initApp().then(() => {
    if (typeof PLAYER !== 'undefined' && PLAYER && PLAYER.playerId) {
        if (typeof startHeartbeat === 'function') {
            startHeartbeat(PLAYER.playerId);
        }
    }
});

// ============================================
// ПУБЛИЧНЫЕ ССЫЛКИ НА ПРОФИЛЬ
// ============================================

(function checkPublicProfileLinks() {
    const urlParams = new URLSearchParams(location.search);
    const publicPlayerId = urlParams.get('p');   // ?p=playerId

    // === 1. Проверяем ?p= (старый формат) ===
    if (publicPlayerId) {
        setTimeout(() => {
            if (typeof openPublicProfile === 'function') {
                openPublicProfile(publicPlayerId);
            }
        }, 300);
        return;
    }

    // === 2. Проверяем #u/ник (новый формат) ===
    const hash = location.hash;
    if (hash && hash.startsWith('#u/')) {
        const username = hash.substring(3).trim();
        if (!username) return;

        setTimeout(() => {
            if (typeof openPublicProfileByUsername === 'function') {
                openPublicProfileByUsername(username);
            } else {
                console.warn('openPublicProfileByUsername не найдена');
            }
        }, 300);
    }
})();

// === Обработка изменения хэша (если пользователь перешёл по ссылке вручную) ===
window.addEventListener('hashchange', () => {
    const hash = location.hash;
    if (hash && hash.startsWith('#u/')) {
        const username = hash.substring(3).trim();
        if (username && typeof openPublicProfileByUsername === 'function') {
            openPublicProfileByUsername(username);
        }
    }
});