// ============ UI: ХАШАРЫ ============

// Глобальное состояние
let CURRENT_HASHARS = [];
let CURRENT_HASHAR_FILTERS = {
    cityKey: null,
    category: null,
    onlyUpcoming: true,
    status: 'open',
};
let CURRENT_OPEN_HASHAR = null;

// Категории хашаров с Lucide-иконками
const HASHAR_CATEGORIES = {
    repair:  { icon: 'hammer',      label: 'Ремонт' },
    trees:   { icon: 'trees',       label: 'Деревья' },
    cleanup: { icon: 'brush',       label: 'Уборка' },
    help:    { icon: 'hand-heart',  label: 'Помощь' },
    charity: { icon: 'heart',       label: 'Благотворительность' },
    other:   { icon: 'pin',         label: 'Другое' },
};

// ============================================
// РЕНДЕР: список хашаров (лента)
// ============================================
async function renderHasharsList() {
    const container = document.getElementById('hasharsList');
    if (!container) return;

    container.innerHTML = '<div class="dashboard-empty">Загрузка...</div>';

    const filters = { ...CURRENT_HASHAR_FILTERS };
    if (!filters.cityKey && PLAYER?.currentCity) {
        filters.cityKey = PLAYER.currentCity;
    }

    CURRENT_HASHARS = await loadHashars(filters);

    if (CURRENT_HASHARS.length === 0) {
        container.innerHTML = `
            <div class="dashboard-empty">
                Пока нет хашаров в этом городе
            </div>
            <button class="btn btn-primary btn-sm" id="hasharCreateBtn">
                <i data-lucide="hand-heart"></i> Создать хашар
            </button>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    container.innerHTML = CURRENT_HASHARS.map(h => renderHasharCard(h)).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderHasharCard(h) {
    const cat = HASHAR_CATEGORIES[h.category] || HASHAR_CATEGORIES.other;
    const date = formatHasharDate(h.starts_at);
    const joined = h.myJoined ? 'Уже участвую' : null;

    return `
        <div class="hashar-card" data-hashar-id="${h.id}">
            <div class="hashar-card__icon">
                <i data-lucide="${cat.icon}"></i>
            </div>
            <div class="hashar-card__body">
                <div class="hashar-card__title">${escapeHtml(h.title)}</div>
                <div class="hashar-card__meta">
                    <span><i data-lucide="calendar"></i> ${date}</span>
                    <span><i data-lucide="map-pin"></i> ${escapeHtml(h.address || cityName(h.city_key))}</span>
                </div>
                <div class="hashar-card__cat">${cat.label}</div>
            </div>
            ${joined ? `<div class="hashar-card__badge"><i data-lucide="check"></i></div>` : ''}
        </div>
    `;
}

// ============================================
// РЕНДЕР: мои хашары (для дашборда)
// ============================================
async function renderMyHashars() {
    const container = document.getElementById('dashHashars');
    if (!container) return;

    container.innerHTML = '<div class="dashboard-empty">Загрузка...</div>';

    const list = await loadMyHashars();

    if (list.length === 0) {
        container.innerHTML = `
            <div class="dashboard-empty">
                Ты пока не участвуешь в хашарах
            </div>
            <button class="btn btn-primary btn-sm btn-block" id="dashHasharCreateBtn">
                <i data-lucide="hand-heart"></i> Создать хашар
            </button>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    container.innerHTML = list.slice(0, 5).map(h => {
        const cat = HASHAR_CATEGORIES[h.category] || HASHAR_CATEGORIES.other;
        const dateStr = formatHasharDate(h.starts_at);

        return `
            <div class="dashboard-row" data-hashar-id="${h.id}">
                <div class="dashboard-row__icon">
                    <i data-lucide="${cat.icon}"></i>
                </div>
                <div class="dashboard-row__info">
                    <div class="dashboard-row__name">${escapeHtml(h.title)}</div>
                    <div class="dashboard-row__meta">
                        ${dateStr}
                        ${h.address ? ' · ' + escapeHtml(h.address) : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// МОДАЛКА: создать хашар
// ============================================
function openHasharCreateModal() {
    const modal = document.getElementById('hasharCreateModal');
    if (!modal) return;

    document.getElementById('hasharTitleInput').value = '';
    document.getElementById('hasharDescInput').value = '';
    document.getElementById('hasharAddressInput').value = '';
    document.getElementById('hasharMaxInput').value = '';
    document.getElementById('hasharStartInput').value = defaultStartDate();
    document.getElementById('hasharEndInput').value = '';

    const catContainer = document.getElementById('hasharCatPicker');
    if (catContainer) {
        catContainer.innerHTML = Object.entries(HASHAR_CATEGORIES).map(([key, c]) => `
            <button type="button" class="hashar-cat-option${key === 'other' ? ' active' : ''}" data-cat="${key}">
                <i data-lucide="${c.icon}"></i> ${c.label}
            </button>
        `).join('');
    }

    const citySelect = document.getElementById('hasharCityInput');
    if (citySelect) {
        citySelect.innerHTML = Object.entries(CITIES).map(([key, c]) =>
            `<option value="${key}" ${key === (PLAYER?.currentCity || '') ? 'selected' : ''}>${c.name}</option>`
        ).join('');
    }

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function defaultStartDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
}

// ============================================
// МОДАЛКА: просмотр хашара
// ============================================
async function openHasharModal(hasharId) {
    const modal = document.getElementById('hasharModal');
    if (!modal) return;

    modal.style.display = 'flex';
    const body = document.getElementById('hasharModalBody');
    body.innerHTML = '<div class="dashboard-empty">Загрузка...</div>';

    const hashar = await loadHasharById(hasharId);
    if (!hashar) {
        body.innerHTML = '<div class="dashboard-empty">Не удалось загрузить</div>';
        return;
    }

    CURRENT_OPEN_HASHAR = hashar;
    const isMine = await amIInHashar(hasharId);
    const isHost = hashar.host_id === PLAYER?.playerId;

    renderHasharView(hashar, { isMine, isHost });
}

function renderHasharView(hashar, { isMine, isHost }) {
    const body = document.getElementById('hasharModalBody');
    const cat = HASHAR_CATEGORIES[hashar.category] || HASHAR_CATEGORIES.other;

    const membersHtml = (hashar.members || []).map(m => `
        <div class="hashar-member" data-player-profile="${m.player_id}">
            <div class="hashar-member__avatar">${renderAvatarHtml(m.avatar)}</div>
            <div class="hashar-member__name">${escapeHtml(m.name)}</div>
            ${m.role === 'host' ? '<div class="hashar-member__role"><i data-lucide="crown"></i></div>' : ''}
        </div>
    `).join('');

    const volunteers = (hashar.members || []).filter(m => m.role === 'volunteer').length;
    const limitText = hashar.max_volunteers
        ? `${volunteers}/${hashar.max_volunteers}`
        : `${volunteers}`;

    body.innerHTML = `
        <div class="hashar-view__header">
            <div class="hashar-view__icon"><i data-lucide="${cat.icon}"></i></div>
            <h2>${escapeHtml(hashar.title)}</h2>
            <div class="hashar-view__cat">${cat.label}</div>
        </div>

        ${hashar.description ? `<p class="hashar-view__desc">${escapeHtml(hashar.description)}</p>` : ''}

        <div class="hashar-view__rows">
            <div class="hashar-view__row"><i data-lucide="calendar"></i> ${formatHasharDate(hashar.starts_at)}</div>
            ${hashar.ends_at ? `<div class="hashar-view__row"><i data-lucide="clock"></i> до ${formatHasharDate(hashar.ends_at)}</div>` : ''}
            <div class="hashar-view__row"><i data-lucide="map-pin"></i> ${escapeHtml(hashar.address || cityName(hashar.city_key))}</div>
            <div class="hashar-view__row"><i data-lucide="users"></i> Участников: ${limitText}</div>
            <div class="hashar-view__row"><i data-lucide="tag"></i> Статус: ${translateHasharStatus(hashar.status)}</div>
        </div>

        <div class="hashar-view__section">
            <h3>Кто идёт (${(hashar.members || []).length})</h3>
            <div class="hashar-members-grid">${membersHtml || '<div class="dashboard-empty">Пока никого</div>'}</div>
        </div>

        ${renderHasharActions(hashar, { isMine, isHost })}
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderHasharActions(hashar, { isMine, isHost }) {
    if (hashar.status !== 'open') {
        return `<div class="dashboard-empty">Хашар ${translateHasharStatus(hashar.status)}</div>`;
    }

    if (isHost) {
        return `
            <button class="btn btn-secondary btn-block" id="hasharCloseBtn" data-hashar-id="${hashar.id}">
                <i data-lucide="check"></i> Закрыть хашар
            </button>
        `;
    }

    if (isMine) {
        return `
            <button class="btn btn-ghost btn-block" id="hasharLeaveBtn" data-hashar-id="${hashar.id}">
                Покинуть хашар
            </button>
        `;
    }

    return `
        <button class="btn btn-primary btn-block" id="hasharJoinBtn" data-hashar-id="${hashar.id}">
            <i data-lucide="hand-heart"></i> Присоединиться
        </button>
    `;
}

// ============================================
// ХЕЛПЕРЫ
// ============================================
function formatHasharDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function translateHasharStatus(status) {
    const map = {
        open: 'открыт',
        in_progress: 'идёт',
        done: 'завершён',
        cancelled: 'отменён',
    };
    return map[status] || status;
}

// Аватар: URL → <img>, иначе эмодзи
function renderAvatarHtml(avatar) {
    if (!avatar) return '🧑‍💼';
    if (typeof avatar === 'string' && avatar.startsWith('http')) {
        return `<img src="${avatar}" alt="" loading="lazy">`;
    }
    return avatar;
}

// ============================================
// ОБРАБОТЧИКИ
// ============================================
document.addEventListener('click', async (e) => {
    // Открыть карточку хашара (из секции)
    const card = e.target.closest('.hashar-card');
    if (card && !e.target.closest('[data-hashar-id]')) {
        openHasharModal(card.dataset.hasharId);
        return;
    }

    // Создать хашар — открыть модалку
    if (e.target.closest('#hasharCreateBtn') || e.target.closest('#dashHasharCreateBtn')) {
        openHasharCreateModal();
        return;
    }

    // Выбор категории
    const catBtn = e.target.closest('.hashar-cat-option');
    if (catBtn) {
        const parent = catBtn.parentElement;
        parent.querySelectorAll('.hashar-cat-option').forEach(b => b.classList.remove('active'));
        catBtn.classList.add('active');
        return;
    }

    // Отправить создание хашара
    if (e.target.id === 'hasharCreateSubmit') {
        const title = document.getElementById('hasharTitleInput').value.trim();
        const desc = document.getElementById('hasharDescInput').value.trim();
        const startsAt = document.getElementById('hasharStartInput').value;
        const cityKey = document.getElementById('hasharCityInput').value;

        if (!title) { showWarningToast('Введи название'); return; }

        // Проверка названия
        const titleError = validateUserText(title, { minLength: 3, maxLength: 100, fieldName: 'Название' });
        if (titleError) { showWarningToast(titleError); return; }

        // Проверка описания
        if (desc) {
            const descError = validateUserText(desc, { minLength: 2, maxLength: 500, fieldName: 'Описание' });
            if (descError) { showWarningToast(descError); return; }
        }

        if (!startsAt) { showWarningToast('Выбери дату'); return; }

        const catBtn = document.querySelector('#hasharCatPicker .hashar-cat-option.active');
        const category = catBtn ? catBtn.dataset.cat : 'other';

        const maxVol = parseInt(document.getElementById('hasharMaxInput').value) || null;

        const result = await createHashar({
            title,
            description: desc || null,
            category,
            cityKey,
            address: document.getElementById('hasharAddressInput').value.trim(),
            startsAt: new Date(startsAt).toISOString(),
            endsAt: document.getElementById('hasharEndInput').value
                ? new Date(document.getElementById('hasharEndInput').value).toISOString()
                : null,
            maxVolunteers: maxVol,
        });

        if (result.error) {
            showWarningToast(result.error);
            return;
        }

        PLAYER.xp += 40;
        PLAYER.level = getLevelFromXP(PLAYER.xp);
        await savePlayerToServer(PLAYER);
        updatePlayerBadge();
        showXPToast(40, 'Новый хашар!');

        document.getElementById('hasharCreateModal').style.display = 'none';
        await renderHasharsList();
        await renderMyHashars();
        return;
    }

    // Присоединиться
    if (e.target.id === 'hasharJoinBtn') {
        const id = e.target.dataset.hasharId;
        const result = await joinHashar(id);
        if (result.error) { showWarningToast(result.error); return; }

        PLAYER.xp += 25;
        PLAYER.level = getLevelFromXP(PLAYER.xp);
        await savePlayerToServer(PLAYER);
        updatePlayerBadge();
        showXPToast(25, 'Ты в хашаре!');

        openHasharModal(id);
        await renderMyHashars();
        return;
    }

    // Покинуть
    if (e.target.id === 'hasharLeaveBtn') {
        const ok = await showConfirm('Покинуть хашар?', { okText: 'Покинуть' });
        if (!ok) return;
        const id = e.target.dataset.hasharId;
        await leaveHashar(id);
        openHasharModal(id);
        await renderMyHashars();
        return;
    }

    // Закрыть хашар (host)
    if (e.target.id === 'hasharCloseBtn') {
        const ok = await showConfirm('Закрыть хашар?', { okText: 'Закрыть' });
        if (!ok) return;
        const id = e.target.dataset.hasharId;
        await updateHasharStatus(id, 'done');

        PLAYER.xp += 50;
        PLAYER.level = getLevelFromXP(PLAYER.xp);
        await savePlayerToServer(PLAYER);
        updatePlayerBadge();
        showXPToast(50, 'Хашар закрыт!');

        openHasharModal(id);
        await renderHasharsList();
        return;
    }

    // Фильтр по категории в ленте
    const filterBtn = e.target.closest('[data-hashar-filter-cat]');
    if (filterBtn) {
        CURRENT_HASHAR_FILTERS.category = filterBtn.dataset.hasharFilterCat || null;
        document.querySelectorAll('[data-hashar-filter-cat]').forEach(b =>
            b.classList.toggle('active', b === filterBtn));
        await renderHasharsList();
        return;
    }

    // Закрытие модалок
    if (e.target.id === 'hasharModal' || e.target.closest('#hasharClose')) {
        document.getElementById('hasharModal').style.display = 'none';
    }
    if (e.target.id === 'hasharCreateModal' || e.target.closest('#hasharCreateClose')) {
        document.getElementById('hasharCreateModal').style.display = 'none';
    }
});