// ============ UI: ПРОФИЛЬ + АВТОРИЗАЦИЯ ============

let selectedAvatar = '🧑‍💼';
let selectedNewAvatar = null;
let currentViewedPlayerId = null;

// ============================================
// ОТРИСОВКА АВАТАРА
// ============================================
function renderAvatar(el, avatar) {
    if (!el) return;
    if (!avatar) {
        el.innerHTML = '🧑‍💼';
        return;
    }
    if (avatar.startsWith('http')) {
        el.innerHTML = `<img src="${avatar}" alt="avatar">`;
    } else {
        el.textContent = avatar;
    }
}

// ============================================
// ОБНОВЛЕНИЕ ДАННЫХ ИГРОКА (дашборд + модалка)
// ============================================
function updatePlayerBadge() {
    if (!PLAYER) return;

    const xpInLevel = PLAYER.xp % 100;
    const xpToNext = 100 - xpInLevel;

    // === ДАШБОРД ===
    const dashAvatar = document.getElementById('dashAvatar');
    const dashName = document.getElementById('dashName');
    const dashLevel = document.getElementById('dashLevel');
    const dashXP = document.getElementById('dashXP');
    const dashXPNext = document.getElementById('dashXPNext');
    const dashXPBar = document.getElementById('dashXPBar');

    if (dashAvatar) renderAvatar(dashAvatar, PLAYER.avatar);
    if (dashName) dashName.textContent = PLAYER.name;
    if (dashLevel) dashLevel.textContent = PLAYER.level;
    if (dashXP) dashXP.textContent = PLAYER.xp;
    if (dashXPNext) dashXPNext.textContent = `до уровня ${PLAYER.level + 1}: ${xpToNext} XP`;
    if (dashXPBar) dashXPBar.style.width = `${xpInLevel}%`;

    // === МОДАЛКА ПРОФИЛЯ ===
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileLevel = document.getElementById('profileLevel');
    const profileXP = document.getElementById('profileXP');
    const profileXPNext = document.getElementById('profileXPNext');
    const profileXPBar = document.getElementById('profileXPBar');

    if (profileAvatar) renderAvatar(profileAvatar, PLAYER.avatar);
    if (profileName) profileName.textContent = PLAYER.name;
    if (profileLevel) profileLevel.textContent = PLAYER.level;
    if (profileXP) profileXP.textContent = PLAYER.xp;
    if (profileXPNext) profileXPNext.textContent = `до уровня ${PLAYER.level + 1}: ${xpToNext} XP`;
    if (profileXPBar) profileXPBar.style.width = `${xpInLevel}%`;
}

