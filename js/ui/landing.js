// ============ UI: ЛЕНДИНГ ============

// Рандомные 5 городов + 5 мест для карточек лендинга.
// Запускается один раз при загрузке страницы.

function pickRandom(arr, n) {
    const copy = arr.slice();
    const out = [];
    while (out.length < n && copy.length > 0) {
        const i = Math.floor(Math.random() * copy.length);
        out.push(copy.splice(i, 1)[0]);
    }
    return out;
}

function renderLandingFeatures() {
    const citiesEl = document.getElementById('landingCitiesFeature');
    const placesEl = document.getElementById('landingPlacesFeature');
    if (!citiesEl && !placesEl) return;
    if (typeof CITIES === 'undefined') return;

    // --- 5 случайных городов ---
    if (citiesEl) {
        const allCities = Object.values(CITIES).map(c => c.name);
        const five = pickRandom(allCities, 5);
        citiesEl.textContent = five.join(' · ');
    }

    // --- 5 случайных мест из всех городов ---
    if (placesEl) {
        const allPlaces = [];

        Object.values(CITIES).forEach(city => {
            const buckets = [
                city.hotels,
                city.services,
                city.transport?.train,
                city.transport?.bus,
                city.transport?.taxi,
            ];
            buckets.forEach(bucket => {
                if (Array.isArray(bucket)) {
                    bucket.forEach(place => {
                        if (place && place.title) allPlaces.push(place.title);
                    });
                }
            });
        });

        const five = pickRandom(allPlaces, 5);
        placesEl.textContent = five.join(' · ');
    }
}

// Запуск: после того как data.js и DOM готовы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderLandingFeatures);
} else {
    renderLandingFeatures();
}