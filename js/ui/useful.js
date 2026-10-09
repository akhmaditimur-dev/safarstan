// ============ UI: ПОЛЕЗНОЕ РЯДОМ ============

let USEFUL_ALL = [];        // кэш всех загруженных для модалки
let USEFUL_FILTER = 'all';  // фильтр категории в модалке

const USEFUL_CATEGORIES = {
    food:    { icon: 'utensils',      label: 'Еда' },
    shop:    { icon: 'shopping-bag',  label: 'Магазин' },
    service: { icon: 'wrench',        label: 'Услуги' },
    beauty:  { icon: 'scissors',      label: 'Красота' },
    health:  { icon: 'heart-pulse',   label: 'Здоровье' },
    auto:    { icon: 'car',           label: 'Авто' },
    other:   { icon: 'map-pin',       label: 'Другое' },
};

function getUsefulCategoryLabel(key) {
    return USEFUL_CATEGORIES[key]?.label || 'Другое';
}
function getUsefulCategoryIcon(key) {
    return USEFUL_CATEGORIES[key]?.icon || 'map-pin';
}

// === Рендер карточки в дашборде ===
async function renderUsefulCard() {
    const container = document.getElementById('dashUseful');
    if (!container || !PLAYER || !PLAYER.currentCity) return;

    container.innerHTML = '<div class="dashboard-empty">⏳ Загрузка...</div>';

    const items = await loadUsefulPlaces(PLAYER.currentCity, 5);
    const cityName = CITIES[PLAYER.currentCity]?.name || '';

    if (items.length === 0) {
        container.innerHTML = `
            <div class="dashboard-empty">
                <p style="margin-bottom: 12px;">В ${escapeHtml(cityName)} пока ничего нет</p>
                <button class="btn btn-primary btn-sm" id="usefulAddBtnEmpty">
                    <i data-lucide="plus"></i> Добавить полезное
                </button>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    container.innerHTML = items.map(renderUsefulItem).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Один элемент списка
function renderUsefulItem(item) {
    const author = item.author || {};
    const authorName = author.name || '';
    const isMine = PLAYER && item.added_by === PLAYER.playerId;
    const badge = item.is_paid
        ? '<span class="useful-badge useful-badge--ad">Реклама</span>'
        : item.source_type === 'admin'
            ? '<span class="useful-badge useful-badge--admin">Совет</span>'
            : item.source_type === 'friend'
                ? `<span class="useful-badge useful-badge--friend">от ${escapeHtml(authorName || 'друга')}</span>`
                : '';

    const deleteBtn = isMine
        ? `<button class="useful-item__delete" data-useful-delete="${item.id}" title="Удалить"><i data-lucide="trash-2"></i></button>`
        : '';

    const catIcon = getUsefulCategoryIcon(item.category);
    const catLabel = getUsefulCategoryLabel(item.category);

    const metaParts = [];
    if (item.address) metaParts.push(escapeHtml(item.address));
    if (item.phone)   metaParts.push(`<a href="tel:${escapeHtml(item.phone)}">${escapeHtml(item.phone)}</a>`);

    return `
        <div class="useful-item">
            <div class="useful-item__head">
                <div class="useful-item__cat">
                    <i data-lucide="${catIcon}"></i>
                    <span>${catLabel}</span>
                </div>
                ${badge}
                ${deleteBtn}
            </div>
            <div class="useful-item__title">${escapeHtml(item.title)}</div>
            ${item.description ? `<div class="useful-item__desc">${escapeHtml(item.description)}</div>` : ''}
            ${metaParts.length ? `<div class="useful-item__meta">${metaParts.join(' · ')}</div>` : ''}
            ${item.link ? `<a class="useful-item__link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener">Открыть ссылку →</a>` : ''}
        </div>
    `;
}

// === Модалка «Добавить полезное» ===
function openUsefulAddModal() {
    const modal = document.getElementById('usefulAddModal');
    if (!modal || !PLAYER) return;

    // Сброс формы
    document.getElementById('usefulTitle').value = '';
    document.getElementById('usefulDesc').value = '';
    document.getElementById('usefulCategory').value = 'food';
    document.getElementById('usefulAddress').value = '';
    document.getElementById('usefulPhone').value = '';
    document.getElementById('usefulLink').value = '';
    document.getElementById('usefulError').style.display = 'none';

    const cityLabel = document.getElementById('usefulAddCityLabel');
    if (cityLabel) {
        const cityName = CITIES[PLAYER.currentCity]?.name || '—';
        cityLabel.textContent = `Город: ${cityName}`;
    }

    modal.style.display = 'flex';
}

function closeUsefulAddModal() {
    const modal = document.getElementById('usefulAddModal');
    if (modal) modal.style.display = 'none';
}

async function submitUsefulAdd() {
    if (!PLAYER || !PLAYER.currentCity) return;

    const title = document.getElementById('usefulTitle').value.trim();
    const description = document.getElementById('usefulDesc').value.trim();
    const category = document.getElementById('usefulCategory').value;
    const address = document.getElementById('usefulAddress').value.trim();
    const phone = document.getElementById('usefulPhone').value.trim();
    const link = document.getElementById('usefulLink').value.trim();
    const errorEl = document.getElementById('usefulError');

    if (!title) {
        errorEl.textContent = 'Введи название';
        errorEl.style.display = 'block';
        return;
    }
    if (title.length < 2) {
        errorEl.textContent = 'Слишком короткое название';
        errorEl.style.display = 'block';
        return;
    }

    errorEl.style.display = 'none';

    const result = await addUsefulPlace({
        cityKey: PLAYER.currentCity,
        title, description, category, address, phone, link,
    });

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    // +5 XP
    PLAYER.xp += 5;
    const oldLevel = PLAYER.level;
    PLAYER.level = getLevelFromXP(PLAYER.xp);
    await savePlayerToServer(PLAYER);
    if (typeof updatePlayerBadge === 'function') updatePlayerBadge();
    if (typeof showXPToast === 'function') showXPToast(5, 'Полезное место');
    if (PLAYER.level > oldLevel && typeof showLevelUp === 'function') {
        setTimeout(() => showLevelUp(PLAYER.level), 400);
    }

    closeUsefulAddModal();
    await renderUsefulCard();
}

// === Модалка «Все полезное» ===
async function openUsefulAllModal() {
    const modal = document.getElementById('usefulAllModal');
    if (!modal || !PLAYER) return;

    modal.style.display = 'flex';
    USEFUL_FILTER = 'all';

    const list = document.getElementById('usefulAllList');
    list.innerHTML = '<div class="dashboard-empty">⏳ Загрузка...</div>';

    // Загружаем без лимита
    USEFUL_ALL = await loadUsefulPlaces(PLAYER.currentCity, 200);

    renderUsefulAllToolbar();
    renderUsefulAllList();
}

function closeUsefulAllModal() {
    const modal = document.getElementById('usefulAllModal');
    if (modal) modal.style.display = 'none';
}

function renderUsefulAllToolbar() {
    const tb = document.getElementById('usefulAllToolbar');
    if (!tb) return;

    const cats = [{ key: 'all', label: 'Все' },
        ...Object.entries(USEFUL_CATEGORIES).map(([k, v]) => ({ key: k, label: v.label }))];

    tb.innerHTML = `
        <div class="my-reviews-chips">
            ${cats.map(c => `
                <button type="button" class="my-reviews-chip ${USEFUL_FILTER === c.key ? 'active' : ''}"
                        data-useful-filter="${c.key}">${c.label}</button>
            `).join('')}
        </div>
    `;
}

function renderUsefulAllList() {
    const list = document.getElementById('usefulAllList');
    if (!list) return;

    const items = USEFUL_FILTER === 'all'
        ? USEFUL_ALL
        : USEFUL_ALL.filter(x => x.category === USEFUL_FILTER);

    if (items.length === 0) {
        list.innerHTML = `<div class="dashboard-empty">Ничего не найдено</div>`;
        return;
    }

    list.innerHTML = items.map(renderUsefulItem).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}