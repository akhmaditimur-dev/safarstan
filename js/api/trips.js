// ============ API: ПОПУТЧИКИ ============

// Загрузить поездки (по городу отправления)
async function loadTrips(cityFrom = null, days = 30) {
    const now = new Date().toISOString();
    const until = new Date();
    until.setDate(until.getDate() + days);

    let query = _supabase
        .from('trips')
        .select(`
            id, driver_id, city_from, city_to, depart_at, transport,
            seats_total, seats_taken, price, contact, description, created_at,
            driver:driver_id (id, name, avatar, level)
        `)
        .eq('is_active', true)
        .gte('depart_at', now)
        .lte('depart_at', until.toISOString())
        .order('depart_at', { ascending: true });

    if (cityFrom) query = query.eq('city_from', cityFrom);

    const { data, error } = await query;
    if (error) {
        console.warn('loadTrips error:', error);
        return [];
    }
    return data || [];
}

// Присоединиться к поездке
async function joinTrip(tripId) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { data: trip } = await _supabase
        .from('trips')
        .select('id, seats_total, seats_taken, driver_id')
        .eq('id', tripId)
        .single();

    if (!trip) return { error: 'Поездка не найдена' };
    if (trip.seats_taken >= trip.seats_total) return { error: 'Мест нет' };

    const { error: err1 } = await _supabase
        .from('trip_passengers')
        .insert({ trip_id: tripId, player_id: PLAYER.playerId });

    if (err1) {
        if (err1.message.includes('duplicate')) return { error: 'Ты уже в этой поездке' };
        return { error: err1.message };
    }

    await _supabase
        .from('trips')
        .update({ seats_taken: trip.seats_taken + 1 })
        .eq('id', tripId);

    // Уведомление водителю
    if (typeof createNotification === 'function' && trip.driver_id !== PLAYER.playerId) {
        await createNotification(trip.driver_id, 'trip_joined', { trip_id: tripId }, PLAYER.playerId);
    }

    // Добавить в план
    if (typeof savePlan === 'function') {
        const fullTrip = await getTripById(tripId);
        if (fullTrip) {
            await savePlan(PLAYER.playerId, {
                cityKey: fullTrip.city_to,
                placeTitle: `Поездка в ${CITIES[fullTrip.city_to]?.name || fullTrip.city_to}`,
                visitDate: fullTrip.depart_at.slice(0, 10),
                note: 'Попутчик',
            });
            if (typeof renderCalendar === 'function') renderCalendar();
        }
    }

    return { ok: true };
}

// Отписаться от поездки
async function leaveTrip(tripId) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { data: trip } = await _supabase
        .from('trips')
        .select('seats_taken')
        .eq('id', tripId)
        .single();

    const { error } = await _supabase
        .from('trip_passengers')
        .delete()
        .eq('trip_id', tripId)
        .eq('player_id', PLAYER.playerId);

    if (error) return { error: error.message };

    if (trip) {
        await _supabase
            .from('trips')
            .update({ seats_taken: Math.max(0, trip.seats_taken - 1) })
            .eq('id', tripId);
    }

    return { ok: true };
}

// Отменить поездку (водитель)
async function cancelTrip(tripId) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { error } = await _supabase
        .from('trips')
        .update({ is_active: false })
        .eq('id', tripId)
        .eq('driver_id', PLAYER.playerId);

    if (error) return { error: error.message };
    return { ok: true };
}

// Создать поездку
async function createTrip(data) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { data: trip, error } = await _supabase
        .from('trips')
        .insert({
            driver_id: PLAYER.playerId,
            city_from: data.cityFrom,
            city_to: data.cityTo,
            depart_at: data.departAt,
            transport: data.transport || 'car',
            seats_total: data.seatsTotal || 1,
            seats_taken: 1,  // водитель уже занимает место
            price: data.price || null,
            contact: data.contact || null,
            description: data.description || null,
        })
        .select()
        .single();

    if (error) return { error: error.message };

    // Автоматически в план
    if (typeof savePlan === 'function') {
        await savePlan(PLAYER.playerId, {
            cityKey: data.cityTo,
            placeTitle: `Поездка в ${CITIES[data.cityTo]?.name || data.cityTo}`,
            visitDate: data.departAt.slice(0, 10),
            note: 'Моя поездка',
        });
        if (typeof renderCalendar === 'function') renderCalendar();
    }

    // В ленту
    if (typeof saveFeedEvent === 'function') {
        await saveFeedEvent(PLAYER.playerId, 'trip', {
            from: CITIES[data.cityFrom]?.name || data.cityFrom,
            to: CITIES[data.cityTo]?.name || data.cityTo,
        }, data.cityFrom);
    }

    return { trip };
}

// Одна поездка с участниками
async function getTripById(tripId) {
    const { data: trip } = await _supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
    if (!trip) return null;

    const { data: passengers } = await _supabase
        .from('trip_passengers')
        .select('player_id, players:player_id (id, name, avatar)')
        .eq('trip_id', tripId);

    return { ...trip, passengers: passengers || [] };
}

// Кто уже записан (для отображения кнопки)
async function loadMyTripIds() {
    if (!PLAYER || !PLAYER.playerId) return [];
    const { data } = await _supabase
        .from('trip_passengers')
        .select('trip_id')
        .eq('player_id', PLAYER.playerId);
    return (data || []).map(r => r.trip_id);
}