// ============ API: КРУГИ (постоянные составы) ============

// Загрузить круги, в которых я состою
async function loadMyCircles() {
    if (!PLAYER || !PLAYER.playerId) return [];

    const { data: memberships, error: err1 } = await _supabase
        .from('circle_members')
        .select('circle_id, role, status')
        .eq('player_id', PLAYER.playerId)
        .eq('status', 'active');

    if (err1) {
        console.warn('loadMyCircles err1:', err1);
        return [];
    }
    if (!memberships || memberships.length === 0) return [];

    const ids = memberships.map(m => m.circle_id);

    const { data: circles, error: err2 } = await _supabase
        .from('circles')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false });

    if (err2) {
        console.warn('loadMyCircles err2:', err2);
        return [];
    }

    return (circles || []).map(c => {
        const m = memberships.find(x => x.circle_id === c.id);
        return { ...c, myRole: m ? m.role : 'member' };
    });
}

// Загрузить один круг с участниками и последними встречами
async function loadCircleById(circleId) {
    const { data: circle, error: err1 } = await _supabase
        .from('circles')
        .select('*')
        .eq('id', circleId)
        .single();

    if (err1 || !circle) return null;

    const { data: members } = await _supabase
        .from('circle_members')
        .select('id, player_id, role, status, joined_at')
        .eq('circle_id', circleId)
        .eq('status', 'active');

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
            name: p?.name || 'Игрок',
            avatar: p?.avatar || '🧑‍💼',
            level: p?.level || 1,
        };
    });

    const { data: meetings } = await _supabase
        .from('circle_meetings')
        .select('*')
        .eq('circle_id', circleId)
        .order('date', { ascending: false })
        .limit(10);

    return { ...circle, members: membersFull, meetings: meetings || [] };
}

// Создать круг
async function createCircle(data) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { data: circle, error } = await _supabase
        .from('circles')
        .insert({
            type: data.type || 'gap',
            name: data.name,
            description: data.description || null,
            city_key: data.cityKey || null,
            admin_id: PLAYER.playerId,
            schedule: data.schedule || null,
            avatar_emoji: data.avatarEmoji || '☕',
        })
        .select()
        .single();

    if (error) return { error: error.message };

    await _supabase
        .from('circle_members')
        .insert({
            circle_id: circle.id,
            player_id: PLAYER.playerId,
            role: 'admin',
            status: 'active',
        });

    return { circle };
}

// Пригласить в круг (ждёт одобрения админа)
async function inviteToCircle(circleId, toPlayerId) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { error } = await _supabase
        .from('circle_invites')
        .insert({
            circle_id: circleId,
            from_player: PLAYER.playerId,
            to_player: toPlayerId,
            status: 'pending',
        });

    if (error) {
        if (error.message.includes('duplicate')) return { error: 'Уже приглашён' };
        return { error: error.message };
    }

    // Уведомление админу (если приглашает не админ)
    const { data: circle } = await _supabase
        .from('circles')
        .select('admin_id, name')
        .eq('id', circleId)
        .single();

    if (circle && circle.admin_id !== PLAYER.playerId) {
        if (typeof createNotification === 'function') {
            await createNotification(
                circle.admin_id,
                'circle_invite_pending',
                { circle_title: circle.name, circle_id: circleId },
                PLAYER.playerId
            );
        }
    }

    return { ok: true };
}

// Одобрить приглашение (админ)
async function approveCircleInvite(inviteId) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { data: inv } = await _supabase
        .from('circle_invites')
        .select('*')
        .eq('id', inviteId)
        .single();

    if (!inv) return { error: 'Приглашение не найдено' };

    // Добавляем в участники
    const { error: err1 } = await _supabase
        .from('circle_members')
        .insert({
            circle_id: inv.circle_id,
            player_id: inv.to_player,
            role: 'member',
            status: 'active',
        });

    if (err1 && !err1.message.includes('duplicate')) {
        return { error: err1.message };
    }

    await _supabase
        .from('circle_invites')
        .update({ status: 'approved', approved_by: PLAYER.playerId })
        .eq('id', inviteId);

    if (typeof createNotification === 'function') {
        await createNotification(inv.to_player, 'circle_invite_approved', {}, PLAYER.playerId);
    }

    return { ok: true };
}

// Отклонить приглашение
async function declineCircleInvite(inviteId) {
    const { error } = await _supabase
        .from('circle_invites')
        .update({ status: 'declined' })
        .eq('id', inviteId);

    if (error) return { error: error.message };
    return { ok: true };
}

// Выйти из круга
async function leaveCircle(circleId) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { error } = await _supabase
        .from('circle_members')
        .update({ status: 'left' })
        .eq('circle_id', circleId)
        .eq('player_id', PLAYER.playerId);

    if (error) return { error: error.message };
    return { ok: true };
}

// Создать встречу внутри круга
async function createCircleMeeting(data) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { data: meeting, error } = await _supabase
        .from('circle_meetings')
        .insert({
            circle_id: data.circleId,
            organizer_id: data.organizerId || PLAYER.playerId,
            date: data.date,
            time: data.time || null,
            place: data.place || null,
            address: data.address || null,
            comment: data.comment || null,
            status: 'planned',
        })
        .select()
        .single();

    if (error) return { error: error.message };
    return { meeting };
}

// Мои входящие приглашения в круги
async function loadMyCircleInvites() {
    if (!PLAYER || !PLAYER.playerId) return [];

    const { data: invites, error } = await _supabase
        .from('circle_invites')
        .select('id, circle_id, from_player, created_at')
        .eq('to_player', PLAYER.playerId)
        .eq('status', 'pending');

    if (error) {
        console.warn('loadMyCircleInvites:', error);
        return [];
    }
    if (!invites || invites.length === 0) return [];

    const circleIds = invites.map(i => i.circle_id);
    const fromIds = invites.map(i => i.from_player);

    const { data: circles } = await _supabase
        .from('circles')
        .select('id, name, avatar_emoji, city_key')
        .in('id', circleIds);

    const { data: players } = await _supabase
        .from('players')
        .select('id, name, avatar')
        .in('id', fromIds);

    return invites.map(inv => {
        const c = (circles || []).find(x => x.id === inv.circle_id);
        const f = (players || []).find(x => x.id === inv.from_player);
        return {
            ...inv,
            circleName: c?.name || 'Круг',
            circleEmoji: c?.avatar_emoji || '☕',
            fromName: f?.name || 'Игрок',
            fromAvatar: f?.avatar || '🧑‍💼',
        };
    });
}