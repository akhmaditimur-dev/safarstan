// ============ API: ИГРОК ============

// ============================================
// ЗАГРУЗКА / СОХРАНЕНИЕ СВОЕГО ПРОФИЛЯ
// ============================================
async function loadPlayerFromServer() {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await _supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) {
        console.error('Ошибка загрузки профиля:', error);
        return null;
    }
    return data;
}

async function savePlayerToServer(player) {
    const user = await getCurrentUser();
    if (!user) return null;

    const payload = {
        user_id: user.id,
        email: user.email,
        name: player.name,
        avatar: player.avatar,
        avatar_path: player.avatarPath || null,
        home_city: player.homeCity,
        current_city: player.currentCity,
        xp: player.xp,
        level: player.level,
        badges: player.badges || [],
        completed_quests: player.completedQuests || [],
        quests_claimed: player.questsClaimed || [],
        user_places_added: player.userPlacesAdded || 0,
        checkin_cooldowns: player.checkinCooldowns || {},
        today_checkins: player.todayCheckins || 0,
        today_date: player.todayDate || null,
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await _supabase
        .from('players')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

    if (error) {
        console.error('Ошибка сохранения профиля:', error);
        return null;
    }
    return data;
}

// ============================================
// ЗАГРУЗКА ПРОФИЛЯ ДРУГОГО ИГРОКА
// ============================================
async function loadPlayerById(playerId) {
    if (!playerId) return null;

    const { data, error } = await _supabase
        .from('public_players')
        .select('id, name, avatar, level, xp, home_city, current_city, badges, username, is_private, last_seen_at')
        .eq('id', playerId)
        .single();

    if (error) {
        console.error('Ошибка загрузки игрока:', error);
        return null;
    }
    return data;
}

async function loadPlayerCheckins(playerId) {
    if (!playerId) return {};

    const { data, error } = await _supabase
        .from('checkins')
        .select('city_key')
        .eq('player_id', playerId);

    if (error) return {};

    const visited = {};
    data.forEach(c => {
        visited[c.city_key] = (visited[c.city_key] || 0) + 1;
    });
    return visited;
}

// ============================================
// МЯГКОЕ УДАЛЕНИЕ АККАУНТА
// ============================================
async function softDeletePlayer(playerId) {
    const { error } = await _supabase
        .from('players')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq('id', playerId);

    if (error) {
        console.warn('Ошибка удаления аккаунта:', error);
        return { error: error.message };
    }
    return { ok: true };
}

async function restorePlayer(playerId) {
    const { error } = await _supabase
        .from('players')
        .update({
            is_deleted: false,
            deleted_at: null,
        })
        .eq('id', playerId);

    if (error) {
        console.warn('Ошибка восстановления:', error);
        return { error: error.message };
    }
    return { ok: true };
}

async function isPlayerDeleted(playerId) {
    const { data, error } = await _supabase
        .from('players')
        .select('is_deleted, deleted_at')
        .eq('id', playerId)
        .single();

    if (error || !data) return { deleted: false };
    return {
        deleted: data.is_deleted === true,
        deletedAt: data.deleted_at,
    };
}

function isRestorePeriodExpired(deletedAt) {
    if (!deletedAt) return false;
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffDays = (now - deleted) / (1000 * 60 * 60 * 24);
    return diffDays > 30;
}

// ============================================
// ПРИВАТНЫЙ ПРОФИЛЬ — ЗАПРОСЫ НА ДОСТУП
// ============================================
async function requestProfileAccess(fromPlayerId, toPlayerId) {
    const { error } = await _supabase
        .from('profile_access_requests')
        .upsert({
            from_player_id: fromPlayerId,
            to_player_id: toPlayerId,
            status: 'pending',
            updated_at: new Date().toISOString(),
        }, { onConflict: 'from_player_id,to_player_id' });

    if (error) {
        console.warn('Ошибка запроса доступа:', error);
        return { error: error.message };
    }
    return { ok: true };
}

async function hasProfileAccess(fromPlayerId, toPlayerId) {
    const { data, error } = await _supabase
        .from('profile_access_requests')
        .select('status')
        .eq('from_player_id', fromPlayerId)
        .eq('to_player_id', toPlayerId)
        .maybeSingle();

    if (error || !data) return false;
    return data.status === 'accepted';
}

async function getProfileAccessStatus(fromPlayerId, toPlayerId) {
    const { data, error } = await _supabase
        .from('profile_access_requests')
        .select('status')
        .eq('from_player_id', fromPlayerId)
        .eq('to_player_id', toPlayerId)
        .maybeSingle();

    if (error || !data) return null;
    return data.status;
}

async function loadIncomingAccessRequests(playerId) {
    const { data, error } = await _supabase
        .from('profile_access_requests')
        .select(`
            id, status, created_at,
            from_player:public_players!profile_access_requests_from_player_id_fkey (
                id, name, avatar, level
            )
        `)
        .eq('to_player_id', playerId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('Ошибка загрузки запросов:', error);
        return [];
    }
    return data || [];
}

async function acceptProfileAccess(requestId) {
    const { error } = await _supabase
        .from('profile_access_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);

    if (error) return { error: error.message };
    return { ok: true };
}

async function declineProfileAccess(requestId) {
    const { error } = await _supabase
        .from('profile_access_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', requestId);

    if (error) return { error: error.message };
    return { ok: true };
}

async function savePrivacyFlag(playerId, isPrivate) {
    const { error } = await _supabase
        .from('players')
        .update({ is_private: isPrivate })
        .eq('id', playerId);

    if (error) return { error: error.message };
    return { ok: true };
}

// ============================================
// БЛОКИРОВКА ПОЛЬЗОВАТЕЛЕЙ
// ============================================
async function blockPlayer(blockerId, blockedId) {
    const { error } = await _supabase
        .from('blocks')
        .insert({ blocker_id: blockerId, blocked_id: blockedId });

    if (error) {
        console.warn('Ошибка блокировки:', error);
        return { error: error.message };
    }
    return { ok: true };
}

async function unblockPlayer(blockerId, blockedId) {
    const { error } = await _supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId);

    if (error) {
        console.warn('Ошибка разблокировки:', error);
        return { error: error.message };
    }
    return { ok: true };
}

async function isBlockedBy(blockerId, blockedId) {
    const { data, error } = await _supabase
        .from('blocks')
        .select('id')
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId)
        .maybeSingle();

    if (error || !data) return false;
    return true;
}

