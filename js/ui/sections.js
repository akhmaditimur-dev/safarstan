// ============ UI: СЕКЦИИ (город, табы, язык) ============

// ----- Хелперы -----
function $(sel, root = document) {
    return typeof sel === 'string' ? root.querySelector(sel) : sel;
}

function $id(id) {
    return document.getElementById(id);
}

function setText(elOrSel, text) {
    const el = typeof elOrSel === 'string'
        ? (elOrSel.startsWith('#') || elOrSel.includes('.') ? $(elOrSel) : $id(elOrSel))
        : elOrSel;
    if (el) el.textContent = text;
}

function setHTML(elOrSel, html) {
    const el = typeof elOrSel === 'string'
        ? (elOrSel.startsWith('#') || elOrSel.includes('.') ? $(elOrSel) : $id(elOrSel))
        : elOrSel;
    if (el) el.innerHTML = html;
}

// ============ ИНФОРМАЦИЯ О ГОРОДЕ ============
function renderCityInfo() {
    const city = CITIES[currentCity];
    if (!city) return;

    setText('cityTitle', city.name);
    setText('cityCountry', city.country);
    setText('cityDescription', city.description);

    // Предупреждение для особых городов
    const warnEl = $id('cityWarning');
    if (city.special) {
        if (!warnEl) {
            const desc = $id('cityDescription');
            if (desc && desc.parentElement) {
                const warn = document.createElement('div');
                warn.id = 'cityWarning';
                warn.className = 'city-warning';
                warn.innerHTML = '<i data-lucide="alert-triangle"></i> Особый режим въезда: проверьте визовые требования';
                desc.after(warn);
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        }
    } else if (warnEl) {
        warnEl.remove();
    }

    setText('statPopulation', city.population);
    setText('statCurrency', city.currency);
    setText('statLanguage', city.language);
    setText('statTime', city.time);
}

// ============ ТАБЫ ТРАНСПОРТА ============
function renderTabs() {
    const tabs = document.querySelectorAll('#transportTabs .tab');
    if (!tabs.length) return;

    const dict = (I18N && I18N[currentLang]) || (I18N && I18N.ru) || {};
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.type === currentTransportType);
        const label = dict[tab.dataset.type];
        if (label) tab.textContent = label;
    });
}

// ============ ЯЗЫК ============
function applyLang() {
    const dict = (I18N && I18N[currentLang]) || (I18N && I18N.ru) || {};

    // Hero
    setText('.hero h1', dict.heroTitle || '');
    setText('.hero__subtitle', dict.heroSubtitle || '');

    // Заголовки секций
    setText('#transport h2', dict.transport || '');
    setText('#hotels h2',    dict.hotels    || '');
    setText('#services h2',  dict.services  || '');

    // Кнопка языка
    setText('langBtn', currentLang === 'ru' ? 'EN' : 'RU');

    // Табы транспорта
    renderTabs();
}

// ============================================
// СТАТИСТИКА ГОРОДА
// ============================================
async function renderCityAnalytics() {
    const container = $id('cityAnalytics');
    if (!container) return;

    container.style.display = 'none';

    let analytics;
    try {
        analytics = await loadCityAnalytics(currentCity);
    } catch (err) {
        console.warn('Ошибка загрузки аналитики города:', err);
        return;
    }

    if (!analytics || !analytics.totalCheckins) {
        return;
    }

    container.style.display = 'block';

    // --- Сводка ---
    const summary = $id('cityAnalyticsSummary');
    if (summary) {
        summary.innerHTML = `
            <div class="city-analytics__stat">
                <strong>${analytics.totalPlayers || 0}</strong>
                <small>Игроков</small>
            </div>
            <div class="city-analytics__stat">
                <strong>${analytics.totalCheckins || 0}</strong>
                <small>Чек-инов</small>
            </div>
        `;
    }

    // --- Топ мест ---
    const placesEl = $id('cityTopPlaces');
    if (placesEl) {
        const topPlaces = analytics.topPlaces || [];
        if (topPlaces.length === 0) {
            placesEl.innerHTML = '<div class="city-analytics__empty">Пока нет данных</div>';
        } else {
            placesEl.innerHTML = topPlaces.map((p, i) => `
                <div class="city-analytics__item">
                    <span class="city-analytics__item-rank">${i + 1}</span>
                    <span class="city-analytics__item-name">${p.title || '—'}</span>
                    <span class="city-analytics__item-value">${p.count || 0}</span>
                </div>
            `).join('');
        }
    }

    // --- Топ игроков ---
    const playersEl = $id('cityTopPlayers');
    if (playersEl) {
        const topPlayers = analytics.topPlayers || [];
        if (topPlayers.length === 0) {
            playersEl.innerHTML = '<div class="city-analytics__empty">Пока нет данных</div>';
        } else {
            playersEl.innerHTML = topPlayers.map((p, i) => `
                <div class="city-analytics__item" data-player-profile="${p.id}" style="cursor:pointer;">
                    <span class="city-analytics__item-rank">${i + 1}</span>
                    <span class="city-analytics__item-name">${p.name || '—'}</span>
                    <span class="city-analytics__item-value">${p.count || 0}</span>
                </div>
            `).join('');
        }
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}