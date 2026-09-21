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

    const info = (typeof COUNTRY_INFO !== 'undefined' && COUNTRY_INFO[city.country]) || {};

    // 1. Население
    setText('statPopulation', city.population);

    // 2. Языки
    const langs = info.languages || (city.language ? city.language.split(' / ') : []);
    const langsListEl = $id('statLanguagesList');
    if (langsListEl) langsListEl.textContent = langs.join(', ');

    // 3. Валюта + курсы
    setText('statCurrency', city.currency);
    if (typeof renderCurrencyRates === 'function') renderCurrencyRates(city);

    // 4. Погода
    if (typeof renderWeather === 'function') renderWeather(city);

    // 5. Время
    setText('statTime', city.time);

    // 6. Оплата
    setText('statPayment', 'Принимают');
    const payEl = $id('statPaymentList');
    if (payEl) payEl.textContent = (info.payment || []).join(' · ');

    // 7. Связь
    setText('statMobile', 'SIM');
    const mobEl = $id('statMobileList');
    if (mobEl) mobEl.textContent = (info.mobile || []).join(', ');

    // 8. Экстренные
    setText('statEmergency', '112');
    const emEl = $id('statEmergencyList');
    if (emEl && info.emergency) {
        const e = info.emergency;
        emEl.textContent = `${e.ambulance} · ${e.fire} · ${e.police}`;
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// КУРСЫ ВАЛЮТ (API open.er-api.com)
// ============================================
let _currencyCache = {};

async function renderCurrencyRates(city) {
    const container = $id('currencyRates');
    if (!container || !city || !city.currencyCode) return;

    const code = city.currencyCode;
    const now = Date.now();

    // Кэш на 1 час
    if (_currencyCache[code] && (now - _currencyCache[code].time < 3600000)) {
        displayRates(container, _currencyCache[code].data, city.currency);
        return;
    }

    container.innerHTML = '<div class="currency-rate-item">Загрузка...</div>';

    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${code}`);
        const data = await response.json();

        if (data.result !== 'success' || !data.rates) {
            throw new Error('API вернул ошибку');
        }

        // data.rates['USD'] = сколько USD за 1 UZS.
        // Нам надо 1 USD = X UZS → X = 1 / data.rates['USD'].
        const rates = {
            USD: 1 / data.rates['USD'],
            EUR: 1 / data.rates['EUR'],
            RUB: 1 / data.rates['RUB'],
        };

        _currencyCache[code] = { time: now, data: rates };
        displayRates(container, rates, city.currency);

    } catch (err) {
        console.warn('Ошибка загрузки курсов:', err);
        container.innerHTML = '';
    }
}

function displayRates(container, rates, currencyName) {
    // Короткие названия валют для курсов
    const shortNames = {
        'Сомони': 'смн',
        'Сум': 'сум',
        'Тенге': '₸',
        'Сом': 'сом',
        'Манат': 'манат',
    };

    const shortName = shortNames[currencyName] || currencyName.toLowerCase();

    container.innerHTML = ['USD', 'EUR', 'RUB'].map(code => {
        const val = rates[code];
        if (!val) return '';
        const formatted = val > 100 ? Math.round(val).toLocaleString('ru-RU') : val.toFixed(3);
        return `
            <div class="currency-rate-item">
                <strong>1 ${code} =</strong>
                <span>${formatted} ${shortName}</span>
            </div>
        `;
    }).join('');
}

// ============================================
// ПОГОДА (API open-meteo.com)
// ============================================
async function renderWeather(city) {
    const container = $id('statWeather');
    const forecastEl = $id('weatherForecast');
    if (!container || !city || !city.coords) return;

    try {
        const url = `https://api.open-meteo.com/v1/forecast`
            + `?latitude=${city.coords.lat}`
            + `&longitude=${city.coords.lng}`
            + `&current=temperature_2m,weather_code`
            + `&daily=temperature_2m_max,temperature_2m_min,weather_code`
            + `&forecast_days=3`
            + `&timezone=auto`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.current) throw new Error('Нет данных');

        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weather_code;
        const { label } = weatherInfo(code);

        container.textContent = `${temp}°C`;
        container.title = label;

        // Прогноз на 3 дня
        if (forecastEl && data.daily && data.daily.time) {
            const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
            const rows = [];

            for (let i = 0; i < 3 && i < data.daily.time.length; i++) {
                const date = new Date(data.daily.time[i]);
                const dayIndex = date.getDay();

                const dayLabel = i === 0 ? 'Сегодня' : days[dayIndex];
                const max = Math.round(data.daily.temperature_2m_max[i]);
                const min = Math.round(data.daily.temperature_2m_min[i]);

                rows.push(`
                    <div class="weather-day">
                        <span class="weather-day__name">${dayLabel}</span>
                        <span class="weather-day__temp">${max}° / ${min}°</span>
                    </div>
                `);
            }

            forecastEl.innerHTML = rows.join('');
        }

    } catch (err) {
        console.warn('Ошибка загрузки погоды:', err);
        container.textContent = '—';
        if (forecastEl) forecastEl.innerHTML = '';
    }
}

function weatherInfo(code) {
    if (code === 0) return { icon: '☀️', label: 'Ясно' };
    if (code <= 3) return { icon: '⛅', label: 'Облачно' };
    if (code <= 48) return { icon: '🌫', label: 'Туман' };
    if (code <= 67) return { icon: '🌧', label: 'Дождь' };
    if (code <= 77) return { icon: '❄️', label: 'Снег' };
    if (code <= 82) return { icon: '🌦', label: 'Ливень' };
    if (code <= 86) return { icon: '🌨', label: 'Снегопад' };
    if (code >= 95) return { icon: '⛈', label: 'Гроза' };
    return { icon: '🌡', label: 'Погода' };
}

// ============ ТАБЫ ТРАНСПОРТА ============
function renderTabs() {
    const tabs = document.querySelectorAll('#transportTabs .tab');
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.type === currentTransportType);
        const key = 'transport.' + tab.dataset.type;
        const label = t(key);
        if (label && label !== `[${key}]`) tab.textContent = label;
    });
}

// ============ ЯЗЫК ============
function applyLang() {
    // Hero
    setText('.hero h1', t('hero.title'));
    setText('.hero__subtitle', t('hero.subtitle'));

    // Заголовки секций
    setText('#map h2', t('sections.map'));
    setText('#ratings h2', t('sections.ratings'));
    setText('#quests h2', t('sections.quests'));
    setText('#transport h2', t('sections.transport'));
    setText('#hotels h2', t('sections.hotels'));
    setText('#services h2', t('sections.services'));

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

    if (!analytics || !analytics.totalCheckins) return;

    container.style.display = 'block';

    // Сводка
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

    // Топ мест
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

    // Топ игроков
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