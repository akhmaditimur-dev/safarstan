// ============ UI: PROFILE — ПУБЛИЧНЫЙ ПРОФИЛЬ (?p= и #u/ник) ============

// === Публичный профиль по ID (?p=playerId) ===
async function openPublicProfile(playerId) {
    if (!playerId) return;
    const player = await loadPlayerById(playerId);
    if (!player) {
        if (typeof showWarningToast === 'function') showWarningToast('Профиль не найден');
        return;
    }
    renderPublicProfile(player, playerId);
}

// === Публичный профиль по нику (#u/ник) ===
async function openPublicProfileByUsername(username) {
    if (!username) return;
    const clean = username.toLowerCase().trim();

    // Если это мой ник — открываем свой профиль
    if (PLAYER && PLAYER.username === clean) {
        if (typeof renderProfile === 'function') renderProfile();
        const profileModal = document.getElementById('profileModal');
        if (profileModal) profileModal.style.display = 'flex';
        return;
    }

    const player = await loadPlayerByUsername(clean);
    if (!player) {
        if (typeof showWarningToast === 'function') showWarningToast('Профиль не найден');
        return;
    }

    // Если игрок удалён
    if (player.is_deleted === true) {
        if (typeof showWarningToast === 'function') {
            showWarningToast('Этот профиль удалён');
        }
        return;
    }

    renderPublicProfile(player, player.id);
}

// === Общий рендер публичного профиля ===
function renderPublicProfile(player, playerId) {
    // Скрываем лендинг
    const landing = document.getElementById('landing');
    if (landing) landing.style.display = 'none';

    // Заполняем
    if (typeof renderAvatar === 'function') {
        renderAvatar(document.getElementById('ppAvatar'), player.avatar);
    }
    document.getElementById('ppName').textContent = player.name || 'Игрок';
    document.getElementById('ppLevel').textContent = player.level || 1;

    // Ник (если есть)
    const usernameEl = document.getElementById('ppUsername');
    if (usernameEl) {
        if (player.username) {
            usernameEl.textContent = '@' + player.username;
            usernameEl.style.display = 'inline';
        } else {
            usernameEl.style.display = 'none';
        }
    }

    // Города
    const citiesEl = document.getElementById('ppCities');
    if (citiesEl) {
        const cities = [];
        const homeCity = CITIES[player.home_city];
        if (homeCity) {
            cities.push(`<span class="city-chip home"><i data-lucide="home"></i> ${homeCity.name}</span>`);
        }
        if (player.current_city && player.current_city !== player.home_city) {
            const cur = CITIES[player.current_city];
            if (cur) {
                cities.push(`<span class="city-chip current"><i data-lucide="map-pin"></i> ${cur.name}</span>`);
            }
        }
        citiesEl.innerHTML = cities.length ? cities.join('') : '<span class="city-chip">—</span>';
    }

    // Статистика
    const statsEl = document.getElementById('ppStats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="profile-stat"><strong>${player.xp || 0}</strong><small>XP</small></div>
            <div class="profile-stat"><strong>${player.level || 1}</strong><small>Уровень</small></div>
        `;
    }

    // Достижения
    const badgesEl = document.getElementById('ppBadges');
    if (badgesEl) {
        const earned = new Set(player.badges || []);
        if (earned.size === 0) {
            badgesEl.innerHTML = '<div class="dashboard-empty">Достижений пока нет</div>';
        } else {
            badgesEl.innerHTML = BADGES
                .filter(b => earned.has(b.id))
                .map(b => `
                    <div class="profile-badge earned">
                        <div class="badge-icon"><i data-lucide="${b.icon}"></i></div>
                        <div class="badge-name">${b.name}</div>
                    </div>
                `).join('');
        }
    }

    // Кнопки — своё поведение для гостя
    const actionsSection = document.getElementById('ppActionsSection');
    if (actionsSection) {
        // Если это я сам — показываем кнопки моего профиля
        if (PLAYER && playerId === PLAYER.playerId) {
            actionsSection.innerHTML = `
                <button id="ppShareBtn" class="btn btn-secondary btn-block">
                    <i data-lucide="share-2"></i> Поделиться профилем
                </button>
                <button id="ppShowQrBtn" class="btn btn-secondary btn-block">
                    <i data-lucide="qr-code"></i> Показать QR
                </button>
            `;
        } else if (!PLAYER) {
            // Гость — кнопка входа
            actionsSection.innerHTML = `
                <button id="ppPublicLoginBtn" class="btn btn-primary btn-block">
                    <i data-lucide="rocket"></i> Войти в Safarstan
                </button>
            `;
        } else {
            // Залогиненный смотрит чужой профиль — обычные кнопки
            // (их восстановит updatePlayerProfileActions при открытии через openPlayerProfile)
            actionsSection.innerHTML = `
                <button id="ppShareBtn" class="btn btn-secondary btn-block">
                    <i data-lucide="share-2"></i> Поделиться профилем
                </button>
                <button id="ppShowQrBtn" class="btn btn-secondary btn-block">
                    <i data-lucide="qr-code"></i> Показать QR
                </button>
            `;
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Обработчик кнопки входа (для гостя)
        const loginBtn = document.getElementById('ppPublicLoginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                // Чистим хэш
                history.replaceState(null, '', location.pathname);
                document.getElementById('playerProfileModal').style.display = 'none';
                if (landing) landing.style.display = 'block';
                if (typeof showAuthModal === 'function') showAuthModal('signup');
            });
        }
    }

    // Открываем модалку
    document.getElementById('playerProfileModal').style.display = 'flex';

    // Запоминаем, кто сейчас открыт (для share/QR)
    if (typeof currentViewedPlayerId !== 'undefined') {
        window.currentViewedPlayerId = playerId;
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}