async function isBlockedEitherWay(playerA, playerB) {
    const [a, b] = await Promise.all([
        isBlockedBy(playerA, playerB),
        isBlockedBy(playerB, playerA),
    ]);
    return a || b;
}

async function loadMyBlocks(playerId) {
    const { data, error } = await _supabase
        .from('blocks')
        .select(`
            id, created_at,
            blocked:players!blocks_blocked_id_fkey (id, name, avatar, level)
        `)
        .eq('blocker_id', playerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('Ошибка загрузки блокировок:', error);
        return [];
    }
    return data || [];
}

// ============================================
// USERNAME (НИК ИГРОКА)
// ============================================
function validateUsername(username) {
    if (!username) return 'Ник не может быть пустым';
    if (username.length < 3) return 'Минимум 3 символа';
    if (username.length > 20) return 'Максимум 20 символов';
    if (!/^[a-z0-9_]+$/.test(username)) {
        return 'Только латиница, цифры и подчёркивание';
    }
    const reserved = ['admin', 'support', 'api', 'www', 'u', 'p', 'root', 'help', 'faq'];
    if (reserved.includes(username)) return 'Этот ник зарезервирован';
    return null;
}

async function isUsernameAvailable(username, excludePlayerId = null) {
    let query = _supabase
        .from('public_players')
        .select('id')
        .ilike('username', username);

    if (excludePlayerId) {
        query = query.neq('id', excludePlayerId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
        console.warn('Ошибка проверки ника:', error);
        return false;
    }
    return !data;
}

async function saveUsername(playerId, username) {
    const clean = username.toLowerCase().trim();

    const validationError = validateUsername(clean);
    if (validationError) return { error: validationError };

    const available = await isUsernameAvailable(clean, playerId);
    if (!available) return { error: 'Этот ник уже занят' };

    const { error } = await _supabase
        .from('players')
        .update({ username: clean })
        .eq('id', playerId);

    if (error) {
        console.warn('Ошибка сохранения ника:', error);
        return { error: error.message };
    }
    return { ok: true, username: clean };
}

async function generateUsernameForPlayer(playerId, baseName) {
    let base = (baseName || 'player')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 15);

    if (base.length < 3) base = 'player';

    let candidate = base;
    let attempt = 0;

    while (!(await isUsernameAvailable(candidate, playerId))) {
        attempt++;
        candidate = `${base}${attempt}`;
        if (attempt > 100) {
            candidate = `player${Math.floor(Math.random() * 99999)}`;
            break;
        }
    }

    const { error } = await _supabase
        .from('players')
        .update({ username: candidate })
        .eq('id', playerId);

    if (error) {
        console.warn('Ошибка автогенерации ника:', error);
        return null;
    }
    return candidate;
}

