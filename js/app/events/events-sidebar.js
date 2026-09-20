// ============ APP: СОБЫТИЯ САЙДБАРА ============

document.addEventListener('click', async (e) => {
    // Клик по пункту сайдбара
    const navItem = e.target.closest('.dashboard-nav-item');
    if (!navItem) return;

    // Скролл к секции
    if (navItem.dataset.scroll) {
        const target = document.getElementById(navItem.dataset.scroll);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
    }

    // Открыть модалку
    if (navItem.dataset.openModal) {
        const modalId = navItem.dataset.openModal;
        openSidebarModal(modalId);
        return;
    }

    // Дропдаун уведомлений
    if (navItem.dataset.openDropdown) {
        e.stopPropagation(); // ← чтобы глобальный обработчик не закрыл сразу
        if (typeof toggleNotificationsDropdown === 'function') {
            await toggleNotificationsDropdown();
        }
        return;
    }
});

// Открытие нужной модалки
function openSidebarModal(modalId) {
    // Специальные случаи — с предварительным рендером
    if (modalId === 'profileModal' && typeof renderProfile === 'function') {
        renderProfile();
    }
    if (modalId === 'friendsModal' && typeof renderFriends === 'function') {
        renderFriends();
    }
    if (modalId === 'galleryModal' && typeof openGalleryModal === 'function') {
        openGalleryModal();
        return;
    }
    if (modalId === 'myReviewsModal' && typeof openMyReviewsModal === 'function') {
        openMyReviewsModal();
        return;
    }
    if (modalId === 'settingsModal' && typeof openSettingsModal === 'function') {
        openSettingsModal();
        if (typeof renderModulesSettings === 'function') renderModulesSettings();
        if (typeof renderPrivacySettings === 'function') renderPrivacySettings();
        return;
    }
    if (modalId === 'accessRequestsModal' && typeof openAccessRequestsModal === 'function') {
        openAccessRequestsModal();
        return;
    }

    // Универсально: показать модалку по id
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } else {
        console.warn('Модалка не найдена:', modalId);
    }
}