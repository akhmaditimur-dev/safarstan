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
            { id: 'navProfileBtn', icon: 'user',         label: 'Профиль',           action: 'modal',  modal: 'profileModal',  module: null },
            { id: 'navFriendsBtn', icon: 'users',        label: 'Друзья',            action: 'modal',  modal: 'friendsModal',  counter: 'dashFriendsCount', module: 'friends' },
            { id: 'navAccessRequestsBtn', icon: 'user-check', label: 'Запросы на профиль', action: 'modal', modal: 'accessRequestsModal', counter: 'dashAccessRequestsCount', module: null, hiddenIfNot: 'isPrivate' },
            { id: 'navGalleryBtn', icon: 'image',        label: 'Моя галерея',       action: 'modal',  modal: 'galleryModal',  module: null },
            { id: 'navReviewsBtn', icon: 'message-circle', label: 'Мои отзывы',      action: 'modal',  modal: 'myReviewsModal', module: null },
            { id: 'navSettingsBtn', icon: 'settings',    label: 'Настройки',         action: 'modal',  modal: 'settingsModal', module: null },
            { id: 'navFaqBtn',     icon: 'help-circle',  label: 'FAQ',               action: 'modal',  modal: 'faqModal',      module: null },
        ],
    },
    {
        title: 'Общение',
        items: [
            // Заготовки — показываем только когда будут чаты
            { id: 'navMessagesBtn',    icon: 'mail',    label: 'Сообщения',      action: 'modal', modal: 'messagesModal', counter: 'dashMessagesCount', module: null, comingSoon: true },
            { id: 'navGroupChatsBtn',  icon: 'users-2', label: 'Групповые чаты', action: 'modal', modal: 'groupChatsModal', counter: 'dashGroupChatsCount', module: null, comingSoon: true },
            { id: 'navNotificationsBtn', icon: 'bell',  label: 'Уведомления',    action: 'dropdown', counter: 'dashNotifCount', module: null },
        ],
    },
    {
        title: 'Активности',
        items: [
            { id: 'navMapBtn',     icon: 'map',         label: 'Карта',   action: 'scroll', target: 'map',     module: null },
            { id: 'navRatingsBtn', icon: 'trophy',      label: 'Рейтинг', action: 'scroll', target: 'ratings', module: null },
            { id: 'navQuestsBtn',  icon: 'target',      label: 'Квесты',  action: 'scroll', target: 'quests',  module: 'quests' },
            { id: 'navGapsBtn',    icon: 'coffee',      label: 'Мои гапы', action: 'scroll', target: 'dashGapsCard', counter: 'dashGapsCount', module: 'gaps' },
            { id: 'navHasharsBtn', icon: 'hand-heart',  label: 'Хашары',  action: 'scroll', target: 'dashHasharsCard', module: 'hashars' },
        ],
    },
    {
        title: 'Инфо',
        items: [
            { id: 'navCityInfoBtn', icon: 'building-2',    label: 'О городе',  action: 'scroll', target: 'info',      module: null },
            { id: 'navTransportBtn', icon: 'bus',          label: 'Транспорт', action: 'scroll', target: 'transport', module: null },
            { id: 'navHotelsBtn',    icon: 'hotel',        label: 'Отели',     action: 'scroll', target: 'hotels',    module: null },
            { id: 'navServicesBtn',  icon: 'shopping-cart', label: 'Сервисы',  action: 'scroll', target: 'services',  module: null },
        ],
    },
];

// Рендер сайдбара в контейнер #dashboardSidebar
function renderSidebar() {
    const container = document.getElementById('dashboardSidebar');
    if (!container) return;

    const html = SIDEBAR_CONFIG.map(group => {
        const items = group.items.filter(item => isSidebarItemVisible(item));

        if (items.length === 0) return '';

        return `
            <div class="dashboard-nav-section">
                <h3 class="dashboard-nav-title">${group.title}</h3>
                ${items.map(item => renderSidebarItem(item)).join('')}
            </div>
        `;
    }).join('<div class="dashboard-nav-divider"></div>');

    container.innerHTML = html;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Применяем счётчики
    updateSidebarCounters();
}

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
            <span class="dashboard-nav-arrow">→</span>
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