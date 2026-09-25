// ============ UI: ДАШБОРД ============

// === Показать лендинг ===
function showLanding() {
    const landing = document.getElementById('landing');
    const dashboard = document.getElementById('dashboard');
    const hero = document.querySelector('.hero');

    if (landing) landing.style.display = 'block';
    if (dashboard) dashboard.style.display = 'none';
    if (hero) hero.style.display = 'none';

    hidePrivateSections();
}

// === Показать дашборд ===
async function showDashboard() {
    const landing = document.getElementById('landing');
    const dashboard = document.getElementById('dashboard');
    const hero = document.querySelector('.hero');

    if (landing) landing.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';
    if (hero) hero.style.display = 'block';

    showPrivateSections();

    renderSidebar();
    renderDashboard();
    await renderPlans();
    await renderFriends();
    await renderFeed();

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// === Скрыть секции для не-залогиненных ===
function hidePrivateSections() {
    const sections = ['ratings', 'quests'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    document.querySelectorAll('.add-place-btn').forEach(btn => {
        btn.style.display = 'none';
    });
}

// === Показать секции для залогиненных ===
function showPrivateSections() {
    const sections = ['ratings', 'quests'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = '';
    });

    document.querySelectorAll('.add-place-btn').forEach(btn => {
        btn.style.display = '';
    });
}

// === Рендер дашборда ===
function renderDashboard() {
    if (!PLAYER) return;

    // === АВАТАР ===
    const dashAvatar = document.getElementById('dashAvatar');
    if (dashAvatar && typeof renderAvatar === 'function') {
        renderAvatar(dashAvatar, PLAYER.avatar);
    } else if (dashAvatar) {
        dashAvatar.textContent = PLAYER.avatar || '🧑‍💼';
    }

    // === ИМЯ, УРОВЕНЬ, XP ===
    const dashName = document.getElementById('dashName');
    const dashLevel = document.getElementById('dashLevel');
    const dashXP = document.getElementById('dashXP');

    if (dashName) dashName.textContent = PLAYER.name;
    if (dashLevel) dashLevel.textContent = PLAYER.level;
    if (dashXP) dashXP.textContent = PLAYER.xp;

    const xpInLevel = PLAYER.xp % 100;
    const xpToNext = 100 - xpInLevel;

    const dashXPNext = document.getElementById('dashXPNext');
    const dashXPBar = document.getElementById('dashXPBar');

    if (dashXPNext) dashXPNext.textContent = `до уровня ${PLAYER.level + 1}: ${xpToNext} XP`;
    if (dashXPBar) dashXPBar.style.width = `${xpInLevel}%`;

    // === МОИ ГОРОДА ===
    const citiesEl = document.getElementById('dashCities');
    if (citiesEl) {
        const visited = PLAYER.visitedCities || {};
        const visitedCount = Object.values(visited).filter(n => n > 0).length;

        if (visitedCount === 0) {
            citiesEl.innerHTML = `
                <div class="dashboard-empty">
                    Пока нет посещённых городов. Начни с чек-ина!
                </div>
            `;
        } else {
            citiesEl.innerHTML = Object.entries(CITIES).map(([key, city]) => {
                const isHome = key === PLAYER.homeCity;
                const isCurrent = key === PLAYER.currentCity;
                const isVisited = visited[key] > 0;
                let cls = 'city-chip';
                let icon = '';

            if (isHome)         { cls += ' home';    icon = '<i data-lucide="home"></i>'; }
            else if (isCurrent) { cls += ' current'; icon = '<i data-lucide="map-pin"></i>'; }
            else if (isVisited) { cls += ' visited'; icon = '<i data-lucide="check"></i>'; }
            else return '';

            cls += ' city-chip--clickable';
            return `<button class="${cls}" data-city-key="${key}">${icon}${city.name}</button>`;
            }).join('');
        }
    }

    // === КВЕСТЫ ===
    const questsEl = document.getElementById('dashQuests');
    if (questsEl) {
        const activeQuests = QUESTS
            .filter(q => !PLAYER.completedQuests.includes(q.id))
            .map(q => ({ quest: q, result: checkQuest(q) }))
            .sort((a, b) => {
                const aPercent = a.result.progress[0] / a.result.progress[1];
                const bPercent = b.result.progress[0] / b.result.progress[1];
                return bPercent - aPercent;
            })
            .slice(0, 3);

        if (activeQuests.length === 0) {
            questsEl.innerHTML = `
                <div class="dashboard-empty">
                    <i data-lucide="party-popper"></i> Все квесты выполнены!
                </div>
            `;
        } else {
            questsEl.innerHTML = activeQuests.map(({ quest, result }) => `
                <div class="dashboard-quest">
                    <div class="dashboard-quest__icon"><i data-lucide="${quest.icon}"></i></div>
                    <div class="dashboard-quest__info">
                        <div class="dashboard-quest__name">${quest.name}</div>
                        <div class="dashboard-quest__progress">${result.progress[0]} / ${result.progress[1]}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    // === МОЙ ВКЛАД ===
    const contribEl = document.getElementById('dashContribution');
    if (contribEl) {
        const visited = PLAYER.visitedCities || {};
        const visitedCount = Object.values(visited).filter(n => n > 0).length;
        const homeCityScores = CITY_SCORES[PLAYER.homeCity] || { residents: 0, home: 0, hospitality: 0 };
        const currentCityScores = CITY_SCORES[PLAYER.currentCity] || { residents: 0, home: 0, hospitality: 0 };
        const homeCityName = CITIES[PLAYER.homeCity] ? CITIES[PLAYER.homeCity].name : PLAYER.homeCity;
        const currentCityName = CITIES[PLAYER.currentCity] ? CITIES[PLAYER.currentCity].name : PLAYER.currentCity;

        contribEl.innerHTML = `
            <div class="dashboard-contribution__item">
                <span class="dashboard-contribution__label">
                    <i data-lucide="home"></i> ${homeCityName}
                </span>
                <span class="dashboard-contribution__value">${homeCityScores.residents + homeCityScores.home + homeCityScores.hospitality}</span>
            </div>
            <div class="dashboard-contribution__item">
                <span class="dashboard-contribution__label">
                    <i data-lucide="map-pin"></i> ${currentCityName}
                </span>
                <span class="dashboard-contribution__value">${currentCityScores.residents + currentCityScores.home + currentCityScores.hospitality}</span>
            </div>
            <div class="dashboard-contribution__item">
                <span class="dashboard-contribution__label">
                    <i data-lucide="map"></i> Городов посещено
                </span>
                <span class="dashboard-contribution__value">${visitedCount}</span>
            </div>
        `;
    }

    // === СЧЁТЧИК ДРУЗЕЙ ===
    const dashCountEl = document.getElementById('dashFriendsCount');
    if (dashCountEl && typeof FRIENDS !== 'undefined') {
        dashCountEl.textContent = FRIENDS.length;
    }

    // === LUCIDE ИКОНКИ ===
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// === Мои планы ===
let PLANS = [];

async function renderPlans() {
    if (!PLAYER || !PLAYER.playerId) return;

    PLANS = await loadPlans(PLAYER.playerId);

    const container = document.getElementById('dashPlans');
    if (!container) return;

    if (PLANS.length === 0) {
        container.innerHTML = `
            <div class="dashboard-empty">
                <p style="margin-bottom: 12px;">Пока нет планов. Куда собираешься?</p>
                <button class="btn btn-primary btn-sm" id="dashEmptyAddPlanBtn">
                    <i data-lucide="plus"></i> Добавить план
                </button>
            </div>
        `;
        const btn = document.getElementById('dashEmptyAddPlanBtn');
        if (btn) {
            btn.addEventListener('click', () => {
                if (typeof openPlanModal === 'function') openPlanModal(PLAYER?.currentCity);
            });
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    container.innerHTML = PLANS.map((plan, idx) => {
        const visitDate = new Date(plan.visit_date);
        const diffDays = Math.round((visitDate - today) / (1000 * 60 * 60 * 24));
        const isNext = idx === 0;
        const city = CITIES[plan.city_key];

        let countdownText = '';
        let countdownIcon = '';

        if (diffDays === 0) {
            countdownIcon = 'flame';
            countdownText = 'Сегодня!';
        } else if (diffDays === 1) {
            countdownIcon = 'clock';
            countdownText = 'Завтра';
        } else if (diffDays > 1) {
            countdownIcon = 'calendar';
            countdownText = `Через ${diffDays} дн.`;
        } else {
            countdownIcon = 'alert-triangle';
            countdownText = 'Просрочен';
        }

        return `
            <div class="plan-item ${isNext ? 'plan-item--next' : ''}">
                <div class="plan-item__info">
                    <div class="plan-item__city">${city ? city.name : plan.city_key}</div>
                    ${plan.place_title ? `<div class="plan-item__place"><i data-lucide="map-pin"></i> ${plan.place_title}</div>` : ''}
                    ${plan.note ? `<div class="plan-item__note">"${plan.note}"</div>` : ''}
                    <div class="plan-item__date">${formatDate(plan.visit_date)}</div>
                    <div class="plan-item__countdown">
                        <i data-lucide="${countdownIcon}"></i> ${countdownText}
                    </div>
                </div>
                <div class="plan-item__actions">
                    <button class="plan-item__btn" data-plan-complete="${plan.id}" title="Выполнено">
                        <i data-lucide="check"></i>
                    </button>
                    <button class="plan-item__btn" data-plan-delete="${plan.id}" title="Удалить">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Превращаем Lucide-иконки в SVG
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// === Утилита: формат даты ===
function formatDate(dateStr) {
    const d = new Date(dateStr);
    const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ============ ПЛАВАЮЩАЯ КНОПКА «В ДАШБОРД» ============

function initBackToDashboardButton() {
    if (document.getElementById('backToDashboardBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'backToDashboardBtn';
    btn.className = 'back-to-dashboard';
    btn.title = 'Вернуться в дашборд';
    btn.innerHTML = '<i data-lucide="arrow-up"></i>';
    btn.style.display = 'none';

    btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.body.appendChild(btn);

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Показываем кнопку, когда дашборд вне зоны видимости
    window.addEventListener('scroll', () => {
        const dashboard = document.getElementById('dashboard');
        if (!dashboard) return;

        const rect = dashboard.getBoundingClientRect();
        const isVisible = rect.bottom > 100;

        btn.style.display = isVisible ? 'none' : 'flex';
    }, { passive: true });
}