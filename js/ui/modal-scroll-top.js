// ============ UI: КНОПКА «НАВЕРХ» В МОДАЛКАХ ============

(function initModalScrollTop() {
    // Какие модалки получают кнопку
    const MODAL_IDS = [
        'profileModal',
        'playerProfileModal',
        'myReviewsModal',
        'galleryModal',
        'settingsModal',
        'faqModal',
        'privacyModal',
        'termsModal',
        'mapSettingsModal',
        'resetProgressModal',
        'friendsModal',
        'blockedListModal',
        'notificationsModal',
        'adminReportsModal',
        'accessRequestsModal',
    ];

    // Настройка порога появления
    const SCROLL_THRESHOLD = 200;

    function attachToModal(modalEl) {
        if (!modalEl || modalEl.dataset.scrollTopAttached === '1') return;
        modalEl.dataset.scrollTopAttached = '1';

        const modalBox = modalEl.querySelector('.modal');
        if (!modalBox) return;

        // Создаём кнопку
        const btn = document.createElement('button');
        btn.className = 'modal-scroll-top';
        btn.type = 'button';
        btn.title = 'Наверх';
        btn.innerHTML = '<i data-lucide="arrow-up"></i>';
        modalBox.appendChild(btn);

        // Показ/скрытие
        modalBox.addEventListener('scroll', () => {
            btn.classList.toggle('visible', modalBox.scrollTop > SCROLL_THRESHOLD);
        }, { passive: true });

        // Клик — наверх
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            modalBox.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function attachAll() {
        MODAL_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) attachToModal(el);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // При DOM готов
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachAll);
    } else {
        attachAll();
    }

    // Экспорт для повторного вызова (например, после рендера модалки)
    window.attachModalScrollTops = attachAll;
})();