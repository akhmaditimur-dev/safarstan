// ============ UI: НАСТРОЙКИ МОДУЛЕЙ ============

// Список модулей (общие настройки в профиле)
const AVAILABLE_MODULES = [
    { id: 'friends', icon: '👥', label: 'Друзья' },
    { id: 'quests',  icon: '🎯', label: 'Квесты' },
    { id: 'gaps',    icon: '☕', label: 'Гапы' },
    { id: 'hashars', icon: '🤝', label: 'Хашары' },
];

// Слои карты (что показывать в тултипе)
const MAP_LAYERS = [
    { id: 'friends', icon: '👥', label: 'Друзья' },
    { id: 'quests',  icon: '🎯', label: 'Квесты' },
    { id: 'gaps',    icon: '☕', label: 'Гапы' },
    { id: 'hashars', icon: '🤝', label: 'Хашары' },
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
                <span class="module-emoji">${mod.icon}</span>
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
                <span class="module-emoji">${layer.icon}</span>
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
        gaps:    ['dashGaps', 'gapInvitesBlock', 'navGapsBtn'],
        hashars: ['dashHashars', 'hashars', 'navHasharsBtn'],
        quests:  ['quests', 'navQuestsBtn'],
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