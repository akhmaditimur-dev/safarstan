// ============ API: ОТМЕТКИ ДРУЗЕЙ ПРИ ЧЕК-ИНЕ ============

const MAX_CHECKIN_TAGS = 5;

// ============================================
// СОХРАНЕНИЕ ОТМЕТОК
// ============================================
async function saveCheckinTags(checkinId, taggerId, placeKey, taggedIds) {
    if (!checkinId || !taggerId || !placeKey) {
        return { error: 'Не хватает данных' };
    }
    if (!Array.isArray(taggedIds) || taggedIds.length === 0) {
        return { ok: true, saved: 0 };
    }
    if (taggedIds.length > MAX_CHECKIN_TAGS) {
        return { error: `Максимум ${MAX_CHECKIN_TAGS} отметок` };
    }

    // Убираем дубли и себя
    const unique = [...new Set(taggedIds)].filter(id => id && id !== taggerId);
    if (unique.length === 0) return { ok: true, saved: 0 };

    const rows = unique.map(taggedId => ({
        checkin_id: checkinId,
        tagger_id: taggerId,
        tagged_id: taggedId,
        place_key: placeKey,
    }));

    const { error } = await _supabase
        .from('checkin_tags')
        .insert(rows);

    if (error) {
        console.warn('Ошибка сохранения отметок:', error);
        return { error: error.message };
    }
    return { ok: true, saved: unique.length };
}

// ============================================
// ЗАГРУЗКА — мои отметки по месту (для ленты)
// ============================================
// Возвращает массив: [{ tagged_id, tagger_id, checkin_id, created_at, place_key }]
async function loadMyCheckinTags(placeKeys, sinceHours = 24) {
    if (!PLAYER || !PLAYER.playerId) return [];
    if (!placeKeys || placeKeys.length === 0) return [];

    const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();

    const { data, error } = await _supabase
        .from('checkin_tags')
        .select('id, checkin_id, tagger_id, tagged_id, place_key, created_at')
        .in('place_key', placeKeys)
        .gte('created_at', since)
        .or(`tagger_id.eq.${PLAYER.playerId},tagged_id.eq.${PLAYER.playerId}`);

    if (error) {
        console.warn('Ошибка загрузки отметок:', error);
        return [];
    }
    return data || [];
}

// ============================================
// ЗАГРУЗКА — все отметки в конкретном чек-ине
// ============================================
async function loadTagsForCheckin(checkinId) {
    if (!checkinId) return [];

    const { data, error } = await _supabase
        .from('checkin_tags')
        .select(`
            id, tagged_id, created_at,
            tagged:public_players!checkin_tags_tagged_id_fkey (id, name, avatar)
        `)
        .eq('checkin_id', checkinId);

    if (error) {
        console.warn('Ошибка загрузки отметок чек-ина:', error);
        return [];
    }
    return data || [];
}

// ============================================
// ДРУЗЬЯ ДЛЯ ВЫБОРА В МОДАЛКЕ
// ============================================
async function loadFriendsForTagging() {
    if (typeof FRIENDS !== 'undefined' && FRIENDS.length > 0) {
        return FRIENDS;
    }
    if (typeof loadFriends === 'function' && PLAYER?.playerId) {
        return await loadFriends(PLAYER.playerId);
    }
    return [];
}