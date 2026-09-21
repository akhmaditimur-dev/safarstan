// ============ UI: КАРТА (OpenLayers) ============

let safarstanMap = null;
let clusterSource = null;   // ← ИЗМЕНЕНО: было citySource
let cityLayer = null;
let hasharSource = null;
let hasharLayer = null;
let cityTooltipOverlay = null;
let currentHoveredCity = null;
let tileLayer = null;
let _cityMarkersLayer = null;
let _cityMarkersSource = null;
let _planMarkersLayer = null;
let _planMarkersSource = null;

let _cityGapStatsCache = null;
let _cityHasharStatsCache = null;

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

    // === Кластеризация городов ===
    const baseCitySource = new ol.source.Vector();
    clusterSource = new ol.source.Cluster({
        distance: 40,
        minDistance: 20,
        source: baseCitySource,
    });

    cityLayer = new ol.layer.Vector({
        source: clusterSource,
        style: cityStyleFunction,   // определяет стиль по zoom + size
        zIndex: 10,
    });

    // === Хашары (без изменений) ===
    hasharSource = new ol.source.Vector();
    hasharLayer = new ol.layer.Vector({
        source: hasharSource,
        zIndex: 15,
    });

    // === Слой меток друзей (поверх городов) ===
    _cityMarkersSource = new ol.source.Vector();
    _cityMarkersLayer = new ol.layer.Vector({
        source: _cityMarkersSource,
        zIndex: 12,
    });

    // === Слой меток планов ===
    _planMarkersSource = new ol.source.Vector();
    _planMarkersLayer = new ol.layer.Vector({
        source: _planMarkersSource,
        zIndex: 14,
    });

    // === Тайлы ===
    const initialStyle = typeof getMapStyle === 'function' ? getMapStyle() : 'light';
    tileLayer = new ol.layer.Tile({
        source: getTileSource(initialStyle),
    });

    safarstanMap = new ol.Map({
        target: 'safarstanMap',
        layers: [
            tileLayer,
            cityLayer,
            _planMarkersLayer,
            _cityMarkersLayer,
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

    // === Клик по карте ===
    safarstanMap.on('click', (evt) => {
        // 1. Хашар
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

        // 2. Город или кластер
        const feature = safarstanMap.forEachFeatureAtPixel(
            evt.pixel,
            (f) => f,
            { hitTolerance: 8, layerFilter: (l) => l === cityLayer }
        );

        if (feature) {
            const features = feature.get('features');

            if (features && features.length === 1) {
                // Один город — выбираем
                const cityKey = features[0].get('cityKey');
                if (cityKey && CITIES[cityKey]) {
                    currentCity = cityKey;
                    renderAll();
                    if (typeof renderCitySelector === 'function') renderCitySelector();
                    saveState();
                }
            } else if (features && features.length > 1) {
                // Кластер — приближаем
                const extent = feature.getGeometry().getExtent();
                safarstanMap.getView().fit(extent, {
                    duration: 400,
                    padding: [80, 80, 80, 80],
                    maxZoom: 12,
                });
            }
        }
    });

    // === Тултип ===
    const tooltipEl = document.getElementById('cityTooltip');
    if (tooltipEl) {
        cityTooltipOverlay = new ol.Overlay({
            element: tooltipEl,
            positioning: 'bottom-center',
            offset: [0, -12],
        });
        safarstanMap.addOverlay(cityTooltipOverlay);
    }

    // === Наведение мыши ===
    safarstanMap.on('pointermove', async (evt) => {
        if (evt.dragging) return;

        const feature = safarstanMap.forEachFeatureAtPixel(
            evt.pixel,
            (f) => f,
            { hitTolerance: 8, layerFilter: (l) => l === cityLayer }
        );

        let cityKey = null;
        if (feature) {
            const features = feature.get('features');
            if (features && features.length === 1) {
                cityKey = features[0].get('cityKey');
            }
        }

        safarstanMap.getTargetElement().style.cursor = feature ? 'pointer' : '';

        if (cityKey === currentHoveredCity) return;
        currentHoveredCity = cityKey;

        if (!cityKey) {
            hideCityTooltip();
            return;
        }

        await showCityTooltip(cityKey);
    });

    updateMapMarkers();

    // === Автоцентрирование ===
    if (typeof isMapLayerEnabled !== 'function' || isMapLayerEnabled('autoCenter')) {
        if (PLAYER && PLAYER.currentCity && CITIES[PLAYER.currentCity]?.coords) {
            const coords = CITIES[PLAYER.currentCity].coords;
            safarstanMap.getView().setCenter(ol.proj.fromLonLat([coords.lng, coords.lat]));
            safarstanMap.getView().setZoom(6);
        }
    }
}

// ============================================
// СТИЛЬ ГОРОДА / КЛАСТЕРА
// ============================================
function cityStyleFunction(feature) {
    const features = feature.get('features');
    const size = features ? features.length : 1;

    // === Кластер (2+ города) ===
    if (size > 1) {
        return new ol.style.Style({
            image: new ol.style.Circle({
                radius: 16 + Math.min(size, 10) * 0.8,
                fill: new ol.style.Fill({ color: '#16a34a' }),
                stroke: new ol.style.Stroke({ color: '#ffffff', width: 3 }),
            }),
            text: new ol.style.Text({
                text: String(size),
                font: 'bold 14px Inter, Arial, sans-serif',
                fill: new ol.style.Fill({ color: '#ffffff' }),
            }),
        });
    }

    // === Один город ===
    const singleFeature = features[0];
    const status = singleFeature.get('status') || 'unvisited';

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
    if (!safarstanMap || !clusterSource) return;

    clusterSource.getSource().clear();

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

        clusterSource.getSource().addFeature(feature);
    });

    // Метки друзей и планов
    renderFriendMarkers();
    renderPlanMarkers();

    // Хашары
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
// МЕТКИ ДРУЗЕЙ НА КАРТЕ
// ============================================
async function renderFriendMarkers() {
    if (!_cityMarkersSource) return;
    _cityMarkersSource.clear();

    if (typeof isMapLayerEnabled === 'function' && !isMapLayerEnabled('markersFriends')) {
        return;
    }

    let stats;
    try {
        stats = await getCityFriendsStatsCached();
    } catch (err) {
        return;
    }

    if (!stats) return;

    Object.entries(stats).forEach(([cityKey, count]) => {
        if (!count || count <= 0) return;

        const city = CITIES[cityKey];
        if (!city || !city.coords) return;

        const feature = new ol.Feature({
            geometry: new ol.geom.Point(
                ol.proj.fromLonLat([city.coords.lng, city.coords.lat])
            ),
            count: count,
        });

        feature.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
                radius: 9,
                fill: new ol.style.Fill({ color: '#3b82f6' }),
                stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 }),
            }),
            text: new ol.style.Text({
                text: String(count),
                font: 'bold 10px Inter, Arial, sans-serif',
                fill: new ol.style.Fill({ color: '#ffffff' }),
            }),
        }));

        _cityMarkersSource.addFeature(feature);
    });
}

