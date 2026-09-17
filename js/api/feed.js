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

// Загрузить общую ленту
async function loadFeed(limit = 10) {
    const { data, error } = await _supabase
        .from('feed')
        .select(`
            id,
            event_type,
            event_data,
            city_key,
            created_at,
            player_id,
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