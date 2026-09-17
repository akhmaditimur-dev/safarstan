// ============ UI: РЕЙТИНГ ГОРОДОВ ============

function renderRatings() {
    ensureCityScores();

    const container = document.getElementById('ratingList');
    if (!container) return;

    const rows = Object.entries(CITIES).map(([key, city]) => ({
        key,
        name: city.name,
        country: city.country,
        score: CITY_SCORES[key][currentRatingType] || 0,
    }));

    rows.sort((a, b) => b.score - a.score);

    const visibleRows = rows.filter((r, idx) => r.score > 0 || idx < 3);

    if (visibleRows.every(r => r.score === 0)) {
        container.innerHTML = `
            <div class="rating-empty">
                Пока никто не набрал очки.<br>
                Стань первым — сделай чек-ин! ✅
            </div>
        `;
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];

    container.innerHTML = visibleRows.map((row, idx) => {
        const pos = idx + 1;
        const topClass = pos <= 3 ? `top-${pos}` : '';
        const medal = medals[idx] || pos;

        return `
            <div class="rating-row ${topClass}">
                <div class="rating-position">${medal}</div>
                <div class="rating-city">
                    ${row.name}
                    <small>${row.country}</small>
                </div>
                <div class="rating-score">
                    ${row.score}
                    <small>очков</small>
                </div>
            </div>
        `;
    }).join('');
}

function renderRatingTabs() {
    document.querySelectorAll('#ratingTabs .tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.rating === currentRatingType);
    });
}