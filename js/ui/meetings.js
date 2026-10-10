// ============ UI: ВСТРЕЧИ ============

let MEETINGS_CACHE = [];

// ============================================
// КАРТОЧКА «МОИ ВСТРЕЧИ» В ДАШБОРДЕ
// ============================================
async function renderMeetingsDashboard() {
    const container = document.getElementById('dashMeetings');
    if (!container) return;

    container.innerHTML = '<div class="dashboard-empty">Загрузка...</div>';

    const myMeetings = await loadMyMeetings();
    MEETINGS_CACHE = myMeetings;

    // Топ-3 ближайших будущих
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = myMeetings
        .filter(m => m.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3);

    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="dashboard-empty">
                Пока нет встреч
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    container.innerHTML = upcoming.map(m => renderMeetingRow(m)).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Строка встречи в дашборде
function renderMeetingRow(meeting) {
    const date = new Date(meeting.date + 'T00:00:00');
    const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    const typeIcon = {
        gap: 'coffee',
        friend_meeting: 'users',
        birthday: 'cake',
        wedding: 'heart',
        business: 'briefcase',
        hashar: 'hand-heart',
        other: 'calendar',
    }[meeting.type] || 'calendar';

    const cityName = meeting.city_key && CITIES[meeting.city_key]
        ? CITIES[meeting.city_key].name
        : '';

    return `
        <div class="dashboard-row" data-meeting-id="${meeting.id}">
            <div class="dashboard-row__icon">
                <i data-lucide="${typeIcon}"></i>
            </div>
            <div class="dashboard-row__info">
                <div class="dashboard-row__name">${escapeHtml(meeting.title)}</div>
                <div class="dashboard-row__meta">
                    ${dateStr}
                    ${cityName ? ' · ' + escapeHtml(cityName) : ''}
                </div>
            </div>
        </div>
    `;
}

// ============================================
// МОДАЛКА СОЗДАНИЯ ВСТРЕЧИ
// ============================================

let MEETING_DRAFT = {
    type: null,
};

function openMeetingCreateModal() {
    const modal = document.getElementById('meetingCreateModal');
    if (!modal || !PLAYER) return;

    MEETING_DRAFT = { type: null };

    // Сброс на шаг 1
    modal.querySelectorAll('[data-meeting-step]').forEach(s => {
        s.style.display = s.dataset.meetingStep === '1' ? '' : 'none';
    });

    // Сброс полей
    document.getElementById('meetingTitle').value = '';
    document.getElementById('meetingDescription').value = '';
    document.getElementById('meetingPlace').value = '';
    document.getElementById('meetingAddress').value = '';
    document.getElementById('meetingPrivacy').value = 'friends';
    document.getElementById('meetingCreateError').style.display = 'none';

    // Дата — завтра
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('meetingDate').value = tomorrow.toISOString().slice(0, 10);

    // Город — текущий
    const citySelect = document.getElementById('meetingCity');
    if (citySelect) {
        if (citySelect.options.length === 0) {
            citySelect.innerHTML = Object.entries(CITIES)
                .map(([k, c]) => `<option value="${k}">${c.name}</option>`).join('');
        }
        citySelect.value = PLAYER.currentCity || 'tashkent';
    }

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeMeetingCreateModal() {
    const modal = document.getElementById('meetingCreateModal');
    if (modal) modal.style.display = 'none';
}

function selectMeetingType(type) {
    MEETING_DRAFT.type = type;

    // Заголовок шага 2
    const titles = {
        friend_meeting: { t: 'Встреча друзей', s: 'Соберёмся вместе' },
        birthday: { t: 'День рождения', s: 'Кто именинник?' },
        hashar: { t: 'Хашар', s: 'Общее дело' },
    };
    const info = titles[type] || { t: 'Встреча', s: '' };
    document.getElementById('meetingStep2Title').textContent = info.t;
    document.getElementById('meetingStep2Subtitle').textContent = info.s;

    // Показ полей по типу
    document.querySelectorAll('[data-meeting-fields]').forEach(el => {
        el.style.display = el.dataset.meetingFields === type ? '' : 'none';
    });

    // Переключить на шаг 2
    const modal = document.getElementById('meetingCreateModal');
    modal.querySelectorAll('[data-meeting-step]').forEach(s => {
        s.style.display = s.dataset.meetingStep === '2' ? '' : 'none';
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function submitMeetingCreate() {
    const errorEl = document.getElementById('meetingCreateError');
    errorEl.style.display = 'none';

    if (!MEETING_DRAFT.type) {
        errorEl.textContent = 'Выбери тип';
        errorEl.style.display = 'block';
        return;
    }

    const title = document.getElementById('meetingTitle').value.trim();
    const description = document.getElementById('meetingDescription').value.trim();
    const date = document.getElementById('meetingDate').value;
    const time = document.getElementById('meetingTime').value;
    const place = document.getElementById('meetingPlace').value.trim();
    const address = document.getElementById('meetingAddress').value.trim();
    const cityKey = document.getElementById('meetingCity').value;
    const privacy = document.getElementById('meetingPrivacy').value;

    if (!title) {
        errorEl.textContent = 'Введи название';
        errorEl.style.display = 'block';
        return;
    }
    if (title.length < 3) {
        errorEl.textContent = 'Название слишком короткое';
        errorEl.style.display = 'block';
        return;
    }
    if (!date) {
        errorEl.textContent = 'Выбери дату';
        errorEl.style.display = 'block';
        return;
    }

    // Данные по типу
    const data = {};
    if (MEETING_DRAFT.type === 'birthday') {
        data.birthday_person = document.getElementById('meetingBirthdayPerson').value.trim();
        data.age = parseInt(document.getElementById('meetingBirthdayAge').value) || null;
        data.wishlist = document.getElementById('meetingBirthdayWishlist').value.trim();
    } else if (MEETING_DRAFT.type === 'hashar') {
        data.category = document.getElementById('meetingHasharCategory').value;
        data.bring = document.getElementById('meetingHasharBring').value.trim();
        data.max_members = parseInt(document.getElementById('meetingHasharMax').value) || null;
    }

    const result = await createMeeting({
        type: MEETING_DRAFT.type,
        title, description, date, time, place, address, cityKey, privacy, data,
    });

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    closeMeetingCreateModal();
    await renderMeetingsDashboard();

    if (typeof showWarningToast === 'function') showWarningToast('✅ Встреча создана');
}

// ============================================
// МОДАЛКА «ВСЕ ВСТРЕЧИ»
// ============================================

let MEETINGS_ALL_FILTER = 'all';

async function openMeetingsAllModal() {
    const modal = document.getElementById('meetingsAllModal');
    if (!modal) return;

    modal.style.display = 'flex';
    MEETINGS_ALL_FILTER = 'all';
    document.getElementById('meetingsFilterType').value = 'all';

    await renderMeetingsAllList();
}

function closeMeetingsAllModal() {
    const modal = document.getElementById('meetingsAllModal');
    if (modal) modal.style.display = 'none';
}

async function renderMeetingsAllList() {
    const list = document.getElementById('meetingsAllList');
    if (!list) return;

    list.innerHTML = '<div class="dashboard-empty">Загрузка...</div>';

    const all = await loadMeetings({
        type: MEETINGS_ALL_FILTER === 'all' ? null : MEETINGS_ALL_FILTER,
    });

    // Фильтр: мои + друзей. Приватные чужие — не показываем.
    const friendIds = (typeof FRIENDS !== 'undefined' ? FRIENDS : []).map(f => f.id);
    const myId = PLAYER?.playerId;

    const visible = all.filter(m => {
        if (m.creator_id === myId) return true;
        if (m.privacy === 'public') return true;
        if (m.privacy === 'friends' && friendIds.includes(m.creator_id)) return true;
        return false;
    });

    // Только будущие
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = visible
        .filter(m => m.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date));

    if (upcoming.length === 0) {
        list.innerHTML = `
            <div class="dashboard-empty" style="padding: 40px 20px;">
                <p style="margin-bottom: 16px;">Пока нет встреч</p>
                <button class="btn btn-primary btn-sm" id="meetingsAllCreateBtn">
                    <i data-lucide="plus"></i> Создать встречу
                </button>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    list.innerHTML = upcoming.map(m => renderMeetingCard(m)).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Полная карточка встречи для модалки
function renderMeetingCard(meeting) {
    const date = new Date(meeting.date + 'T00:00:00');
    const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const timeStr = meeting.time ? meeting.time.slice(0, 5) : '';
    const cityName = meeting.city_key && CITIES[meeting.city_key]
        ? CITIES[meeting.city_key].name
        : '';

    const typeIcon = {
        gap: 'coffee',
        friend_meeting: 'users',
        birthday: 'cake',
        wedding: 'heart',
        business: 'briefcase',
        hashar: 'hand-heart',
        other: 'calendar',
    }[meeting.type] || 'calendar';

    const creator = meeting.creator || {};
    const creatorName = creator.name || 'Игрок';
    const creatorAvatar = creator.avatar || '🧑‍💼';
    const avatarHtml = typeof renderAvatarHtml === 'function'
        ? renderAvatarHtml(creatorAvatar)
        : creatorAvatar;

    const isMine = meeting.creator_id === PLAYER?.playerId;

    return `
        <div class="meeting-card" data-meeting-detail="${meeting.id}">
            <div class="meeting-card__icon">
                <i data-lucide="${typeIcon}"></i>
            </div>
            <div class="meeting-card__body">
                <div class="meeting-card__title">${escapeHtml(meeting.title)}</div>
                <div class="meeting-card__meta">
                    <span><i data-lucide="calendar"></i> ${dateStr}${timeStr ? ', ' + timeStr : ''}</span>
                    ${meeting.place ? `<span><i data-lucide="map-pin"></i> ${escapeHtml(meeting.place)}</span>` : ''}
                    ${cityName ? `<span><i data-lucide="building-2"></i> ${escapeHtml(cityName)}</span>` : ''}
                </div>
                <div class="meeting-card__creator">
                    <span class="meeting-card__avatar">${avatarHtml}</span>
                    <span>${isMine ? 'Ты' : escapeHtml(creatorName)}</span>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// ДЕТАЛИ ВСТРЕЧИ
// ============================================

async function openMeetingDetail(meetingId) {
    const modal = document.getElementById('meetingDetailModal');
    const body = document.getElementById('meetingDetailBody');
    if (!modal || !body) return;

    modal.style.display = 'flex';
    body.innerHTML = '<div class="dashboard-empty">Загрузка...</div>';

    const meeting = await loadMeetingById(meetingId);
    if (!meeting) {
        body.innerHTML = '<div class="dashboard-empty">Не удалось загрузить</div>';
        return;
    }

    const isMine = meeting.creator_id === PLAYER?.playerId;
    const date = new Date(meeting.date + 'T00:00:00');
    const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = meeting.time ? meeting.time.slice(0, 5) : '';
    const cityName = meeting.city_key && CITIES[meeting.city_key]
        ? CITIES[meeting.city_key].name
        : '';

    const typeLabel = {
        friend_meeting: 'Встреча друзей',
        birthday: 'День рождения',
        hashar: 'Хашар',
        gap: 'Гап',
        wedding: 'Свадьба',
        business: 'Бизнес-встреча',
        other: 'Встреча',
    }[meeting.type] || 'Встреча';

    // Поля для конкретного типа
    let typeFieldsHtml = '';
    const data = meeting.data || {};

    if (meeting.type === 'birthday') {
        typeFieldsHtml = `
            ${data.birthday_person ? `<div class="meeting-detail__row"><i data-lucide="user"></i> Именинник: <strong>${escapeHtml(data.birthday_person)}</strong></div>` : ''}
            ${data.age ? `<div class="meeting-detail__row"><i data-lucide="cake"></i> Возраст: <strong>${data.age}</strong></div>` : ''}
            ${data.wishlist ? `<div class="meeting-detail__row"><i data-lucide="gift"></i> Пожелания: ${escapeHtml(data.wishlist)}</div>` : ''}
        `;
    } else if (meeting.type === 'hashar') {
        const catLabels = {
            repair: 'Ремонт', trees: 'Деревья', cleanup: 'Уборка',
            help: 'Помощь', other: 'Другое',
        };
        typeFieldsHtml = `
            ${data.category ? `<div class="meeting-detail__row"><i data-lucide="tag"></i> Категория: <strong>${catLabels[data.category] || data.category}</strong></div>` : ''}
            ${data.bring ? `<div class="meeting-detail__row"><i data-lucide="shopping-bag"></i> Взять: ${escapeHtml(data.bring)}</div>` : ''}
            ${data.max_members ? `<div class="meeting-detail__row"><i data-lucide="users"></i> Лимит: ${data.max_members}</div>` : ''}
        `;
    }

    body.innerHTML = `
        <div class="meeting-detail__header">
            <div class="meeting-detail__type">${typeLabel}</div>
            <h2>${escapeHtml(meeting.title)}</h2>
        </div>

        ${meeting.description ? `<p class="meeting-detail__desc">${escapeHtml(meeting.description)}</p>` : ''}

        <div class="meeting-detail__rows">
            <div class="meeting-detail__row"><i data-lucide="calendar"></i> ${dateStr}${timeStr ? ', ' + timeStr : ''}</div>
            ${meeting.place ? `<div class="meeting-detail__row"><i data-lucide="map-pin"></i> ${escapeHtml(meeting.place)}</div>` : ''}
            ${meeting.address ? `<div class="meeting-detail__row"><i data-lucide="navigation"></i> ${escapeHtml(meeting.address)}</div>` : ''}
            ${cityName ? `<div class="meeting-detail__row"><i data-lucide="building-2"></i> ${escapeHtml(cityName)}</div>` : ''}
            ${typeFieldsHtml}
        </div>

        <div class="meeting-detail__privacy">
            <i data-lucide="lock"></i>
            ${meeting.privacy === 'public' ? 'Публичное' : meeting.privacy === 'friends' ? 'Только друзья' : 'По приглашению'}
        </div>

        ${isMine ? `
            <button class="btn btn-danger btn-block" id="meetingDetailCancelBtn" data-meeting-id="${meeting.id}" style="margin-top: 16px;">
                <i data-lucide="x"></i> Отменить встречу
            </button>
        ` : ''}
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeMeetingDetailModal() {
    const modal = document.getElementById('meetingDetailModal');
    if (modal) modal.style.display = 'none';
}