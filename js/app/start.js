// ============ APP: ФИНАЛЬНЫЙ ЗАПУСК ============

// Регистрация Service Worker (только через http://, не file://)
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
            .then((reg) => console.log('✅ SW зарегистрирован:', reg.scope))
            .catch((err) => console.warn('⚠️ SW не зарегистрирован:', err));
    });
}

// Тема и язык — не зависят от игрока, можно сразу
initTheme();
applyLang();

// Иконки Lucide — для статических элементов в шапке
if (typeof lucide !== 'undefined') lucide.createIcons();

// Всё остальное — внутри initApp()
initApp();