// ============ API: ЛЕНТА СОБЫТИЙ ============

// Сохранить событие
async function saveFeedEvent(playerId, eventType, eventData = {}, cityKey = null) {
    const { error } = await _supabase
        .from('feed')
        .insert({
            player_id: playerId,
            event_type: eventType,
            event_data: eventData,
            city_key: cityKey,
        });

    if (error) console.error('Ошибка сохранения события:', error);
}

// Загрузить ленту (свои + друзья + рекомендованные из моих городов)
// Загрузить ленту (свои + друзья + рекомендованные из моих городов)
async function loadFeed(limit = 10) {
    // === Проверка PLAYER ===
    if (!PLAYER || !PLAYER.playerId) {
        // Fallback: общая лента
        const { data, error } = await _supabase
            .from('feed')
            .select(`
                id, event_type, event_data, city_key, created_at, player_id,
                players:player_id (name, avatar, home_city, current_city)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Ошибка загрузки ленты:', error);
            return [];
        }
        return data || [];
    }

    const myId = PLAYER.playerId;
    if (!myId) return [];

    // === Фильтруем friendIds от undefined/null ===
    const friendIds = (typeof FRIENDS !== 'undefined' ? FRIENDS : [])
        .map(f => f && f.id)
        .filter(id => typeof id === 'string' && id.length > 0);

    // Города, которые я отметил
    const visitedCities = Object.keys(PLAYER.visitedCities || {});
    const myCities = [PLAYER.homeCity, PLAYER.currentCity, ...visitedCities]
        .filter((v, i, a) => v && a.indexOf(v) === i);

    // === ЧАСТЬ 1: Свои + друзья ===
    const idsForFeed = [myId, ...friendIds]
        .filter(id => typeof id === 'string' && id.length > 0);

    const { data: personalFeed, error: err1 } = await _supabase
        .from('feed')
        .select(`
            id, event_type, event_data, city_key, created_at, player_id,
            players:player_id (name, avatar, home_city, current_city)
        `)
        .in('player_id', idsForFeed)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (err1) {
        console.warn('Ошибка личной ленты:', err1);
    }

    // === ЧАСТЬ 2: События от чужих в моих городах ===
    let cityFeed = [];
    if (myCities.length > 0) {
        const excludeIds = [myId, ...friendIds]
            .filter(id => typeof id === 'string' && id.length > 0);

        let query = _supabase
            .from('feed')
            .select(`
                id, event_type, event_data, city_key, created_at, player_id,
                players:player_id (name, avatar, home_city, current_city)
            `)
            .in('city_key', myCities)
            .order('created_at', { ascending: false })
            .limit(Math.floor(limit / 2));

        // Если есть кого исключать — применяем .not
        if (excludeIds.length > 0) {
            query = query.not('player_id', 'in', `(${excludeIds.join(',')})`);
        }

        const { data: otherFeed, error: err2 } = await query;

        if (err2) {
            console.warn('Ошибка ленты городов:', err2);
        }
        cityFeed = otherFeed || [];
    }

    // === ОБЪЕДИНЯЕМ ===
    const all = [...(personalFeed || []), ...cityFeed];

    const seen = new Set();
    const unique = all.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });

    unique.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return unique.slice(0, limit);
}

// Загрузить ленту только друзей
async function loadFriendsFeed(friendIds, limit = 10) {
    if (!friendIds || friendIds.length === 0) return [];

    const { data, error } = await _supabase
        .from('feed')
        .select(`
            id, event_type, event_data, city_key, created_at, player_id,
            players:player_id (name, avatar)
        `)
        .in('player_id', friendIds)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Ошибка ленты друзей:', error);
        return [];
    }
    return data || [];
}