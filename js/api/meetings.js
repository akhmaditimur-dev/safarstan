// ============ API: ВСТРЕЧИ (разовые) ============

// Загрузить встречи: свой + друзей + публичные
async function loadMeetings(filter = {}) {
    let query = _supabase
        .from('meetings')
        .select(`
            id, type, creator_id, title, description, date, time, place, address,
            city_key, privacy, data, is_active, created_at,
            creator:creator_id (id, name, avatar, level)
        `)
        .eq('is_active', true)
        .order('date', { ascending: true });

    if (filter.type && filter.type !== 'all') query = query.eq('type', filter.type);
    if (filter.city) query = query.eq('city_key', filter.city);
    if (filter.fromDate) query = query.gte('date', filter.fromDate);

    const { data, error } = await query;
    if (error) {
        console.warn('loadMeetings:', error);
        return [];
    }
    return data || [];
}

// Загрузить одну встречу с участниками
async function loadMeetingById(meetingId) {
    const { data: meeting, error: err1 } = await _supabase
        .from('meetings')
        .select('*, creator:creator_id (id, name, avatar, level)')
        .eq('id', meetingId)
        .single();

    if (err1 || !meeting) return null;

    const { data: members } = await _supabase
        .from('meeting_members')
        .select('id, player_id, role, status')
        .eq('meeting_id', meetingId);

    const memberIds = (members || []).map(m => m.player_id);
    let players = [];
    if (memberIds.length > 0) {
        const { data: pl } = await _supabase
            .from('players')
            .select('id, name, avatar, level')
            .in('id', memberIds);
        players = pl || [];
    }

    // Скрываем список гостей для свадьбы, если не жених/невеста
    const isWedding = meeting.type === 'wedding';
    const brideId = meeting.data?.bride_id;
    const groomId = meeting.data?.groom_id;
    const canSeeGuests = !isWedding || (PLAYER && (PLAYER.playerId === brideId || PLAYER.playerId === groomId));

    const membersFull = canSeeGuests
        ? (members || []).map(m => {
            const p = players.find(x => x.id === m.player_id);
            return {
                ...m,
                name: p?.name || 'Игрок',
                avatar: p?.avatar || '🧑‍💼',
                level: p?.level || 1,
            };
        })
        : [];

    return { ...meeting, members: membersFull, canSeeGuests };
}

// Создать встречу
async function createMeeting(data) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { data: meeting, error } = await _supabase
        .from('meetings')
        .insert({
            type: data.type,
            creator_id: PLAYER.playerId,
            title: data.title,
            description: data.description || null,
            date: data.date,
            time: data.time || null,
            place: data.place || null,
            address: data.address || null,
            city_key: data.cityKey || PLAYER.currentCity,
            privacy: data.privacy || 'friends',
            data: data.data || {},
        })
        .select()
        .single();

    if (error) return { error: error.message };

    // Создатель автоматически участник
    await _supabase
        .from('meeting_members')
        .insert({
            meeting_id: meeting.id,
            player_id: PLAYER.playerId,
            role: 'creator',
            status: 'going',
        });

    return { meeting };
}

// Присоединиться
async function joinMeeting(meetingId) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { error } = await _supabase
        .from('meeting_members')
        .insert({
            meeting_id: meetingId,
            player_id: PLAYER.playerId,
            role: 'guest',
            status: 'going',
        });

    if (error) {
        if (error.message.includes('duplicate')) return { error: 'Уже участвуешь' };
        return { error: error.message };
    }
    return { ok: true };
}

// Покинуть
async function leaveMeeting(meetingId) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { error } = await _supabase
        .from('meeting_members')
        .delete()
        .eq('meeting_id', meetingId)
        .eq('player_id', PLAYER.playerId);

    if (error) return { error: error.message };
    return { ok: true };
}

// Отменить (создатель)
async function cancelMeeting(meetingId) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { error } = await _supabase
        .from('meetings')
        .update({ is_active: false })
        .eq('id', meetingId)
        .eq('creator_id', PLAYER.playerId);

    if (error) return { error: error.message };
    return { ok: true };
}

// Мои встречи (где я участник или создатель)
async function loadMyMeetings() {
    if (!PLAYER || !PLAYER.playerId) return [];

    const { data: memberships } = await _supabase
        .from('meeting_members')
        .select('meeting_id')
        .eq('player_id', PLAYER.playerId);

    const meetingIds = (memberships || []).map(m => m.meeting_id);

    const { data: created } = await _supabase
        .from('meetings')
        .select('id')
        .eq('creator_id', PLAYER.playerId)
        .eq('is_active', true);

    const createdIds = (created || []).map(m => m.id);

    const allIds = [...new Set([...meetingIds, ...createdIds])];
    if (allIds.length === 0) return [];

    const { data: meetings } = await _supabase
        .from('meetings')
        .select(`
            id, type, creator_id, title, date, time, place, city_key, privacy,
            creator:creator_id (id, name, avatar, level)
        `)
        .in('id', allIds)
        .eq('is_active', true)
        .order('date', { ascending: true });

    return meetings || [];
}

