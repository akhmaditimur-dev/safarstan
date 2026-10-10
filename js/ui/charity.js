// ============ UI: БЛАГОТВОРИТЕЛЬНОСТЬ ============

let CHARITY_CACHE = [];
let CHARITY_FILTER = 'all';

const CHARITY_TYPE_LABELS = {
    money: 'Деньги',
    things: 'Вещи',
    help: 'Помощь',
    volunteer: 'Волонтёрство',
    animals: 'Животные',
};

// ============================================
// РЕНДЕР СЕКЦИИ
// ============================================
async function renderCharity() {
    const list = document.getElementById('charityList');
    if (!list) return;

    list.innerHTML = '<div class="charity-empty">⏳ Загрузка...</div>';

    const all = await loadCharityCampaigns();
    CHARITY_CACHE = all;

    let items = all;
    if (CHARITY_FILTER === 'money') {
        items = all.filter(c => c.type === 'money');
    } else if (CHARITY_FILTER === 'things') {
        items = all.filter(c => c.type === 'things');
    } else if (CHARITY_FILTER === 'mine') {
        items = all.filter(c => c.creator_id === PLAYER?.playerId);
    }

    if (items.length === 0) {
        const cta = CHARITY_FILTER === 'mine'
            ? '<p>У тебя пока нет сборов</p>'
            : '<p>Пока нет активных сборов</p>';
        list.innerHTML = `
            <div class="charity-empty">
                ${cta}
                <button class="btn btn-primary btn-sm" id="charityCreateBtnEmpty">
                    <i data-lucide="plus"></i> Создать сбор
                </button>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    list.innerHTML = items.map(c => renderCharityCard(c)).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderCharityCard(campaign) {
    const typeLabel = CHARITY_TYPE_LABELS[campaign.type] || 'Сбор';
    const creator = campaign.creator || {};
    const creatorName = creator.name || 'Игрок';
    const avatarHtml = typeof renderAvatarHtml === 'function'
        ? renderAvatarHtml(creator.avatar || '🧑‍💼')
        : '🧑‍💼';

    const cityName = campaign.city_key && CITIES[campaign.city_key]
        ? CITIES[campaign.city_key].name
        : '';

    // Прогресс
    let progressHtml = '';
    if (campaign.type === 'money' && campaign.goal_amount) {
        const collected = campaign.collected_amount || 0;
        const percent = Math.min(100, Math.round((collected / campaign.goal_amount) * 100));
        progressHtml = `
            <div class="charity-card__progress">
                <div class="charity-card__progress-bar">
                    <div class="charity-card__progress-fill" style="width: ${percent}%"></div>
                </div>
                <div class="charity-card__progress-text">
                    ${collected} / ${campaign.goal_amount}
                </div>
            </div>
        `;
    }

    // Статус
    const statusLabels = {
        pending_moderation: { label: 'На модерации', cls: 'warning' },
        active: { label: 'Активный', cls: 'success' },
        rejected: { label: 'Отклонён', cls: 'danger' },
        closed: { label: 'Закрыт', cls: 'muted' },
        reported: { label: 'С отчётом', cls: 'success' },
    };
    const status = statusLabels[campaign.status] || { label: campaign.status, cls: 'muted' };

    return `
        <div class="charity-card" data-charity-id="${campaign.id}">
            <div class="charity-card__head">
                <span class="charity-card__type">${typeLabel}</span>
                <span class="charity-status charity-status--${status.cls}">${status.label}</span>
            </div>

            <h3 class="charity-card__title">${escapeHtml(campaign.title)}</h3>

            ${campaign.description ? `<p class="charity-card__desc">${escapeHtml(campaign.description)}</p>` : ''}

            ${cityName ? `<div class="charity-card__city"><i data-lucide="map-pin"></i> ${escapeHtml(cityName)}</div>` : ''}

            ${progressHtml}

            <div class="charity-card__footer">
                <div class="charity-card__author">
                    <span class="charity-card__avatar">${avatarHtml}</span>
                    <span>${escapeHtml(creatorName)}</span>
                </div>
                ${campaign.deadline ? `<span class="charity-card__deadline">до ${formatDate(campaign.deadline)}</span>` : ''}
            </div>
        </div>
    `;
}

// ============================================
// МОДАЛКА СОЗДАНИЯ
// ============================================
function openCharityCreateModal() {
    const modal = document.getElementById('charityCreateModal');
    if (!modal || !PLAYER) return;

    // ... сброс полей ...

    toggleCharityTypeFields();

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Инициализация поиска города — после показа модалки
    if (typeof initCitySelect === 'function') {
        initCitySelect('charityCityInput', 'charityCity', 'charityCityDropdown');
        setCitySelect('charityCityInput', 'charityCity', PLAYER.currentCity || 'tashkent');
    }
}

function closeCharityCreateModal() {
    const modal = document.getElementById('charityCreateModal');
    if (modal) modal.style.display = 'none';
}

function toggleCharityTypeFields() {
    const type = document.getElementById('charityType').value;
    const moneyFields = document.querySelectorAll('[data-charity-money-fields]');
    moneyFields.forEach(el => {
        el.style.display = type === 'money' ? '' : 'none';
    });
}

async function submitCharityCreate() {
    const errorEl = document.getElementById('charityCreateError');
    errorEl.style.display = 'none';

    const type = document.getElementById('charityType').value;
    const title = document.getElementById('charityTitle').value.trim();
    const description = document.getElementById('charityDescription').value.trim();
    const cityKey = document.getElementById('charityCity').value;
    const goalAmount = document.getElementById('charityGoal').value.trim();
    const requisites = document.getElementById('charityRequisites').value.trim();
    const deadline = document.getElementById('charityDeadline').value;

    if (!title || title.length < 3) {
        errorEl.textContent = 'Название слишком короткое';
        errorEl.style.display = 'block';
        return;
    }
    if (!description || description.length < 10) {
        errorEl.textContent = 'Описание слишком короткое (минимум 10 символов)';
        errorEl.style.display = 'block';
        return;
    }

    // Автопроверка мата
    if (typeof hasBadWords === 'function' && (hasBadWords(title) || hasBadWords(description))) {
        errorEl.textContent = 'Пожалуйста, без грубых слов';
        errorEl.style.display = 'block';
        return;
    }

    if (type === 'money') {
        if (!goalAmount) {
            errorEl.textContent = 'Укажи цель сбора';
            errorEl.style.display = 'block';
            return;
        }
        if (!requisites) {
            errorEl.textContent = 'Укажи реквизиты';
            errorEl.style.display = 'block';
            return;
        }
    }

    const result = await createCharityCampaign({
        type, title, description, cityKey,
        goalAmount, requisites, deadline,
    });

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    closeCharityCreateModal();
    await renderCharity();
    if (typeof showWarningToast === 'function') {
        showWarningToast('✅ Сбор отправлен на модерацию');
    }
}

// ============================================
// МОДАЛКА ДЕТАЛЕЙ
// ============================================
async function openCharityDetail(campaignId) {
    const modal = document.getElementById('charityDetailModal');
    const body = document.getElementById('charityDetailBody');
    if (!modal || !body) return;

    modal.style.display = 'flex';
    body.innerHTML = '<div class="dashboard-empty">Загрузка...</div>';

    const campaign = await loadCharityById(campaignId);
    if (!campaign) {
        body.innerHTML = '<div class="dashboard-empty">Не удалось загрузить</div>';
        return;
    }

    const typeLabel = CHARITY_TYPE_LABELS[campaign.type] || 'Сбор';
    const cityName = campaign.city_key && CITIES[campaign.city_key]
        ? CITIES[campaign.city_key].name
        : '';

    const isMine = campaign.creator_id === PLAYER?.playerId;

    // Прогресс
    let progressHtml = '';
    if (campaign.type === 'money' && campaign.goal_amount) {
        const collected = campaign.collected_amount || 0;
        const percent = Math.min(100, Math.round((collected / campaign.goal_amount) * 100));
        progressHtml = `
            <div class="charity-detail__progress">
                <div class="charity-card__progress-bar">
                    <div class="charity-card__progress-fill" style="width: ${percent}%"></div>
                </div>
                <div class="charity-card__progress-text">
                    Собрано: ${collected} из ${campaign.goal_amount}
                </div>
            </div>
        `;
    }

    body.innerHTML = `
        <div class="charity-detail__header">
            <span class="charity-card__type">${typeLabel}</span>
            <h2>${escapeHtml(campaign.title)}</h2>
        </div>

        ${campaign.description ? `<p class="charity-detail__desc">${escapeHtml(campaign.description)}</p>` : ''}

        <div class="charity-detail__rows">
            ${cityName ? `<div class="meeting-detail__row"><i data-lucide="map-pin"></i> ${escapeHtml(cityName)}</div>` : ''}
            ${campaign.deadline ? `<div class="meeting-detail__row"><i data-lucide="calendar"></i> до ${formatDate(campaign.deadline)}</div>` : ''}
            ${campaign.requisites ? `<div class="meeting-detail__row"><i data-lucide="credit-card"></i> ${escapeHtml(campaign.requisites)}</div>` : ''}
        </div>

        ${progressHtml}

        ${isMine ? `
            <button class="btn btn-secondary btn-block" id="charityReportBtn" data-charity-id="${campaign.id}" style="margin-top: 16px;">
                <i data-lucide="file-text"></i> Оставить отчёт
            </button>
        ` : ''}
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeCharityDetailModal() {
    const modal = document.getElementById('charityDetailModal');
    if (modal) modal.style.display = 'none';
}