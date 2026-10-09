// ============ UI: КАЛЕНДАРЬ ============

let _calYear = new Date().getFullYear();
let _calMonth = new Date().getMonth();
let _calEvents = [];

const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const DOW_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// ============================================
// РЕНДЕР
// ============================================
async function renderCalendar() {
    const grid = document.getElementById('calGrid');
    const label = document.getElementById('calMonthLabel');
    if (!grid || !label) return;

    label.textContent = `${MONTH_NAMES[_calMonth]} ${_calYear}`;

    _calEvents = await loadMyCalendarEvents(_calYear, _calMonth);

    const byDate = {};
    _calEvents.forEach(e => {
        if (!byDate[e.date]) byDate[e.date] = [];
        byDate[e.date].push(e);
    });

    let html = '';

    DOW_NAMES.forEach(d => {
        html += `<div class="calendar-grid__dow">${d}</div>`;
    });

    const firstDay = new Date(_calYear, _calMonth, 1);
    const daysInMonth = new Date(_calYear, _calMonth + 1, 0).getDate();

    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let i = 0; i < startDow; i++) {
        html += `<div class="calendar-day calendar-day--empty"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${_calYear}-${String(_calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const events = byDate[dateStr] || [];

        const isToday = dateStr === todayStr;
        const isPast = dateStr < todayStr;

        let cls = 'calendar-day';
        if (isToday) cls += ' calendar-day--today';
        else if (isPast) cls += ' calendar-day--past';

        let dots = '';
        if (events.length > 0) {
            const hasPlan = events.some(e => e.type === 'plan');
            const hasGap = events.some(e => e.type === 'gap');
            const hasHashar = events.some(e => e.type === 'hashar');

            dots = '<div class="calendar-day__dots">';
            if (hasPlan) dots += '<span class="calendar-dot calendar-dot--plan"></span>';
            if (hasGap) dots += '<span class="calendar-dot calendar-dot--gap"></span>';
            if (hasHashar) dots += '<span class="calendar-dot calendar-dot--hashar"></span>';
            dots += '</div>';
        }

        html += `
            <button class="${cls}" data-cal-date="${dateStr}">
                ${d}
                ${dots}
            </button>
        `;
    }

    grid.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// МОДАЛКА ДНЯ
// ============================================
function openCalendarDayModal(dateStr) {
    const modal = document.getElementById('calendarDayModal');
    if (!modal) return;

    const events = _calEvents.filter(e => e.date === dateStr);

    const [y, m, d] = dateStr.split('-');
    document.getElementById('calendarDayTitle').textContent = `${parseInt(d)} ${MONTH_NAMES[parseInt(m) - 1]} ${y}`;

    const list = document.getElementById('calendarDayList');

    if (events.length === 0) {
        list.innerHTML = '<div class="calendar-day-empty">Нет событий</div>';
    } else {
        list.innerHTML = events.map(e => {
            let iconName = 'calendar-plus';
            let cls = 'plan';

            if (e.type === 'gap') {
                iconName = 'coffee';
                cls = 'gap';
            } else if (e.type === 'hashar') {
                iconName = 'hand-heart';
                cls = 'hashar';
            }

            return `
                <div class="calendar-event">
                    <div class="calendar-event__icon calendar-event__icon--${cls}">
                        <i data-lucide="${iconName}"></i>
                    </div>
                    <div class="calendar-event__body">
                        <div class="calendar-event__title">${escapeHtml(e.title)}</div>
                        ${e.sub ? `<div class="calendar-event__sub">${escapeHtml(e.sub)}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeCalendarDayModal() {
    const modal = document.getElementById('calendarDayModal');
    if (modal) modal.style.display = 'none';
}

// ============================================
// ОБРАБОТЧИКИ
// ============================================
document.addEventListener('click', (e) => {
    if (e.target.closest('#calPrevBtn')) {
        _calMonth--;
        if (_calMonth < 0) { _calMonth = 11; _calYear--; }
        renderCalendar();
        return;
    }

    if (e.target.closest('#calNextBtn')) {
        _calMonth++;
        if (_calMonth > 11) { _calMonth = 0; _calYear++; }
        renderCalendar();
        return;
    }

    const dayBtn = e.target.closest('[data-cal-date]');
    if (dayBtn) {
        openCalendarDayModal(dayBtn.dataset.calDate);
        return;
    }

    if (e.target.closest('#calendarDayClose') || e.target.id === 'calendarDayModal') {
        closeCalendarDayModal();
    }
});