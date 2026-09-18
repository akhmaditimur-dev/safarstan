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
// ПРОФИЛЬ — МОДАЛКА
// ============================================
function renderProfile() {
    if (!PLAYER) return;

    // Шапка профиля
    const avatarEl = document.getElementById('profileAvatar');
    const nameEl = document.getElementById('profileName');
    const levelEl = document.getElementById('profileLevel');

    if (avatarEl) renderAvatar(avatarEl, PLAYER.avatar);
    if (nameEl) nameEl.textContent = PLAYER.name;
    if (levelEl) levelEl.textContent = PLAYER.level;

    // XP
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

    // Превращаем иконки
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
    document.getElementById('ppCities').innerHTML = '';
    document.getElementById('ppStats').innerHTML = '';
    document.getElementById('ppBadges').innerHTML = '';
    document.getElementById('ppAddFriendBtn').style.display = 'none';
    document.getElementById('ppRemoveFriendBtn').style.display = 'none';
    document.getElementById('ppPendingBtn').style.display = 'none';

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

    const citiesEl = document.getElementById('ppCities');
    const homeCity = CITIES[player.home_city];
    const currentCity = CITIES[player.current_city];

    let citiesHtml = '';
    if (homeCity) {
        citiesHtml += `<span class="city-chip home"><i data-lucide="home"></i> ${homeCity.name}</span>`;
    }
    if (currentCity && player.current_city !== player.home_city) {
        citiesHtml += `<span class="city-chip current"><i data-lucide="map-pin"></i> ${currentCity.name}</span>`;
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

    // Превращаем иконки в SVG
    if (typeof lucide !== 'undefined') lucide.createIcons();

    updatePlayerProfileActions(playerId);
}

async function updatePlayerProfileActions(playerId) {
    if (!PLAYER || !playerId) return;

    const addBtn = document.getElementById('ppAddFriendBtn');
    const removeBtn = document.getElementById('ppRemoveFriendBtn');
    const pendingBtn = document.getElementById('ppPendingBtn');

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