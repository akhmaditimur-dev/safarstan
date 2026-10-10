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