async function loadPlayerByUsername(username) {
    if (!username) return null;

    const clean = username.toLowerCase().trim();

    const { data, error } = await _supabase
        .from('public_players')
        .select('id, name, avatar, avatar_path, level, xp, home_city, current_city, badges, username, is_private, settings')
        .ilike('username', clean)
        .maybeSingle();

    if (error || !data) return null;
    return data;
}

// ============================================
// СМЕНА ГОРОДА
// ============================================
async function savePlayerCity(playerId, type, cityKey) {
    if (!playerId || !type || !cityKey) {
        return { error: 'Не хватает данных' };
    }
    if (!CITIES[cityKey]) {
        return { error: 'Неизвестный город' };
    }
    if (type !== 'home' && type !== 'current') {
        return { error: 'Неверный тип' };
    }

    const field = type === 'home' ? 'home_city' : 'current_city';

    const { error } = await _supabase
        .from('players')
        .update({ [field]: cityKey })
        .eq('id', playerId);

    if (error) {
        console.warn('Ошибка смены города:', error);
        return { error: error.message };
    }
    return { ok: true };
}

// ============================================
// ЖАЛОБЫ / МОДЕРАЦИЯ
// ============================================
async function createReport(reporterId, targetType, targetId, reason, comment = null) {
    const { error } = await _supabase
        .from('reports')
        .insert({
            reporter_id: reporterId,
            target_type: targetType,
            target_id: String(targetId),
            reason,
            comment: comment || null,
        });

    if (error) {
        console.warn('Ошибка отправки жалобы:', error);
        return { error: error.message };
    }
    return { ok: true };
}

async function hasReported(reporterId, targetType, targetId) {
    const { data, error } = await _supabase
        .from('reports')
        .select('id')
        .eq('reporter_id', reporterId)
        .eq('target_type', targetType)
        .eq('target_id', String(targetId))
        .maybeSingle();

    if (error || !data) return false;
    return true;
}

async function loadAllReports(status = 'pending') {
    const { data, error } = await _supabase
        .from('reports')
        .select(`
            id, target_type, target_id, reason, comment, status, created_at,
            reporter:players!reports_reporter_id_fkey (id, name, avatar)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('Ошибка загрузки жалоб:', error);
        return [];
    }
    return data || [];
}

async function resolveReport(reportId, adminId, status = 'resolved') {
    const { error } = await _supabase
        .from('reports')
        .update({
            status,
            resolved_by: adminId,
            resolved_at: new Date().toISOString(),
        })
        .eq('id', reportId);

    if (error) return { error: error.message };
    return { ok: true };
}