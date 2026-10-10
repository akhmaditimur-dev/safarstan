// ============ APP: СОБЫТИЯ ПОПУТЧИКОВ ============

// Открытие модалки создания
document.addEventListener('click', (e) => {
    if (e.target.closest('#tripCreateBtn') || e.target.closest('#tripCreateBtnEmpty')) {
        openTripCreateModal();
    }
});

// Закрытие
document.addEventListener('click', (e) => {
    if (e.target.id === 'tripCreateModal' || e.target.closest('#tripCreateClose')) {
        closeTripCreateModal();
    }
});

// Submit
document.addEventListener('click', async (e) => {
    if (!e.target.closest('#tripCreateSubmit')) return;
    await submitTripCreate();
});

// Фильтр
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-trip-filter]');
    if (!btn) return;
    TRIPS_FILTER_CITY = btn.dataset.tripFilter;
    document.querySelectorAll('.trip-filter').forEach(b => {
        b.classList.toggle('active', b === btn);
    });
    renderTrips();
});

// Присоединиться
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-trip-join]');
    if (!btn) return;
    btn.disabled = true;
    const result = await joinTrip(btn.dataset.tripJoin);
    btn.disabled = false;
    if (result.error) {
        if (typeof showWarningToast === 'function') showWarningToast(result.error);
        return;
    }
    if (typeof showWarningToast === 'function') showWarningToast('✅ Ты в поездке');
    await renderTrips();
});

// Отписаться
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-trip-leave]');
    if (!btn) return;
    const ok = await showConfirm('Отписаться от поездки?', { okText: 'Отписаться' });
    if (!ok) return;
    const result = await leaveTrip(btn.dataset.tripLeave);
    if (result.error) {
        if (typeof showWarningToast === 'function') showWarningToast(result.error);
        return;
    }
    await renderTrips();
});

// Отменить (водитель)
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-trip-cancel]');
    if (!btn) return;
    const ok = await showConfirm('Отменить поездку? Все пассажиры увидят это.', { okText: 'Отменить' });
    if (!ok) return;
    const result = await cancelTrip(btn.dataset.tripCancel);
    if (result.error) {
        if (typeof showWarningToast === 'function') showWarningToast(result.error);
        return;
    }
    await renderTrips();
});