// ============================================
// МЕТКИ ПЛАНОВ НА КАРТЕ
// ============================================
async function renderPlanMarkers() {
    if (!_planMarkersSource) return;
    _planMarkersSource.clear();

    if (typeof isMapLayerEnabled === 'function' && !isMapLayerEnabled('markersPlans')) {
        return;
    }

    if (!PLAYER || !PLAYER.playerId) return;

    let plans = [];
    try {
        plans = await loadPlans(PLAYER.playerId);
    } catch (err) {
        return;
    }

    if (!plans || plans.length === 0) return;

    // Группируем планы по городам
    const byCity = {};
    plans.forEach(p => {
        if (!p.city_key) return;
        byCity[p.city_key] = (byCity[p.city_key] || 0) + 1;
    });

    Object.entries(byCity).forEach(([cityKey, count]) => {
        const city = CITIES[cityKey];
        if (!city || !city.coords) return;

        const feature = new ol.Feature({
            geometry: new ol.geom.Point(
                ol.proj.fromLonLat([city.coords.lng, city.coords.lat])
            ),
        });

        feature.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
                radius: 11,
                fill: new ol.style.Fill({ color: '#a855f7' }),
                stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 }),
            }),
            text: new ol.style.Text({
                text: '📅',
                font: '12px Inter, Arial, sans-serif',
                offsetY: 0,
            }),
        }));

        _planMarkersSource.addFeature(feature);
    });
}

