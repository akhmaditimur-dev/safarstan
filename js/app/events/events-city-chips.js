// ============ APP: КЛИК ПО ЧИПУ ГОРОДА ============

document.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-city-key]');
    if (!chip) return;

    // Пропускаем, если это внутри дропдауна шапки или поиска —
    // у них свои обработчики
    if (chip.closest('#headerCityDropdown')) return;
    if (chip.closest('.city-select__dropdown')) return;
    if (chip.closest('#headerSearchResults')) return;

    const key = chip.dataset.cityKey;
    if (!key || !CITIES[key]) return;

    // Обновляем глобальный город
    if (typeof currentCity !== 'undefined') {
        currentCity = key;
    } else {
        window.currentCity = key;
    }

    // Сохраняем в PLAYER
    if (typeof PLAYER !== 'undefined' && PLAYER) {
        PLAYER.currentCity = key;
        if (typeof savePlayerToServer === 'function') {
            savePlayerToServer(PLAYER);
        }
    }

    // Обновляем UI
    if (typeof renderAll === 'function') renderAll();
    if (typeof renderCityInfo === 'function') renderCityInfo();
    if (typeof renderHeaderCity === 'function') renderHeaderCity();
    if (typeof renderAffiche === 'function') renderAffiche();
    if (typeof saveState === 'function') saveState();
});