// ============ UI: PROFILE — ЧУЖОЙ ПРОФИЛЬ ============

let currentViewedPlayerId = null;

async function openPlayerProfile(playerId) {
    if (!playerId) return;
    if (!PLAYER) return;

    if (playerId === PLAYER.playerId) {
        renderProfile();
        document.getElementById('profileModal').style.display = 'flex';
        return;
    }

    const modal = document.getElementById('playerProfileModal');
    if (!modal) return;

    document.getElementById('ppName').textContent = '⏳ Загрузка...';
    document.getElementById('ppAvatar').innerHTML = '⏳';
    document.getElementById('ppLevel').textContent = '—';

    // Сброс статуса
    const ppStatusEl = document.getElementById('ppStatus');
    if (ppStatusEl) { ppStatusEl.style.display = 'none'; ppStatusEl.innerHTML = ''; }
    document.getElementById('ppCities').innerHTML = '';
    document.getElementById('ppStats').innerHTML = '';
    document.getElementById('ppBadges').innerHTML = '';
    document.getElementById('ppAddFriendBtn').style.display = 'none';
    document.getElementById('ppRemoveFriendBtn').style.display = 'none';
    document.getElementById('ppPendingBtn').style.display = 'none';

    restorePpShareButton();
    modal.style.display = 'flex';

    const player = await loadPlayerById(playerId);
    if (!player) {
        document.getElementById('ppName').textContent = 'Ошибка загрузки';
        return;
    }

    currentViewedPlayerId = playerId;

    renderAvatar(document.getElementById('ppAvatar'), player.avatar);
    document.getElementById('ppName').textContent = player.name;
    document.getElementById('ppLevel').textContent = player.level || 1;

    // Онлайн-статус
    const statusEl = document.getElementById('ppStatus');
    if (statusEl && typeof getOnlineStatus === 'function') {
        const { label, dot } = getOnlineStatus(player.last_seen_at);
        statusEl.innerHTML = `<span class="online-dot online-dot--${dot}"></span>${label}`;
        statusEl.style.display = 'inline-flex';
    }

    // Ник (если есть)
    const ppUsername = document.getElementById('ppUsername');
    if (ppUsername) {
        if (player.username) {
            ppUsername.textContent = '@' + player.username;
            ppUsername.style.display = 'inline';
        } else {
            ppUsername.style.display = 'none';
        }
    }

    // Проверка приватности
    const isPrivate = player.is_private === true;
    let hasAccess = true;

    if (isPrivate && playerId !== PLAYER.playerId) {
        try {
            hasAccess = await hasProfileAccess(PLAYER.playerId, playerId);
        } catch (err) {
            console.warn('Ошибка проверки доступа:', err);
            hasAccess = false;
        }
    }

    if (isPrivate && !hasAccess) {
        renderPrivateProfile(player, playerId);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    // Публичное отображение профиля
    const citiesEl = document.getElementById('ppCities');
    const homeCity = CITIES[player.home_city];

    const otherPrivacy = player.settings?.privacy || {};
    const showCity = otherPrivacy.showCity !== false;

    let citiesHtml = '';
    if (homeCity) {
        citiesHtml += `<span class="city-chip home"><i data-lucide="home"></i> ${homeCity.name}</span>`;
    }
    if (showCity && player.current_city && player.current_city !== player.home_city) {
        const currentCity = CITIES[player.current_city];
        if (currentCity) {
            citiesHtml += `<span class="city-chip current"><i data-lucide="map-pin"></i> ${currentCity.name}</span>`;
        }
    } else if (!showCity) {
        citiesHtml += `<span class="city-chip" style="opacity:0.6;">📍 Город скрыт</span>`;
    }
    citiesEl.innerHTML = citiesHtml || '<span class="city-chip">—</span>';

    const visited = await loadPlayerCheckins(playerId);
    const visitedKeys = Object.keys(visited);

    visitedKeys.forEach(key => {
        if (key === player.home_city || key === player.current_city) return;
        const city = CITIES[key];
        if (city) {
            citiesEl.innerHTML += `<span class="city-chip visited"><i data-lucide="check"></i> ${city.name}</span>`;
        }
    });

    const totalCheckins = Object.values(visited).reduce((s, n) => s + n, 0);
    const visitedCount = visitedKeys.length;

    document.getElementById('ppStats').innerHTML = `
        <div class="profile-stat"><strong>${player.xp || 0}</strong><small>XP</small></div>
        <div class="profile-stat"><strong>${visitedCount}</strong><small>Городов</small></div>
        <div class="profile-stat"><strong>${totalCheckins}</strong><small>Чек-инов</small></div>
    `;

    const badgesEl = document.getElementById('ppBadges');
    const earned = new Set(player.badges || []);
    badgesEl.innerHTML = BADGES.map(badge => {
        const has = earned.has(badge.id);
        return `
            <div class="profile-badge ${has ? 'earned' : 'locked'}">
                <div class="badge-icon"><i data-lucide="${badge.icon}"></i></div>
                <div class="badge-name">${badge.name}</div>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();

    updatePlayerProfileActions(playerId);
    updateBlockButton(playerId);
}

async function updateBlockButton(playerId) {
    const btn = document.getElementById('ppBlockBtn');
    if (!btn) return;

    const alreadyBlocked = await isBlockedBy(PLAYER.playerId, playerId);
    btn.style.display = alreadyBlocked ? 'none' : 'block';
}

function restorePpShareButton() {
    const actions = document.getElementById('ppActionsSection');
    if (!actions) return;

    // Если кнопок нет — восстанавливаем обе
    if (!document.getElementById('ppShareBtn')) {
        const shareBtn = document.createElement('button');
        shareBtn.id = 'ppShareBtn';
        shareBtn.className = 'btn btn-secondary btn-block';
        shareBtn.innerHTML = '<i data-lucide="share-2"></i> Поделиться профилем';
        actions.insertBefore(shareBtn, actions.firstChild);
    }

    if (!document.getElementById('ppShowQrBtn')) {
        const qrBtn = document.createElement('button');
        qrBtn.id = 'ppShowQrBtn';
        qrBtn.className = 'btn btn-secondary btn-block';
        qrBtn.innerHTML = '<i data-lucide="qr-code"></i> Показать QR';

        const shareBtn = document.getElementById('ppShareBtn');
        if (shareBtn && shareBtn.nextSibling) {
            actions.insertBefore(qrBtn, shareBtn.nextSibling);
        } else {
            actions.insertBefore(qrBtn, actions.firstChild);
        }
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function updatePlayerProfileActions(playerId) {
    if (!PLAYER || !playerId) return;

    const addBtn = document.getElementById('ppAddFriendBtn');
    const removeBtn = document.getElementById('ppRemoveFriendBtn');
    const pendingBtn = document.getElementById('ppPendingBtn');

    if (!addBtn || !removeBtn || !pendingBtn) return;

    addBtn.style.display = 'none';
    removeBtn.style.display = 'none';
    pendingBtn.style.display = 'none';
    pendingBtn.disabled = false;
    pendingBtn.style.cursor = 'default';
    pendingBtn.title = '';

    const friends = (typeof FRIENDS !== 'undefined' ? FRIENDS : []);
    const isFriend = friends.some(f => f.id === playerId);

    if (isFriend) {
        removeBtn.style.display = 'block';
        return;
    }

    try {
        const outgoing = await loadOutgoingRequests(PLAYER.playerId);
        const isPending = outgoing.some(r => r.to_player_id === playerId && r.status === 'pending');

        if (isPending) {
            pendingBtn.style.display = 'block';
            pendingBtn.disabled = false;
            pendingBtn.style.cursor = 'pointer';
            pendingBtn.title = 'Нажми, чтобы отменить заявку';
            return;
        }
    } catch (err) {
        console.warn('Ошибка проверки заявок:', err);
    }

    addBtn.style.display = 'block';
}

function closePlayerProfile() {
    const modal = document.getElementById('playerProfileModal');
    if (modal) modal.style.display = 'none';
    currentViewedPlayerId = null;
}

async function renderPrivateProfile(player, playerId) {
    document.getElementById('ppCities').innerHTML = '';
    document.getElementById('ppStats').innerHTML = '';
    document.getElementById('ppBadges').innerHTML = '';

    document.querySelectorAll('#playerProfileModal .profile-section h3').forEach(h => {
        h.style.display = 'none';
    });

    const actionsSection = document.getElementById('ppActionsSection');
    if (!actionsSection) return;

    let status = null;
    try {
        status = await getProfileAccessStatus(PLAYER.playerId, playerId);
    } catch (err) {
        console.warn('Ошибка проверки статуса запроса:', err);
    }

    let btnHtml = '';
    if (status === 'pending') {
        btnHtml = `
            <button class="btn btn-secondary btn-block" disabled>
                <i data-lucide="clock"></i> Запрос отправлен
            </button>
        `;
    } else if (status === 'declined') {
        btnHtml = `
            <button class="btn btn-secondary btn-block" disabled>
                <i data-lucide="x"></i> Запрос отклонён
            </button>
        `;
    } else {
        btnHtml = `
            <button id="ppRequestAccessBtn" class="btn btn-primary btn-block">
                <i data-lucide="lock-open"></i> Запросить доступ
            </button>
        `;
    }

    actionsSection.innerHTML = `
        <div class="profile-private-notice" style="text-align:center; padding: 24px 16px; background: var(--color-bg-alt, #f5f5f5); border-radius: 12px; margin-bottom: 16px;">
            <div style="font-size: 48px; margin-bottom: 12px;">🔒</div>
            <div style="font-weight: 600; margin-bottom: 6px;">Профиль приватный</div>
            <div style="font-size: 14px; opacity: 0.7;">Игрок скрыл свои данные. Отправь запрос, чтобы увидеть больше.</div>
        </div>
        ${btnHtml}
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    const reqBtn = document.getElementById('ppRequestAccessBtn');
    if (reqBtn) {
        reqBtn.addEventListener('click', async () => {
            reqBtn.disabled = true;
            reqBtn.innerHTML = '<i data-lucide="loader"></i> Отправка...';
            if (typeof lucide !== 'undefined') lucide.createIcons();

            const result = await requestProfileAccess(PLAYER.playerId, playerId);

            if (result.error) {
                if (typeof showWarningToast === 'function') {
                    showWarningToast('Не удалось отправить запрос');
                }
                reqBtn.disabled = false;
                reqBtn.innerHTML = '<i data-lucide="lock-open"></i> Запросить доступ';
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }

            if (typeof createNotification === 'function') {
                await createNotification(playerId, 'profile_access_request', {}, PLAYER.playerId);
            }

            if (typeof showWarningToast === 'function') {
                showWarningToast('✅ Запрос отправлен');
            }

            reqBtn.innerHTML = '<i data-lucide="clock"></i> Запрос отправлен';
            reqBtn.classList.remove('btn-primary');
            reqBtn.classList.add('btn-secondary');
            reqBtn.disabled = true;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }
}