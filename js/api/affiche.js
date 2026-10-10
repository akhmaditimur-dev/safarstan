// ============ API: АФИША ============

// Загрузить активные события города на ближайшие N дней
async function loadAfficheEvents(cityKey = null, days = 90) {
    const today = new Date();
    const from = today.toISOString().slice(0, 10);

    const until = new Date();
    until.setDate(until.getDate() + days);
    const to = until.toISOString().slice(0, 10);

    let query = _supabase
        .from('affiche_events')
        .select('*')
        .eq('is_active', true)
        .gte('date_start', from)
        .lte('date_start', to)
        .order('date_start', { ascending: true });

    if (cityKey) {
        query = query.eq('city_key', cityKey);
    }

    const { data, error } = await query;

    if (error) {
        console.warn('loadAfficheEvents error:', error);
        return [];
    }
    return data || [];
}

// Загрузить счётчики «Пойду» для набора событий
async function loadAfficheAttendees(eventIds) {
    if (!eventIds || eventIds.length === 0) return {};

    const { data, error } = await _supabase
        .from('affiche_attendees')
        .select('event_id, player_id')
        .in('event_id', eventIds);

    if (error) {
        console.warn('loadAfficheAttendees error:', error);
        return {};
    }

    const result = {};
    (data || []).forEach(row => {
        if (!result[row.event_id]) {
            result[row.event_id] = { count: 0, players: [] };
        }
        result[row.event_id].count += 1;
        result[row.event_id].players.push(row.player_id);
    });
    return result;
}

// Переключить «Пойду» / не иду
async function toggleAfficheAttend(eventId) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    // Проверяем, есть ли уже
    const { data: existing } = await _supabase
        .from('affiche_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('player_id', PLAYER.playerId)
        .maybeSingle();

    if (existing) {
        // Удаляем
        const { error } = await _supabase
            .from('affiche_attendees')
            .delete()
            .eq('id', existing.id);
        if (error) return { error: error.message };
        return { going: false };
    } else {
        // Добавляем
        const { error } = await _supabase
            .from('affiche_attendees')
            .insert({
                event_id: eventId,
                player_id: PLAYER.playerId,
            });
        if (error) return { error: error.message };
        return { going: true };
    }
}

// Дефолтная картинка-заглушка (SVG data-uri)
function getDefaultAffichePhoto() {
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='240' viewBox='0 0 400 240'><rect width='400' height='240' fill='%23dcfce7'/><g fill='none' stroke='%23166534' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' opacity='0.55'><rect x='150' y='80' width='100' height='90' rx='8'/><path d='M150 105 h100'/><path d='M170 80 v-15 M230 80 v-15'/><circle cx='180' cy='135' r='6'/><circle cx='220' cy='135' r='6'/></g><text x='200' y='205' font-family='Arial, sans-serif' font-size='14' fill='%23166534' text-anchor='middle' opacity='0.6'>Афиша</text></svg>";
}