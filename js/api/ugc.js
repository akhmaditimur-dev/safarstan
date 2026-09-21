// ============ API: UGC (ПОЛЬЗОВАТЕЛЬСКИЕ МЕСТА) ============

// Сохранить пользовательское место
async function saveUserPlace(playerId, cityKey, category, place) {
    const { error } = await _supabase
        .from('user_places')
        .insert({
            player_id: playerId,
            city_key: cityKey,
            category: category,
            title: place.title,
            description: place.desc,
            meta: place.meta,
            author_name: place.author,
            author_avatar: place.authorAvatar,
        });
    if (error) console.error('Ошибка сохранения места:', error);
}

// Загрузить все пользовательские места
async function loadUserPlaces() {
    const { data, error } = await _supabase
        .from('user_places')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Ошибка загрузки мест:', error);
        return {};
    }

    const result = {};
    data.forEach(row => {
        if (!result[row.city_key]) result[row.city_key] = {};
        if (!result[row.city_key][row.category]) result[row.city_key][row.category] = [];
        result[row.city_key][row.category].push({
            id: row.id,
            title: row.title,
            desc: row.description,
            meta: row.meta,
            author: row.author_name,
            authorAvatar: row.author_avatar,
            playerId: row.player_id,
        });
    });
    return result;
}