// ============ API: УВЕДОМЛЕНИЯ ============

async function createNotification(userId, type, payload = {}, fromPlayerId = null) {
    const { error } = await _supabase
        .from('notifications')
        .insert({
            user_id: userId,
            from_player_id: fromPlayerId,
            type,
            payload,
        });

    if (error) {
        console.warn('Ошибка создания уведомления:', error);
        return { error: error.message };
    }
    return { ok: true };
}

async function loadMyNotifications(playerId, limit = 50) {
    const { data, error } = await _supabase
        .from('notifications')
        .select(`
            id, type, payload, is_read, created_at, from_player_id,
            from_player:players!notifications_from_player_id_fkey (
                id, name, avatar
            )
        `)
        .eq('user_id', playerId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.warn('Ошибка загрузки уведомлений:', error);
        return [];
    }
    return data || [];
}

async function getUnreadCount(playerId) {
    const { count, error } = await _supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', playerId)
        .eq('is_read', false);

    if (error) {
        console.warn('Ошибка счётчика:', error);
        return 0;
    }
    return count || 0;
}

async function markNotificationRead(notificationId) {
    const { error } = await _supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) return { error: error.message };
    return { ok: true };
}

async function markAllNotificationsRead(playerId) {
    const { error } = await _supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', playerId)
        .eq('is_read', false);

    if (error) return { error: error.message };
    return { ok: true };
}

async function deleteNotification(notificationId) {
    const { error } = await _supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

    if (error) return { error: error.message };
    return { ok: true };
}