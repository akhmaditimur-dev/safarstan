// ============ UI: PROFILE — СВОЙ ПРОФИЛЬ ============

let selectedAvatar = '🧑‍💼';

// ============================================
// ОБНОВЛЕНИЕ ДАННЫХ ИГРОКА (дашборд + модалка)
// ============================================
function updatePlayerBadge() {
    if (!PLAYER) return;

    const xpInLevel = PLAYER.xp % 100;
    const xpToNext = 100 - xpInLevel;
    const nextLabel = `до уровня ${PLAYER.level + 1}: ${xpToNext} XP`;

    // Дашборд
    const dashAvatar   = document.getElementById('dashAvatar');
    const dashName     = document.getElementById('dashName');
    const dashLevel    = document.getElementById('dashLevel');
    const dashXP       = document.getElementById('dashXP');
    const dashXPNext   = document.getElementById('dashXPNext');
    const dashXPBar    = document.getElementById('dashXPBar');

    if (dashAvatar) renderAvatar(dashAvatar, PLAYER.avatar);
    if (dashName)   dashName.textContent = PLAYER.name;
    if (dashLevel)  dashLevel.textContent = PLAYER.level;
    if (dashXP)     dashXP.textContent = PLAYER.xp;
    if (dashXPNext) dashXPNext.textContent = nextLabel;
    if (dashXPBar)  dashXPBar.style.width = `${xpInLevel}%`;

    // Модалка профиля
    const profileAvatar   = document.getElementById('profileAvatar');
    const profileName     = document.getElementById('profileName');
    const profileLevel    = document.getElementById('profileLevel');
    const profileXP       = document.getElementById('profileXP');
    const profileXPNext   = document.getElementById('profileXPNext');
    const profileXPBar    = document.getElementById('profileXPBar');

    if (profileAvatar) renderAvatar(profileAvatar, PLAYER.avatar);
    if (profileName)   profileName.textContent = PLAYER.name;
    if (profileLevel)  profileLevel.textContent = PLAYER.level;
    if (profileXP)     profileXP.textContent = PLAYER.xp;
    if (profileXPNext) profileXPNext.textContent = nextLabel;
    if (profileXPBar)  profileXPBar.style.width = `${xpInLevel}%`;
}

