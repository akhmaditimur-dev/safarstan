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

    document.getElementById('addPlaceModal').style.display = 'flex';
}

async function submitUserPlace() {
    if (!PLAYER) return;

    const name = document.getElementById('placeName').value.trim();
    const desc = document.getElementById('placeDesc').value.trim();
    const category = document.getElementById('placeCategory').value;
    const meta = document.getElementById('placeMeta').value.trim();

    if (!name) { showWarningToast('Введи название 🙏'); return; }
    if (!desc) { showWarningToast('Добавь описание 🙏'); return; }

    // Проверка названия
    const nameError = validateUserText(name, { minLength: 2, maxLength: 100, fieldName: 'Название' });
    if (nameError) { showWarningToast(nameError); return; }

    // Проверка описания
    const descError = validateUserText(desc, { minLength: 2, maxLength: 500, fieldName: 'Описание' });
    if (descError) { showWarningToast(descError); return; }

    if (todayAddedCount >= DAILY_LIMIT) {
        showWarningToast('Лимит на сегодня исчерпан');
        return;
    }

    const metaParts = meta
        ? meta.split(',').map(s => s.trim()).slice(0, 2)
        : [category, '—'];
    while (metaParts.length < 2) metaParts.push('—');

    const newPlace = {
        title: name,
        desc: desc,
        meta: metaParts,
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

    document.getElementById('addPlaceModal').style.display = 'none';

    renderAll();
    renderQuests();
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

async function editUserPlace(cityKey, category, idx) {
    const place = USER_PLACES[cityKey]?.[category]?.[idx];
    if (!place) return;

    if (place.playerId && place.playerId !== PLAYER.playerId) {
        showWarningToast('Можно редактировать только свои места');
        return;
    }

    // ⚠️ prompt() оставлен временно — потом заменим на кастомную модалку
    const newName = prompt('Новое название:', place.title);
    if (newName === null) return;
    const newDesc = prompt('Новое описание:', place.desc);
    if (newDesc === null) return;

    const updates = {};
    if (newName.trim()) updates.title = newName.trim();
    if (newDesc.trim()) updates.description = newDesc.trim();

    if (Object.keys(updates).length === 0) return;

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

    if (updates.title) place.title = updates.title;
    if (updates.description) place.desc = updates.description;

    renderAll();
}