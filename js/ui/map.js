// ============ UI: КАРТА (OpenLayers) ============

let safarstanMap = null;
let citySource = null;
let cityLayer = null;
let hasharSource = null;
let hasharLayer = null;
let cityTooltipOverlay = null;
let currentHoveredCity = null;

// Кэш статистики
let _cityGapStatsCache = null;
let _cityHasharStatsCache = null;

// Центр карты — мир
const MAP_CENTER = [40.0, 40.0];
const MAP_ZOOM = 3;

// ============================================
// ОСНОВНАЯ КАРТА
// ============================================
function renderMap() {
    const container = document.getElementById('safarstanMap');
    if (!container) return;

    if (safarstanMap) {
        updateMapMarkers();
        return;
    }

    // --- Слой городов ---
    citySource = new ol.source.Vector();
    cityLayer = new ol.layer.Vector({
        source: citySource,
        style: cityStyleFunction,
        zIndex: 10,
    });

    // --- Слой хашаров ---
    hasharSource = new ol.source.Vector();
    hasharLayer = new ol.layer.Vector({
        source: hasharSource,
        zIndex: 15,
    });

    safarstanMap = new ol.Map({
        target: 'safarstanMap',
        layers: [
            new ol.layer.Tile({ source: new ol.source.OSM() }),
            cityLayer,
            hasharLayer,
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat(MAP_CENTER),
            zoom: MAP_ZOOM,
            minZoom: 2,
            maxZoom: 18,
        }),
        controls: ol.control.defaults.defaults({ attribution: true }),
    });

    // --- Клик по карте ---
    safarstanMap.on('click', (evt) => {
        // Сначала ищем хашар
        const hasharFeature = safarstanMap.forEachFeatureAtPixel(
            evt.pixel,
            (f) => f,
            { hitTolerance: 8, layerFilter: (l) => l === hasharLayer }
        );
        if (hasharFeature) {
            const hasharId = hasharFeature.get('hasharId');
            if (hasharId && typeof openHasharModal === 'function') {
                openHasharModal(hasharId);
            }
            return;
        }

        // Потом — город
        const cityFeature = safarstanMap.forEachFeatureAtPixel(
            evt.pixel,
            (f) => f,
            { hitTolerance: 8, layerFilter: (l) => l === cityLayer }
        );
        if (cityFeature) {
            const cityKey = cityFeature.get('cityKey');
            if (cityKey && CITIES[cityKey]) {
                currentCity = cityKey;
                renderAll();
                if (typeof renderCitySelector === 'function') renderCitySelector();
                saveState();
            }
        }
    });

    // --- Тултип ---
    const tooltipEl = document.getElementById('cityTooltip');
    if (tooltipEl) {
        cityTooltipOverlay = new ol.Overlay({
            element: tooltipEl,
            positioning: 'bottom-center',
            offset: [0, -12],
        });
        safarstanMap.addOverlay(cityTooltipOverlay);
    }

    // --- Наведение мыши ---
    safarstanMap.on('pointermove', async (evt) => {
        if (evt.dragging) return;

        // Ищем город
        const feature = safarstanMap.forEachFeatureAtPixel(
            evt.pixel,
            (f) => f,
            { hitTolerance: 8, layerFilter: (l) => l === cityLayer }
        );

        const cityKey = feature ? feature.get('cityKey') : null;

        safarstanMap.getTargetElement().style.cursor = cityKey ? 'pointer' : '';

        if (cityKey === currentHoveredCity) return;
        currentHoveredCity = cityKey;

        if (!cityKey) {
            hideCityTooltip();
            return;
        }

        await showCityTooltip(cityKey);
    });

    updateMapMarkers();
}

// ============================================
// СТИЛЬ ГОРОДОВ
// ============================================
function cityStyleFunction(feature) {
    const status = feature.get('status') || 'unvisited';

    let fillColor = '#94a3b8';
    let radius = 8;
    let strokeColor = '#ffffff';
    let strokeWidth = 2;

    if (status === 'home') {
        fillColor = '#f59e0b'; radius = 11; strokeWidth = 3;
    } else if (status === 'current') {
        fillColor = '#3b82f6'; radius = 11; strokeWidth = 3;
    } else if (status === 'visited') {
        fillColor = '#16a34a'; radius = 9;
    }

    return new ol.style.Style({
        image: new ol.style.Circle({
            radius,
            fill: new ol.style.Fill({ color: fillColor }),
            stroke: new ol.style.Stroke({ color: strokeColor, width: strokeWidth }),
        }),
    });
}

// ============================================
// МАРКЕРЫ ГОРОДОВ
// ============================================
function updateMapMarkers() {
    if (!safarstanMap || !citySource) return;

    citySource.clear();

    Object.entries(CITIES).forEach(([key, city]) => {
        if (!city.coords) return;

        const status = getCityStatus(key);

        const feature = new ol.Feature({
            geometry: new ol.geom.Point(
                ol.proj.fromLonLat([city.coords.lng, city.coords.lat])
            ),
            cityKey: key,
            status: status.cls,
        });

        citySource.addFeature(feature);
    });

    // Обновляем хашары — если тумблер включён
    if (typeof isMapLayerEnabled !== 'function' || isMapLayerEnabled('hashars')) {
        renderHasharMarkers();
    } else if (hasharSource) {
        hasharSource.clear();
    }
}

function getCityStatus(cityKey) {
    if (!PLAYER) return { cls: 'unvisited', label: 'Не посещено' };

    const visited = PLAYER.visitedCities || {};

    if (cityKey === PLAYER.homeCity) return { cls: 'home', label: 'Родной город' };
    if (cityKey === PLAYER.currentCity) return { cls: 'current', label: 'Текущий город' };
    if (visited[cityKey] > 0) return { cls: 'visited', label: `Посещён (${visited[cityKey]} чек-инов)` };
    return { cls: 'unvisited', label: 'Не посещено' };
}