// ============================================
// КЭШ СТАТИСТИКИ (без изменений)
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
// БЕЙДЖИ ГАПОВ — только в тултипе
// ============================================
async function renderGapBadges() {
    return;
}

// ============================================
// ТОЧКИ ХАШАРОВ (без изменений)
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

    const catSymbols = {
        repair: 'Р',
        trees:  'Д',
        cleanup:'У',
        help:   'П',
        charity:'Б',
        other:  '•',
    };

    hashars.forEach(h => {
        if (!h.coords || !h.coords.lat || !h.coords.lng) return;

        const symbol = catSymbols[h.category] || '•';

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
                text: symbol,
                font: 'bold 12px Inter, Arial, sans-serif',
                fill: new ol.style.Fill({ color: '#ffffff' }),
                offsetY: 0,
            }),
        }));

        hasharSource.addFeature(feature);
    });
}

// ============================================
// ТУЛТИП ГОРОДА (без изменений, но с метками планов)
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

    // Планы
    if (typeof isMapLayerEnabled !== 'function' || isMapLayerEnabled('markersPlans')) {
        if (PLAYER && PLAYER.playerId) {
            try {
                const plans = await loadPlans(PLAYER.playerId);
                const count = plans.filter(p => p.city_key === cityKey).length;
                if (count > 0) {
                    items.push(`<span class="city-tooltip__item"><i data-lucide="calendar-plus"></i> <strong>${count}</strong></span>`);
                }
            } catch (e) { /* ничего */ }
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

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function hideCityTooltip() {
    const tooltipEl = document.getElementById('cityTooltip');
    if (tooltipEl) tooltipEl.style.display = 'none';
    if (cityTooltipOverlay) cityTooltipOverlay.setPosition(undefined);
    currentHoveredCity = null;
}

// ============================================
// СТИЛЬ / ТАЙЛЫ КАРТЫ
// ============================================

const TILE_SOURCES = {
    // Светлая — обычный OSM
    light: () => new ol.source.OSM(),

    // Тёмная — тоже OSM, но с CSS-фильтром (см. updateMapStyle)
    dark: () => new ol.source.OSM(),

    // Спутник — Esri (без ключа)
    satellite: () => new ol.source.XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: '© Esri',
        maxZoom: 18,
    }),
};

function getTileSource(style) {
    const factory = TILE_SOURCES[style] || TILE_SOURCES.light;
    return factory();
}

// Обновить тайлы карты (при смене стиля)
function updateMapStyle(style) {
    if (!safarstanMap || !tileLayer) return;

    // Меняем источник тайлов
    tileLayer.setSource(getTileSource(style));

    // Для тёмной — добавляем CSS-фильтр на контейнер карты
    const el = document.getElementById('safarstanMap');
    if (el) {
        if (style === 'dark') {
            el.classList.add('map--dark');
        } else {
            el.classList.remove('map--dark');
        }
    }

    // Обновляем подсветку в дропдауне
    updateMapStyleDropdown();
}

// Подсветка активного стиля в дропдауне на карте
function updateMapStyleDropdown() {
    const style = typeof getMapStyle === 'function' ? getMapStyle() : 'light';
    document.querySelectorAll('[data-map-style]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mapStyle === style);
    });
}

// Тема карты при смене темы сайта — карта переключается автоматически
function updateMapTiles(theme) {
    // Тема карты следует за темой сайта
    const mapStyle = (theme === 'dark' || theme === 'space') ? 'dark' : 'light';

    // Но если явно выбран спутник — оставляем
    const userStyle = typeof getMapStyle === 'function' ? getMapStyle() : 'light';
    if (userStyle === 'satellite') return;

    updateMapStyle(mapStyle);
}

// Автоцентрирование на текущем городе
function centerMapOnMyCity() {
    if (!safarstanMap) return;
    if (typeof isMapLayerEnabled === 'function' && !isMapLayerEnabled('autoCenter')) return;

    if (PLAYER && PLAYER.currentCity && CITIES[PLAYER.currentCity]?.coords) {
        const coords = CITIES[PLAYER.currentCity].coords;
        safarstanMap.getView().animate({
            center: ol.proj.fromLonLat([coords.lng, coords.lat]),
            zoom: 6,
            duration: 500,
        });
    }
}