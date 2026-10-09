// ============ APP: СОБЫТИЯ ПОЛЕЗНОГО ============

// Открыть модалку «Добавить полезное»
document.addEventListener('click', (e) => {
    if (!e.target.closest('#usefulAddBtn, #usefulAddBtnEmpty')) return;
    openUsefulAddModal();
});

// Открыть модалку «Все полезное»
document.addEventListener('click', (e) => {
    if (!e.target.closest('#usefulShowAllBtn')) return;
    openUsefulAllModal();
});

// Закрыть модалки
document.addEventListener('click', (e) => {
    if (e.target.id === 'usefulAddModal' || e.target.closest('#usefulAddClose')) {
        closeUsefulAddModal();
    }
    if (e.target.id === 'usefulAllModal' || e.target.closest('#usefulAllClose')) {
        closeUsefulAllModal();
    }
});

// Submit добавления
document.addEventListener('click', async (e) => {
    if (!e.target.closest('#usefulAddSubmit')) return;
    await submitUsefulAdd();
});

// Фильтр категорий в модалке «Все полезное»
document.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-useful-filter]');
    if (!chip) return;
    USEFUL_FILTER = chip.dataset.usefulFilter;
    renderUsefulAllToolbar();
    renderUsefulAllList();
});

// Удаление своего полезного места
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-useful-delete]');
    if (!btn) return;

    const ok = await showConfirm('Удалить это место?', { okText: 'Удалить' });
    if (!ok) return;

    const id = btn.dataset.usefulDelete;
    const res = await deleteUsefulPlace(id);

    if (res.error) {
        if (typeof showWarningToast === 'function') showWarningToast('Не удалось удалить');
        return;
    }

    // Обновляем оба списка
    await renderUsefulCard();

    // Если открыта модалка — перезагружаем её
    const allModal = document.getElementById('usefulAllModal');
    if (allModal && allModal.style.display === 'flex') {
        USEFUL_ALL = USEFUL_ALL.filter(x => x.id !== id);
        renderUsefulAllList();
    }
});