// ============ UI: ГОРОД В ШАПКЕ ============

function renderHeaderCity() {
    const nameEl = document.getElementById('headerCityName');
    if (!nameEl || !PLAYER) return;

    const city = CITIES[PLAYER.currentCity];
    nameEl.textContent = city ? city.name : '—';
}

function openHeaderCityDropdown() {
    const dropdown = document.getElementById('headerCityDropdown');
    if (!dropdown) return;

    const visited = PLAYER?.visitedCities || {};
    const homeKey = PLAYER?.homeCity;
    const currentKey = PLAYER?.currentCity;

    // Собираем города: родной, текущий, посещённые
    const keys = new Set();
    if (homeKey) keys.add(homeKey);
    if (currentKey) keys.add(currentKey);
    Object.keys(visited).forEach(k => {
        if (visited[k] > 0) keys.add(k);
    });

    if (keys.size === 0) {
        dropdown.innerHTML = '<div class="header-city__empty">Пока нет городов</div>';
        dropdown.style.display = 'block';
        return;
    }

    // Сортировка по алфавиту
    const list = [...keys]
        .map(k => ({ key: k, city: CITIES[k] }))
        .filter(x => x.city)
        .sort((a, b) => a.city.name.localeCompare(b.city.name, 'ru'));

    dropdown.innerHTML = list.map(({ key, city }) => {
        const isCurrent = key === currentKey;
        const isHome = key === homeKey;
        const icon = isHome ? 'home' : isCurrent ? 'map-pin' : 'check';

        return `
            <button class="header-city__item ${isCurrent ? 'active' : ''}" data-city-key="${key}">
                <i data-lucide="${icon}"></i>
                <span>${escapeHtml(city.name)}</span>
                ${isCurrent ? '<i data-lucide="check" class="header-city__check"></i>' : ''}
            </button>
        `;
    }).join('');

    dropdown.style.display = 'block';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeHeaderCityDropdown() {
    const dropdown = document.getElementById('headerCityDropdown');
    if (dropdown) dropdown.style.display = 'none';
}

// Обработчики
document.addEventListener('click', (e) => {
    if (e.target.closest('#headerCityBtn')) {
        e.preventDefault();
        const dropdown = document.getElementById('headerCityDropdown');
        if (dropdown.style.display === 'block') {
            closeHeaderCityDropdown();
        } else {
            openHeaderCityDropdown();
        }
        return;
    }

    const item = e.target.closest('.header-city__item');
    if (item) {
        const key = item.dataset.cityKey;
        closeHeaderCityDropdown();
        if (typeof selectCity === 'function' && key) {
            selectCity(key);
            renderHeaderCity();
        }
        return;
    }

    if (!e.target.closest('#headerCity')) {
        closeHeaderCityDropdown();
    }
});