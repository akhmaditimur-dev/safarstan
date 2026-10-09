// ============ API: КАЛЕНДАРЬ ============

async function loadMyCalendarEvents(year, month) {
    if (!PLAYER || !PLAYER.playerId) return [];

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    const startDate = monthStart.toISOString().slice(0, 10);
    const endDate = monthEnd.toISOString().slice(0, 10);
    const startIso = monthStart.toISOString();
    const endIso = monthEnd.toISOString();

    const events = [];

    // === 1. ПЛАНЫ ===
    try {
        const { data: plans } = await _supabase
            .from('plans')
            .select('id, city_key, place_title, visit_date, note')
            .eq('player_id', PLAYER.playerId)
            .eq('is_deleted', false)
            .gte('visit_date', startDate)
            .lte('visit_date', endDate);

        (plans || []).forEach(p => {
            events.push({
                type: 'plan',
                date: p.visit_date,
                title: p.place_title || CITIES[p.city_key]?.name || 'Визит',
                sub: CITIES[p.city_key]?.name || '',
                id: p.id,
            });
        });
    } catch (e) {
        console.warn('Ошибка планов:', e);
    }

    // === 2. ХАШАРЫ ===
    try {
        const { data: memberships } = await _supabase
            .from('hashar_members')
            .select('hashar_id')
            .eq('player_id', PLAYER.playerId)
            .eq('status', 'joined');

        if (memberships && memberships.length > 0) {
            const hasharIds = memberships.map(m => m.hashar_id);

            const { data: hashars } = await _supabase
                .from('hashars')
                .select('id, title, starts_at, address, city_key')
                .in('id', hasharIds)
                .gte('starts_at', startIso)
                .lte('starts_at', endIso);

            (hashars || []).forEach(h => {
                events.push({
                    type: 'hashar',
                    date: h.starts_at.slice(0, 10),
                    title: h.title,
                    sub: h.address || CITIES[h.city_key]?.name || '',
                    id: h.id,
                });
            });
        }
    } catch (e) {
        console.warn('Ошибка хашаров:', e);
    }

    // === 3. ГАПЫ ===
    try {
        const { data: memberships } = await _supabase
            .from('gap_members')
            .select('gap_id')
            .eq('player_id', PLAYER.playerId)
            .eq('status', 'active');

        if (memberships && memberships.length > 0) {
            const gapIds = memberships.map(m => m.gap_id);

            const { data: gaps } = await _supabase
                .from('gaps')
                .select('id, name, city_key, schedule, meet_point')
                .in('id', gapIds)
                .eq('is_active', true);

            (gaps || []).forEach(gap => {
                const dates = expandGapScheduleToDates(gap.schedule, monthStart, monthEnd);
                dates.forEach(dateStr => {
                    events.push({
                        type: 'gap',
                        date: dateStr,
                        title: gap.name,
                        sub: gap.meet_point || CITIES[gap.city_key]?.name || '',
                        id: gap.id,
                    });
                });
            });
        }
    } catch (e) {
        console.warn('Ошибка гапов:', e);
    }

    return events;
}

// ============================================
// РАСШИРЕНИЕ РАСПИСАНИЯ ГАПА В ДАТЫ
// ============================================
function expandGapScheduleToDates(schedule, fromDate, toDate) {
    if (!schedule || !schedule.type || !schedule.startDate) return [];

    const dates = [];
    const start = new Date(schedule.startDate + 'T00:00:00');
    const end = new Date(toDate);
    const from = new Date(fromDate);

    if (isNaN(start.getTime())) return [];
    if (start > end) return [];

    const type = schedule.type;

    // Один раз — только точная дата
    if (type === 'once') {
        const dateStr = start.toISOString().slice(0, 10);
        const fromStr = from.toISOString().slice(0, 10);
        const endStr = end.toISOString().slice(0, 10);
        if (dateStr >= fromStr && dateStr <= endStr) {
            dates.push(dateStr);
        }
        return dates;
    }

    // Начинаем с max(start, from)
    let current = new Date(Math.max(start.getTime(), from.getTime()));

    // Выравниваем
    if (type === 'weekly' || type === 'biweekly') {
        const diffDays = Math.floor((current - start) / (1000 * 60 * 60 * 24));
        const step = type === 'weekly' ? 7 : 14;
        const rem = diffDays % step;
        if (rem !== 0) {
            current.setDate(current.getDate() + (step - rem));
        }
    } else if (type === 'monthly') {
        const startDay = start.getDate();
        if (current.getDate() > startDay) {
            current.setMonth(current.getMonth() + 1);
        }
        current.setDate(startDay);
    }

    // Идём по шагам
    while (current <= end) {
        dates.push(current.toISOString().slice(0, 10));

        if (type === 'weekly') {
            current.setDate(current.getDate() + 7);
        } else if (type === 'biweekly') {
            current.setDate(current.getDate() + 14);
        } else if (type === 'monthly') {
            current.setMonth(current.getMonth() + 1);
        } else {
            break;
        }
    }

    return dates;
}