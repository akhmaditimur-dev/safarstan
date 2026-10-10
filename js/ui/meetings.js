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