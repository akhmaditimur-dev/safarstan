// ============ API: ДРУЗЬЯ ============

// ============================================
// ПОИСК ИГРОКОВ
// ============================================
async function searchPlayers(query, currentPlayerId) {
    if (!query || query.length < 2) return [];

    const q = query.trim().toLowerCase();
    const { data, error } = await _supabase
        .from('public_players')
        .select('id, name, avatar, home_city, current_city, level, username, last_seen_at')
        .neq('id', currentPlayerId)
        .or(`name.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(10);

    if (error) {
        console.error('Ошибка поиска:', error);
        return [];
    }
    return data || [];
}

// ============================================
// ЗАЯВКИ В ДРУЗЬЯ
// ============================================
async function sendFriendRequest(fromId, toId) {
    const { error } = await _supabase
        .from('friend_requests')
        .insert({ from_player_id: fromId, to_player_id: toId });

    if (error) {
        console.error('Ошибка отправки заявки:', error);
        return false;
    }

    if (typeof createNotification === 'function') {
        await createNotification(toId, 'friend_request', {}, fromId);
    }
    return true;
}

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

async function loadOutgoingRequests(playerId) {
    const { data, error } = await _supabase
        .from('friend_requests')
        .select('id, to_player_id, status, created_at')
        .eq('from_player_id', playerId);

    if (error) return [];
    return data || [];
}

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

    if (typeof createNotification === 'function') {
        await createNotification(fromId, 'friend_accepted', {}, toId);
    }
    return true;
}

async function declineFriendRequest(requestId) {
    const { error } = await _supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

    if (error) console.error('Ошибка отклонения:', error);
}

async function cancelFriendRequest(fromId, toId) {
    const { error } = await _supabase
        .from('friend_requests')
        .delete()
        .eq('from_player_id', fromId)
        .eq('to_player_id', toId)
        .eq('status', 'pending');

    if (error) {
        console.error('Ошибка отмены заявки:', error);
        return { error: error.message };
    }
    return { ok: true };
}

// ============================================
// СПИСОК ДРУЗЕЙ
// ============================================
async function loadFriends(playerId) {
    // 1. Строки дружбы
    const { data: rows, error: rowsError } = await _supabase
        .from('friends')
        .select('id, player_a, player_b')
        .or(`player_a.eq.${playerId},player_b.eq.${playerId}`);

    if (rowsError) {
        console.error('Ошибка загрузки друзей:', rowsError);
        return [];
    }
    if (!rows || rows.length === 0) return [];

    // 2. ID друзей
    const friendIds = rows.map(r =>
        r.player_a === playerId ? r.player_b : r.player_a
    );

    // 3. Профили из public_players (RLS открыт)
    const { data: players, error: playersError } = await _supabase
        .from('public_players')
        .select('id, name, avatar, home_city, current_city, level, last_seen_at, username')
        .in('id', friendIds);

    if (playersError) {
        console.error('Ошибка загрузки профилей друзей:', playersError);
        return [];
    }

    const byId = {};
    (players || []).forEach(p => { byId[p.id] = p; });

    // 4. Собираем
    return rows.map(r => {
        const fid = r.player_a === playerId ? r.player_b : r.player_a;
        const p = byId[fid] || {};
        return {
            friendsRowId: r.id,
            id: fid,
            name: p.name || 'Игрок',
            avatar: p.avatar || '🧑‍💼',
            home_city: p.home_city || null,
            current_city: p.current_city || null,
            level: p.level || 1,
            username: p.username || null,
            last_seen_at: p.last_seen_at || null,
        };
    });
}

async function removeFriend(friendsRowId) {
    const { error } = await _supabase
        .from('friends')
        .delete()
        .eq('id', friendsRowId);

    if (error) console.error('Ошибка удаления друга:', error);
}

// Количество моих друзей (для статистики профиля)
async function countMyFriends(playerId) {
    if (!playerId) return null;
    const { count, error } = await _supabase
        .from('friends')
        .select('id', { count: 'exact', head: true })
        .or(`player_a.eq.${playerId},player_b.eq.${playerId}`);

    if (error) {
        console.warn('countMyFriends error:', error);
        return null;
    }
    return count || 0;
}