// ============================================
// ПРОФИЛЬ — МОДАЛКА (свой)
// ============================================
function renderProfile() {
    if (!PLAYER) return;

    const avatarEl = document.getElementById('profileAvatar');
    const nameEl = document.getElementById('profileName');
    const levelEl = document.getElementById('profileLevel');

    if (avatarEl) renderAvatar(avatarEl, PLAYER.avatar);
    if (nameEl) nameEl.textContent = PLAYER.name;
    if (levelEl) levelEl.textContent = PLAYER.level;

    const xpInLevel = PLAYER.xp % 100;
    const xpToNext = 100 - xpInLevel;

    const xpEl = document.getElementById('profileXP');
    const xpNextEl = document.getElementById('profileXPNext');
    const xpBarEl = document.getElementById('profileXPBar');

    if (xpEl) xpEl.textContent = PLAYER.xp;
    if (xpNextEl) xpNextEl.textContent = `до уровня ${PLAYER.level + 1}: ${xpToNext} XP`;
    if (xpBarEl) xpBarEl.style.width = `${xpInLevel}%`;

    // Города
    const citiesEl = document.getElementById('profileCities');
    if (citiesEl) {
        const visited = PLAYER.visitedCities || {};
        citiesEl.innerHTML = Object.entries(CITIES).map(([key, city]) => {
            const isHome = key === PLAYER.homeCity;
            const isCurrent = key === PLAYER.currentCity;
            const isVisited = visited[key] > 0;
            let cls = 'city-chip';
            let icon = '';

            if (isHome)         { cls += ' home';    icon = '<i data-lucide="home"></i>'; }
            else if (isCurrent) { cls += ' current'; icon = '<i data-lucide="map-pin"></i>'; }
            else if (isVisited) { cls += ' visited'; icon = '<i data-lucide="check"></i>'; }

            return `<span class="${cls}">${icon}${city.name}</span>`;
        }).join('');
    }

    // Статистика
    const statsEl = document.getElementById('profileStats');
    if (statsEl) {
        const visited = PLAYER.visitedCities || {};
        const totalCheckins = Object.values(PLAYER.checkins || {}).reduce((s, n) => s + n, 0);
        const uniquePlaces = Object.keys(PLAYER.checkins || {}).length;
        const visitedCount = Object.values(visited).filter(n => n > 0).length;

        statsEl.innerHTML = `
            <div class="profile-stat"><strong>${totalCheckins}</strong><small>Чек-инов</small></div>
            <div class="profile-stat"><strong>${visitedCount}</strong><small>Городов</small></div>
            <div class="profile-stat"><strong>${uniquePlaces}</strong><small>Мест</small></div>
        `;
    }

    // Бейджи
    const badgesEl = document.getElementById('profileBadges');
    if (badgesEl) {
        const earned = new Set(PLAYER.badges || []);
        badgesEl.innerHTML = BADGES.map(badge => {
            const has = earned.has(badge.id);
            return `
                <div class="profile-badge ${has ? 'earned' : 'locked'}">
                    <div class="badge-icon"><i data-lucide="${badge.icon}"></i></div>
                    <div class="badge-name">${badge.name}</div>
                    <div class="badge-desc">${badge.desc}</div>
                </div>
            `;
        }).join('');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// АВАТАР-ПИКЕР (регистрация)
// ============================================
function initAvatarPicker() {
    const picker = document.getElementById('regAvatarPicker');
    if (!picker) return;
    const options = picker.querySelectorAll('.avatar-option');
    if (options.length === 0) return;

    options[0].classList.add('selected');

    options.forEach(btn => {
        btn.addEventListener('click', () => {
            options.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedAvatar = btn.dataset.avatar;
        });
    });
}

// ============================================
// SELECT ГОРОДОВ
// ============================================
function fillCitySelects() {
    const homeSelect = document.getElementById('regHomeCity');
    const currentSelect = document.getElementById('regCurrentCity');
    if (!homeSelect || !currentSelect) return;

    const options = Object.entries(CITIES)
        .map(([key, city]) => `<option value="${key}">${city.name} (${city.country})</option>`)
        .join('');

    homeSelect.innerHTML = options;
    currentSelect.innerHTML = options;
    currentSelect.value = homeSelect.value;
}

function fillPlanCitySelect(preselectKey) {
    const select = document.getElementById('planCity');
    if (!select) return;

    select.innerHTML = Object.entries(CITIES)
        .map(([key, city]) => `<option value="${key}">${city.name} (${city.country})</option>`)
        .join('');

    if (preselectKey) select.value = preselectKey;
}

// ============================================
// ИКОНКИ LUCIDE
// ============================================
function renderIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ============================================
// РЕДАКТИРОВАНИЕ ИМЕНИ
// ============================================
function enableNameEdit() {
    const profileModal = document.getElementById('profileModal');
    const isProfileModal = profileModal && profileModal.style.display === 'flex';

    const nameEl = isProfileModal
        ? document.getElementById('profileName')
        : document.getElementById('dashName');

    const editBtn = isProfileModal
        ? document.getElementById('editNameBtnProfile')
        : document.getElementById('editNameBtnDash');

    if (!nameEl || !editBtn) return;

    nameEl.style.display = 'none';
    editBtn.style.display = 'none';

    const form = document.createElement('div');
    form.className = 'profile-name-edit';
    form.id = 'nameEditForm';
    form.innerHTML = `
        <input type="text" id="nameEditInput" class="profile-name-input" value="${PLAYER.name}" maxlength="30">
        <button class="profile-name-save" id="nameEditSave">✓</button>
        <button class="profile-name-cancel" id="nameEditCancel">✕</button>
    `;

    nameEl.parentNode.insertBefore(form, nameEl.nextSibling);

    const input = document.getElementById('nameEditInput');
    input.focus();
    input.select();

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveNameEdit();
        if (e.key === 'Escape') cancelNameEdit();
    });

    document.getElementById('nameEditSave').addEventListener('click', saveNameEdit);
    document.getElementById('nameEditCancel').addEventListener('click', cancelNameEdit);
}