// ============================================
// РЕНДЕР МОДАЛКИ ПРОФИЛЯ
// ============================================
function renderProfile() {
    if (!PLAYER) return;

    if (typeof renderProfileSkeleton === 'function') {
        renderProfileSkeleton();
    }

    // Сброс вкладки на «Обзор» при каждом открытии
    setProfileTab('overview');

    renderProfileHeader();
    renderProfileCities();
    renderProfileStats();
    renderProfileBadges();

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Переключение вкладок своего профиля
function setProfileTab(tabKey) {
    const tabs = document.querySelectorAll('#profileTabs .profile-tab');
    const panes = document.querySelectorAll('#profileModal .profile-tab-pane[data-profile-pane]');
    if (!tabs.length || !panes.length) return;

    tabs.forEach(t => t.classList.toggle('active', t.dataset.profileTab === tabKey));
    panes.forEach(p => {
        p.style.display = p.dataset.profilePane === tabKey ? '' : 'none';
    });
}

// --- Шапка ---
function renderProfileHeader() {
    const avatarEl = document.getElementById('profileAvatar');
    const nameEl = document.getElementById('profileName');
    const levelEl = document.getElementById('profileLevel');
    const usernameEl = document.getElementById('profileUsername');

    if (avatarEl) renderAvatar(avatarEl, PLAYER.avatar);
    if (nameEl) nameEl.textContent = PLAYER.name;
    if (levelEl) levelEl.textContent = PLAYER.level;
    if (usernameEl) usernameEl.textContent = PLAYER.username || '—';

    const xpInLevel = PLAYER.xp % 100;
    const xpToNext = 100 - xpInLevel;

    const xpEl = document.getElementById('profileXP');
    const xpNextEl = document.getElementById('profileXPNext');
    const xpBarEl = document.getElementById('profileXPBar');

    if (xpEl) xpEl.textContent = PLAYER.xp;
    if (xpNextEl) xpNextEl.textContent = `до уровня ${PLAYER.level + 1}: ${xpToNext} XP`;
    if (xpBarEl) xpBarEl.style.width = `${xpInLevel}%`;
}

// --- Мои города ---
function renderProfileCities() {
    const citiesEl = document.getElementById('profileCities');
    if (!citiesEl) return;

    const visited = PLAYER.visitedCities || {};
    const homeKey = PLAYER.homeCity;
    const currentKey = PLAYER.currentCity;

    const mainKeys = [homeKey, currentKey].filter((v, i, a) => v && a.indexOf(v) === i);

    const otherVisited = [];
    const otherUnvisited = [];

    Object.entries(CITIES).forEach(([key, city]) => {
        if (mainKeys.includes(key)) return;
        if (visited[key] > 0) otherVisited.push({ key, city });
        else otherUnvisited.push({ key, city });
    });

    const renderChip = (key, city) => {
        const clickable = `city-chip city-chip--clickable" data-city-key="${key}"`;

        const editBtn = (type) => `
            <button class="city-chip__edit" data-edit-city="${type}" title="Сменить город">
                <i data-lucide="pencil"></i>
            </button>
        `;

        if (key === homeKey) {
            return `
                <span class="city-chip-wrap">
                    <button class="${clickable} home"><i data-lucide="home"></i>${city.name}</button>
                    ${editBtn('home')}
                </span>
            `;
        }
        if (key === currentKey) {
            return `
                <span class="city-chip-wrap">
                    <button class="${clickable} current"><i data-lucide="map-pin"></i>${city.name}</button>
                    ${editBtn('current')}
                </span>
            `;
        }
        if (visited[key] > 0) {
            return `<button class="${clickable} visited"><i data-lucide="check"></i>${city.name}</button>`;
        }
        return `<button class="${clickable}">${city.name}</button>`;
    };

    let html = '';

    mainKeys.forEach(key => {
        const city = CITIES[key];
        if (city) html += renderChip(key, city);
    });

    if (otherVisited.length > 0) {
        html += `<button class="city-chip-toggle" data-toggle-cities="visited">Посещённые (${otherVisited.length})</button>`;
    }
    if (otherUnvisited.length > 0) {
        html += `<button class="city-chip-toggle" data-toggle-cities="unvisited">Другие (${otherUnvisited.length})</button>`;
    }

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

// --- Статистика ---
async function renderProfileStats() {
    const statsEl = document.getElementById('profileStats');
    if (!statsEl) return;

    // Локальные данные (мгновенно)
    const visited = PLAYER.visitedCities || {};
    const totalCheckins = Object.values(PLAYER.checkins || {}).reduce((s, n) => s + n, 0);
    const uniquePlaces = Object.keys(PLAYER.checkins || {}).length;
    const visitedCount = Object.values(visited).filter(n => n > 0).length;

    // Сразу рисуем с прочерками для серверных цифр
    statsEl.innerHTML = `
        <div class="profile-stat"><strong>${totalCheckins}</strong><small>Чек-инов</small></div>
        <div class="profile-stat"><strong>${visitedCount}</strong><small>Городов</small></div>
        <div class="profile-stat"><strong>${uniquePlaces}</strong><small>Мест</small></div>
        <div class="profile-stat"><strong id="psReviews">—</strong><small>Отзывов</small></div>
        <div class="profile-stat"><strong id="psPhotos">—</strong><small>Фото</small></div>
        <div class="profile-stat"><strong id="psFriends">—</strong><small>Друзей</small></div>
    `;

    // Параллельно тянем серверные метрики
    try {
        const [reviewsCount, photosCount, friendsCount] = await Promise.all([
            countMyReviews(PLAYER.playerId),
            countMyPhotos(PLAYER.playerId),
            countMyFriends(PLAYER.playerId),
        ]);

        const elR = document.getElementById('psReviews');
        const elP = document.getElementById('psPhotos');
        const elF = document.getElementById('psFriends');

        if (elR) elR.textContent = reviewsCount ?? '—';
        if (elP) elP.textContent = photosCount ?? '—';
        if (elF) elF.textContent = friendsCount ?? '—';
    } catch (err) {
        console.warn('Не удалось загрузить расширенную статистику:', err);
    }
}

// --- Достижения ---
function renderProfileBadges() {
    const badgesEl = document.getElementById('profileBadges');
    if (!badgesEl) return;

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

// ============================================
// АВАТАР-ПИКЕР (для регистрации)
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
function buildCityOptionsHtml() {
    return Object.entries(CITIES)
        .map(([key, city]) => `<option value="${key}">${city.name} (${city.country})</option>`)
        .join('');
}

function fillCitySelects() {
    const homeSelect = document.getElementById('regHomeCity');
    const currentSelect = document.getElementById('regCurrentCity');
    if (!homeSelect || !currentSelect) return;

    const options = buildCityOptionsHtml();
    homeSelect.innerHTML = options;
    currentSelect.innerHTML = options;
    currentSelect.value = homeSelect.value;
}

function fillPlanCitySelect(preselectKey) {
    const select = document.getElementById('planCity');
    if (!select) return;

    select.innerHTML = buildCityOptionsHtml();
    if (preselectKey) select.value = preselectKey;
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

// ============================================
// РЕДАКТИРОВАНИЕ НИКА
// ============================================
function enableUsernameEdit() {
    if (!PLAYER) return;

    const row = document.querySelector('.profile-username-row');
    const usernameSpan = document.getElementById('profileUsername');
    const editBtn = document.getElementById('editUsernameBtn');
    if (!row || !usernameSpan || !editBtn) return;

    usernameSpan.parentElement.style.display = 'none';
    editBtn.style.display = 'none';

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
    if (label) label.style.display = '';
    if (editBtn) editBtn.style.display = '';
}

// ============================================
// СМЕНА АВАТАРА
// ============================================
function openAvatarModal() {
    if (!PLAYER) return;
    const modal = document.getElementById('avatarModal');
    if (!modal) return;

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
// ГАЛЕРЕЯ
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

// ============================================
// МОИ ОТЗЫВЫ
// ============================================
const MY_REVIEWS_STATE = {
    q: '',
    rating: 'all',   // 'all' | '5' | '4' | '3' | 'none'
    city: 'all',
    sort: 'new',     // 'new' | 'old' | 'high' | 'low'
    all: [],
};

async function openMyReviewsModal() {
    if (!PLAYER || !PLAYER.playerId) return;
    const modal = document.getElementById('myReviewsModal');
    if (!modal) return;

    const list = document.getElementById('myReviewsList');
    list.innerHTML = '<div class="dashboard-empty">⏳ Загрузка...</div>';
    modal.style.display = 'flex';

    const reviews = await loadMyReviews(PLAYER.playerId);
    MY_REVIEWS_STATE.all = reviews;
    MY_REVIEWS_STATE.q = '';
    MY_REVIEWS_STATE.rating = 'all';
    MY_REVIEWS_STATE.city = 'all';
    MY_REVIEWS_STATE.sort = 'new';

    const searchInput = document.getElementById('myReviewsSearch');
    if (searchInput) searchInput.value = '';

    renderMyReviewsToolbar();
    renderMyReviewsList();
}

function closeMyReviewsModal() {
    const modal = document.getElementById('myReviewsModal');
    if (modal) modal.style.display = 'none';
}

function renderMyReviewsToolbar() {
    const toolbar = document.getElementById('myReviewsToolbar');
    if (!toolbar) return;

    const reviews = MY_REVIEWS_STATE.all;

    // Города, в которых есть отзывы
    const cityKeys = [...new Set(reviews.map(r => r.place_key.split('|')[0]))];
    const showCityFilter = cityKeys.length > 1;

    const ratingChips = [
        { key: 'all',  label: 'Все' },
        { key: '5',    label: '5★' },
        { key: '4',    label: '4★' },
        { key: '3',    label: '3★' },
        { key: 'none', label: 'Без оценки' },
    ];

    const sortChips = [
        { key: 'new',  label: 'Новые' },
        { key: 'old',  label: 'Старые' },
        { key: 'high', label: 'Высокий рейтинг' },
        { key: 'low',  label: 'Низкий рейтинг' },
    ];

    toolbar.innerHTML = `
        <div class="my-reviews-search">
            <span class="my-reviews-search__icon"><i data-lucide="search"></i></span>
            <input type="text" id="myReviewsSearch" class="my-reviews-search__input"
                   placeholder="Поиск по тексту или месту"
                   value="${escapeHtml(MY_REVIEWS_STATE.q)}">
            <button type="button" class="my-reviews-search__clear" id="myReviewsSearchClear"
                    style="${MY_REVIEWS_STATE.q ? '' : 'display:none;'}">
                <i data-lucide="x"></i>
            </button>
        </div>

        <div class="my-reviews-chips" data-filter="rating">
            ${ratingChips.map(c => `
                <button type="button" class="my-reviews-chip ${MY_REVIEWS_STATE.rating === c.key ? 'active' : ''}"
                        data-my-rating="${c.key}">${c.label}</button>
            `).join('')}
        </div>

        ${showCityFilter ? `
            <div class="my-reviews-chips" data-filter="city">
                <button type="button" class="my-reviews-chip ${MY_REVIEWS_STATE.city === 'all' ? 'active' : ''}"
                        data-my-city="all">Все города</button>
                ${cityKeys.map(k => `
                    <button type="button" class="my-reviews-chip ${MY_REVIEWS_STATE.city === k ? 'active' : ''}"
                            data-my-city="${k}">${CITIES[k] ? CITIES[k].name : k}</button>
                `).join('')}
            </div>
        ` : ''}

        <div class="my-reviews-chips" data-filter="sort">
            ${sortChips.map(c => `
                <button type="button" class="my-reviews-chip ${MY_REVIEWS_STATE.sort === c.key ? 'active' : ''}"
                        data-my-sort="${c.key}">${c.label}</button>
            `).join('')}
        </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function getFilteredMyReviews() {
    const { q, rating, city, sort, all } = MY_REVIEWS_STATE;
    const needle = q.trim().toLowerCase();

    let arr = all.filter(r => {
        const [cityKey, , placeTitle] = r.place_key.split('|');

        if (city !== 'all' && cityKey !== city) return false;

        if (rating === 'none') {
            if (r.rating) return false;
        } else if (rating !== 'all') {
            if (Number(r.rating) !== Number(rating)) return false;
        }

        if (needle) {
            const hay = (r.text + ' ' + placeTitle).toLowerCase();
            if (!hay.includes(needle)) return false;
        }

        return true;
    });

    arr.sort((a, b) => {
        if (sort === 'new')  return new Date(b.created_at) - new Date(a.created_at);
        if (sort === 'old')  return new Date(a.created_at) - new Date(b.created_at);
        if (sort === 'high') return (b.rating || 0) - (a.rating || 0);
        if (sort === 'low')  return (a.rating || 0) - (b.rating || 0);
        return 0;
    });

    return arr;
}

function renderMyReviewsList() {
    const list = document.getElementById('myReviewsList');
    if (!list) return;

    const reviews = getFilteredMyReviews();

    if (reviews.length === 0) {
        list.innerHTML = `
            <div class="dashboard-empty">
                <p style="margin-bottom: 12px;">Ничего не найдено</p>
                <button class="btn btn-secondary btn-sm" id="myReviewsResetBtn">
                    <i data-lucide="rotate-ccw"></i> Сбросить фильтры
                </button>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    list.innerHTML = reviews.map(r => {
        const [cityKey, category, placeTitle] = r.place_key.split('|');
        const cityName = CITIES[cityKey] ? CITIES[cityKey].name : cityKey;
        const stars = r.rating ? '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) : '';

        return `
            <div class="my-review-item">
                <div class="my-review-place">${escapeHtml(placeTitle)} · ${escapeHtml(cityName)}</div>
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

// Клики по вкладкам своего профиля
document.addEventListener('click', (e) => {
    const tab = e.target.closest('#profileTabs .profile-tab');
    if (!tab) return;
    setProfileTab(tab.dataset.profileTab);
});