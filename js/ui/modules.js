// ============ UI: НАСТРОЙКИ МОДУЛЕЙ ============

// ============================================
// КОНФИГ: Что показывать в дашборде и меню
// ============================================
// Модуль управляет видимостью карточек в дашборде, пунктов в сайдбаре,
// а также секций на странице. Отключил — пропадает везде.
//
// id       — ключ модуля (совпадает с settings.modules[moduleName])
// icon     — иконка Lucide
// label    — текст для тумблера
// sidebarId— id пункта в сайдбаре (или null, если пункта нет)
// dashId   — id карточки в дашборде (или null)
// sectionId— id секции на странице (или null)

const AVAILABLE_MODULES = [
    { id: 'accessRequests', icon: 'user-check',   label: 'Запросы на профиль', sidebarId: 'navAccessRequestsBtn', dashId: null,                sectionId: null },
    { id: 'plans',          icon: 'calendar-plus', label: 'Мои планы',          sidebarId: 'navPlansBtn',          dashId: 'dashPlansCard',      sectionId: null },
    { id: 'gallery',        icon: 'image',         label: 'Моя галерея',        sidebarId: 'navGalleryBtn',        dashId: null,                 sectionId: null },
    { id: 'reviews',        icon: 'message-circle',label: 'Мои отзывы',         sidebarId: 'navReviewsBtn',        dashId: null,                 sectionId: null },
    { id: 'notifications',  icon: 'bell',          label: 'Уведомления',        sidebarId: 'navNotificationsBtn',  dashId: null,                 sectionId: null },
    { id: 'quests',         icon: 'target',        label: 'Активные квесты',    sidebarId: 'navQuestsBtn',         dashId: 'dashQuestsCard',     sectionId: 'quests' },
    { id: 'gaps',           icon: 'coffee',        label: 'Гапы',               sidebarId: 'navGapsBtn',           dashId: 'dashGapsCard',       sectionId: null },
    { id: 'hashars',        icon: 'hand-heart',    label: 'Хашары',             sidebarId: 'navHasharsBtn',        dashId: 'dashHasharsCard',    sectionId: null },
    { id: 'faq',            icon: 'help-circle',   label: 'FAQ',                sidebarId: 'navFaqBtn',            dashId: null,                 sectionId: null },
];

// Слои, показываемые в ТУЛТИПЕ при наведении на город
const MAP_LAYERS = [
    { id: 'friends', icon: 'users',      label: 'Друзья' },
    { id: 'quests',  icon: 'target',     label: 'Квесты' },
    { id: 'gaps',    icon: 'coffee',     label: 'Гапы' },
    { id: 'hashars', icon: 'hand-heart', label: 'Хашары' },
];

// МЕТКИ на самой карте (поверх городов)
const MAP_MARKERS = [
    { id: 'markersFriends', icon: 'users',         label: 'Друзья в городах' },
    { id: 'markersPlans',   icon: 'calendar-plus', label: 'Мои планы' },
];

// ПОВЕДЕНИЕ карты
const MAP_BEHAVIOR = [
    { id: 'autoCenter', icon: 'crosshair', label: 'Центрировать на моём городе' },
];

// ============================================
// ПРОВЕРКИ ВКЛЮЧЕНО / ВЫКЛЮЧЕНО
// ============================================
function isModuleEnabled(moduleName) {
    if (!PLAYER) return true;
    if (!PLAYER.settings || !PLAYER.settings.modules) return true;
    return PLAYER.settings.modules[moduleName] !== false;
}

function isMapLayerEnabled(layerName) {
    if (!PLAYER) return true;
    if (!PLAYER.settings || !PLAYER.settings.map) return true;
    return PLAYER.settings.map[layerName] !== false;
}