async function saveNameEdit() {
    const input = document.getElementById('nameEditInput');
    if (!input) return;

    const newName = input.value.trim();

    if (!newName) {
        showWarningToast('Имя не может быть пустым 🙏');
        return;
    }
    if (newName.length < 2) {
        showWarningToast('Имя слишком короткое (минимум 2 символа)');
        return;
    }
    if (newName.length > 30) {
        showWarningToast('Имя слишком длинное (максимум 30 символов)');
        return;
    }
    if (typeof hasBadWords === 'function' && hasBadWords(newName)) {
        showWarningToast('Пожалуйста, без грубых слов 🙏');
        return;
    }
    if (newName === PLAYER.name) {
        cancelNameEdit();
        return;
    }

    const oldName = PLAYER.name;
    PLAYER.name = newName;

    try {
        await savePlayerToServer(PLAYER);
        updatePlayerBadge();
        renderProfile();
        cancelNameEdit();
        showWarningToast(`✅ Имя изменено: ${newName}`);
    } catch (err) {
        console.error('Ошибка сохранения имени:', err);
        PLAYER.name = oldName;
        showWarningToast('Не удалось сохранить имя. Попробуй позже.');
    }
}

function cancelNameEdit() {
    const form = document.getElementById('nameEditForm');
    const profileModal = document.getElementById('profileModal');
    const isProfileModal = profileModal && profileModal.style.display === 'flex';

    const nameEl = isProfileModal
        ? document.getElementById('profileName')
        : document.getElementById('dashName');

    const editBtn = isProfileModal
        ? document.getElementById('editNameBtnProfile')
        : document.getElementById('editNameBtnDash');

    if (form) form.remove();
    if (nameEl) nameEl.style.display = '';
    if (editBtn) editBtn.style.display = '';
}

// ============================================
// СМЕНА АВАТАРА
// ============================================
function openAvatarModal() {
    if (!PLAYER) return;
    const modal = document.getElementById('avatarModal');
    if (!modal) return;

    selectedNewAvatar = null;
    const preview = document.getElementById('avatarPreview');
    const errorEl = document.getElementById('avatarError');
    const fileInput = document.getElementById('avatarFileInput');

    if (preview) preview.innerHTML = '';
    if (errorEl) errorEl.style.display = 'none';
    if (fileInput) fileInput.value = '';

    modal.style.display = 'flex';
}

function closeAvatarModal() {
    const modal = document.getElementById('avatarModal');
    if (modal) modal.style.display = 'none';
}

async function saveEmojiAvatar(emoji) {
    if (!PLAYER || !emoji) return;

    PLAYER.avatar = emoji;
    await savePlayerToServer(PLAYER);
    updatePlayerBadge();
    renderProfile();

    showWarningToast(`✅ Аватар изменён: ${emoji}`);
    closeAvatarModal();
}

async function saveUploadedAvatar(file) {
    if (!PLAYER || !file) return;

    const errorEl = document.getElementById('avatarError');

    if (errorEl) {
        errorEl.textContent = '⏳ Загрузка...';
        errorEl.style.display = 'block';
    }

    const result = await uploadAvatar(file, PLAYER.playerId);

    if (result.error) {
        if (errorEl) {
            errorEl.textContent = result.error;
            errorEl.style.display = 'block';
        }
        return;
    }

    if (PLAYER.avatar && PLAYER.avatar.startsWith('http') && PLAYER.avatarPath) {
        await deleteOldAvatar(PLAYER.avatarPath);
    }

    PLAYER.avatar = result.url;
    PLAYER.avatarPath = result.path;

    await savePlayerToServer(PLAYER);
    updatePlayerBadge();
    renderProfile();

    showWarningToast('✅ Фото загружено!');
    closeAvatarModal();
}

