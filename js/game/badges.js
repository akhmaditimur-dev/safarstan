// ============ GAME: БЕЙДЖИ ============

// Получить бейдж по ID
function getBadgeById(id) {
    return BADGES.find(b => b.id === id);
}

// Проверить, какие бейджи заработал игрок
function checkBadges() {
    if (!PLAYER) return [];

    const earned = new Set(PLAYER.badges || []);
    const newBadges = [];
    const visited = PLAYER.visitedCities || {};
    const visitedKeys = Object.keys(visited);
    const totalCheckins = Object.values(PLAYER.checkins || {}).reduce((s, n) => s + n, 0);

    const earn = (id) => {
        if (!earned.has(id)) {
            earned.add(id);
            newBadges.push(id);
        }
    };

    // 🌱 Новичок
    if (totalCheckins >= 1) earn('novice');

    // 🏠 Домосед — 10 чек-инов в текущем городе
    if (PLAYER.currentCity && (visited[PLAYER.currentCity] || 0) >= 10) earn('homebody');

    // 🚌 Сосед — 2 города
    if (visitedKeys.length >= 2) earn('neighbor');

    // 🧭 Путешественник — 4 города
    if (visitedKeys.length >= 4) earn('traveler');

    // ⭐ Первооткрыватель — 5 городов
    if (visitedKeys.length >= 5) earn('pioneer');

    // 🌏 Легенда ЦА — все города
    if (visitedKeys.length >= Object.keys(CITIES).length) earn('legend');

    // 🕌 Шёлковый путь
    if (visited.samarkand && visited.bukhara && visited.khiva) earn('silk_road');

    // 🏔 Горный орёл
    if (visited.bishkek && visited.osh && visited.khujand) earn('mountain_eagle');

    // 🌟 Первооткрыватель места (UGC)
    if ((PLAYER.userPlacesAdded || 0) >= 1) earn('place_pioneer');

    PLAYER.badges = [...earned];
    return newBadges;
}