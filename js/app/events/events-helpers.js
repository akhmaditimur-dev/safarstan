// ============ APP: ХЕЛПЕРЫ СОБЫТИЙ И АВТОРИЗАЦИИ ============

// Безопасно навесить обработчик по id
function on(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
}

// Заполнить PLAYER из serverPlayer
function setPlayerFromServer(serverPlayer) {
    PLAYER = {
        name: serverPlayer.name,
        avatar: serverPlayer.avatar,
        homeCity: serverPlayer.home_city,
        currentCity: serverPlayer.current_city,
        xp: serverPlayer.xp,
        level: serverPlayer.level,
        badges: serverPlayer.badges || [],
        completedQuests: serverPlayer.completed_quests || [],
        questsClaimed: serverPlayer.quests_claimed || [],
        userPlacesAdded: serverPlayer.user_places_added || 0,
        visitedCities: {},
        checkins: {},
        playerId: serverPlayer.id,
        checkinCooldowns: serverPlayer.checkin_cooldowns || {},
        todayCheckins: serverPlayer.today_checkins || 0,
        todayDate: serverPlayer.today_date || null,
        avatarPath: serverPlayer.avatar_path || null,
        settings: serverPlayer.settings || {},
        isPrivate: serverPlayer.is_private === true,
        onboardingCompleted: serverPlayer.onboarding_completed === true,
        username: serverPlayer.username || null,
    };
}

// После успешной авторизации
async function afterAuth() {
    const checkins = await loadCheckins(PLAYER.playerId);
    PLAYER.checkins = checkins;

    Object.keys(checkins).forEach(key => {
        const cityKey = key.split('|')[0];
        PLAYER.visitedCities[cityKey] = (PLAYER.visitedCities[cityKey] || 0) + checkins[key];
    });

    const authModal = document.getElementById('authModal');
    if (authModal) authModal.style.display = 'none';

    updatePlayerBadge();

    if (typeof initNotificationsBell === 'function') {
        initNotificationsBell();
    }

    if (typeof refreshAccessRequestsList === 'function' && PLAYER.isPrivate) {
        refreshAccessRequestsList();
    }

    if (typeof applyModuleVisibility === 'function') applyModuleVisibility();

    renderQuests();
    renderMap();
    await renderAll();

    if (typeof isModuleEnabled !== 'function' || isModuleEnabled('gaps')) {
        if (typeof renderGapsDashboard === 'function') await renderGapsDashboard();
        if (typeof renderGapInvites === 'function') await renderGapInvites();
    }
    if (typeof isModuleEnabled !== 'function' || isModuleEnabled('hashars')) {
        if (typeof renderMyHashars === 'function') await renderMyHashars();
        if (typeof renderHasharsList === 'function') await renderHasharsList();
    }

    await showDashboard();

    if (typeof maybeShowOnboarding === 'function') {
        maybeShowOnboarding();
    }
}

// Модалка восстановления удалённого аккаунта
let _pendingRestorePlayer = null;

function showRestoreModal(player, isExpired) {
    _pendingRestorePlayer = player;

    const modal = document.getElementById('restoreAccountModal');
    const subtitle = document.getElementById('restoreAccountSubtitle');
    const submitBtn = document.getElementById('restoreAccountSubmit');
    if (!modal) return;

    if (isExpired) {
        subtitle.textContent = 'Срок хранения истёк (больше 30 дней). Данные будут удалены безвозвратно.';
        submitBtn.style.display = 'none';
    } else {
        const deletedDate = new Date(player.deleted_at);
        const daysLeft = 30 - Math.floor((new Date() - deletedDate) / (1000 * 60 * 60 * 24));
        subtitle.textContent = `Твой аккаунт удалён. Осталось ${daysLeft} дн. до окончательного удаления. Восстановить?`;
        submitBtn.style.display = 'block';
    }

    modal.style.display = 'flex';
}