// ============ API: ПРИСУТСТВИЕ (ОНЛАЙН-СТАТУС) ============

const HEARTBEAT_INTERVAL_MS = 60 * 1000;   // раз в минуту
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // < 2 мин = онлайн

let _heartbeatTimer = null;
let _heartbeatPlayerId = null;

// Запустить heartbeat для текущего игрока
function startHeartbeat(playerId) {
    if (!playerId) return;
    if (_heartbeatPlayerId === playerId && _heartbeatTimer) return; // уже запущен

    stopHeartbeat();
    _heartbeatPlayerId = playerId;

    // Сразу отправляем — игрок только что онлайн
    _sendHeartbeat();

    // Дальше — каждые 60 сек
    _heartbeatTimer = setInterval(_sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    // При возврате на вкладку — сразу шлём
    document.addEventListener('visibilitychange', _onVisibilityChange);

    // При закрытии — финальный heartbeat
    window.addEventListener('beforeunload', _sendHeartbeat);
}

function stopHeartbeat() {
    if (_heartbeatTimer) {
        clearInterval(_heartbeatTimer);
        _heartbeatTimer = null;
    }
    document.removeEventListener('visibilitychange', _onVisibilityChange);
    window.removeEventListener('beforeunload', _sendHeartbeat);
    _heartbeatPlayerId = null;
}

function _onVisibilityChange() {
    if (document.visibilityState === 'visible') {
        _sendHeartbeat();
    }
}

async function _sendHeartbeat() {
    if (!_heartbeatPlayerId) return;

    try {
        const { error } = await _supabase
            .from('players')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', _heartbeatPlayerId);

        if (error) {
            console.warn('Heartbeat error:', error.message);
        }
    } catch (err) {
        console.warn('Heartbeat failed:', err);
    }
}

// ============================================
// ОПРЕДЕЛЕНИЕ СТАТУСА
// ============================================

// Возвращает { label, dot, isOnline } по last_seen_at
function getOnlineStatus(lastSeenAt) {
    if (!lastSeenAt) {
        return { label: 'давно не заходил', dot: 'gray', isOnline: false };
    }

    const now = Date.now();
    const seen = new Date(lastSeenAt).getTime();
    const diff = now - seen;

    if (diff < ONLINE_THRESHOLD_MS) {
        return { label: 'онлайн', dot: 'green', isOnline: true };
    }

    const min = Math.floor(diff / 60000);
    if (min < 60) {
        return { label: `был(а) ${min} мин назад`, dot: 'gray', isOnline: false };
    }

    const hours = Math.floor(min / 60);
    if (hours < 24) {
        return { label: `был(а) ${hours} ч назад`, dot: 'gray', isOnline: false };
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
        return { label: `был(а) ${days} дн назад`, dot: 'gray', isOnline: false };
    }

    return { label: 'давно не заходил', dot: 'gray', isOnline: false };
}

// HTML-точка статуса
function renderOnlineDot(lastSeenAt) {
    const { dot, label } = getOnlineStatus(lastSeenAt);
    return `<span class="online-dot online-dot--${dot}" title="${label}"></span>`;
}