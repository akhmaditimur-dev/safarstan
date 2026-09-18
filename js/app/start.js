// ============ APP: ФИНАЛЬНЫЙ ЗАПУСК ============

// Регистрация Service Worker
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
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