// ============ GAME: ЧЕК-ИН ============

const CHECKIN_COOLDOWN_MS = 60 * 60 * 1000;   // 1 час
const DAILY_CHECKIN_LIMIT = 5;                // 5 в день
const REVISIT_XP_DAYS = 30;                   // через 30 дней — полный XP снова
const REVISIT_XP_MS = REVISIT_XP_DAYS * 24 * 60 * 60 * 1000;

let lastCheckinTime = 0;

async function checkIn(checkinKey) {
    if (!PLAYER) return;

    // Защита от undefined (старые профили)
    if (!PLAYER.checkinCooldowns) PLAYER.checkinCooldowns = {};
    if (typeof PLAYER.todayCheckins !== 'number') PLAYER.todayCheckins = 0;

    // === АНТИ-СПАМ: 2 секунды между кликами ===
    const now = Date.now();
    if (now - lastCheckinTime < 2000) {
        showWarningToast('Слишком быстро! Подожди 2 секунды');
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
        showWarningToast(`Лимит ${DAILY_CHECKIN_LIMIT} чек-инов в день`);
        return;
    }

    // === КУЛДАУН 1 ЧАС НА МЕСТО ===
    const lastTime = PLAYER.checkinCooldowns[checkinKey] || 0;
    const elapsed = now - lastTime;
    if (elapsed < CHECKIN_COOLDOWN_MS) {
        const remainingMin = Math.ceil((CHECKIN_COOLDOWN_MS - elapsed) / 60000);
        showWarningToast(`Это место — через ${remainingMin} мин`);
        return;
    }

    // === РАЗБОР КЛЮЧА ===
    const [cityKey, category, placeTitle] = checkinKey.split('|');
    const isFirstTimeInCity = !PLAYER.visitedCities[cityKey];

    const isHomeCity = (cityKey === PLAYER.homeCity);
    const isCurrentCity = (cityKey === PLAYER.currentCity);
    const isForeignCity = !isHomeCity && !isCurrentCity;

    // === XP ===
    // === ПРОВЕРКА: был ли тут раньше и когда ===
    const previousVisits = PLAYER.checkins[checkinKey] || 0;
    const lastVisitAt = PLAYER.checkinLastAt?.[checkinKey] || 0;
    const daysSinceLastVisit = lastVisitAt
        ? (now - lastVisitAt) / (24 * 60 * 60 * 1000)
        : Infinity;

    // Если > 30 дней — считаем как новое посещение (или первое вообще)
    const isRevisit = previousVisits > 0 && daysSinceLastVisit >= REVISIT_XP_DAYS;
    const treatAsNew = previousVisits === 0 || isRevisit;

    // === XP ===
    let xpGained = 5;
    let reason = 'Свой город';

    if (isHomeCity && !isCurrentCity) {
        xpGained = 7;
        reason = 'Родной город';
    } else if (isForeignCity) {
        xpGained = 15;
        reason = 'Чужой город';
    }

    if (treatAsNew) {
        // Свежий визит — полный XP + бонус за новое место
        if (isRevisit) {
            reason = `Снова тут (${REVISIT_XP_DAYS}+ дней)`;
        }
    } else {
        // Был недавно — уменьшенный XP
        xpGained = Math.max(1, Math.floor(xpGained / 2));
        reason = 'Повторный визит';
    }

    if (isFirstTimeInCity) {
        xpGained += 30;
        reason = 'Новый город!';
    }

    // === ОБНОВЛЕНИЕ PLAYER ===
    if (!PLAYER.checkinLastAt) PLAYER.checkinLastAt = {};

    PLAYER.checkins[checkinKey] = (PLAYER.checkins[checkinKey] || 0) + 1;
    PLAYER.visitedCities[cityKey] = (PLAYER.visitedCities[cityKey] || 0) + 1;
    PLAYER.xp += xpGained;
    PLAYER.checkinCooldowns[checkinKey] = now;
    PLAYER.checkinLastAt[checkinKey] = now;
    PLAYER.todayCheckins += 1;

    // === ОЧКИ ГОРОДАМ ===
    ensureCityScores();

    let cityScoreField = 'residents';
    let cityScoreValue = 5;

    if (isCurrentCity) {
        cityScoreField = 'residents';
        cityScoreValue = 5;
        CITY_SCORES[cityKey].residents += 5;
    } else if (isHomeCity) {
        cityScoreField = 'home';
        cityScoreValue = 7;
        CITY_SCORES[cityKey].home += 7;
    } else {
        cityScoreField = 'hospitality';
        cityScoreValue = isFirstTimeInCity ? 20 : 10;
        CITY_SCORES[cityKey].hospitality += cityScoreValue;
    }

    // === УРОВЕНЬ ===
    const oldLevel = PLAYER.level;
    PLAYER.level = getLevelFromXP(PLAYER.xp);

    // === СОХРАНЕНИЕ НА СЕРВЕР ===
    await savePlayerToServer(PLAYER);

    // Чек-ин → получаем checkinId → событие в ленту
    const checkinId = await saveCheckin(PLAYER.playerId, cityKey, category, placeTitle);

    await saveFeedEvent(PLAYER.playerId, 'checkin', {
        place: placeTitle,
        checkinId: checkinId || null,
    }, cityKey);

    await updateCityScore(cityKey, cityScoreField, cityScoreValue);

    // === UI: тосты и уровни ===
    updatePlayerBadge();
    showXPToast(xpGained, reason);

    if (PLAYER.level > oldLevel) {
        setTimeout(() => showLevelUp(PLAYER.level), 400);
    }

    // === БЕЙДЖИ ===
    const newBadges = checkBadges();
    if (newBadges.length > 0) {
        await savePlayerToServer(PLAYER);
        newBadges.forEach((id, idx) => {
            setTimeout(() => showBadgeToast(getBadgeById(id)), 600 + idx * 800);
        });

        // Предлагаем поделиться первым бейджем (через 2 секунды после тоста)
        setTimeout(async () => {
            if (typeof showConfirm === 'function') {
                const badgeName = getBadgeById(newBadges[0])?.name || 'Новое достижение';
                const wantToShare = await showConfirm(
                    `Ты получил бейдж «${badgeName}»! Поделиться этим?`, 
                    { okText: 'Поделиться', cancelText: 'Не сейчас' }
                );
                if (wantToShare) {
                    await shareBadge(badgeName);
                }
            }
        }, 2000);
    }

    // === КВЕСТЫ ===
    const newQuests = checkQuests();
    if (newQuests.length > 0) {
        await savePlayerToServer(PLAYER);
        updatePlayerBadge();
        newQuests.forEach((quest, idx) => {
            setTimeout(() => showQuestToast(quest), 1400 + idx * 900);
        });
    }

    // === ПЕРЕРИСОВКА ===
    if (typeof resetRatingsCache === 'function') resetRatingsCache();

    renderAll();
    renderRatings();
    renderQuests();
    updateMapMarkers();

    // Обновляем ленту, чтобы событие появилось сразу
    if (typeof renderFeed === 'function') {
        await renderFeed();
    }

    // === ОТМЕТКА ДРУЗЕЙ ===
    if (checkinId) {
        openTagFriendsModal(checkinId, checkinKey, placeTitle);
    }

    // === ПОДЕЛИТЬСЯ ===
    // Спрашиваем с небольшой задержкой, чтобы окно не перекрывало «С кем был?»
    setTimeout(async () => {
        if (typeof showConfirm === 'function') {
            const wantToShare = await showConfirm(
                'Место отмечено! Поделиться этим с друзьями?', 
                { okText: 'Поделиться', cancelText: 'Не сейчас' }
            );
            if (wantToShare) {
                await shareCheckin(PLAYER.currentCity, placeTitle);
            }
        }
    }, 500);
}

// ============================================
// ПОДЕЛИТЬСЯ ЧЕК-ИНОМ
// ============================================
async function shareCheckin(cityKey, placeName) {
    if (!PLAYER) return;

    const city = CITIES[cityKey]?.name || cityKey;
    const text = `Я только что отметился в «${placeName}» (${city}) в Safarstan! Присоединяйся:`;
    const url = 'https://akhmaditimur-dev.github.io/safarstan/';
    
    // Нативный шаринг (мобилки)
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Safarstan',
                text: text,
                url: url
            });
            return;
        } catch (err) {
            if (err.name !== 'AbortError') console.warn('Share error:', err);
            return;
        }
    }

    // Копирование в буфер (десктоп)
    try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        if (typeof showWarningToast === 'function') {
            showWarningToast('Ссылка скопирована в буфер обмена!');
        }
    } catch (err) {
        console.warn('Clipboard error:', err);
        if (typeof showWarningToast === 'function') {
            showWarningToast('Не удалось скопировать ссылку');
        }
    }
}