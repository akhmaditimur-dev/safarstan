// ============ APP: СОБЫТИЯ БЛАГОТВОРИТЕЛЬНОСТИ ============

// Открыть модалку создания
document.addEventListener('click', (e) => {
    if (e.target.closest('#charityCreateBtn') || e.target.closest('#charityCreateBtnEmpty')) {
        openCharityCreateModal();
    }
});

// Закрыть
document.addEventListener('click', (e) => {
    if (e.target.id === 'charityCreateModal' || e.target.closest('#charityCreateClose')) {
        closeCharityCreateModal();
    }
});

// Submit
document.addEventListener('click', async (e) => {
    if (!e.target.closest('#charityCreateSubmit')) return;
    await submitCharityCreate();
});

// Смена типа в форме
document.addEventListener('change', (e) => {
    if (e.target.id === 'charityType') {
        toggleCharityTypeFields();
    }
});

// Фильтры
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-charity-filter]');
    if (!btn) return;
    CHARITY_FILTER = btn.dataset.charityFilter;
    document.querySelectorAll('.charity-filter').forEach(b => {
        b.classList.toggle('active', b === btn);
    });
    renderCharity();
});

// Открыть детали
document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-charity-id]');
    if (!card) return;
    if (e.target.closest('#charityReportBtn')) return; // отдельный обработчик
    openCharityDetail(card.dataset.charityId);
});

// Закрыть детали
document.addEventListener('click', (e) => {
    if (e.target.id === 'charityDetailModal' || e.target.closest('#charityDetailClose')) {
        closeCharityDetailModal();
    }
});