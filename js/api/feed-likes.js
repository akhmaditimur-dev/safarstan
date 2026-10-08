// ============ API: ЛАЙКИ ЛЕНТЫ ============

// Загрузить лайки для списка feed-id
// Возвращает { feedId: { count: N, myLike: true|false } }
async function loadFeedLikes(feedIds) {
    if (!feedIds || feedIds.length === 0) return {};

    const result = {};
    feedIds.forEach(id => { result[id] = { count: 0, myLike: false }; });

    const { data, error } = await _supabase
        .from('feed_likes')
        .select('feed_id, player_id')
        .in('feed_id', feedIds);

    if (error) {
        console.warn('Ошибка загрузки лайков:', error);
        return result;
    }

    const myId = PLAYER?.playerId;

    (data || []).forEach(like => {
        if (!result[like.feed_id]) {
            result[like.feed_id] = { count: 0, myLike: false };
        }
        result[like.feed_id].count += 1;
        if (like.player_id === myId) {
            result[like.feed_id].myLike = true;
        }
    });

    return result;
}

// Поставить / убрать лайк
async function toggleFeedLike(feedId) {
    if (!PLAYER || !PLAYER.playerId) {
        return { error: 'Не авторизован' };
    }

    // Проверяем, есть ли уже мой лайк
    const { data: existing } = await _supabase
        .from('feed_likes')
        .select('id')
        .eq('feed_id', feedId)
        .eq('player_id', PLAYER.playerId)
        .maybeSingle();

    if (existing) {
        // Удаляем
        const { error } = await _supabase
            .from('feed_likes')
            .delete()
            .eq('id', existing.id);

        if (error) return { error: error.message };
        return { ok: true, liked: false };
    }

    // Ставим
    const { error } = await _supabase
        .from('feed_likes')
        .insert({
            feed_id: feedId,
            player_id: PLAYER.playerId,
        });

    if (error) return { error: error.message };
    return { ok: true, liked: true };
}