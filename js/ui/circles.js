// ============ UI: КРУГИ ============

let CIRCLES_CACHE = [];

const CIRCLE_TYPE_LABELS = {
    gap: 'Гап',
    family: 'Семья',
    work: 'Коллеги',
    earth: 'Землячество',
};

const CIRCLE_SCHEDULE_LABELS = {
    weekly: 'Каждую неделю',
    biweekly: 'Раз в 2 недели',
    monthly: 'Раз в месяц',
    quarterly: 'Раз в квартал',
    once: 'Один раз',
    manual: 'По договорённости',
};

// ============================================
// РЕНДЕР: карточка в дашборде
// ============================================
async function renderCirclesDashboard() {
    const container = document.getElementById('dashCircles');
    if (!container || !PLAYER) return;

    container.innerHTML = '<div class="dashboard-empty">Загрузка...</div>';

    const circles = await loadMyCircles();
    CIRCLES_CACHE = circles;

    if (circles.length === 0) {
        container.innerHTML = `
            <div class="dashboard-empty">
                Пока нет кругов. Создай первый.
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    // Первые 5
    container.innerHTML = circles.slice(0, 5).map(c => {
        const typeLabel = CIRCLE_TYPE_LABELS[c.type] || 'Круг';
        const iconName = c.avatar_emoji || 'coffee';

        return `
            <div class="dashboard-row" data-circle-id="${c.id}">
                <div class="dashboard-row__icon"><i data-lucide="${iconName}"></i></div>
                <div class="dashboard-row__info">
                    <div class="dashboard-row__name">${escapeHtml(c.name)}</div>
                    <div class="dashboard-row__meta">
                        ${typeLabel}
                        ${c.city_key ? ' · ' + cityName(c.city_key) : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// МОДАЛКА СОЗДАНИЯ
// ============================================
function openCircleCreateModal() {
    const modal = document.getElementById('circleCreateModal');
    if (!modal || !PLAYER) return;

    document.getElementById('circleType').value = 'gap';
    document.getElementById('circleName').value = '';
    document.getElementById('circleDescription').value = '';
    document.getElementById('circleSchedule').value = 'monthly';
    document.getElementById('circleMeetPoint').value = '';
    document.getElementById('circleCreateError').style.display = 'none';

    // Иконка — сброс на coffee
    document.querySelectorAll('#circleIconPicker .circle-icon-option').forEach((btn, i) => {
        btn.classList.toggle('active', i === 0);
    });

    // Город
    if (typeof initCitySelect === 'function') {
        initCitySelect('circleCityInput', 'circleCity', 'circleCityDropdown');
        setCitySelect('circleCityInput', 'circleCity', PLAYER.currentCity || 'tashkent');
    }

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeCircleCreateModal() {
    const modal = document.getElementById('circleCreateModal');
    if (modal) modal.style.display = 'none';
}

async function submitCircleCreate() {
    const errorEl = document.getElementById('circleCreateError');
    errorEl.style.display = 'none';

    const type = document.getElementById('circleType').value;
    const name = document.getElementById('circleName').value.trim();
    const description = document.getElementById('circleDescription').value.trim();
    const cityKey = document.getElementById('circleCity').value;
    const scheduleType = document.getElementById('circleSchedule').value;
    const meetPoint = document.getElementById('circleMeetPoint').value.trim();
    const iconBtn = document.querySelector('#circleIconPicker .circle-icon-option.active');
    const icon = iconBtn ? iconBtn.dataset.icon : 'coffee';

    if (!name || name.length < 3) {
        errorEl.textContent = 'Название слишком короткое (минимум 3 символа)';
        errorEl.style.display = 'block';
        return;
    }

    if (typeof hasBadWords === 'function' && hasBadWords(name)) {
        errorEl.textContent = 'Пожалуйста, без грубых слов';
        errorEl.style.display = 'block';
        return;
    }

    if (!cityKey) {
        errorEl.textContent = 'Выбери город';
        errorEl.style.display = 'block';
        return;
    }

    const result = await createCircle({
        type,
        name,
        description,
        cityKey,
        schedule: { type: scheduleType },
        meetPoint,
        avatarEmoji: icon,
    });

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    closeCircleCreateModal();
    await renderCirclesDashboard();

    if (typeof showWarningToast === 'function') {
        showWarningToast('✅ Круг создан');
    }
}

// ============================================
// ПРОСМОТР КРУГА
// ============================================

let CURRENT_OPEN_CIRCLE = null;

async function openCircleView(circleId) {
    const modal = document.getElementById('circleViewModal');
    if (!modal) return;

    modal.style.display = 'flex';
    const body = document.getElementById('circleViewBody');
    body.innerHTML = '<div class="dashboard-empty">Загрузка...</div>';

    const [circle, members, pendingInvites] = await Promise.all([
        loadCircleById(circleId),
        loadCircleMembers(circleId),
        loadCirclePendingInvites(circleId),
    ]);

    if (!circle) {
        body.innerHTML = '<div class="dashboard-empty">Не удалось загрузить круг</div>';
        return;
    }

    CURRENT_OPEN_CIRCLE = circle;
    const myMembership = members.find(m => m.player_id === PLAYER?.playerId);
    const isAdmin = myMembership?.role === 'admin';

    renderCircleView(circle, members, pendingInvites, { isAdmin, myMembership });
}

function closeCircleView() {
    const modal = document.getElementById('circleViewModal');
    if (modal) modal.style.display = 'none';
    CURRENT_OPEN_CIRCLE = null;
}

function renderCircleView(circle, members, pendingInvites, { isAdmin, myMembership }) {
    const body = document.getElementById('circleViewBody');
    const iconName = circle.avatar_emoji || 'coffee';
    const typeLabel = CIRCLE_TYPE_LABELS[circle.type] || 'Круг';
    const scheduleLabel = circle.schedule?.type
        ? (CIRCLE_SCHEDULE_LABELS[circle.schedule.type] || '')
        : 'Без расписания';

    // Участники
    const membersHtml = members.map(m => {
        const avatarHtml = renderAvatarHtml(m.avatar);
        const roleIcon = m.role === 'admin' ? 'crown' : 'user';
        return `
            <div class="circle-member" data-player-profile="${m.player_id}">
                <div class="circle-member__avatar">${avatarHtml}</div>
                <div class="circle-member__name">${escapeHtml(m.name)}</div>
                <div class="circle-member__role">
                    <i data-lucide="${roleIcon}"></i>
                </div>
            </div>
        `;
    }).join('');

    // Входящие заявки (только админ)
    const pendingHtml = (isAdmin && pendingInvites.length > 0) ? `
        <div class="circle-view__section">
            <h3>Заявки на вступление (${pendingInvites.length})</h3>
            ${pendingInvites.map(inv => {
                const avatarHtml = renderAvatarHtml(inv.to.avatar);
                return `
                    <div class="circle-pending">
                        <div class="circle-pending__avatar">${avatarHtml}</div>
                        <div class="circle-pending__info">
                            <div><strong>${escapeHtml(inv.to.name)}</strong></div>
                            <div class="circle-pending__meta">пригласил ${escapeHtml(inv.from.name)}</div>
                        </div>
                        <div class="circle-pending__actions">
                            <button class="btn btn-primary btn-sm" data-circle-approve="${inv.id}">
                                <i data-lucide="check"></i>
                            </button>
                            <button class="btn btn-ghost btn-sm" data-circle-decline="${inv.id}">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    ` : '';

    // Кнопки
    let actionsHtml = '';
    if (isAdmin) {
        actionsHtml = `
            <button class="btn btn-primary btn-block" id="circleInviteBtn" data-circle-id="${circle.id}">
                <i data-lucide="user-plus"></i> Пригласить
            </button>
        `;
        if (members.length > 1) {
            actionsHtml += `
                <button class="btn btn-ghost btn-block" id="circleLeaveBtn" data-circle-id="${circle.id}">
                    <i data-lucide="log-out"></i> Выйти
                </button>
            `;
        }
    } else if (myMembership) {
        actionsHtml = `
            <button class="btn btn-ghost btn-block" id="circleLeaveBtn" data-circle-id="${circle.id}">
                <i data-lucide="log-out"></i> Выйти
            </button>
        `;
    }

    body.innerHTML = `
        <div class="circle-view__header">
            <div class="circle-view__icon"><i data-lucide="${iconName}"></i></div>
            <div>
                <div class="circle-view__type">${typeLabel}</div>
                <h2>${escapeHtml(circle.name)}</h2>
            </div>
        </div>

        ${circle.description ? `<p class="circle-view__desc">${escapeHtml(circle.description)}</p>` : ''}

        <div class="circle-view__rows">
            ${circle.city_key ? `<div class="circle-view__row"><i data-lucide="map-pin"></i> ${cityName(circle.city_key)}</div>` : ''}
            ${circle.meet_point ? `<div class="circle-view__row"><i data-lucide="coffee"></i> ${escapeHtml(circle.meet_point)}</div>` : ''}
            <div class="circle-view__row"><i data-lucide="clock"></i> ${scheduleLabel}</div>
        </div>

        ${pendingHtml}

        <div class="circle-view__section">
            <h3>Участники (${members.length})</h3>
            <div class="circle-members-grid">${membersHtml}</div>
        </div>

        <div class="circle-view__actions">${actionsHtml}</div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// ПРИГЛАШЕНИЕ
// ============================================

function openCircleInviteModal(circleId) {
    const modal = document.getElementById('circleInviteModal');
    if (!modal) return;

    document.getElementById('circleInviteSearch').value = '';
    document.getElementById('circleInviteResults').innerHTML = '';
    document.getElementById('circleInviteSearch').dataset.circleId = circleId;

    modal.style.display = 'flex';
}

function closeCircleInviteModal() {
    const modal = document.getElementById('circleInviteModal');
    if (modal) modal.style.display = 'none';
}

function searchFriendsForCircle(query) {
    const container = document.getElementById('circleInviteResults');
    if (!container) return;

    if (!query || query.length < 2) {
        container.innerHTML = '';
        return;
    }

    const friends = (typeof FRIENDS !== 'undefined' ? FRIENDS : []);
    const q = query.toLowerCase();
    const found = friends.filter(f => f.name.toLowerCase().includes(q)).slice(0, 10);

    if (found.length === 0) {
        container.innerHTML = '<div class="dashboard-empty">Никого не нашли</div>';
        return;
    }

    const circleId = document.getElementById('circleInviteSearch').dataset.circleId;

    container.innerHTML = found.map(p => {
        const avatarHtml = renderAvatarHtml(p.avatar || '🧑‍💼');
        return `
            <div class="circle-invite-result">
                <div class="circle-invite-result__avatar">${avatarHtml}</div>
                <div class="circle-invite-result__name">${escapeHtml(p.name)}</div>
                <button class="btn btn-primary btn-sm"
                        data-circle-invite-send="${p.id}"
                        data-circle-id="${circleId}">
                    Пригласить
                </button>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}