// ============ UI: PROFILE — СВОЙ ПРОФИЛЬ ============

let selectedAvatar = '🧑‍💼';
let selectedNewAvatar = null;

// === Обновление данных игрока (дашборд + модалка профиля) ===
function updatePlayerBadge() {
    if (!PLAYER) return;

    const xpInLevel = PLAYER.xp % 100;
    const xpToNext = 100 - xpInLevel;

    // Дашборд
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

    // Модалка профиля
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

// === Свой профиль — модалка ===
function renderProfile() {
    if (!PLAYER) return;

    const avatarEl = document.getElementById('profileAvatar');
    const nameEl = document.getElementById('profileName');
    const levelEl = document.getElementById('profileLevel');

    if (avatarEl) renderAvatar(avatarEl, PLAYER.avatar);
    if (nameEl) nameEl.textContent = PLAYER.name;
    if (levelEl) levelEl.textContent = PLAYER.level;

    // Ник
    const usernameEl = document.getElementById('profileUsername');
    if (usernameEl) {
        usernameEl.textContent = PLAYER.username || '—';
    }

    const xpInLevel = PLAYER.xp % 100;
    const xpToNext = 100 - xpInLevel;

    const xpEl = document.getElementById('profileXP');
    const xpNextEl = document.getElementById('profileXPNext');
    const xpBarEl = document.getElementById('profileXPBar');

    if (xpEl) xpEl.textContent = PLAYER.xp;
    if (xpNextEl) xpNextEl.textContent = `до уровня ${PLAYER.level + 1}: ${xpToNext} XP`;
    if (xpBarEl) xpBarEl.style.width = `${xpInLevel}%`;

    // Города — родной + текущий + свёрнутые остальные
    const citiesEl = document.getElementById('profileCities');
    if (citiesEl) {
        const visited = PLAYER.visitedCities || {};
        const homeKey = PLAYER.homeCity;
        const currentKey = PLAYER.currentCity;

        // Главные города (всегда видно)
        const mainKeys = [homeKey, currentKey].filter((v, i, a) => v && a.indexOf(v) === i);

        // Остальные разбиваем на «посещённые» и «непосещённые»
        const otherVisited = [];
        const otherUnvisited = [];

        Object.entries(CITIES).forEach(([key, city]) => {
            if (mainKeys.includes(key)) return;
            if (visited[key] > 0) otherVisited.push({ key, city });
            else otherUnvisited.push({ key, city });
        });

        const renderChip = (key, city) => {
            if (key === homeKey)         return `<span class="city-chip home"><i data-lucide="home"></i>${city.name}</span>`;
            if (key === currentKey)      return `<span class="city-chip current"><i data-lucide="map-pin"></i>${city.name}</span>`;
            if (visited[key] > 0)        return `<span class="city-chip visited"><i data-lucide="check"></i>${city.name}</span>`;
            return `<span class="city-chip">${city.name}</span>`;
        };

        let html = '';

        // Главные
        mainKeys.forEach(key => {
            const city = CITIES[key];
            if (city) html += renderChip(key, city);
        });

        // Кнопки раскрытия
        if (otherVisited.length > 0) {
            html += `<button class="city-chip-toggle" data-toggle-cities="visited">Посещённые (${otherVisited.length})</button>`;
        }
        if (otherUnvisited.length > 0) {
            html += `<button class="city-chip-toggle" data-toggle-cities="unvisited">Другие (${otherUnvisited.length})</button>`;
        }

        // Скрытые секции
        if (otherVisited.length > 0) {
            html += `<div class="city-chips-extra" id="cityExtraVisited" style="display:none;">
                ${otherVisited.map(({key, city}) => renderChip(key, city)).join('')}
            </div>`;
        }
        if (otherUnvisited.length > 0) {
            html += `<div class="city-chips-extra" id="cityExtraUnvisited" style="display:none;">
                ${otherUnvisited.map(({key, city}) => renderChip(key, city)).join('')}
            </div>`;
        }

        citiesEl.innerHTML = html;
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

    // Достижения
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

// === Аватар-пикер (для регистрации) ===
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

// === Select городов ===
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

// === Иконки ===
function renderIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// === Редактирование имени ===
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

    if (!newName) { showWarningToast('Имя не может быть пустым 🙏'); return; }
    if (newName.length < 2) { showWarningToast('Имя слишком короткое (минимум 2 символа)'); return; }
    if (newName.length > 30) { showWarningToast('Имя слишком длинное (максимум 30 символов)'); return; }
    if (typeof hasBadWords === 'function' && hasBadWords(newName)) {
        showWarningToast('Пожалуйста, без грубых слов 🙏');
        return;
    }
    if (newName === PLAYER.name) { cancelNameEdit(); return; }

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

// === Смена аватара ===
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

// === Галерея ===
async function openGalleryModal() {
    if (!PLAYER || !PLAYER.playerId) return;
    const modal = document.getElementById('galleryModal');
    if (!modal) return;

    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '<div class="dashboard-empty">⏳ Загрузка...</div>';
    modal.style.display = 'flex';

    const photos = await loadMyPhotos(PLAYER.playerId);

    if (photos.length === 0) {
        grid.innerHTML = '<div class="dashboard-empty">Пока нет фото</div>';
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

// === Мои отзывы ===
async function openMyReviewsModal() {
    if (!PLAYER || !PLAYER.playerId) return;
    const modal = document.getElementById('myReviewsModal');
    if (!modal) return;

    const list = document.getElementById('myReviewsList');
    list.innerHTML = '<div class="dashboard-empty">⏳ Загрузка...</div>';
    modal.style.display = 'flex';

    const reviews = await loadMyReviews(PLAYER.playerId);

    if (reviews.length === 0) {
        list.innerHTML = '<div class="dashboard-empty">Пока нет отзывов</div>';
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

// === Настройки ===
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
// РЕДАКТИРОВАНИЕ НИКА
// ============================================

function enableUsernameEdit() {
    if (!PLAYER) return;

    const row = document.querySelector('.profile-username-row');
    const usernameSpan = document.getElementById('profileUsername');
    const editBtn = document.getElementById('editUsernameBtn');
    if (!row || !usernameSpan || !editBtn) return;

    // Скрываем текущие
    usernameSpan.parentElement.style.display = 'none';
    editBtn.style.display = 'none';

    // Форма
    const form = document.createElement('div');
    form.className = 'profile-username-edit';
    form.id = 'usernameEditForm';
    form.innerHTML = `
        <span class="profile-username-at">@</span>
        <input type="text" id="usernameEditInput" class="profile-username-input"
               value="${PLAYER.username || ''}"
               placeholder="твой_ник"
               maxlength="20"
               autocomplete="off"
               spellcheck="false">
        <button class="profile-name-save" id="usernameEditSave">✓</button>
        <button class="profile-name-cancel" id="usernameEditCancel">✕</button>
        <p id="usernameEditError" class="auth-error" style="display:none;width:100%;"></p>
    `;

    row.parentNode.insertBefore(form, row.nextSibling);

    const input = document.getElementById('usernameEditInput');
    input.focus();
    input.select();

    input.addEventListener('input', () => {
        // Приводим к lowercase
        const pos = input.selectionStart;
        input.value = input.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        input.setSelectionRange(pos, pos);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveUsernameEdit();
        if (e.key === 'Escape') cancelUsernameEdit();
    });

    document.getElementById('usernameEditSave').addEventListener('click', saveUsernameEdit);
    document.getElementById('usernameEditCancel').addEventListener('click', cancelUsernameEdit);
}

async function saveUsernameEdit() {
    const input = document.getElementById('usernameEditInput');
    const errorEl = document.getElementById('usernameEditError');
    if (!input) return;

    const newUsername = input.value.trim().toLowerCase();

    if (newUsername === PLAYER.username) {
        cancelUsernameEdit();
        return;
    }

    const validationError = validateUsername(newUsername);
    if (validationError) {
        errorEl.textContent = validationError;
        errorEl.style.display = 'block';
        return;
    }

    errorEl.style.display = 'none';

    const result = await saveUsername(PLAYER.playerId, newUsername);

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    PLAYER.username = result.username;
    cancelUsernameEdit();

    // Обновляем текст ника сразу
    const usernameEl = document.getElementById('profileUsername');
    if (usernameEl) usernameEl.textContent = PLAYER.username;

    showWarningToast('✅ Ник изменён: @' + PLAYER.username);

    setTimeout(() => {
        if (typeof renderProfile === 'function') renderProfile();
    }, 50);
}

function cancelUsernameEdit() {
    const form = document.getElementById('usernameEditForm');
    const row = document.querySelector('.profile-username-row');
    const label = document.querySelector('.profile-username-label');
    const editBtn = document.getElementById('editUsernameBtn');

    if (form) form.remove();
    if (row) row.style.display = '';
    if (label) label.style.display = '';   // ← ВОССТАНАВЛИВАЕМ
    if (editBtn) editBtn.style.display = '';
}