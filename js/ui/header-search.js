// ============ UI: ПОИСК В ШАПКЕ ============

let headerSearchTimeout = null;

function initHeaderSearch() {
    const input = document.getElementById('headerSearchInput');
    const results = document.getElementById('headerSearchResults');
    const clear = document.getElementById('headerSearchClear');

    if (!input || !results) return;

    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();

        if (clear) clear.style.display = query ? 'flex' : 'none';

        if (query.length < 2) {
            results.style.display = 'none';
            return;
        }

        clearTimeout(headerSearchTimeout);
        headerSearchTimeout = setTimeout(() => {
            performSearch(query, results);
        }, 200);
    });

    // Клик по результату
    results.addEventListener('click', (e) => {
        const item = e.target.closest('[data-result-type]');
        if (!item) return;

        const type = item.dataset.resultType;
        const value = item.dataset.resultValue;

        handleSearchResult(type, value);

        // Закрыть
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
        if (!e.target.closest('#headerSearch')) {
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
// ПОИСК
// ============================================
function performSearch(query, container) {
    const results = {
        cities: [],
        places: [],
        quests: [],
    };

    // 1. ГОРОДА
    Object.entries(CITIES).forEach(([key, city]) => {
        if (city.name.toLowerCase().includes(query) ||
            city.country.toLowerCase().includes(query)) {
            results.cities.push({ key, name: city.name, country: city.country, flag: city.flag || '' });
        }
    });

    // 2. МЕСТА (транспорт, отели, сервисы) в текущем городе + UGC
    const currentCityData = CITIES[currentCity];
    if (currentCityData) {
        // Официальные
        ['transport', 'hotels', 'services'].forEach(section => {
            const items = section === 'transport'
                ? [...(currentCityData.transport?.train || []),
                   ...(currentCityData.transport?.bus || []),
                   ...(currentCityData.transport?.taxi || [])]
                : (currentCityData[section] || []);

            items.forEach(item => {
                if (item.title?.toLowerCase().includes(query) ||
                    item.desc?.toLowerCase().includes(query)) {
                    results.places.push({
                        title: item.title,
                        desc: item.desc,
                        cityKey: currentCity,
                        cityName: currentCityData.name,
                        section,
                    });
                }
            });
        });

        // UGC (пользовательские)
        const userPlaces = USER_PLACES[currentCity] || {};
        Object.entries(userPlaces).forEach(([category, places]) => {
            places.forEach(p => {
                if (p.title?.toLowerCase().includes(query) ||
                    p.desc?.toLowerCase().includes(query)) {
                    results.places.push({
                        title: p.title,
                        desc: p.desc,
                        cityKey: currentCity,
                        cityName: currentCityData.name,
                        section: category,
                    });
                }
            });
        });
    }

    // 3. КВЕСТЫ
    QUESTS.forEach(quest => {
        if (quest.name.toLowerCase().includes(query) ||
            quest.desc.toLowerCase().includes(query)) {
            results.quests.push(quest);
        }
    });

    renderSearchResults(results, container);
}

// ============================================
// РЕНДЕР РЕЗУЛЬТАТОВ
// ============================================
function renderSearchResults(results, container) {
    const total = results.cities.length + results.places.length + results.quests.length;

    if (total === 0) {
        container.innerHTML = '<div class="header-search__empty">Ничего не найдено</div>';
        container.style.display = 'block';
        return;
    }

    let html = '';

    // Города
    if (results.cities.length > 0) {
        html += `
            <div class="header-search__group">
                <div class="header-search__group-title">🏙 Города</div>
                ${results.cities.slice(0, 5).map(c => `
                    <button class="header-search__result"
                            data-result-type="city"
                            data-result-value="${c.key}">
                        <span class="header-search__result-icon">${c.flag || '🏙'}</span>
                        <span class="header-search__result-text">
                            ${c.name}
                            <span class="header-search__result-sub">${c.country}</span>
                        </span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    // Места
    if (results.places.length > 0) {
        html += `
            <div class="header-search__group">
                <div class="header-search__group-title">📍 Места в ${CITIES[currentCity]?.name || ''}</div>
                ${results.places.slice(0, 5).map(p => `
                    <button class="header-search__result"
                            data-result-type="place"
                            data-result-value="${p.section}">
                        <span class="header-search__result-icon">
                            ${p.section === 'hotel' ? '🏨' :
                              p.section === 'service' ? '🛒' :
                              p.section === 'train' ? '🚂' :
                              p.section === 'bus' ? '🚌' :
                              p.section === 'taxi' ? '🚕' : '📍'}
                        </span>
                        <span class="header-search__result-text">
                            ${p.title}
                            <span class="header-search__result-sub">${p.cityName}</span>
                        </span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    // Квесты
    if (results.quests.length > 0) {
        html += `
            <div class="header-search__group">
                <div class="header-search__group-title">🎯 Квесты</div>
                ${results.quests.slice(0, 5).map(q => `
                    <button class="header-search__result"
                            data-result-type="quest"
                            data-result-value="${q.id}">
                        <span class="header-search__result-icon">${q.icon}</span>
                        <span class="header-search__result-text">${q.name}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    container.innerHTML = html;
    container.style.display = 'block';
}

// ============================================
// ОБРАБОТКА КЛИКА ПО РЕЗУЛЬТАТУ
// ============================================
function handleSearchResult(type, value) {
    if (type === 'city') {
        // Выбор города
        if (typeof selectCity === 'function') {
            selectCity(value);
        }
    } else if (type === 'place') {
        // Скролл к секции
        const sectionId = value === 'hotel' ? 'hotels' :
                         value === 'service' ? 'services' :
                         value === 'train' || value === 'bus' || value === 'taxi' ? 'transport' :
                         'services';
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } else if (type === 'quest') {
        // Скролл к квестам
        const section = document.getElementById('quests');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}