// ============================================
// РЕНДЕР: НАСТРОЙКИ ПРОФИЛЯ (модули)
// ============================================
function renderModulesSettings() {
    const container = document.getElementById('modulesSettings');
    if (!container) return;

    container.innerHTML = AVAILABLE_MODULES.map(mod => `
        <div class="module-row">
            <div class="module-label">
                <span class="module-emoji"><i data-lucide="${mod.icon}"></i></span>
                <span>${mod.label}</span>
            </div>
            <label class="toggle">
                <input type="checkbox"
                       data-module-toggle="${mod.id}"
                       ${isModuleEnabled(mod.id) ? 'checked' : ''}>
                <span class="toggle__slider"></span>
            </label>
        </div>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
    renderLangSelect();
}

// ============================================
// РЕНДЕР: НАСТРОЙКИ КАРТЫ
// ============================================
function renderMapSettings() {
    // 1. Слои тултипа
    const container = document.getElementById('mapModulesSettings');
    if (container) {
        container.innerHTML = MAP_LAYERS.map(layer => `
            <div class="module-row">
                <div class="module-label">
                    <span class="module-emoji"><i data-lucide="${layer.icon}"></i></span>
                    <span>${layer.label}</span>
                </div>
                <label class="toggle">
                    <input type="checkbox"
                           data-map-toggle="${layer.id}"
                           ${isMapLayerEnabled(layer.id) ? 'checked' : ''}>
                    <span class="toggle__slider"></span>
                </label>
            </div>
        `).join('');
    }

    // 2. Метки на карте
    const markersContainer = document.getElementById('mapMarkersSettings');
    if (markersContainer) {
        markersContainer.innerHTML = MAP_MARKERS.map(marker => `
            <div class="module-row">
                <div class="module-label">
                    <span class="module-emoji"><i data-lucide="${marker.icon}"></i></span>
                    <span>${marker.label}</span>
                </div>
                <label class="toggle">
                    <input type="checkbox"
                           data-map-toggle="${marker.id}"
                           ${isMapLayerEnabled(marker.id) ? 'checked' : ''}>
                    <span class="toggle__slider"></span>
                </label>
            </div>
        `).join('');
    }

    // 3. Поведение
    const behaviorContainer = document.getElementById('mapBehaviorSettings');
    if (behaviorContainer) {
        behaviorContainer.innerHTML = MAP_BEHAVIOR.map(item => `
            <div class="module-row">
                <div class="module-label">
                    <span class="module-emoji"><i data-lucide="${item.icon}"></i></span>
                    <span>${item.label}</span>
                </div>
                <label class="toggle">
                    <input type="checkbox"
                           data-map-toggle="${item.id}"
                           ${isMapLayerEnabled(item.id) ? 'checked' : ''}>
                    <span class="toggle__slider"></span>
                </label>
            </div>
        `).join('');
    }

    // 4. Стиль карты — подсветить текущий
    renderMapStyleSelection();

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Подсветка активного стиля карты в модалке
function renderMapStyleSelection() {
    const current = getMapStyle();

    document.querySelectorAll('[data-map-style-option]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mapStyleOption === current);
    });
}

// ============================================
// СОХРАНЕНИЕ
// ============================================
async function saveModuleSetting(moduleName, value) {
    if (!PLAYER) return;

    if (!PLAYER.settings) PLAYER.settings = {};
    if (!PLAYER.settings.modules) PLAYER.settings.modules = {};

    PLAYER.settings.modules[moduleName] = value;

    const { error } = await _supabase
        .from('players')
        .update({ settings: PLAYER.settings })
        .eq('id', PLAYER.playerId);

    if (error) {
        console.warn('Ошибка сохранения настроек:', error);
        if (typeof showWarningToast === 'function') {
            showWarningToast('Не удалось сохранить настройку');
        }
        return;
    }

    applyModuleVisibility();
}

async function saveMapSetting(layerName, value) {
    if (!PLAYER) return;

    if (!PLAYER.settings) PLAYER.settings = {};
    if (!PLAYER.settings.map) PLAYER.settings.map = {};

    PLAYER.settings.map[layerName] = value;

    const { error } = await _supabase
        .from('players')
        .update({ settings: PLAYER.settings })
        .eq('id', PLAYER.playerId);

    if (error) {
        console.warn('Ошибка сохранения настроек карты:', error);
        if (typeof showWarningToast === 'function') {
            showWarningToast('Не удалось сохранить настройку');
        }
        return;
    }

    if (typeof hideCityTooltip === 'function') hideCityTooltip();
}

// ============================================
// ВИДИМОСТЬ МОДУЛЕЙ ВО ВСЁМ ИНТЕРФЕЙСЕ
// ============================================
function applyModuleVisibility() {
    // Проходим по всем модулям и скрываем/показываем
    // соответствующие элементы в дашборде, сайдбаре и секциях
    AVAILABLE_MODULES.forEach(mod => {
        const enabled = isModuleEnabled(mod.id);

        // Пункт в сайдбаре
        if (mod.sidebarId) {
            const el = document.getElementById(mod.sidebarId);
            if (el) el.style.display = enabled ? '' : 'none';
        }

        // Карточка в дашборде
        if (mod.dashId) {
            const el = document.getElementById(mod.dashId);
            if (el) el.style.display = enabled ? '' : 'none';
        }

        // Секция на странице
        if (mod.sectionId) {
            const el = document.getElementById(mod.sectionId);
            if (el) el.style.display = enabled ? '' : 'none';
        }
    });

    // Перерисовываем сайдбар (там своя логика видимости)
    if (typeof renderSidebar === 'function') {
        renderSidebar();
    }

    // Обновляем карту — бейджи/точки зависят от модулей
    if (typeof safarstanMap !== 'undefined' && safarstanMap) {
        if (typeof renderGapBadges === 'function') renderGapBadges();
        if (typeof renderHasharMarkers === 'function') renderHasharMarkers();
    }
}

// ============================================
// ДРУЗЬЯ ПО ГОРОДАМ (кэш + RPC)
// ============================================
let _cityFriendsStatsCache = null;

async function getCityFriendsStatsCached() {
    if (_cityFriendsStatsCache) return _cityFriendsStatsCache;
    try {
        const { data, error } = await _supabase.rpc('get_city_friends_stats');
        if (error) throw error;
        const map = {};
        (data || []).forEach(row => {
            map[row.city_key] = Number(row.friends_count);
        });
        _cityFriendsStatsCache = map;
    } catch (err) {
        console.warn('Ошибка загрузки друзей по городам:', err);
        _cityFriendsStatsCache = {};
    }
    return _cityFriendsStatsCache;
}

function resetCityFriendsStatsCache() {
    _cityFriendsStatsCache = null;
}

// ============================================
// КВЕСТЫ ДЛЯ ГОРОДА (считаем в JS)
// ============================================
function countQuestsForCity(cityKey) {
    if (typeof QUESTS === 'undefined') return 0;
    const done = (PLAYER && PLAYER.completedQuests) || [];

    return QUESTS.filter(q => {
        if (done.includes(q.id)) return false;
        if (q.type === 'current_city') return cityKey === (PLAYER && PLAYER.currentCity);
        if (q.type === 'specific_cities') return (q.cities || []).includes(cityKey);
        if (q.type === 'specific_places') {
            return (q.places || []).some(p => p.startsWith(cityKey + '|'));
        }
        if (q.type === 'category') return true;
        return false;
    }).length;
}

// ============================================
// ПРИВАТНОСТЬ
// ============================================
const PRIVACY_SETTINGS = [
    { id: 'showCity',    icon: 'map-pin', label: 'Показывать мой город' },
    { id: 'showEmail',   icon: 'mail',    label: 'Показывать email' },
    { id: 'isPrivate',   icon: 'lock',    label: 'Приватный профиль (по запросу)' },
];

function isPrivacyEnabled(name) {
    if (!PLAYER) return true;

    if (name === 'isPrivate') {
        if (PLAYER.settings?.privacy?.isPrivate !== undefined) {
            return PLAYER.settings.privacy.isPrivate === true;
        }
        return PLAYER.isPrivate === true;
    }

    if (!PLAYER.settings || !PLAYER.settings.privacy) return true;
    return PLAYER.settings.privacy[name] !== false;
}

function renderPrivacySettings() {
    const container = document.getElementById('privacySettings');
    if (!container) return;

    container.innerHTML = PRIVACY_SETTINGS.map(item => `
        <div class="module-row">
            <div class="module-label">
                <span class="module-emoji"><i data-lucide="${item.icon}"></i></span>
                <span>${item.label}</span>
            </div>
            <label class="toggle">
                <input type="checkbox"
                       data-privacy-toggle="${item.id}"
                       ${isPrivacyEnabled(item.id) ? 'checked' : ''}>
                <span class="toggle__slider"></span>
            </label>
        </div>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function savePrivacySetting(name, value) {
    if (!PLAYER) return;

    if (name === 'isPrivate') {
        const { error } = await _supabase
            .from('players')
            .update({ is_private: value })
            .eq('id', PLAYER.playerId);

        if (error) {
            console.warn('Ошибка сохранения приватности профиля:', error);
            if (typeof showWarningToast === 'function') {
                showWarningToast('Не удалось сохранить');
            }
            return;
        }

        if (!PLAYER.settings) PLAYER.settings = {};
        if (!PLAYER.settings.privacy) PLAYER.settings.privacy = {};
        PLAYER.settings.privacy.isPrivate = value;

        if (typeof showWarningToast === 'function') {
            showWarningToast(value ? '🔒 Профиль стал приватным' : '🔓 Профиль открыт');
        }
        return;
    }

    if (!PLAYER.settings) PLAYER.settings = {};
    if (!PLAYER.settings.privacy) PLAYER.settings.privacy = {};

    PLAYER.settings.privacy[name] = value;

    const { error } = await _supabase
        .from('players')
        .update({ settings: PLAYER.settings })
        .eq('id', PLAYER.playerId);

    if (error) {
        console.warn('Ошибка сохранения приватности:', error);
        if (typeof showWarningToast === 'function') {
            showWarningToast('Не удалось сохранить');
        }
    }
}

// ============================================
// СТИЛЬ КАРТЫ
// ============================================

// Получить текущий стиль карты (из settings.map.style)
function getMapStyle() {
    if (!PLAYER || !PLAYER.settings || !PLAYER.settings.map) {
        // Fallback: по теме сайта
        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        return (theme === 'dark' || theme === 'space') ? 'dark' : 'light';
    }
    return PLAYER.settings.map.style || 'light';
}

// Установить стиль карты
async function setMapStyle(style) {
    if (!PLAYER) return;

    if (!PLAYER.settings) PLAYER.settings = {};
    if (!PLAYER.settings.map) PLAYER.settings.map = {};

    PLAYER.settings.map.style = style;

    const { error } = await _supabase
        .from('players')
        .update({ settings: PLAYER.settings })
        .eq('id', PLAYER.playerId);

    if (error) {
        console.warn('Ошибка сохранения стиля карты:', error);
        if (typeof showWarningToast === 'function') {
            showWarningToast('Не удалось сохранить стиль');
        }
        return;
    }

    // Применяем к карте
    if (typeof updateMapStyle === 'function') updateMapStyle(style);

    // Обновляем UI (модалку + дропдаун на карте)
    if (typeof renderMapStyleSelection === 'function') renderMapStyleSelection();
    if (typeof updateMapStyleDropdown === 'function') updateMapStyleDropdown();
}