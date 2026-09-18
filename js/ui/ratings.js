// ============ UI: РЕЙТИНГ ГОРОДОВ ============

// currentRatingType и currentRatingPeriod — объявлены в storage.js

// Кэш: { 'residents:all': { tashkent: 5, ... }, ... }
let _ratingsCache = {};

async function renderRatings() {
    const container = document.getElementById('ratingList');
    if (!container) return;

    container.innerHTML = '<div class="rating-empty">⏳ Загрузка...</div>';

    const cacheKey = `${currentRatingType}:${currentRatingPeriod}`;
    let scores = _ratingsCache[cacheKey];

    if (!scores) {
        scores = await loadCityRankings(currentRatingType, currentRatingPeriod);
        _ratingsCache[cacheKey] = scores;
    }

    // Собираем строки — только города, где score > 0
    const rows = Object.entries(CITIES).map(([key, city]) => ({
        key,
        name: city.name,
        country: city.country,
        flag: city.flag || '',
        score: scores[key] || 0,
    }));

    // Сортируем по убыванию
    rows.sort((a, b) => b.score - a.score);

    // Оставляем только города с очками; если совсем пусто — сообщение
    const visibleRows = rows.filter(r => r.score > 0);

    if (visibleRows.length === 0) {
        container.innerHTML = `
            <div class="rating-empty">
                Пока нет данных за выбранный период.<br>
                Сделай чек-ин или добавь контент — и город появится здесь! ✅
            </div>
        `;
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];

    container.innerHTML = visibleRows.map((row, idx) => {
        const pos = idx + 1;
        const topClass = pos <= 3 ? `top-${pos}` : '';
        const medal = medals[idx] || pos;
        const scoreLabel = getScoreLabel(currentRatingType, row.score);

        return `
            <div class="rating-row ${topClass}" data-city-key="${row.key}">
                <div class="rating-position">${medal}</div>
                <div class="rating-city">
                    <span class="rating-flag">${row.flag}</span>
                    ${row.name}
                    <small>${row.country}</small>
                </div>
                <div class="rating-score">
                    ${row.score}
                    <small>${scoreLabel}</small>
                </div>
            </div>
        `;
    }).join('');
}

// Подпись под цифрой — зависит от метрики
function getScoreLabel(metric, score) {
    if (metric === 'residents')   return 'чек-инов';
    if (metric === 'home')        return 'жителей';
    if (metric === 'hospitality') return 'визитов';
    if (metric === 'tourists')    return 'туристов';
    if (metric === 'content')     return 'единиц';
    return 'очков';
}

// Активный таб метрики
function renderRatingTabs() {
    document.querySelectorAll('#ratingTabs .tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.rating === currentRatingType);
    });

    document.querySelectorAll('#ratingPeriods .rating-period').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === currentRatingPeriod);
    });
}

// Сброс кэша (например, после чек-ина)
function resetRatingsCache() {
    _ratingsCache = {};
}