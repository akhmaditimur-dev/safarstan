// ============ API: ХАШАРЫ ============

// --- Получить список хашаров (с фильтрами) ---
async function loadHashars(filters = {}) {
    let query = _supabase
        .from('hashars')
        .select('*')
        .eq('is_public', true)
        .order('starts_at', { ascending: true });

    if (filters.cityKey) {
        query = query.eq('city_key', filters.cityKey);
    }
    if (filters.category) {
        query = query.eq('category', filters.category);
    }
    if (filters.status) {
        query = query.eq('status', filters.status);
    }
    if (filters.onlyUpcoming) {
        query = query.gte('starts_at', new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) {
        console.warn('Ошибка загрузки хашаров:', error);
        return [];
    }

    return data || [];
}

// --- Получить один хашар со всеми участниками ---
async function loadHasharById(hasharId) {
    const { data: hashar, error: err1 } = await _supabase
        .from('hashars')
        .select('*')
        .eq('id', hasharId)
        .single();

    if (err1 || !hashar) {
        console.warn('Ошибка загрузки хашара:', err1);
        return null;
    }

    const { data: members, error: err2 } = await _supabase
        .from('hashar_members')
        .select('id, player_id, role, status, joined_at')
        .eq('hashar_id', hasharId);

    if (err2) {
        console.warn('Ошибка загрузки участников хашара:', err2);
    }

    const memberIds = (members || []).map(m => m.player_id);
    let players = [];
    if (memberIds.length > 0) {
        const { data: pl } = await _supabase
            .from('players')
            .select('id, name, avatar, level')
            .in('id', memberIds);
        players = pl || [];
    }

    const membersFull = (members || []).map(m => {
        const p = players.find(x => x.id === m.player_id);
        return {
            ...m,
            name: p ? p.name : 'Игрок',
            avatar: p ? p.avatar : '🧑‍💼',
            level: p ? p.level : 1,
        };
    });

    return { ...hashar, members: membersFull };
}

// --- Создать хашар ---
async function createHashar(data) {
    const playerId = await getMyPlayerId();
    if (!playerId) return { error: 'Не авторизован' };

    const { data: hashar, error } = await _supabase
        .from('hashars')
        .insert({
            title: data.title,
            description: data.description || null,
            category: data.category || 'other',
            city_key: data.cityKey,
            address: data.address || null,
            coords: data.coords || null,
            host_id: playerId,
            starts_at: data.startsAt,
            ends_at: data.endsAt || null,
            max_volunteers: data.maxVolunteers || null,
            is_public: true,
            status: 'open',
        })
        .select()
        .single();

    if (error) {
        console.warn('Ошибка создания хашара:', error);
        return { error: error.message };
    }

    // Сразу добавляю себя как host
    await _supabase
        .from('hashar_members')
        .insert({
            hashar_id: hashar.id,
            player_id: playerId,
            role: 'host',
            status: 'joined',
        });

    return { hashar };
}

// --- Присоединиться к хашару ---
async function joinHashar(hasharId) {
    const playerId = await getMyPlayerId();
    if (!playerId) return { error: 'Не авторизован' };

    const { error } = await _supabase
        .from('hashar_members')
        .upsert({
            hashar_id: hasharId,
            player_id: playerId,
            role: 'volunteer',
            status: 'joined',
        }, { onConflict: 'hashar_id,player_id' });

    if (error) {
        console.warn('Ошибка присоединения:', error);
        return { error: error.message };
    }

    return { ok: true };
}

// --- Покинуть хашар ---
async function leaveHashar(hasharId) {
    const playerId = await getMyPlayerId();
    if (!playerId) return { error: 'Не авторизован' };

    const { error } = await _supabase
        .from('hashar_members')
        .delete()
        .eq('hashar_id', hasharId)
        .eq('player_id', playerId);

    if (error) return { error: error.message };
    return { ok: true };
}

// --- Проверить: я участвую в этом хашаре? ---
async function amIInHashar(hasharId) {
    const playerId = await getMyPlayerId();
    if (!playerId) return false;

    const { data, error } = await _supabase
        .from('hashar_members')
        .select('id')
        .eq('hashar_id', hasharId)
        .eq('player_id', playerId)
        .maybeSingle();

    if (error) return false;
    return !!data;
}

// --- Мои хашары (где я участник) ---
async function loadMyHashars() {
    const playerId = await getMyPlayerId();
    if (!playerId) return [];

    const { data: memberships, error: err1 } = await _supabase
        .from('hashar_members')
        .select('hashar_id, role, status')
        .eq('player_id', playerId);

    if (err1 || !memberships || memberships.length === 0) return [];

    const hasharIds = memberships.map(m => m.hashar_id);

    const { data: hashars, error: err2 } = await _supabase
        .from('hashars')
        .select('*')
        .in('id', hasharIds)
        .order('starts_at', { ascending: false });

    if (err2) return [];

    return (hashars || []).map(h => {
        const m = memberships.find(x => x.hashar_id === h.id);
        return { ...h, myRole: m ? m.role : 'volunteer' };
    });
}

// --- Изменить статус хашара (например, закрыть) ---
async function updateHasharStatus(hasharId, newStatus) {
    const { error } = await _supabase
        .from('hashars')
        .update({ status: newStatus })
        .eq('id', hasharId);

    if (error) return { error: error.message };
    return { ok: true };
}

// --- Статистика: сколько открытых хашаров в каждом городе ---
async function loadCityHasharStats() {
    const { data, error } = await _supabase
        .rpc('get_city_hashar_stats');

    if (error) {
        console.warn('Ошибка статистики хашаров:', error);
        return {};
    }

    const map = {};
    (data || []).forEach(row => {
        map[row.city_key] = Number(row.hashars_open);
    });
    return map;
}