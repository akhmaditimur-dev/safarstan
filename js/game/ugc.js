// ============ GAME: UGC (ПОЛЬЗОВАТЕЛЬСКИЕ МЕСТА) ============

const DAILY_LIMIT = 5;

function openAddPlaceModal(preselectedCategory) {
    if (!PLAYER) return;

    if (todayAddedCount >= DAILY_LIMIT) {
        showWarningToast(`Лимит на сегодня: ${DAILY_LIMIT} мест. Возвращайся завтра! 🛌`);
        return;
    }

    document.getElementById('addPlaceCityLabel').textContent = `Город: ${CITIES[currentCity].name}`;
    document.getElementById('placeName').value = '';
    document.getElementById('placeDesc').value = '';
    document.getElementById('placeMeta').value = '';
    document.getElementById('placeCategory').value = preselectedCategory || 'service';

    // Сброс тегов
    document.querySelectorAll('#placeTagsPicker .place-tag-option').forEach(btn => {
        btn.classList.remove('active');
});

document.getElementById('addPlaceModal').style.display = 'flex';}

async function submitUserPlace() {
    if (!PLAYER) return;

    const name = document.getElementById('placeName').value.trim();
    const desc = document.getElementById('placeDesc').value.trim();
    const category = document.getElementById('placeCategory').value;
    const meta = document.getElementById('placeMeta').value.trim();

    if (!name) { showWarningToast('Введи название 🙏'); return; }
    if (!desc) { showWarningToast('Добавь описание 🙏'); return; }

    const nameError = validateUserText(name, { minLength: 2, maxLength: 100, fieldName: 'Название' });
    if (nameError) { showWarningToast(nameError); return; }

    const descError = validateUserText(desc, { minLength: 2, maxLength: 500, fieldName: 'Описание' });
    if (descError) { showWarningToast(descError); return; }

    const metaParts = meta
        ? meta.split(',').map(s => s.trim()).slice(0, 2)
        : [category, '—'];
    while (metaParts.length < 2) metaParts.push('—');

    // Собираем теги
    const selectedTags = [];
    document.querySelectorAll('#placeTagsPicker .place-tag-option.active').forEach(btn => {
        selectedTags.push(btn.dataset.tag);
    });

    // ============ РЕЖИМ РЕДАКТИРОВАНИЯ ============
    if (_editPlaceCtx) {
        const { cityKey, category: oldCat, idx } = _editPlaceCtx;
        const place = USER_PLACES[cityKey]?.[oldCat]?.[idx];
        if (!place) { _editPlaceCtx = null; return; }

        const updates = {
            title: name,
            description: desc,
            category: category,
            meta: metaParts,
            tags: selectedTags,
        };

        if (place.id) {
            const { error } = await _supabase
                .from('user_places')
                .update(updates)
                .eq('id', place.id);

            if (error) {
                console.error('Ошибка обновления:', error);
                showWarningToast('Не удалось сохранить');
                return;
            }
        }

        // Обновляем локально
        Object.assign(place, {
            title: name,
            desc: desc,
            meta: metaParts,
            tags: selectedTags,
        });

        // Если менялась категория — переносим в другой массив
        if (category !== oldCat) {
            USER_PLACES[cityKey][oldCat].splice(idx, 1);
            if (!USER_PLACES[cityKey][category]) USER_PLACES[cityKey][category] = [];
            USER_PLACES[cityKey][category].push(place);
        }

        _editPlaceCtx = null;
        closeAddPlaceModal();
        showWarningToast('✅ Место обновлено');
        renderAll();
        return;
    }

    // ============ РЕЖИМ СОЗДАНИЯ ============
    if (todayAddedCount >= DAILY_LIMIT) {
        showWarningToast('Лимит на сегодня исчерпан');
        return;
    }

    const newPlace = {
        title: name,
        desc: desc,
        meta: metaParts,
        tags: selectedTags,
        author: PLAYER.name,
        authorAvatar: PLAYER.avatar || '🧑‍💼',
    };

    await saveUserPlace(PLAYER.playerId, currentCity, category, newPlace);
    await saveFeedEvent(PLAYER.playerId, 'ugc', {
        title: name,
    }, currentCity);

    if (!USER_PLACES[currentCity]) USER_PLACES[currentCity] = {};
    if (!USER_PLACES[currentCity][category]) USER_PLACES[currentCity][category] = [];
    USER_PLACES[currentCity][category].push(newPlace);

    incrementTodayAdded();

    PLAYER.userPlacesAdded = (PLAYER.userPlacesAdded || 0) + 1;
    PLAYER.xp += 30;

    const oldLevel = PLAYER.level;
    PLAYER.level = getLevelFromXP(PLAYER.xp);

    await savePlayerToServer(PLAYER);

    updatePlayerBadge();
    showXPToast(30, 'Новое место!');

    if (PLAYER.level > oldLevel) {
        setTimeout(() => showLevelUp(PLAYER.level), 400);
        await saveFeedEvent(PLAYER.playerId, 'level', {
            level: PLAYER.level,
        }, currentCity);
    }

    const newBadges = checkBadges();
    if (newBadges.length > 0) {
        await savePlayerToServer(PLAYER);
        newBadges.forEach((id, idx) => {
            setTimeout(() => showBadgeToast(getBadgeById(id)), 600 + idx * 800);
        });
        for (const badgeId of newBadges) {
            const badge = getBadgeById(badgeId);
            if (badge) {
                await saveFeedEvent(PLAYER.playerId, 'badge', {
                    badgeName: badge.name,
                    badgeIcon: badge.icon,
                }, currentCity);
            }
        }
    }

    const newQuests = checkQuests();
    if (newQuests.length > 0) {
        await savePlayerToServer(PLAYER);
        updatePlayerBadge();
        newQuests.forEach((q, idx) => {
            setTimeout(() => showQuestToast(q), 1400 + idx * 900);
        });
        for (const quest of newQuests) {
            await saveFeedEvent(PLAYER.playerId, 'quest', {
                questName: quest.name,
            }, currentCity);
        }
    }

    closeAddPlaceModal();
    renderAll();
    renderQuests();
}

