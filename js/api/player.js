// ============ API: ИГРОК ============

// Загрузить профиль текущего пользователя
async function loadPlayerFromServer() {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await _supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) {
        console.error('Ошибка загрузки профиля:', error);
        return null;
    }
    return data;
}

// Создать или обновить профиль
async function savePlayerToServer(player) {
    const user = await getCurrentUser();
    if (!user) return null;

    const payload = {
        user_id: user.id,
        email: user.email,
        name: player.name,
        avatar: player.avatar,
        avatar_path: player.avatarPath || null, 
        home_city: player.homeCity,
        current_city: player.currentCity,
        xp: player.xp,
        level: player.level,
        badges: player.badges || [],
        completed_quests: player.completedQuests || [],
        quests_claimed: player.questsClaimed || [],
        user_places_added: player.userPlacesAdded || 0,
        updated_at: new Date().toISOString(),
        checkin_cooldowns: player.checkinCooldowns || {},
        today_checkins: player.todayCheckins || 0,
        today_date: player.todayDate || null,
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await _supabase
        .from('players')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

    if (error) {
        console.error('Ошибка сохранения профиля:', error);
        return null;
    }
    return data;
}

// ============================================
// ЗАГРУЗКА ПРОФИЛЯ ДРУГОГО ИГРОКА
// ============================================

async function loadPlayerById(playerId) {
    if (!playerId) return null;

    const { data, error } = await _supabase
        .from('players')
        .select('id, name, avatar, level, xp, home_city, current_city, badges')
        .eq('id', playerId)
        .single();

    if (error) {
        console.error('Ошибка загрузки игрока:', error);
        return null;
    }
    return data;
}

async function loadPlayerCheckins(playerId) {
    if (!playerId) return {};

    const { data, error } = await _supabase
        .from('checkins')
        .select('city_key')
        .eq('player_id', playerId);

    if (error) return {};

    const visited = {};
    data.forEach(c => {
        visited[c.city_key] = (visited[c.city_key] || 0) + 1;
    });
    return visited;
}