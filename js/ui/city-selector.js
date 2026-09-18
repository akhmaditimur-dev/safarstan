// ============ UI: ВЫБОР ГОРОДА ============

// Флаги стран — буквенные коды
const COUNTRY_FLAGS = {
    'Узбекистан': 'UZ',
    'Казахстан': 'KZ',
    'Кыргызстан': 'KG',
    'Таджикистан': 'TJ',
    'Туркменистан': 'TM',
};

// ============================================
// ПОИСК ГОРОДА
// ============================================
function initCitySearch() {
    const input = document.getElementById('citySearchInput');
    const results = document.getElementById('citySearchResults');
    const clear = document.getElementById('citySearchClear');
    if (!input || !results) return;

    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();

        if (clear) clear.style.display = query ? 'flex' : 'none';

        if (query.length < 1) {
            results.style.display = 'none';
            return;
        }

        const matches = Object.entries(CITIES).filter(([key, city]) =>
            city.name.toLowerCase().includes(query) ||
            city.country.toLowerCase().includes(query)
        ).slice(0, 5);

        if (matches.length === 0) {
            results.innerHTML = '<div class="city-search__empty">Ничего не найдено</div>';
            results.style.display = 'block';
            return;
        }

        results.innerHTML = matches.map(([key, city]) => `
            <button class="city-search__result" data-city-key="${key}">
                <span class="city-search__result-flag">${city.flag || '—'}</span>
                <span class="city-search__result-name">${city.name}</span>
                <span class="city-search__result-country">${city.country}</span>
            </button>
        `).join('');
        results.style.display = 'block';
    });

    results.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-city-key]');
        if (!btn) return;
        selectCity(btn.dataset.cityKey);
        input.value = '';
        results.style.display = 'none';
        if (clear) clear.style.display = 'none';
    });

    if (clear) {
        clear.addEventListener('click', () => {
            input.value = '';
            results.style.display = 'none';
            clear.style.display = 'none';
            input.focus();
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.city-search')) {
            results.style.display = 'none';
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            results.style.display = 'none';
            input.blur();
        }
    });
}

