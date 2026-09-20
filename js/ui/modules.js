// ============ UI: НАСТРОЙКИ МОДУЛЕЙ ============

// Список модулей (общие настройки в профиле)
const AVAILABLE_MODULES = [
    { id: 'friends', icon: 'users',      label: 'Друзья' },
    { id: 'quests',  icon: 'target',     label: 'Квесты' },
    { id: 'gaps',    icon: 'coffee',     label: 'Гапы' },
    { id: 'hashars', icon: 'hand-heart', label: 'Хашары' },
];

const MAP_LAYERS = [
    { id: 'friends', icon: 'users',      label: 'Друзья' },
    { id: 'quests',  icon: 'target',     label: 'Квесты' },
    { id: 'gaps',    icon: 'coffee',     label: 'Гапы' },
    { id: 'hashars', icon: 'hand-heart', label: 'Хашары' },
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
}

// ============================================
// РЕНДЕР: НАСТРОЙКИ КАРТЫ
// ============================================
function renderMapSettings() {
    const container = document.getElementById('mapModulesSettings');
    if (!container) return;

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

    if (typeof lucide !== 'undefined') lucide.createIcons();
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
    const sections = {
        gaps:    ['dashGapsCard', 'gapInvitesBlock', 'navGapsBtn'],
        hashars: ['dashHasharsCard', 'navHasharsBtn'],
        quests:  ['dashQuestsCard', 'quests', 'navQuestsBtn'],
        friends: ['navFriendsBtn'],
    };

    Object.entries(sections).forEach(([mod, ids]) => {
        const enabled = isModuleEnabled(mod);
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.style.display = enabled ? '' : 'none';
        });
    });

    // Обновляем карту — бейджи/точки зависят от модулей
    // Но только если карта уже создана
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

// Проверка: включена ли настройка приватности
function isPrivacyEnabled(name) {
    if (!PLAYER) return true;

    // Приватный профиль — отдельная логика
    if (name === 'isPrivate') {
        // Сначала смотрим в локальный кэш
        if (PLAYER.settings?.privacy?.isPrivate !== undefined) {
            return PLAYER.settings.privacy.isPrivate === true;
        }
        // Фолбэк — из профиля
        return PLAYER.isPrivate === true;
    }

    if (!PLAYER.settings || !PLAYER.settings.privacy) return true;
    return PLAYER.settings.privacy[name] !== false;
}

// Рендер тумблеров приватности
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

// Сохранить настройку приватности
async function savePrivacySetting(name, value) {
    if (!PLAYER) return;

    // Специальный случай: приватный профиль — отдельная колонка в players
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

        // Кэшируем локально, чтобы UI не перерисовывался до перезагрузки
        if (!PLAYER.settings) PLAYER.settings = {};
        if (!PLAYER.settings.privacy) PLAYER.settings.privacy = {};
        PLAYER.settings.privacy.isPrivate = value;

        if (typeof showWarningToast === 'function') {
            showWarningToast(value ? '🔒 Профиль стал приватным' : '🔓 Профиль открыт');
        }
        return;
    }

    // Остальные тумблеры — как раньше, в settings.privacy
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