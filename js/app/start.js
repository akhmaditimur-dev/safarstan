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
initApp();