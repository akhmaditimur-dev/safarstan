// ============ UI: УНИВЕРСАЛЬНЫЙ ПОИСК ГОРОДА ============

// Инициализирует поиск для указанного input'а.
// inputId — id видимого input'а
// hiddenId — id скрытого input'а (куда пишется ключ города)
// dropdownId — id контейнера дропдауна
function initCitySelect(inputId, hiddenId, dropdownId) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    if (!input || !dropdown) return;

    // При фокусе и вводе
    input.addEventListener('input', () => {
        showCityDropdown(input.value.trim(), dropdown);
    });

    input.addEventListener('focus', () => {
        showCityDropdown(input.value.trim(), dropdown);
    });

    // Клик по городу в дропдауне
    dropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.city-select__item');
        if (!item) return;
        input.value = item.dataset.cityName;
        document.getElementById(hiddenId).value = item.dataset.cityKey;
        dropdown.style.display = 'none';
    });

    // Клик вне — закрыть
    document.addEventListener('click', (e) => {
        if (!e.target.closest(`#${inputId}`) && !e.target.closest(`#${dropdownId}`)) {
            dropdown.style.display = 'none';
        }
    });
}

// Показать дропдаун с городами
function showCityDropdown(query, dropdown) {
    const all = Object.entries(CITIES)
        .map(([key, c]) => ({ key, name: c.name, country: c.country }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

    const q = (query || '').toLowerCase();
    const items = q
        ? all.filter(c => c.name.toLowerCase().includes(q)).slice(0, 30)
        : all.slice(0, 30);

    if (items.length === 0) {
        dropdown.innerHTML = '<div class="city-select__empty">Ничего не нашли</div>';
        dropdown.style.display = 'block';
        return;
    }

    dropdown.innerHTML = items.map(c => `
        <button type="button" class="city-select__item"
                data-city-key="${c.key}"
                data-city-name="${escapeHtml(c.name)}">
            <span class="city-select__name">${escapeHtml(c.name)}</span>
            <span class="city-select__country">${escapeHtml(c.country)}</span>
        </button>
    `).join('');

    dropdown.style.display = 'block';
}

// Установить значение вручную
function setCitySelect(inputId, hiddenId, cityKey) {
    const input = document.getElementById(inputId);
    const hidden = document.getElementById(hiddenId);
    if (!input || !hidden) return;

    const city = CITIES[cityKey];
    input.value = city ? city.name : '';
    hidden.value = cityKey || '';
}

// Получить выбранный ключ
function getCitySelectValue(hiddenId) {
    const hidden = document.getElementById(hiddenId);
    return hidden ? hidden.value : '';
}