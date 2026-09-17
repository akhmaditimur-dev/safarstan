// ============ GAME: ЧЕК-ИН ============

const CHECKIN_COOLDOWN_MS = 60 * 60 * 1000;   // 1 час
const DAILY_CHECKIN_LIMIT = 5;                // 5 в день

let lastCheckinTime = 0;

async function checkIn(checkinKey) {
    if (!PLAYER) return;

    // Защита от undefined (старые профили)
    if (!PLAYER.checkinCooldowns) PLAYER.checkinCooldowns = {};
    if (typeof PLAYER.todayCheckins !== 'number') PLAYER.todayCheckins = 0;

    // === АНТИ-СПАМ: 2 секунды между кликами ===
    const now = Date.now();
    if (now - lastCheckinTime < 2000) {
        showWarningToast('⏳ Слишком быстро! Подожди 2 сек');
        return;
    }
    lastCheckinTime = now;

    // === СБРОС ДНЕВНОГО СЧЁТЧИКА ===
    const todayStr = new Date().toISOString().slice(0, 10);
    if (PLAYER.todayDate !== todayStr) {
        PLAYER.todayDate = todayStr;
        PLAYER.todayCheckins = 0;
    }

    // === ЛИМИТ 5 В ДЕНЬ ===
    if (PLAYER.todayCheckins >= DAILY_CHECKIN_LIMIT) {
        showWarningToast(`🚫 Лимит ${DAILY_CHECKIN_LIMIT} чек-инов в день`);
        return;
    }

    // === КУЛДАУН 1 ЧАС НА МЕСТО ===
    const lastTime = PLAYER.checkinCooldowns[checkinKey] || 0;
    const elapsed = now - lastTime;
    if (elapsed < CHECKIN_COOLDOWN_MS) {
        const remainingMin = Math.ceil((CHECKIN_COOLDOWN_MS - elapsed) / 60000);
        showWarningToast(`⏳ Это место — через ${remainingMin} мин`);
        return;
    }

    // === ПРОХОДИМ — ДЕЛАЕМ ЧЕК-ИН ===
    const cityKey = checkinKey.split('|')[0];
    const category = checkinKey.split('|')[1];
    const placeTitle = checkinKey.split('|')[2];
    const isFirstTimeInCity = !PLAYER.visitedCities[cityKey];

    let xpGained = 5;
    let reason = 'Свой город';

    if (cityKey === PLAYER.homeCity && cityKey !== PLAYER.currentCity) {
        xpGained = 7;
        reason = 'Родной город';
    } else if (cityKey !== PLAYER.currentCity && cityKey !== PLAYER.homeCity) {
        xpGained = 15;
        reason = 'Чужой город';
    }

    if (isFirstTimeInCity) {
        xpGained += 30;
        reason = '🌟 Новый город!';
    }

    // Обновляем PLAYER
    PLAYER.checkins[checkinKey] = (PLAYER.checkins[checkinKey] || 0) + 1;
    PLAYER.visitedCities[cityKey] = (PLAYER.visitedCities[cityKey] || 0) + 1;
    PLAYER.xp += xpGained;

    // Обновляем защиту
    PLAYER.checkinCooldowns[checkinKey] = now;
    PLAYER.todayCheckins += 1;

    // Очки городам
    ensureCityScores();
    const isHomeCity = (cityKey === PLAYER.homeCity);
    const isCurrentCity = (cityKey === PLAYER.currentCity);
    const isForeignCity = !isHomeCity && !isCurrentCity;

    if (isCurrentCity) CITY_SCORES[cityKey].residents += 5;
    if (isHomeCity && !isCurrentCity) CITY_SCORES[cityKey].home += 7;
    if (isForeignCity) {
        const bonus = isFirstTimeInCity ? 20 : 10;
        CITY_SCORES[cityKey].hospitality += bonus;
    }

    // Уровень
    const oldLevel = PLAYER.level;
    PLAYER.level = getLevelFromXP(PLAYER.xp);

    // Сохранение
    await savePlayerToServer(PLAYER);
    await saveFeedEvent(PLAYER.playerId, 'checkin', {
        place: placeTitle,
    }, cityKey);
    await saveCheckin(PLAYER.playerId, cityKey, category, placeTitle);
    await updateCityScore(
        cityKey,
        isCurrentCity ? 'residents' : isHomeCity ? 'home' : 'hospitality',
        isCurrentCity ? 5 : isHomeCity ? 7 : (isFirstTimeInCity ? 20 : 10)
    );

    updatePlayerBadge();
    showXPToast(xpGained, reason);

    if (PLAYER.level > oldLevel) {
        setTimeout(() => showLevelUp(PLAYER.level), 400);
    }

    const newBadges = checkBadges();
    if (newBadges.length > 0) {
        await savePlayerToServer(PLAYER);
        newBadges.forEach((id, idx) => {
            setTimeout(() => showBadgeToast(getBadgeById(id)), 600 + idx * 800);
        });
    }

    const newQuests = checkQuests();
    if (newQuests.length > 0) {
        await savePlayerToServer(PLAYER);
        updatePlayerBadge();
        newQuests.forEach((quest, idx) => {
            setTimeout(() => showQuestToast(quest), 1400 + idx * 900);
        });
    }

    renderAll();
    renderRatings();
    renderQuests();
    updateMapMarkers();
}