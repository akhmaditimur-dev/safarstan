// ============ API: ДРУЗЬЯ ============

// Поиск игроков по имени или email
async function searchPlayers(query, currentPlayerId) {
    if (!query || query.length < 2) return [];

    const q = query.trim().toLowerCase();
    const { data, error } = await _supabase
        .from('players')
        .select('id, name, avatar, home_city, current_city, level, email')
        .neq('id', currentPlayerId)
        .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(10);

    if (error) {
        console.error('Ошибка поиска:', error);
        return [];
    }
    return data || [];
}

// Отправить заявку в друзья
async function sendFriendRequest(fromId, toId) {
    const { error } = await _supabase
        .from('friend_requests')
        .insert({ from_player_id: fromId, to_player_id: toId });

    if (error) {
        console.error('Ошибка отправки заявки:', error);
        return false;
    }
    return true;
}

// Загрузить входящие заявки
async function loadIncomingRequests(playerId) {
    const { data, error } = await _supabase
        .from('friend_requests')
        .select(`
            id,
            from_player_id,
            created_at,
            from_player:from_player_id (id, name, avatar, home_city, current_city, level)
        `)
        .eq('to_player_id', playerId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Ошибка загрузки заявок:', error);
        return [];
    }
    return data || [];
}

// Загрузить исходящие заявки
async function loadOutgoingRequests(playerId) {
    const { data, error } = await _supabase
        .from('friend_requests')
        .select('id, to_player_id, status, created_at')
        .eq('from_player_id', playerId);

    if (error) return [];
    return data || [];
}

// Принять заявку
async function acceptFriendRequest(requestId, fromId, toId) {
    const [a, b] = [fromId, toId].sort();
    const { error: err1 } = await _supabase
        .from('friends')
        .insert({ player_a: a, player_b: b });

    if (err1) {
        console.error('Ошибка создания дружбы:', err1);
        return false;
    }

    const { error: err2 } = await _supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

    if (err2) console.error('Ошибка обновления заявки:', err2);
    return true;
}

// Отклонить заявку
async function declineFriendRequest(requestId) {
    const { error } = await _supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

    if (error) console.error('Ошибка отклонения:', error);
}

// Загрузить список друзей
async function loadFriends(playerId) {
    const { data, error } = await _supabase
        .from('friends')
        .select(`
            id,
            player_a,
            player_b,
            a_player:player_a (id, name, avatar, home_city, current_city, level),
            b_player:player_b (id, name, avatar, home_city, current_city, level)
        `)
        .or(`player_a.eq.${playerId},player_b.eq.${playerId}`);

    if (error) {
        console.error('Ошибка загрузки друзей:', error);
        return [];
    }

    return (data || []).map(row => {
        const friend = row.player_a === playerId ? row.b_player : row.a_player;
        return {
            friendsRowId: row.id,
            ...friend,
        };
    });
}

// Удалить друга
async function removeFriend(friendsRowId) {
    const { error } = await _supabase
        .from('friends')
        .delete()
        .eq('id', friendsRowId);

    if (error) console.error('Ошибка удаления друга:', error);
}