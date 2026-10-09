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

    const planId = document.getElementById('planId')?.value || '';
    const cityKey = document.getElementById('planCity').value;
    const placeTitle = document.getElementById('planPlace').value.trim();
    const visitDate = document.getElementById('planDate').value;
    const note = document.getElementById('planNote').value.trim();

    if (!visitDate) {
        showWarningToast('Выбери дату 🙏');
        return;
    }

    if (planId) {
        // === Обновление ===
        const res = await updatePlan(planId, {
            cityKey,
            placeTitle: placeTitle || null,
            visitDate,
            note: note || null,
        });
        if (res?.error) {
            showWarningToast('Не удалось сохранить');
            return;
        }
        showWarningToast('✅ План обновлён');
    } else {
        // === Создание ===
        await savePlan(PLAYER.playerId, {
            cityKey,
            placeTitle: placeTitle || null,
            visitDate,
            note: note || null,
        });

        await saveFeedEvent(PLAYER.playerId, 'plan', {
            placeTitle: placeTitle || null,
        }, cityKey);

        showWarningToast('✅ План сохранён');
    }

    document.getElementById('planModal').style.display = 'none';
    await renderPlans();
});

document.addEventListener('click', async (e) => {
    // Кнопка может быть <button> с иконкой внутри — ищем через closest
    const completeBtn = e.target.closest('[data-plan-complete]');
    if (completeBtn) {
        e.preventDefault();
        e.stopPropagation();
        await completePlan(completeBtn.dataset.planComplete);
        await renderPlans();
        return;
    }

    const deleteBtn = e.target.closest('[data-plan-delete]');
    if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const ok = await showConfirm('Удалить план?', { okText: 'Удалить' });
        if (!ok) return;
        await deletePlan(deleteBtn.dataset.planDelete);
        await renderPlans();
        return;
    }

    const editBtn = e.target.closest('[data-plan-edit]');
    if (editBtn) {
        e.preventDefault();
        e.stopPropagation();
        const planId = editBtn.dataset.planEdit;
        const plan = (typeof PLANS !== 'undefined' ? PLANS : []).find(p => p.id === planId);
        if (!plan) {
            console.warn('План не найден:', planId);
            return;
        }
        openPlanModal(plan.city_key, plan);
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