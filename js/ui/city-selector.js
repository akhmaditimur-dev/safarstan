// ============ UI: ВЫБОР ГОРОДА ============

const COUNTRY_FLAGS = {
    'Узбекистан': '🇺🇿',
    'Казахстан': '🇰🇿',
    'Кыргызстан': '🇰🇬',
    'Таджикистан': '🇹🇯',
    'Туркменистан': '🇹🇲',
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
                <span class="city-search__result-flag">${city.flag || ''}</span>
                <span class="city-search__result-name">${city.name}</span>
                <span class="city-search__result-country">${city.country}</span>
            </button>
        `).join('');
        results.style.display = 'block';
    });

    // Клик на результат
    results.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-city-key]');
        if (!btn) return;
        selectCity(btn.dataset.cityKey);
        input.value = '';
        results.style.display = 'none';
        if (clear) clear.style.display = 'none';
    });

    // Очистка
    if (clear) {
        clear.addEventListener('click', () => {
            input.value = '';
            results.style.display = 'none';
            clear.style.display = 'none';
            input.focus();
        });
    }

    // Клик вне — закрыть
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.city-search')) {
            results.style.display = 'none';
        }
    });

    // Escape — закрыть
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

    // Если нет игрока — скрыть
    if (!PLAYER) {
        section.style.display = 'none';
        return;
    }

    const cities = [];
    const seen = new Set();

    // 1. Родной
    if (PLAYER.homeCity && CITIES[PLAYER.homeCity]) {
        cities.push({ key: PLAYER.homeCity, icon: '🏠', label: 'Родной' });
        seen.add(PLAYER.homeCity);
    }

    // 2. Текущий
    if (PLAYER.currentCity && CITIES[PLAYER.currentCity] && !seen.has(PLAYER.currentCity)) {
        cities.push({ key: PLAYER.currentCity, icon: '📍', label: 'Текущий' });
        seen.add(PLAYER.currentCity);
    }

    // 3. Последний посещённый (по checkinCooldowns)
    const cooldowns = PLAYER.checkinCooldowns || {};
    const lastVisitedCity = Object.keys(cooldowns)
        .map(checkinKey => {
            const [cityKey] = checkinKey.split('|');
            return { cityKey, time: cooldowns[checkinKey] };
        })
        .sort((a, b) => b.time - a.time)
        .find(({ cityKey }) => !seen.has(cityKey) && CITIES[cityKey]);

    if (lastVisitedCity) {
        cities.push({ key: lastVisitedCity.cityKey, icon: '✅', label: 'Недавно' });
        seen.add(lastVisitedCity.cityKey);
    }

    // 4. Из планов
    if (typeof PLANS !== 'undefined' && PLANS.length > 0) {
        const planCity = PLANS[0].city_key;
        if (planCity && CITIES[planCity] && !seen.has(planCity)) {
            cities.push({ key: planCity, icon: '📌', label: 'Планируешь' });
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

    // Сортируем страны: сначала Узбекистан (больше всего городов)
    const sortedCountries = Object.entries(byCountry).sort((a, b) => b[1].length - a[1].length);

    container.innerHTML = sortedCountries.map(([country, cities]) => {
        const flag = COUNTRY_FLAGS[country] || '🏳';

        return `
            <div class="country-item" data-country="${country}">
                <button class="country-item__header">
                    <span class="country-item__flag">${flag}</span>
                    <span class="country-item__name">${country}</span>
                    <span class="country-item__count">${cities.length}</span>
                    <span class="country-item__arrow">▶</span>
                </button>
                <div class="country-item__cities">
                    ${cities.map(({ key, city }) => `
                        <button class="country-city-btn ${key === currentCity ? 'active' : ''}" data-city-key="${key}">
                            ${city.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    // Обработчик аккордеона
    container.addEventListener('click', (e) => {
        // Клик по шапке страны
        const header = e.target.closest('.country-item__header');
        if (header) {
            const item = header.closest('.country-item');
            const isOpen = item.classList.contains('open');

            // Закрыть все
            container.querySelectorAll('.country-item').forEach(el => {
                el.classList.remove('open');
            });

            // Открыть/закрыть текущий
            if (!isOpen) item.classList.add('open');
            return;
        }

        // Клик по городу
        const cityBtn = e.target.closest('[data-city-key]');
        if (cityBtn) {
            selectCity(cityBtn.dataset.cityKey);
        }
    });
}

// ============================================
// ОБНОВИТЬ ВСЁ (после выбора города)
// ============================================
function renderCitySelector() {
    renderMyCities();
    renderCountryAccordion();
}