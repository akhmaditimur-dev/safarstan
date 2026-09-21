// ============ UI: САЙДБАР (навигация в дашборде) ============

// Конфиг сайдбара. Добавляй сюда новые пункты, порядок сохраняется.
//
// Поля:
//   id       — DOM id кнопки (сохраняется для совместимости с events)
//   icon     — имя иконки Lucide
//   label    — текст пункта
//   action   — 'scroll' (к секции) | 'modal' (открыть модалку) | 'dropdown' (дропдаун)
//   target   — id секции для action='scroll'
//   counter  — id счётчика (если нужно)
//   modal    — id модалки (если action='modal')
//   module   — какой модуль управляет видимостью (null — всегда видно)
//   adminOnly— показывать только админам

const SIDEBAR_CONFIG = [
    {
        title: 'Личное',
        items: [
            { id: 'navProfileBtn',        icon: 'user',         label: 'Профиль',              action: 'modal',  modal: 'profileModal',         module: null },
            { id: 'navFriendsBtn',        icon: 'users',        label: 'Друзья',               action: 'modal',  modal: 'friendsModal',         counter: 'dashFriendsCount', module: 'friends' },
            { id: 'navAccessRequestsBtn', icon: 'user-check',   label: 'Запросы на профиль',   action: 'modal',  modal: 'accessRequestsModal',  counter: 'dashAccessRequestsCount', module: 'accessRequests', hiddenIfNot: 'isPrivate' },
            { id: 'navGalleryBtn',        icon: 'image',        label: 'Моя галерея',          action: 'modal',  modal: 'galleryModal',         module: 'gallery' },
            { id: 'navReviewsBtn',        icon: 'message-circle', label: 'Мои отзывы',         action: 'modal',  modal: 'myReviewsModal',       module: 'reviews' },
            { id: 'navSettingsBtn',       icon: 'settings',     label: 'Настройки',            action: 'modal',  modal: 'settingsModal',        module: null },
            { id: 'navFaqBtn',            icon: 'help-circle',  label: 'FAQ',                  action: 'modal',  modal: 'faqModal',             module: 'faq' },
        ],
    },
    {
        title: 'Общение',
        items: [
            { id: 'navMessagesBtn',    icon: 'mail',    label: 'Сообщения',      action: 'modal', modal: 'messagesModal', counter: 'dashMessagesCount', module: null, comingSoon: true },
            { id: 'navGroupChatsBtn',  icon: 'users-2', label: 'Групповые чаты', action: 'modal', modal: 'groupChatsModal', counter: 'dashGroupChatsCount', module: null, comingSoon: true },
            { id: 'navNotificationsBtn', icon: 'bell',  label: 'Уведомления',    action: 'dropdown', counter: 'dashNotifCount', module: 'notifications' },
        ],
    },
    {
        title: 'Активности',
        items: [
            { id: 'navMapBtn',     icon: 'map',           label: 'Карта',      action: 'scroll', target: 'map',            module: null },
            { id: 'navRatingsBtn', icon: 'trophy',        label: 'Рейтинг',    action: 'scroll', target: 'ratings',        module: null },
            { id: 'navQuestsBtn',  icon: 'target',        label: 'Квесты',     action: 'scroll', target: 'quests',         module: 'quests' },
            { id: 'navPlansBtn',   icon: 'calendar-plus', label: 'Мои планы',  action: 'scroll', target: 'dashPlansCard',  module: 'plans' },
            { id: 'navGapsBtn',    icon: 'coffee',        label: 'Мои гапы',   action: 'scroll', target: 'dashGapsCard',   counter: 'dashGapsCount', module: 'gaps' },
            { id: 'navHasharsBtn', icon: 'hand-heart',    label: 'Хашары',     action: 'scroll', target: 'dashHasharsCard', module: 'hashars' },
        ],
    },
    {
        title: 'Инфо',
        items: [
            { id: 'navCityInfoBtn',  icon: 'building-2',    label: 'О городе',  action: 'scroll', target: 'info',      module: null },
            { id: 'navTransportBtn', icon: 'bus',           label: 'Транспорт', action: 'scroll', target: 'transport', module: null },
            { id: 'navHotelsBtn',    icon: 'hotel',         label: 'Отели',     action: 'scroll', target: 'hotels',    module: null },
            { id: 'navServicesBtn',  icon: 'shopping-cart', label: 'Сервисы',   action: 'scroll', target: 'services',  module: null },
        ],
    },
];

// ============================================
// СОСТОЯНИЕ СВОРАЧИВАНИЯ ГРУПП (localStorage)
// ============================================
function getSidebarCollapsed() {
    try {
        return JSON.parse(localStorage.getItem('sidebar_collapsed') || '{}');
    } catch {
        return {};
    }
}