// ============================================
// ГАЛЕРЕЯ ФОТО
// ============================================
async function openGalleryModal() {
    if (!PLAYER || !PLAYER.playerId) return;

    const modal = document.getElementById('galleryModal');
    if (!modal) return;

    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '<div class="dashboard-empty">⏳ Загрузка...</div>';

    modal.style.display = 'flex';

    const photos = await loadMyPhotos(PLAYER.playerId);

    if (photos.length === 0) {
        grid.innerHTML = '<div class="dashboard-empty">Пока нет фото. Загрузи первое! 📸</div>';
        return;
    }

    grid.innerHTML = photos.map(p => `
        <div class="gallery-item" data-lightbox="${p.photo_url}">
            <img src="${p.photo_url}" alt="" loading="lazy">
        </div>
    `).join('');
}

function closeGalleryModal() {
    const modal = document.getElementById('galleryModal');
    if (modal) modal.style.display = 'none';
}

// ============================================
// МОИ ОТЗЫВЫ
// ============================================
async function openMyReviewsModal() {
    if (!PLAYER || !PLAYER.playerId) return;

    const modal = document.getElementById('myReviewsModal');
    if (!modal) return;

    const list = document.getElementById('myReviewsList');
    list.innerHTML = '<div class="dashboard-empty">⏳ Загрузка...</div>';

    modal.style.display = 'flex';

    const reviews = await loadMyReviews(PLAYER.playerId);

    if (reviews.length === 0) {
        list.innerHTML = '<div class="dashboard-empty">Пока нет отзывов. Оставь первый! 💬</div>';
        return;
    }

    list.innerHTML = reviews.map(r => {
        const [cityKey, category, placeTitle] = r.place_key.split('|');
        const cityName = CITIES[cityKey] ? CITIES[cityKey].name : cityKey;
        const stars = r.rating ? '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) : '';

        return `
            <div class="my-review-item">
                <div class="my-review-place">${placeTitle} · ${cityName}</div>
                ${stars ? `<div class="my-review-rating">${stars}</div>` : ''}
                <div class="my-review-text">${escapeHtml(r.text)}</div>
                <div class="my-review-footer">
                    <span class="my-review-date">${formatDate(r.created_at)}</span>
                    <button class="my-review-delete" data-delete-my-review="${r.id}"><i data-lucide="trash-2"></i> Удалить</button>
                </div>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeMyReviewsModal() {
    const modal = document.getElementById('myReviewsModal');
    if (modal) modal.style.display = 'none';
}

// ============================================
// НАСТРОЙКИ
// ============================================
function openSettingsModal() {
    if (!PLAYER) return;
    const modal = document.getElementById('settingsModal');
    if (!modal) return;

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    document.querySelectorAll('#settingsModal [data-theme]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    });

    document.querySelectorAll('#settingsModal [data-lang]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });

    modal.style.display = 'flex';
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.style.display = 'none';
}

// ============================================
// ПРОФИЛЬ ДРУГОГО ИГРОКА
// ============================================
async function openPlayerProfile(playerId) {
    if (!playerId) return;
    if (!PLAYER) return;

    // Свой профиль — открываем обычную модалку
    if (playerId === PLAYER.playerId) {
        renderProfile();
        document.getElementById('profileModal').style.display = 'flex';
        return;
    }

    const modal = document.getElementById('playerProfileModal');
    if (!modal) return;

    // Сброс UI перед загрузкой
    document.getElementById('ppName').textContent = '⏳ Загрузка...';
    document.getElementById('ppAvatar').innerHTML = '⏳';
    document.getElementById('ppLevel').textContent = '—';
    document.getElementById('ppCities').innerHTML = '';
    document.getElementById('ppStats').innerHTML = '';
    document.getElementById('ppBadges').innerHTML = '';
    document.getElementById('ppAddFriendBtn').style.display = 'none';
    document.getElementById('ppRemoveFriendBtn').style.display = 'none';
    document.getElementById('ppPendingBtn').style.display = 'none';

    // Восстанавливаем share-кнопку, если она была перезаписана публичным профилем
    restorePpShareButton();

    modal.style.display = 'flex';

    const player = await loadPlayerById(playerId);
    if (!player) {
        document.getElementById('ppName').textContent = 'Ошибка загрузки';
        return;
    }

    currentViewedPlayerId = playerId;

    // Заполняем шапку профиля сразу (видна всегда, даже если приватный)
    renderAvatar(document.getElementById('ppAvatar'), player.avatar);
    document.getElementById('ppName').textContent = player.name;
    document.getElementById('ppLevel').textContent = player.level || 1;

    // === ПРОВЕРКА ПРИВАТНОСТИ ===
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

    // === ПУБЛИЧНОЕ ОТОБРАЖЕНИЕ ПРОФИЛЯ ===
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

    // Показывает/скрывает кнопку "Заблокировать" на чужом профиле
    async function updateBlockButton(playerId) {
        const btn = document.getElementById('ppBlockBtn');
        if (!btn) return;

        const alreadyBlocked = await isBlockedBy(PLAYER.playerId, playerId);
        btn.style.display = alreadyBlocked ? 'none' : 'block';
}

// Восстанавливает кнопку "Поделиться профилем" в блоке действий
function restorePpShareButton() {
    const actions = document.getElementById('ppActionsSection');
    if (!actions) return;

    if (document.getElementById('ppShareBtn')) return; // уже на месте

    const shareBtn = document.createElement('button');
    shareBtn.id = 'ppShareBtn';
    shareBtn.className = 'btn btn-secondary btn-block';
    shareBtn.style.marginBottom = '8px';
    shareBtn.innerHTML = '<i data-lucide="share-2"></i> Поделиться профилем';
    actions.insertBefore(shareBtn, actions.firstChild);

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

// ============================================
// ПРИВАТНЫЙ ПРОФИЛЬ — плашка + кнопка запроса
// ============================================
async function renderPrivateProfile(player, playerId) {
    // Скрываем все секции с данными
    document.getElementById('ppCities').innerHTML = '';
    document.getElementById('ppStats').innerHTML = '';
    document.getElementById('ppBadges').innerHTML = '';

    // Прячем заголовки секций
    document.querySelectorAll('#playerProfileModal .profile-section h3').forEach(h => {
        h.style.display = 'none';
    });

    const actionsSection = document.getElementById('ppActionsSection');
    if (!actionsSection) return;

    // Проверяем статус запроса
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

// ============================================
// ПУБЛИЧНЫЙ ПРОФИЛЬ (по ссылке ?p=playerId)
// ============================================
async function openPublicProfile(playerId) {
    if (!playerId) return;

    const landing = document.getElementById('landing');
    if (landing) landing.style.display = 'none';

    const player = await loadPlayerById(playerId);

    if (!player) {
        if (typeof showWarningToast === 'function') {
            showWarningToast('Профиль не найден');
        }
        if (landing) landing.style.display = 'block';
        return;
    }

    // Шапка
    renderAvatar(document.getElementById('ppAvatar'), player.avatar);
    document.getElementById('ppName').textContent = player.name || 'Игрок';
    document.getElementById('ppLevel').textContent = player.level || 1;

    // Города — переводим ключи в названия через CITIES
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
        citiesEl.innerHTML = cities.length
            ? cities.join('')
            : '<span class="city-chip">—</span>';
    }

    // Статистика
    const statsEl = document.getElementById('ppStats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="profile-stat"><strong>${player.xp || 0}</strong><small>XP</small></div>
            <div class="profile-stat"><strong>${player.level || 1}</strong><small>Уровень</small></div>
        `;
    }

    // Бейджи — выводим через BADGES как в обычном профиле
    const badgesEl = document.getElementById('ppBadges');
    if (badgesEl) {
        const earned = new Set(player.badges || []);
        if (earned.size === 0) {
            badgesEl.innerHTML = '<div class="dashboard-empty">Бейджей пока нет</div>';
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

    // Кнопка «Войти»
    const actionsSection = document.getElementById('ppActionsSection');
    if (actionsSection) {
        actionsSection.innerHTML = `
            <button id="ppPublicLoginBtn" class="btn btn-primary btn-block">
                <i data-lucide="rocket"></i> Войти в Safarstan
            </button>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('ppPublicLoginBtn').addEventListener('click', () => {
            history.replaceState(null, '', location.pathname);
            document.getElementById('playerProfileModal').style.display = 'none';
            if (landing) landing.style.display = 'block';
            if (typeof showAuthModal === 'function') showAuthModal('signup');
        });
    }

    document.getElementById('playerProfileModal').style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// ЗАПРОСЫ НА ПРОСМОТР ПРОФИЛЯ — модалка владельца
// ============================================

async function openAccessRequestsModal() {
    if (!PLAYER || !PLAYER.playerId) return;

    const modal = document.getElementById('accessRequestsModal');
    if (!modal) return;

    const list = document.getElementById('accessRequestsList');
    list.innerHTML = '<div class="dashboard-empty">⏳ Загрузка...</div>';

    modal.style.display = 'flex';

    await refreshAccessRequestsList();
}

async function refreshAccessRequestsList() {
    const list = document.getElementById('accessRequestsList');
    if (!list) return;

    const requests = await loadIncomingAccessRequests(PLAYER.playerId);

    if (!requests || requests.length === 0) {
        list.innerHTML = '<div class="dashboard-empty">Пока нет входящих запросов</div>';
        updateAccessRequestsBadge(0);
        return;
    }

    list.innerHTML = requests.map(req => {
        const p = req.from_player || {};
        const avatar = p.avatar || '🧑‍💼';
        const name = p.name || 'Игрок';
        const level = p.level || 1;
        const date = req.created_at ? formatDate(req.created_at) : '';

        const avatarHtml = avatar.startsWith('http')
            ? `<img src="${avatar}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : avatar;

        return `
            <div class="friend-item" data-request-id="${req.id}">
                <div class="friend-item__avatar">${avatarHtml}</div>
                <div class="friend-item__info">
                    <div class="friend-item__name">${escapeHtml(name)}</div>
                    <div class="friend-item__sub">Уровень ${level} · ${date}</div>
                </div>
                <div class="friend-item__actions" style="display:flex;gap:6px;">
                    <button class="btn btn-primary btn-sm" data-accept-access="${req.id}">Принять</button>
                    <button class="btn btn-secondary btn-sm" data-decline-access="${req.id}">Отклонить</button>
                </div>
            </div>
        `;
    }).join('');

    updateAccessRequestsBadge(requests.length);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function updateAccessRequestsBadge(count) {
    const badge = document.getElementById('dashAccessRequestsCount');
    if (badge) badge.textContent = count;

    const btn = document.getElementById('navAccessRequestsBtn');
    if (btn) {
        // Кнопку показываем только если у владельца включён приватный профиль
        const isPrivate = PLAYER?.isPrivate === true || PLAYER?.settings?.privacy?.isPrivate === true;
        btn.style.display = isPrivate ? '' : 'none';
    }
}

function closeAccessRequestsModal() {
    const modal = document.getElementById('accessRequestsModal');
    if (modal) modal.style.display = 'none';
}

// Обработчики кликов внутри списка
document.addEventListener('click', async (e) => {
    // Закрыть модалку
    if (e.target.closest('#accessRequestsClose')) {
        closeAccessRequestsModal();
        return;
    }
    if (e.target.id === 'accessRequestsModal') {
        closeAccessRequestsModal();
        return;
    }

    // Принять
    const acceptBtn = e.target.closest('[data-accept-access]');
    if (acceptBtn) {
        const id = acceptBtn.dataset.acceptAccess;
        acceptBtn.disabled = true;
        acceptBtn.textContent = '⏳';

        const result = await acceptProfileAccess(id);
        if (result.error) {
            if (typeof showWarningToast === 'function') {
                showWarningToast('Не удалось принять запрос');
            }
            acceptBtn.disabled = false;
            acceptBtn.textContent = 'Принять';
            return;
        }

        if (typeof showWarningToast === 'function') {
            showWarningToast('✅ Доступ открыт');
        }
        await refreshAccessRequestsList();
        return;
    }

    // Отклонить
    const declineBtn = e.target.closest('[data-decline-access]');
    if (declineBtn) {
        const id = declineBtn.dataset.declineAccess;
        declineBtn.disabled = true;
        declineBtn.textContent = '⏳';

        const result = await declineProfileAccess(id);
        if (result.error) {
            if (typeof showWarningToast === 'function') {
                showWarningToast('Не удалось отклонить запрос');
            }
            declineBtn.disabled = false;
            declineBtn.textContent = 'Отклонить';
            return;
        }

        await refreshAccessRequestsList();
        return;
    }
});

// ============================================
// БЛОКИРОВКА — модалка и обработчики
// ============================================

async function openBlockedListModal() {
    if (!PLAYER || !PLAYER.playerId) return;

    const modal = document.getElementById('blockedListModal');
    if (!modal) return;

    const list = document.getElementById('blockedList');
    list.innerHTML = '<div class="dashboard-empty">⏳ Загрузка...</div>';

    modal.style.display = 'flex';

    await refreshBlockedList();
}

async function refreshBlockedList() {
    const list = document.getElementById('blockedList');
    if (!list) return;

    const blocks = await loadMyBlocks(PLAYER.playerId);

    if (!blocks || blocks.length === 0) {
        list.innerHTML = '<div class="dashboard-empty">Ты никого не заблокировал</div>';
        return;
    }

    list.innerHTML = blocks.map(b => {
        const p = b.blocked || {};
        const avatar = p.avatar || '🧑‍💼';
        const name = p.name || 'Игрок';
        const level = p.level || 1;

        const avatarHtml = avatar.startsWith('http')
            ? `<img src="${avatar}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : avatar;

        return `
            <div class="friend-item">
                <div class="friend-item__avatar">${avatarHtml}</div>
                <div class="friend-item__info">
                    <div class="friend-item__name">${escapeHtml(name)}</div>
                    <div class="friend-item__sub">Уровень ${level}</div>
                </div>
                <div class="friend-item__actions">
                    <button class="btn btn-secondary btn-sm" data-unblock="${p.id}">Разблокировать</button>
                </div>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeBlockedListModal() {
    const modal = document.getElementById('blockedListModal');
    if (modal) modal.style.display = 'none';
}

// Обработчики кликов
document.addEventListener('click', async (e) => {
    // Закрыть модалку
    if (e.target.closest('#blockedListClose')) {
        closeBlockedListModal();
        return;
    }
    if (e.target.id === 'blockedListModal') {
        closeBlockedListModal();
        return;
    }

    // Открыть модалку из настроек
    if (e.target.closest('#settingsBlockedListBtn')) {
        // Закрываем настройки, открываем список
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) settingsModal.style.display = 'none';
        await openBlockedListModal();
        return;
    }

    // Разблокировать
    const unblockBtn = e.target.closest('[data-unblock]');
    if (unblockBtn) {
        const blockedId = unblockBtn.dataset.unblock;
        unblockBtn.disabled = true;
        unblockBtn.textContent = '⏳';

        const result = await unblockPlayer(PLAYER.playerId, blockedId);
        if (result.error) {
            if (typeof showWarningToast === 'function') {
                showWarningToast('Не удалось разблокировать');
            }
            unblockBtn.disabled = false;
            unblockBtn.textContent = 'Разблокировать';
            return;
        }

        if (typeof showWarningToast === 'function') {
            showWarningToast('✅ Разблокирован');
        }
        await refreshBlockedList();
        return;
    }

    // Заблокировать с чужого профиля
    const blockBtn = e.target.closest('#ppBlockBtn');
    if (blockBtn) {
        if (!currentViewedPlayerId) return;

        const ok = await showConfirm('Заблокировать игрока?', {
            okText: 'Заблокировать',
            title: 'Блокировка',
        });
        if (!ok) return;

        blockBtn.disabled = true;
        blockBtn.innerHTML = '<i data-lucide="loader"></i> Блокируем...';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const result = await blockPlayer(PLAYER.playerId, currentViewedPlayerId);

        if (result.error) {
            if (typeof showWarningToast === 'function') {
                showWarningToast('Не удалось заблокировать');
            }
            blockBtn.disabled = false;
            blockBtn.innerHTML = '<i data-lucide="ban"></i> Заблокировать';
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        if (typeof showWarningToast === 'function') {
            showWarningToast('🚫 Игрок заблокирован');
        }
        closePlayerProfile();
        return;
    }
});