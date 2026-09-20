// ============ APP: СОБЫТИЯ ГАПОВ, ХАШАРОВ, ПЛАНОВ, UGC ============

// === Транспорт ===
on('transportTabs', 'click', (e) => {
    if (!e.target.classList.contains('tab')) return;
    currentTransportType = e.target.dataset.type;
    renderTabs();
    renderTransport();
    saveState();
});

// === Рейтинг ===
on('ratingTabs', 'click', (e) => {
    if (!e.target.classList.contains('tab')) return;
    currentRatingType = e.target.dataset.rating;
    renderRatingTabs();
    renderRatings();
});

on('ratingPeriods', 'click', (e) => {
    const btn = e.target.closest('.rating-period');
    if (!btn) return;
    currentRatingPeriod = btn.dataset.period;
    renderRatingTabs();
    renderRatings();
});

on('questTabs', 'click', (e) => {
    if (!e.target.classList.contains('tab')) return;
    currentQuestTab = e.target.dataset.quest;
    _questsExpanded = false;
    renderQuestTabs();
    renderQuests();
});

// === Лента — фильтры ===
on('feedFilters', 'click', (e) => {
    if (!e.target.classList.contains('feed-filter')) return;
    currentFeedFilter = e.target.dataset.feed;

    document.querySelectorAll('.feed-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.feed === currentFeedFilter);
    });

    renderFeed();
});

// === Чек-ин ===
document.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('checkin-btn')) return;
    await checkIn(e.target.dataset.key);
});

// === Планы ===
on('planCityBtn', 'click', () => {
    openPlanModal(currentCity);
});

on('dashAddPlanBtn', 'click', () => {
    openPlanModal(PLAYER ? PLAYER.currentCity : 'tashkent');
});

on('planClose', 'click', () => {
    const modal = document.getElementById('planModal');
    if (modal) modal.style.display = 'none';
});

on('planModal', 'click', (e) => {
    if (e.target.id === 'planModal') e.target.style.display = 'none';
});

on('planSubmit', 'click', async () => {
    if (!PLAYER || !PLAYER.playerId) {
        showWarningToast('Сначала войди в аккаунт');
        return;
    }

    const cityKey = document.getElementById('planCity').value;
    const placeTitle = document.getElementById('planPlace').value.trim();
    const visitDate = document.getElementById('planDate').value;
    const note = document.getElementById('planNote').value.trim();

    if (!visitDate) {
        showWarningToast('Выбери дату 🙏');
        return;
    }

    await savePlan(PLAYER.playerId, {
        cityKey,
        placeTitle: placeTitle || null,
        visitDate,
        note: note || null,
    });

    await saveFeedEvent(PLAYER.playerId, 'plan', {
        placeTitle: placeTitle || null,
    }, cityKey);

    document.getElementById('planModal').style.display = 'none';
    await renderPlans();
});

document.addEventListener('click', async (e) => {
    if (e.target.dataset.planComplete) {
        await completePlan(e.target.dataset.planComplete);
        await renderPlans();
        return;
    }
    if (e.target.dataset.planDelete) {
        const ok = await showConfirm('Удалить план?', { okText: 'Удалить' });
        if (!ok) return;
        await deletePlan(e.target.dataset.planDelete);
        await renderPlans();
        return;
    }
});

// === UGC ===
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-place-btn')) {
        openAddPlaceModal(e.target.dataset.category);
        return;
    }
    if (e.target.classList.contains('delete-btn')) {
        deleteUserPlace(e.target.dataset.delCity, e.target.dataset.delCat, parseInt(e.target.dataset.delIdx));
        return;
    }
    if (e.target.classList.contains('edit-btn')) {
        editUserPlace(e.target.dataset.editCity, e.target.dataset.editCat, parseInt(e.target.dataset.editIdx));
        return;
    }
});

on('addPlaceSubmit', 'click', submitUserPlace);

on('addPlaceClose', 'click', () => {
    const modal = document.getElementById('addPlaceModal');
    if (modal) modal.style.display = 'none';
});

on('addPlaceModal', 'click', (e) => {
    if (e.target.id === 'addPlaceModal') e.target.style.display = 'none';
});

// === Клик по строкам гапов/хашаров ===
document.addEventListener('click', (e) => {
    const gapRow = e.target.closest('[data-gap-id]');
    if (gapRow) {
        if (typeof openGapModal === 'function') {
            openGapModal(gapRow.dataset.gapId);
        }
        return;
    }

    const hasharRow = e.target.closest('[data-hashar-id]');
    if (hasharRow) {
        if (typeof openHasharModal === 'function') {
            openHasharModal(hasharRow.dataset.hasharId);
        }
        return;
    }
});