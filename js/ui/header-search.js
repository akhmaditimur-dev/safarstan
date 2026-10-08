// ============ UI: ПОИСК В ШАПКЕ ============

let headerSearchTimeout = null;

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
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

        handleSearchResult(item.dataset.resultType, item.dataset.resultValue);

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

    // 1. Города
    Object.entries(CITIES).forEach(([key, city]) => {
        if (city.name.toLowerCase().includes(query) ||
            city.country.toLowerCase().includes(query)) {
            results.cities.push({ key, name: city.name, country: city.country });
        }
    });

    // 2. Официальные места (по всем городам)
    Object.entries(CITIES).forEach(([cityKey, cityData]) => {
        ['transport', 'hotels', 'services'].forEach(section => {
            let items = [];

            if (section === 'transport') {
                ['train', 'bus', 'taxi'].forEach(type => {
                    (cityData.transport?.[type] || []).forEach(it => {
                        items.push({ ...it, _sub: type });
                    });
                });
            } else {
                items = (cityData[section] || []).map(it => ({ ...it, _sub: section }));
            }

            items.forEach(item => {
                if (item.title?.toLowerCase().includes(query) ||
                    item.desc?.toLowerCase().includes(query)) {
                    results.places.push({
                        title: item.title,
                        desc: item.desc,
                        cityKey,
                        cityName: cityData.name,
                        section: item._sub,
                    });
                }
            });
        });
    });

    // 3. UGC-места
    Object.entries(USER_PLACES || {}).forEach(([cityKey, cats]) => {
        const cityData = CITIES[cityKey];
        if (!cityData) return;

        Object.entries(cats).forEach(([category, places]) => {
            places.forEach(p => {
                if (p.title?.toLowerCase().includes(query) ||
                    p.desc?.toLowerCase().includes(query)) {
                    results.places.push({
                        title: p.title,
                        desc: p.desc,
                        cityKey,
                        cityName: cityData.name,
                        section: category,
                    });
                }
            });
        });
    });

    // Сортировка: свой город сверху
    results.places.sort((a, b) => {
        const aIsCurrent = a.cityKey === currentCity ? 0 : 1;
        const bIsCurrent = b.cityKey === currentCity ? 0 : 1;
        return aIsCurrent - bIsCurrent;
    });

    // 4. Квесты
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
                <div class="header-search__group-title">Города</div>
                ${results.cities.slice(0, 5).map(c => `
                    <button class="header-search__result"
                            data-result-type="city"
                            data-result-value="${c.key}">
                        <span class="header-search__result-icon"><i data-lucide="building-2"></i></span>
                        <span class="header-search__result-text">
                            ${escapeHtml(c.name)}
                            <span class="header-search__result-sub">${escapeHtml(c.country)}</span>
                        </span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    // Места
    if (results.places.length > 0) {
        const totalPlaces = results.places.length;
        const hasMore = totalPlaces > 5;

        const renderPlaceItem = (p) => {
            const isCurrent = p.cityKey === currentCity;

            const iconName =
                p.section === 'hotel'    ? 'hotel' :
                p.section === 'service'  ? 'shopping-cart' :
                p.section === 'train'    ? 'train-front' :
                p.section === 'bus'      ? 'bus' :
                p.section === 'taxi'     ? 'car' : 'map-pin';

            return `
                <button class="header-search__result"
                        data-result-type="place"
                        data-result-value="${p.section}|${p.title}|${p.cityKey}">
                    <span class="header-search__result-icon"><i data-lucide="${iconName}"></i></span>
                    <span class="header-search__result-text">
                        ${escapeHtml(p.title)}
                        <span class="header-search__result-sub${isCurrent ? ' header-search__result-sub--current' : ''}">
                            ${isCurrent ? '📍 ' : ''}${escapeHtml(p.cityName)}
                        </span>
                    </span>
                </button>
            `;
        };

        html += `
            <div class="header-search__group">
                <div class="header-search__group-title">Места</div>
                <div class="header-search__places" data-places-group>
                    <div data-places-short>
                        ${results.places.slice(0, 5).map(renderPlaceItem).join('')}
                    </div>
                    ${hasMore ? `
                        <div data-places-full style="display:none;">
                            ${results.places.slice(0, 20).map(renderPlaceItem).join('')}
                        </div>
                        <button class="header-search__show-all"
                                data-show-all-places
                                data-total="${totalPlaces}">
                            Показать все (${totalPlaces})
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Квесты
    if (results.quests.length > 0) {
        html += `
            <div class="header-search__group">
                <div class="header-search__group-title">Квесты</div>
                ${results.quests.slice(0, 5).map(q => `
                    <button class="header-search__result"
                            data-result-type="quest"
                            data-result-value="${q.id}">
                        <span class="header-search__result-icon"><i data-lucide="${q.icon}"></i></span>
                        <span class="header-search__result-text">${escapeHtml(q.name)}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    container.innerHTML = html;
    container.style.display = 'block';

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// ОБРАБОТКА КЛИКА ПО РЕЗУЛЬТАТУ
// ============================================
async function handleSearchResult(type, value) {
    // --- Город ---
    if (type === 'city') {
        if (typeof selectCity === 'function') selectCity(value);
        return;
    }

    // --- Квест ---
    if (type === 'quest') {
        const section = document.getElementById('quests');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    // --- Место ---
    // value = "section|title|cityKey"
    const [section, ...rest] = value.split('|');
    const cityKey = rest.pop();
    const title = rest.join('|');

    // Если город другой — сначала переключаем
    if (cityKey && cityKey !== currentCity && CITIES[cityKey]) {
        if (typeof selectCity === 'function') selectCity(cityKey);
        await new Promise(r => setTimeout(r, 600));
    }

    const sectionId =
        section === 'hotel'   ? 'hotels' :
        section === 'service' ? 'services' :
        (section === 'train' || section === 'bus' || section === 'taxi') ? 'transport' :
        'services';

    const sectionEl = document.getElementById(sectionId);
    if (!sectionEl) return;

    sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Подсветка карточки
    setTimeout(() => {
        const cards = sectionEl.querySelectorAll('.card');
        for (const card of cards) {
            const h3 = card.querySelector('h3');
            if (h3 && h3.textContent.trim() === title) {
                card.classList.add('card--highlighted');
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => card.classList.remove('card--highlighted'), 2200);
                break;
            }
        }
    }, 500);
}

// ============================================
// ПОКАЗАТЬ ВСЕ / СВЕРНУТЬ
// ============================================
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-show-all-places]');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const group = btn.closest('[data-places-group]');
    if (!group) return;

    const shortEl = group.querySelector('[data-places-short]');
    const fullEl = group.querySelector('[data-places-full]');
    if (!shortEl || !fullEl) return;

    const isOpen = fullEl.style.display !== 'none';
    const total = parseInt(btn.dataset.total) || 0;

    if (isOpen) {
        shortEl.style.display = '';
        fullEl.style.display = 'none';
        btn.textContent = `Показать все (${total})`;
    } else {
        shortEl.style.display = 'none';
        fullEl.style.display = '';
        btn.textContent = 'Свернуть';
    }
});