// ============================================
// ТВОИ ГОРОДА
// ============================================
function renderMyCities() {
    const section = document.getElementById('myCitiesSection');
    const container = document.getElementById('myCitiesChips');
    if (!section || !container) return;

    if (!PLAYER) {
        section.style.display = 'none';
        return;
    }

    const cities = [];
    const seen = new Set();

    if (PLAYER.homeCity && CITIES[PLAYER.homeCity]) {
        cities.push({ key: PLAYER.homeCity, icon: '<i data-lucide="home"></i>', label: 'Родной' });
        seen.add(PLAYER.homeCity);
    }

    if (PLAYER.currentCity && CITIES[PLAYER.currentCity] && !seen.has(PLAYER.currentCity)) {
        cities.push({ key: PLAYER.currentCity, icon: '<i data-lucide="map-pin"></i>', label: 'Текущий' });
        seen.add(PLAYER.currentCity);
    }

    const cooldowns = PLAYER.checkinCooldowns || {};
    const lastVisitedCity = Object.keys(cooldowns)
        .map(checkinKey => {
            const [cityKey] = checkinKey.split('|');
            return { cityKey, time: cooldowns[checkinKey] };
        })
        .sort((a, b) => b.time - a.time)
        .find(({ cityKey }) => !seen.has(cityKey) && CITIES[cityKey]);

    if (lastVisitedCity) {
        cities.push({ key: lastVisitedCity.cityKey, icon: '<i data-lucide="check"></i>', label: 'Недавно' });
        seen.add(lastVisitedCity.cityKey);
    }

    if (typeof PLANS !== 'undefined' && PLANS.length > 0) {
        const planCity = PLANS[0].city_key;
        if (planCity && CITIES[planCity] && !seen.has(planCity)) {
            cities.push({ key: planCity, icon: '<i data-lucide="calendar"></i>', label: 'Планируешь' });
            seen.add(planCity);
        }
    }

    if (cities.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = cities.map(c => `
        <button class="city-chip ${c.key === currentCity ? 'active' : ''}" data-city-key="${c.key}">
            <span class="city-chip__icon">${c.icon}</span>
            ${CITIES[c.key].name}
        </button>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// АККОРДЕОН СТРАН
// ============================================
function renderCountryAccordion() {
    const container = document.getElementById('countryAccordion');
    if (!container) return;

    // Группируем города по стране
    const byCountry = {};
    Object.entries(CITIES).forEach(([key, city]) => {
        if (!byCountry[city.country]) byCountry[city.country] = [];
        byCountry[city.country].push({ key, city });
    });

    const sortedCountries = Object.entries(byCountry).sort((a, b) => b[1].length - a[1].length);

    container.innerHTML = sortedCountries.map(([country, cities]) => {
        const flag = COUNTRY_FLAGS[country] || '—';

        return `
            <div class="country-item" data-country="${country}">
                <button class="country-item__header" type="button">
                    <span class="country-item__flag">${flag}</span>
                    <span class="country-item__name">${country}</span>
                    <span class="country-item__count">${cities.length}</span>
                    <span class="country-item__arrow"><i data-lucide="chevron-right"></i></span>
                </button>
                <div class="country-item__cities">
                    ${cities.map(({ key, city }) => `
                        <button class="country-city-btn ${key === currentCity ? 'active' : ''}" data-city-key="${key}" type="button">
                            ${city.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// ОБНОВИТЬ ВСЁ (после выбора города)
// ============================================
function renderCitySelector() {
    renderMyCities();
    renderCountryAccordion();
}

// ============================================
// ГЛОБАЛЬНЫЙ ОБРАБОТЧИК АККОРДЕОНА (один раз)
// ============================================
document.addEventListener('click', (e) => {
    // 1. Клик по шапке страны — открыть/закрыть
    const header = e.target.closest('.country-item__header');
    if (header) {
        e.preventDefault();
        const item = header.closest('.country-item');
        if (!item) return;

        const container = item.parentElement;
        const isOpen = item.classList.contains('open');

        // Закрыть все в контейнере
        if (container) {
            container.querySelectorAll('.country-item').forEach(el => {
                el.classList.remove('open');
            });
        }

        // Открыть текущий, если был закрыт
        if (!isOpen) item.classList.add('open');
        return;
    }

    // 2. Клик по городу внутри страны
    const cityBtn = e.target.closest('.country-city-btn[data-city-key]');
    if (cityBtn) {
        e.preventDefault();
        if (typeof selectCity === 'function') {
            selectCity(cityBtn.dataset.cityKey);
        }
        return;
    }

    // 3. Клик по чипу «Твои города»
    const cityChip = e.target.closest('.city-chip[data-city-key]');
    if (cityChip) {
        e.preventDefault();
        if (typeof selectCity === 'function') {
            selectCity(cityChip.dataset.cityKey);
        }
        return;
    }
});

// ============================================
// ВЫБОР ГОРОДА
// ============================================
function selectCity(cityKey) {
    if (!cityKey || !CITIES[cityKey]) return;

    currentCity = cityKey;

    // Сохраняем в localStorage
    if (typeof saveState === 'function') saveState();

    // Перерисовываем
    if (typeof renderAll === 'function') {
        renderAll();
    } else {
        if (typeof renderCityInfo === 'function') renderCityInfo();
        if (typeof renderTransport === 'function') renderTransport();
        if (typeof renderHotels === 'function') renderHotels();
        if (typeof renderServices === 'function') renderServices();
    }

    if (typeof renderCitySelector === 'function') renderCitySelector();

    // Скролл к секции «О городе»
    const infoSection = document.getElementById('info');
    if (infoSection) {
        infoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Обновляем иконки
    if (typeof lucide !== 'undefined') lucide.createIcons();
}