// Сброс модалки в режим "создать"
function closeAddPlaceModal() {
    const modal = document.getElementById('addPlaceModal');
    if (!modal) return;

    modal.style.display = 'none';
    _editPlaceCtx = null;

    const titleEl = modal.querySelector('h2');
    const submitBtn = document.getElementById('addPlaceSubmit');
    if (titleEl) titleEl.textContent = 'Добавить место';
    if (submitBtn) submitBtn.textContent = 'Добавить место';
}

async function deleteUserPlace(cityKey, category, idx) {
    const ok = await showConfirm('Удалить это место?', { okText: 'Удалить' });
    if (!ok) return;

    const place = USER_PLACES[cityKey]?.[category]?.[idx];
    if (!place) return;

    if (place.playerId && place.playerId !== PLAYER.playerId) {
        showWarningToast('Можно удалять только свои места');
        return;
    }

    if (place.id) {
        const { error } = await _supabase
            .from('user_places')
            .delete()
            .eq('id', place.id);

        if (error) {
            console.error('Ошибка удаления:', error);
            showWarningToast('Не удалось удалить');
            return;
        }
    }

    USER_PLACES[cityKey][category].splice(idx, 1);
    renderAll();
}

// ============================================
// РЕДАКТИРОВАНИЕ UGC-МЕСТА
// ============================================
let _editPlaceCtx = null; // { cityKey, category, idx }

async function editUserPlace(cityKey, category, idx) {
    const place = USER_PLACES[cityKey]?.[category]?.[idx];
    if (!place) return;

    if (place.playerId && place.playerId !== PLAYER.playerId) {
        showWarningToast('Можно редактировать только свои места');
        return;
    }

    _editPlaceCtx = { cityKey, category, idx };

    const modal = document.getElementById('addPlaceModal');
    if (!modal) return;

    // Меняем заголовок и кнопку
    const titleEl = modal.querySelector('h2');
    const submitBtn = document.getElementById('addPlaceSubmit');
    if (titleEl) titleEl.textContent = 'Редактировать место';
    if (submitBtn) submitBtn.textContent = 'Сохранить изменения';

    // Заполняем форму
    document.getElementById('addPlaceCityLabel').textContent = `Город: ${CITIES[cityKey].name}`;
    document.getElementById('placeName').value = place.title || '';
    document.getElementById('placeDesc').value = place.desc || '';
    document.getElementById('placeCategory').value = category || 'service';

    // Метка
    const metaStr = (place.meta || []).filter(m => m && m !== '—').join(', ');
    document.getElementById('placeMeta').value = metaStr;

    // Теги
    document.querySelectorAll('#placeTagsPicker .place-tag-option').forEach(btn => {
        const tag = btn.dataset.tag;
        btn.classList.toggle('active', (place.tags || []).includes(tag));
    });

    modal.style.display = 'flex';
}