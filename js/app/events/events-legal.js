// ============ APP: СОБЫТИЯ — ЮРИДИЧЕСКИЕ ДОКУМЕНТЫ ============

document.addEventListener('click', (e) => {
    // Открытие
    const opener = e.target.closest('[data-open-legal]');
    if (opener) {
        const doc = opener.dataset.openLegal; // 'privacy' или 'terms'
        const modalId = doc === 'privacy' ? 'privacyModal' : 'termsModal';
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        return;
    }

    // Закрытие — privacy
    if (e.target.closest('#privacyClose')) {
        document.getElementById('privacyModal').style.display = 'none';
        return;
    }
    if (e.target.id === 'privacyModal') {
        e.target.style.display = 'none';
        return;
    }

    // Закрытие — terms
    if (e.target.closest('#termsClose')) {
        document.getElementById('termsModal').style.display = 'none';
        return;
    }
    if (e.target.id === 'termsModal') {
        e.target.style.display = 'none';
        return;
    }
});