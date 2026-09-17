// ============ API: ГАПЫ ============

// --- Получить мои гапы (где я участник) ---
async function loadMyGaps() {
    const playerId = await getMyPlayerId();
    if (!playerId) return [];

    // Сначала найдём, в каких гапах я состою
    const { data: memberships, error: err1 } = await _supabase
        .from('gap_members')
        .select('gap_id, role, status')
        .eq('player_id', playerId)
        .eq('status', 'active');

    if (err1) {
        console.warn('Ошибка загрузки участий в гапах:', err1);
        return [];
    }

    if (!memberships || memberships.length === 0) return [];

    const gapIds = memberships.map(m => m.gap_id);

    // Теперь загрузим сами гапы
    const { data: gaps, error: err2 } = await _supabase
        .from('gaps')
        .select('*')
        .in('id', gapIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (err2) {
        console.warn('Ошибка загрузки гапов:', err2);
        return [];
    }

    // Приклеим роль каждого
    const withRole = (gaps || []).map(g => {
        const m = memberships.find(x => x.gap_id === g.id);
        return { ...g, myRole: m ? m.role : 'member' };
    });

    return withRole;
}

// --- Получить один гап со всеми участниками ---
async function loadGapById(gapId) {
    const { data: gap, error: err1 } = await _supabase
        .from('gaps')
        .select('*')
        .eq('id', gapId)
        .single();

    if (err1 || !gap) {
        console.warn('Ошибка загрузки гапа:', err1);
        return null;
    }

    const { data: members, error: err2 } = await _supabase
        .from('gap_members')
        .select('id, player_id, role, status, joined_at')
        .eq('gap_id', gapId)
        .eq('status', 'active');

    if (err2) {
        console.warn('Ошибка загрузки участников:', err2);
    }

    // Загрузим имена участников
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

    return { ...gap, members: membersFull };
}

// --- Создать гап ---
async function createGap(data) {
    const playerId = await getMyPlayerId();
    if (!playerId) return { error: 'Не авторизован' };

    const { data: gap, error } = await _supabase
        .from('gaps')
        .insert({
            name: data.name,
            description: data.description || null,
            city_key: data.cityKey,
            host_id: playerId,
            schedule: data.schedule || null,
            meet_point: data.meetPoint || null,
            coords: data.coords || null,
            avatar_emoji: data.avatarEmoji || '☕',
        })
        .select()
        .single();

    if (error) {
        console.warn('Ошибка создания гапа:', error);
        return { error: error.message };
    }

    // Сразу добавлю себя как host
    await _supabase
        .from('gap_members')
        .insert({
            gap_id: gap.id,
            player_id: playerId,
            role: 'host',
            status: 'active',
        });

    return { gap };
}

// --- Пригласить игрока в гап ---
async function inviteToGap(gapId, toPlayerId) {
    const playerId = await getMyPlayerId();
    if (!playerId) return { error: 'Не авторизован' };

    // Проверим, не состоит ли уже
    const { data: existing } = await _supabase
        .from('gap_members')
        .select('id, status')
        .eq('gap_id', gapId)
        .eq('player_id', toPlayerId)
        .maybeSingle();

    if (existing && existing.status === 'active') {
        return { error: 'Этот игрок уже в гапе' };
    }

    const { error } = await _supabase
        .from('gap_invites')
        .upsert({
            gap_id: gapId,
            from_player: playerId,
            to_player: toPlayerId,
            status: 'pending',
        }, { onConflict: 'gap_id,to_player' });

    if (error) {
        console.warn('Ошибка приглашения:', error);
        return { error: error.message };
    }

    return { ok: true };
}

// --- Мои входящие приглашения ---
async function loadMyGapInvites() {
    const playerId = await getMyPlayerId();
    if (!playerId) return [];

    const { data: invites, error } = await _supabase
        .from('gap_invites')
        .select('id, gap_id, from_player, created_at, expires_at')
        .eq('to_player', playerId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

    if (error) {
        console.warn('Ошибка загрузки приглашений:', error);
        return [];
    }

    if (!invites || invites.length === 0) return [];

    // Загрузим инфу о гапах и пригласивших
    const gapIds = invites.map(i => i.gap_id);
    const fromIds = invites.map(i => i.from_player);

    const { data: gaps } = await _supabase
        .from('gaps')
        .select('id, name, avatar_emoji, city_key')
        .in('id', gapIds);

    const { data: players } = await _supabase
        .from('players')
        .select('id, name, avatar')
        .in('id', fromIds);

    return invites.map(inv => {
        const gap = (gaps || []).find(g => g.id === inv.gap_id);
        const from = (players || []).find(p => p.id === inv.from_player);
        return {
            ...inv,
            gapName: gap ? gap.name : 'Гап',
            gapEmoji: gap ? gap.avatar_emoji : '☕',
            fromName: from ? from.name : 'Игрок',
            fromAvatar: from ? from.avatar : '🧑‍💼',
        };
    });
}

// --- Принять приглашение ---
async function acceptGapInvite(inviteId) {
    const playerId = await getMyPlayerId();
    if (!playerId) return { error: 'Не авторизован' };

    const { data: inv, error: err1 } = await _supabase
        .from('gap_invites')
        .select('*')
        .eq('id', inviteId)
        .single();

    if (err1 || !inv) return { error: 'Приглашение не найдено' };

    // Добавим себя в участники
    const { error: err2 } = await _supabase
        .from('gap_members')
        .upsert({
            gap_id: inv.gap_id,
            player_id: playerId,
            role: 'member',
            status: 'active',
            invited_by: inv.from_player,
        }, { onConflict: 'gap_id,player_id' });

    if (err2) return { error: err2.message };

    // Обновим статус приглашения
    await _supabase
        .from('gap_invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);

    return { ok: true };
}

// --- Отклонить приглашение ---
async function declineGapInvite(inviteId) {
    const { error } = await _supabase
        .from('gap_invites')
        .update({ status: 'declined' })
        .eq('id', inviteId);

    if (error) return { error: error.message };
    return { ok: true };
}

// --- Выйти из гапа ---
async function leaveGap(gapId) {
    const playerId = await getMyPlayerId();
    if (!playerId) return { error: 'Не авторизован' };

    const { error } = await _supabase
        .from('gap_members')
        .update({ status: 'left' })
        .eq('gap_id', gapId)
        .eq('player_id', playerId);

    if (error) return { error: error.message };
    return { ok: true };
}

// --- Получить статистику: сколько гапов в каждом городе ---
async function loadCityGapStats() {
    const { data, error } = await _supabase
        .rpc('get_city_gap_stats');

    if (error) {
        console.warn('Ошибка статистики гапов:', error);
        return {};
    }

    const map = {};
    (data || []).forEach(row => {
        map[row.city_key] = Number(row.gaps_count);
    });
    return map;
}

// --- Хелпер: получить ID игрока из таблицы players ---
async function getMyPlayerId() {
    // Если PLAYER уже загружен — берём оттуда
    if (typeof PLAYER !== 'undefined' && PLAYER && PLAYER.playerId) {
        return PLAYER.playerId;
    }

    // Иначе спросим у базы
    const { data, error } = await _supabase
        .rpc('get_my_player_id');

    if (error || !data) return null;
    return data;
}