// ============================================
// УЧАСТНИКИ ВСТРЕЧ
// ============================================

// Пригласить друга на встречу
async function inviteToMeeting(meetingId, toPlayerId) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { error } = await _supabase
        .from('meeting_invites')
        .insert({
            meeting_id: meetingId,
            from_player: PLAYER.playerId,
            to_player: toPlayerId,
            status: 'pending',
        });

    if (error) {
        if (error.message.includes('duplicate')) return { error: 'Уже приглашён' };
        return { error: error.message };
    }

    // Уведомление
    if (typeof createNotification === 'function') {
        const { data: meeting } = await _supabase
            .from('meetings')
            .select('title')
            .eq('id', meetingId)
            .single();

        await createNotification(
            toPlayerId,
            'meeting_invite',
            { meeting_title: meeting?.title || 'Встреча', meeting_id: meetingId },
            PLAYER.playerId
        );
    }

    return { ok: true };
}

// Принять приглашение
async function acceptMeetingInvite(inviteId) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { data: inv } = await _supabase
        .from('meeting_invites')
        .select('*')
        .eq('id', inviteId)
        .single();

    if (!inv) return { error: 'Приглашение не найдено' };

    const { error: err1 } = await _supabase
        .from('meeting_members')
        .insert({
            meeting_id: inv.meeting_id,
            player_id: PLAYER.playerId,
            role: 'guest',
            status: 'going',
        });

    if (err1 && !err1.message.includes('duplicate')) {
        return { error: err1.message };
    }

    await _supabase
        .from('meeting_invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);

    return { ok: true };
}

// Отклонить приглашение
async function declineMeetingInvite(inviteId) {
    const { error } = await _supabase
        .from('meeting_invites')
        .update({ status: 'declined' })
        .eq('id', inviteId);

    if (error) return { error: error.message };
    return { ok: true };
}

// Мои входящие приглашения на встречи
async function loadMyMeetingInvites() {
    if (!PLAYER || !PLAYER.playerId) return [];

    const { data: invites, error } = await _supabase
        .from('meeting_invites')
        .select('id, meeting_id, from_player, created_at')
        .eq('to_player', PLAYER.playerId)
        .eq('status', 'pending');

    if (error) {
        console.warn('loadMyMeetingInvites:', error);
        return [];
    }
    if (!invites || invites.length === 0) return [];

    const meetingIds = invites.map(i => i.meeting_id);
    const fromIds = invites.map(i => i.from_player);

    const { data: meetings } = await _supabase
        .from('meetings')
        .select('id, title, type, date, time, place, city_key')
        .in('id', meetingIds);

    const { data: players } = await _supabase
        .from('players')
        .select('id, name, avatar')
        .in('id', fromIds);

    return invites.map(inv => {
        const m = (meetings || []).find(x => x.id === inv.meeting_id);
        const f = (players || []).find(x => x.id === inv.from_player);
        return {
            ...inv,
            meetingTitle: m?.title || 'Встреча',
            meetingType: m?.type || 'other',
            meetingDate: m?.date,
            meetingTime: m?.time,
            meetingPlace: m?.place,
            meetingCityKey: m?.city_key,
            fromName: f?.name || 'Игрок',
            fromAvatar: f?.avatar || '🧑‍💼',
        };
    });
}

// Загрузить участников встречи
async function loadMeetingMembers(meetingId) {
    const { data: members, error } = await _supabase
        .from('meeting_members')
        .select('id, player_id, role, status')
        .eq('meeting_id', meetingId);

    if (error) {
        console.warn('loadMeetingMembers:', error);
        return [];
    }
    if (!members || members.length === 0) return [];

    const ids = members.map(m => m.player_id);
    const { data: players } = await _supabase
        .from('players')
        .select('id, name, avatar, level')
        .in('id', ids);

    return members.map(m => {
        const p = (players || []).find(x => x.id === m.player_id);
        return {
            ...m,
            name: p?.name || 'Игрок',
            avatar: p?.avatar || '🧑‍💼',
            level: p?.level || 1,
        };
    });
}

// Изменить RSVP
async function updateMeetingRsvp(meetingId, status) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { error } = await _supabase
        .from('meeting_members')
        .update({ status })
        .eq('meeting_id', meetingId)
        .eq('player_id', PLAYER.playerId);

    if (error) return { error: error.message };
    return { ok: true };
}