// ============================================
// КЭШ СТАТИСТИКИ
// ============================================
async function getCityGapStatsCached() {
    if (_cityGapStatsCache) return _cityGapStatsCache;
    try {
        _cityGapStatsCache = await loadCityGapStats();
    } catch (err) {
        console.warn('Ошибка загрузки статистики гапов:', err);
        _cityGapStatsCache = {};
    }
    return _cityGapStatsCache;
}

async function getCityHasharStatsCached() {
    if (_cityHasharStatsCache) return _cityHasharStatsCache;
    try {
        _cityHasharStatsCache = await loadCityHasharStats();
    } catch (err) {
        console.warn('Ошибка загрузки статистики хашаров:', err);
        _cityHasharStatsCache = {};
    }
    return _cityHasharStatsCache;
}

function resetCityStatsCache() {
    _cityGapStatsCache = null;
    _cityHasharStatsCache = null;
}

// ============================================
// БЕЙДЖИ ГАПОВ — теперь только в тултипе
// ============================================
// Функция оставлена для совместимости, но не рисует на карте
async function renderGapBadges() {
    // Умышленно пусто — бейджи гапов не показываем на карте.
    // Данные показываются в тултипе при наведении на город.
    return;
}

// ============================================
// ТОЧКИ ХАШАРОВ
// ============================================
async function renderHasharMarkers() {
    if (!safarstanMap || !hasharSource) return;

    hasharSource.clear();

    if (typeof isMapLayerEnabled === 'function' && !isMapLayerEnabled('hashars')) {
        return;
    }

    let hashars = [];
    try {
        hashars = await loadHashars({ onlyUpcoming: true, status: 'open' });
    } catch (err) {
        console.warn('Ошибка загрузки хашаров для карты:', err);
        return;
    }

    const catIcons = {
        repair: '🔨', trees: '🌳', cleanup: '🧹',
        help: '🤝', charity: '❤️', other: '📌',
    };

    hashars.forEach(h => {
        if (!h.coords || !h.coords.lat || !h.coords.lng) return;

        const emoji = catIcons[h.category] || '📌';

        const feature = new ol.Feature({
            geometry: new ol.geom.Point(
                ol.proj.fromLonLat([h.coords.lng, h.coords.lat])
            ),
            hasharId: h.id,
        });

        feature.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
                radius: 13,
                fill: new ol.style.Fill({ color: '#f59e0b' }),
                stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 }),
            }),
            text: new ol.style.Text({
                text: emoji,
                font: '13px sans-serif',
                offsetY: 0,
            }),
        }));

        hasharSource.addFeature(feature);
    });
}

// ============================================
// ХЕЛПЕР: СКЛОНЕНИЕ
// ============================================
function plural(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
}

// ============================================
// ТУЛТИП ГОРОДА
// ============================================
async function showCityTooltip(cityKey) {
    if (!safarstanMap || !cityTooltipOverlay) return;

    const city = CITIES[cityKey];
    if (!city || !city.coords) return;

    const tooltipEl = document.getElementById('cityTooltip');
    if (!tooltipEl) return;

    const items = [];

    // Гапы
    if (typeof isMapLayerEnabled !== 'function' || isMapLayerEnabled('gaps')) {
        const stats = await getCityGapStatsCached();
        const count = stats[cityKey] || 0;
        if (count > 0) {
            items.push(`<span class="city-tooltip__item"><i data-lucide="coffee"></i> <strong>${count}</strong></span>`);
        }
    }

    // Хашары
    if (typeof isMapLayerEnabled !== 'function' || isMapLayerEnabled('hashars')) {
        const stats = await getCityHasharStatsCached();
        const count = stats[cityKey] || 0;
        if (count > 0) {
            items.push(`<span class="city-tooltip__item"><i data-lucide="hand-heart"></i> <strong>${count}</strong></span>`);
        }
    }

    // Друзья
    if (typeof isMapLayerEnabled !== 'function' || isMapLayerEnabled('friends')) {
        if (typeof getCityFriendsStatsCached === 'function') {
            const stats = await getCityFriendsStatsCached();
            const count = stats[cityKey] || 0;
            if (count > 0) {
                items.push(`<span class="city-tooltip__item"><i data-lucide="users"></i> <strong>${count}</strong></span>`);
            }
        }
    }

    // Квесты
    if (typeof isMapLayerEnabled !== 'function' || isMapLayerEnabled('quests')) {
        if (typeof countQuestsForCity === 'function') {
            const count = countQuestsForCity(cityKey);
            if (count > 0) {
                items.push(`<span class="city-tooltip__item"><i data-lucide="target"></i> <strong>${count}</strong></span>`);
            }
        }
    }

    const rowsHtml = items.length > 0
        ? `<div class="city-tooltip__row">${items.join('')}</div>`
        : `<div class="city-tooltip__empty">Нет данных</div>`;

    tooltipEl.innerHTML = `
        <div class="city-tooltip__title">${city.name}</div>
        ${rowsHtml}
    `;

    const coords = ol.proj.fromLonLat([city.coords.lng, city.coords.lat]);
    cityTooltipOverlay.setPosition(coords);
    tooltipEl.style.display = 'block';

    // Превращаем Lucide-иконки в SVG
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function hideCityTooltip() {
    const tooltipEl = document.getElementById('cityTooltip');
    if (tooltipEl) tooltipEl.style.display = 'none';
    if (cityTooltipOverlay) cityTooltipOverlay.setPosition(undefined);
    currentHoveredCity = null;
}