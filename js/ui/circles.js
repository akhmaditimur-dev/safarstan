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

    container.innerHTML = circles.slice(0, 5).map(c => {
        const typeLabel = CIRCLE_TYPE_LABELS[c.type] || 'Круг';
        let iconName = c.avatar_emoji || 'coffee';
        if (!/^[a-z][a-z0-9-]*$/.test(iconName)) {
            iconName = 'coffee';
        }

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

    requestAnimationFrame(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
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

    document.querySelectorAll('#circleIconPicker .circle-icon-option').forEach((btn, i) => {
        btn.classList.toggle('active', i === 0);
    });

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

    const [circle, members, pendingInvites, meetings] = await Promise.all([
        loadCircleById(circleId),
        loadCircleMembers(circleId),
        loadCirclePendingInvites(circleId),
        loadCircleMeetings(circleId),
    ]);

    if (!circle) {
        body.innerHTML = '<div class="dashboard-empty">Не удалось загрузить круг</div>';
        return;
    }

    CURRENT_OPEN_CIRCLE = circle;
    const myMembership = members.find(m => m.player_id === PLAYER?.playerId);
    const isAdmin = myMembership?.role === 'admin';

    renderCircleView(circle, members, meetings, pendingInvites, { isAdmin, myMembership });
}

function closeCircleView() {
    const modal = document.getElementById('circleViewModal');
    if (modal) modal.style.display = 'none';
    CURRENT_OPEN_CIRCLE = null;
}

function renderCircleView(circle, members, meetings, pendingInvites, { isAdmin, myMembership }) {
    const body = document.getElementById('circleViewBody');
    let iconName = circle.avatar_emoji || 'coffee';
    if (!/^[a-z][a-z0-9-]*$/.test(iconName)) {
        iconName = 'coffee';
    }
    const typeLabel = CIRCLE_TYPE_LABELS[circle.type] || 'Круг';
    const scheduleLabel = circle.schedule?.type
        ? (CIRCLE_SCHEDULE_LABELS[circle.schedule.type] || '')
        : 'Без расписания';

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

    const meetingsHtml = renderCircleMeetingsSection(circle, members, meetings);

    let actionsHtml = '';
    if (isAdmin) {
        actionsHtml = `
            <button class="btn btn-primary btn-block" id="circleMeetingCreateBtn" data-circle-id="${circle.id}">
                <i data-lucide="calendar-plus"></i> Запланировать встречу
            </button>
            <button class="btn btn-secondary btn-block" id="circleInviteBtn" data-circle-id="${circle.id}">
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

        ${meetingsHtml}

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

// ============================================
// СЕКЦИЯ ВСТРЕЧ В КРУГЕ
// ============================================

function renderCircleMeetingsSection(circle, members, meetings) {
    const planned = (meetings || []).filter(m => m.status === 'planned');
    const past = (meetings || []).filter(m => m.status === 'done' || m.status === 'cancelled');

    const today = new Date().toISOString().slice(0, 10);
    const upcoming = planned
        .filter(m => m.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date));

    const next = upcoming[0];
    const upcomingHtml = next ? `
        <div class="circle-meeting-next">
            <div class="circle-meeting-next__date">
                <i data-lucide="calendar"></i>
                ${formatDate(next.date)}${next.time ? ', ' + next.time.slice(0, 5) : ''}
            </div>
            ${next.place ? `<div class="circle-meeting-next__place"><i data-lucide="map-pin"></i> ${escapeHtml(next.place)}</div>` : ''}
            ${next.address ? `<div class="circle-meeting-next__address">${escapeHtml(next.address)}</div>` : ''}
            ${next.comment ? `<div class="circle-meeting-next__comment">${escapeHtml(next.comment)}</div>` : ''}
            <div class="circle-meeting-next__org">
                <i data-lucide="user"></i>
                Организатор: <strong>${escapeHtml(getMemberName(members, next.organizer_id))}</strong>
            </div>
            ${next.organizer_id === PLAYER?.playerId ? `
                <button class="btn btn-secondary btn-sm" data-circle-meeting-done="${next.id}">
                    <i data-lucide="check"></i> Проведена
                </button>
            ` : ''}
        </div>
    ` : `
        <div class="dashboard-empty">Пока нет запланированных встреч</div>
    `;

    const historyHtml = past.slice(0, 5).map(m => {
        const statusIcon = m.status === 'done' ? 'check' : 'x';
        const statusLabel = m.status === 'done' ? 'проведена' : 'отменена';
        return `
            <div class="circle-meeting-history">
                <div class="circle-meeting-history__date">
                    ${formatDate(m.date)}
                </div>
                <div class="circle-meeting-history__place">
                    ${escapeHtml(m.place || '—')}
                </div>
                <div class="circle-meeting-history__status">
                    <i data-lucide="${statusIcon}"></i> ${statusLabel}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="circle-view__section">
            <h3>Ближайшая встреча</h3>
            ${upcomingHtml}
        </div>

        ${past.length > 0 ? `
            <div class="circle-view__section">
                <h3>История (${past.length})</h3>
                ${historyHtml}
            </div>
        ` : ''}
    `;
}

function getMemberName(members, playerId) {
    const m = (members || []).find(x => x.player_id === playerId);
    return m ? m.name : 'Игрок';
}

// ============================================
// СОЗДАНИЕ ВСТРЕЧИ КРУГА
// ============================================

async function openCircleMeetingModal(circleId) {
    const modal = document.getElementById('circleMeetingModal');
    if (!modal) return;

    const circle = await loadCircleById(circleId);
    if (!circle) return;

    const members = await loadCircleMembers(circleId);
    const meetings = await loadCircleMeetings(circleId);

    document.getElementById('circleMeetingCircleName').textContent = circle.name;
    document.getElementById('circleMeetingDate').value = '';
    document.getElementById('circleMeetingTime').value = '18:00';
    document.getElementById('circleMeetingPlace').value = circle.meet_point || '';
    document.getElementById('circleMeetingAddress').value = '';
    document.getElementById('circleMeetingComment').value = '';
    document.getElementById('circleMeetingError').style.display = 'none';

    const orgSelect = document.getElementById('circleMeetingOrganizer');
    orgSelect.innerHTML = members.map(m =>
        `<option value="${m.player_id}">${escapeHtml(m.name)}${m.player_id === PLAYER?.playerId ? ' (ты)' : ''}</option>`
    ).join('');

    const suggested = suggestNextOrganizer(members, meetings);
    if (suggested) {
        orgSelect.value = suggested;
        const suggestedName = getMemberName(members, suggested);
        const hintEl = document.getElementById('circleMeetingHint');
        if (hintEl && suggested !== PLAYER?.playerId) {
            hintEl.textContent = `Рекомендация: ${suggestedName} давно не организовывал`;
        } else {
            hintEl.textContent = '';
        }
    } else {
        document.getElementById('circleMeetingHint').textContent = '';
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('circleMeetingDate').value = tomorrow.toISOString().slice(0, 10);

    modal.dataset.circleId = circleId;
    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeCircleMeetingModal() {
    const modal = document.getElementById('circleMeetingModal');
    if (modal) modal.style.display = 'none';
}

async function submitCircleMeeting() {
    const modal = document.getElementById('circleMeetingModal');
    const errorEl = document.getElementById('circleMeetingError');
    errorEl.style.display = 'none';

    const circleId = modal.dataset.circleId;
    const date = document.getElementById('circleMeetingDate').value;
    const time = document.getElementById('circleMeetingTime').value;
    const place = document.getElementById('circleMeetingPlace').value.trim();
    const address = document.getElementById('circleMeetingAddress').value.trim();
    const comment = document.getElementById('circleMeetingComment').value.trim();
    const organizerId = document.getElementById('circleMeetingOrganizer').value;

    if (!date) {
        errorEl.textContent = 'Выбери дату';
        errorEl.style.display = 'block';
        return;
    }

    if (typeof hasBadWords === 'function' && comment && hasBadWords(comment)) {
        errorEl.textContent = 'Пожалуйста, без грубых слов';
        errorEl.style.display = 'block';
        return;
    }

    const result = await createCircleMeeting({
        circleId,
        organizerId,
        date,
        time,
        place,
        address,
        comment,
    });

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    closeCircleMeetingModal();
    if (CURRENT_OPEN_CIRCLE) {
        await openCircleView(CURRENT_OPEN_CIRCLE.id);
    }
    if (typeof showWarningToast === 'function') {
        showWarningToast('✅ Встреча запланирована');
    }
}