// ============ API: ЧЕК-ИНЫ ============

// Сохранить чек-ин в базу
async function saveCheckin(playerId, cityKey, category, placeTitle) {
    const placeKey = `${cityKey}|${category}|${placeTitle}`;
    const { error } = await _supabase
        .from('checkins')
        .insert({
            player_id: playerId,
            city_key: cityKey,
            category: category,
            place_title: placeTitle,
            place_key: placeKey,
        });
    if (error) console.error('Ошибка чек-ина:', error);
}

// Загрузить все чек-ины игрока
async function loadCheckins(playerId) {
    const { data, error } = await _supabase
        .from('checkins')
        .select('*')
        .eq('player_id', playerId)
        .eq('is_deleted', false);

    if (error) {
        console.error('Ошибка загрузки чек-инов:', error);
        return {};
    }
    const result = {};
    data.forEach(c => {
        result[c.place_key] = (result[c.place_key] || 0) + 1;
    });
    return result;
}

// ============================================
// СТАТИСТИКА ГОРОДА
// ============================================

async function loadCityAnalytics(cityKey) {
    if (!cityKey) return null;

    // 1. Все чек-ины города
    const { data: checkins, error: err1 } = await _supabase
        .from('checkins')
        .select('player_id, category, place_title')
        .eq('city_key', cityKey)
        .eq('is_deleted', false);

    if (err1) {
        console.error('Ошибка загрузки чек-инов города:', err1);
        return null;
    }

    // 2. Уникальные игроки
    const players = new Set();
    checkins.forEach(c => players.add(c.player_id));

    // 3. Топ мест
    const placesCount = {};
    checkins.forEach(c => {
        const key = c.place_title || 'Неизвестное место';
        placesCount[key] = (placesCount[key] || 0) + 1;
    });

    const topPlaces = Object.entries(placesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([title, count]) => ({ title, count }));

    // 4. Топ игроков
    const playersCount = {};
    checkins.forEach(c => {
        playersCount[c.player_id] = (playersCount[c.player_id] || 0) + 1;
    });

    const topPlayersIds = Object.entries(playersCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id, count]) => ({ id, count }));

    // 5. Загружаем имена игроков
    let topPlayers = [];
    if (topPlayersIds.length > 0) {
        const { data: playersData } = await _supabase
            .from('players')
            .select('id, name, avatar')
            .in('id', topPlayersIds.map(p => p.id));

        const playersMap = {};
        (playersData || []).forEach(p => { playersMap[p.id] = p; });

        topPlayers = topPlayersIds.map(({ id, count }) => ({
            id,
            count,
            name: playersMap[id]?.name || 'Игрок',
            avatar: playersMap[id]?.avatar || '🧑‍💼',
        }));
    }

    return {
        totalPlayers: players.size,
        totalCheckins: checkins.length,
        topPlaces,
        topPlayers,
    };
}