function setSidebarCollapsed(title, isCollapsed) {
    const state = getSidebarCollapsed();
    state[title] = isCollapsed;
    localStorage.setItem('sidebar_collapsed', JSON.stringify(state));
}

// ============================================
// РЕНДЕР САЙДБАРА
// ============================================
function renderSidebar() {
    const container = document.getElementById('dashboardSidebar');
    if (!container) return;

    const collapsed = getSidebarCollapsed();

    const html = SIDEBAR_CONFIG.map(group => {
        const items = group.items.filter(item => isSidebarItemVisible(item));
        if (items.length === 0) return '';

        const isCollapsed = collapsed[group.title] === true;
        const arrowIcon = isCollapsed ? 'chevron-right' : 'chevron-down';

        return `
            <div class="dashboard-nav-section" data-group="${group.title}">
                <button class="dashboard-nav-title dashboard-nav-title--toggle" data-toggle-group="${group.title}">
                    <span>${group.title}</span>
                    <i data-lucide="${arrowIcon}" class="dashboard-nav-title__arrow"></i>
                </button>
                <div class="dashboard-nav-items" data-group-items="${group.title}" ${isCollapsed ? 'style="display:none;"' : ''}>
                    ${items.map(item => renderSidebarItem(item)).join('')}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    updateSidebarCounters();
}

// ============================================
// ОБРАБОТЧИК СВОРАЧИВАНИЯ ГРУПП
// ============================================
document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-toggle-group]');
    if (!toggle) return;

    const title = toggle.dataset.toggleGroup;
    const section = toggle.closest('.dashboard-nav-section');
    if (!section) return;

    const itemsWrap = section.querySelector(`[data-group-items="${title}"]`);
    if (!itemsWrap) return;

    const isHidden = itemsWrap.style.display === 'none';
    itemsWrap.style.display = isHidden ? '' : 'none';

    // Меняем стрелку
    const arrow = toggle.querySelector('.dashboard-nav-title__arrow');
    if (arrow) {
        arrow.setAttribute('data-lucide', isHidden ? 'chevron-down' : 'chevron-right');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Сохраняем состояние
    setSidebarCollapsed(title, !isHidden);
});

// Один пункт сайдбара
function renderSidebarItem(item) {
    const counterHtml = item.counter
        ? `<span class="dashboard-nav-count" id="${item.counter}">0</span>`
        : '';

    const dataAttrs = [];
    if (item.action === 'scroll') dataAttrs.push(`data-scroll="${item.target}"`);
    if (item.action === 'modal')  dataAttrs.push(`data-open-modal="${item.modal}"`);
    if (item.action === 'dropdown') dataAttrs.push(`data-open-dropdown="${item.id}"`);
    if (item.comingSoon) dataAttrs.push(`data-coming-soon="1"`);

    return `
        <button class="dashboard-nav-item" id="${item.id}" ${dataAttrs.join(' ')}>
            <span class="dashboard-nav-icon"><i data-lucide="${item.icon}"></i></span>
            <span class="dashboard-nav-label">${item.label}</span>
            ${counterHtml}
        </button>
    `;
}

// Видимость пункта
function isSidebarItemVisible(item) {
    // Модуль выключен — скрываем
    if (item.module && typeof isModuleEnabled === 'function') {
        if (!isModuleEnabled(item.module)) return false;
    }

    // hiddenIfNot: 'isPrivate' — показывать только если приватный профиль
    if (item.hiddenIfNot === 'isPrivate') {
        const isPrivate = PLAYER?.isPrivate === true;
        if (!isPrivate) return false;
    }

    return true;
}

// Обновление счётчиков (друзья, гапы, уведомления, запросы)
function updateSidebarCounters() {
    if (!PLAYER) return;

    // Друзья
    const friendsEl = document.getElementById('dashFriendsCount');
    if (friendsEl && typeof FRIENDS !== 'undefined') {
        friendsEl.textContent = FRIENDS.length;
    }

    // Гапы
    const gapsEl = document.getElementById('dashGapsCount');
    if (gapsEl && typeof CURRENT_GAPS !== 'undefined') {
        gapsEl.textContent = CURRENT_GAPS.length;
    }

    // Запросы на профиль
    const reqEl = document.getElementById('dashAccessRequestsCount');
    if (reqEl) {
        // Значение ставится из refreshAccessRequestsList
    }

    // Уведомления
    const notifEl = document.getElementById('dashNotifCount');
    if (notifEl) {
        // Значение ставится из updateNotificationsBadge
    }
}