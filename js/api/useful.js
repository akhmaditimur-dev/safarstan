// ============ API: ПОЛЕЗНОЕ РЯДОМ ============

// Загрузить полезные места для города
// Логика: сначала от друзей, потом платные, потом админские
async function loadUsefulPlaces(cityKey, limit = 5) {
    if (!cityKey) return [];

    const friendIds = (typeof FRIENDS !== 'undefined' ? FRIENDS : [])
        .map(f => f && f.id)
        .filter(id => typeof id === 'string' && id.length > 0);

    const nowIso = new Date().toISOString();

    // Забираем всё активное в городе
    const { data, error } = await _supabase
        .from('useful_places')
        .select(`
            id, city_key, title, description, category, address, phone, link,
            photo_url, source_type, added_by, visible_to, is_paid, paid_until, created_at,
            author:added_by (id, name, avatar)
        `)
        .eq('city_key', cityKey)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('loadUsefulPlaces error:', error);
        return [];
    }

    const rows = data || [];

    // Фильтрация по видимости:
    // - visible_to='city' → всем
    // - visible_to='friends' → только друзьям (или самому себе)
    const myId = PLAYER ? PLAYER.playerId : null;

    const visible = rows.filter(r => {
        if (r.visible_to === 'city') return true;
        if (r.visible_to === 'friends') {
            if (r.added_by === myId) return true;
            return friendIds.includes(r.added_by);
        }
        return false;
    });

    // Платные активны только до paid_until
    const active = visible.filter(r => {
        if (!r.is_paid) return true;
        if (!r.paid_until) return true;
        return new Date(r.paid_until) > new Date(nowIso);
    });

    // Сортировка: друзья → платные → админ → остальное
    const weight = (r) => {
        if (r.source_type === 'friend') return 1;
        if (r.is_paid) return 2;
        if (r.source_type === 'admin') return 3;
        return 4;
    };

    active.sort((a, b) => {
        const wa = weight(a), wb = weight(b);
        if (wa !== wb) return wa - wb;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    return active.slice(0, limit);
}

// Добавить полезное место (только друг)
async function addUsefulPlace({ cityKey, title, description, category, address, phone, link, photoUrl }) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { data, error } = await _supabase
        .from('useful_places')
        .insert({
            city_key: cityKey,
            title,
            description: description || null,
            category: category || 'other',
            address: address || null,
            phone: phone || null,
            link: link || null,
            photo_url: photoUrl || null,
            source_type: 'friend',
            added_by: PLAYER.playerId,
            visible_to: 'friends',
            is_active: true,
            is_paid: false,
        })
        .select()
        .single();

    if (error) {
        console.error('addUsefulPlace error:', error);
        return { error: error.message };
    }
    return { data };
}

// Удалить своё полезное место
async function deleteUsefulPlace(id) {
    const { error } = await _supabase
        .from('useful_places')
        .delete()
        .eq('id', id)
        .eq('added_by', PLAYER.playerId);

    if (error) {
        console.error('deleteUsefulPlace error:', error);
        return { error: error.message };
    }
    return { ok: true };
}