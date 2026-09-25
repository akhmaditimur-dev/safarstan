// ============ UI: ДРУЗЬЯ ============

let FRIENDS = [];
let INCOMING_REQUESTS = [];

async function renderFriends() {
    if (!PLAYER || !PLAYER.playerId) return;

    // Показываем skeleton
    if (typeof renderFriendsSkeleton === 'function') {
        renderFriendsSkeleton('friendsList', 3);
        renderFriendsSkeleton('friendsIncoming', 2);
    }

    FRIENDS = await loadFriends(PLAYER.playerId);
    INCOMING_REQUESTS = await loadIncomingRequests(PLAYER.playerId);

    const countEl = document.getElementById('friendsCount');
    if (countEl) countEl.textContent = FRIENDS.length;

    const dashCountEl = document.getElementById('dashFriendsCount');
    if (dashCountEl) dashCountEl.textContent = FRIENDS.length;

    // === Входящие заявки ===
    const incomingSection = document.getElementById('friendsIncomingSection');
    const incomingEl = document.getElementById('friendsIncoming');

    if (incomingSection && incomingEl) {
        if (INCOMING_REQUESTS.length === 0) {
            incomingSection.style.display = 'none';
        } else {
            incomingSection.style.display = 'block';
            incomingEl.innerHTML = INCOMING_REQUESTS.map(req => {
                const p = req.from_player || {};
                const pid = p.id || '';
                const cityName = p.current_city && CITIES[p.current_city]
                    ? CITIES[p.current_city].name
                    : '';

                return `
                    <div class="friend-item">
                        <div class="friend-item__avatar" data-player-profile="${pid}">${renderAvatarHtml(p.avatar)}</div>
                        <div class="friend-item__info">
                            <div class="friend-item__name" data-player-profile="${pid}">${escapeHtml(p.name || 'Игрок')}</div>
                            <div class="friend-item__sub">Уровень ${p.level || 1}${cityName ? ` · ${cityName}` : ''}</div>
                        </div>
                        <div class="friend-item__actions">
                            <button class="friend-action-btn" data-accept="${req.id}" data-from="${req.from_player_id}">
                                Принять
                            </button>
                            <button class="friend-action-btn friend-action-btn--secondary" data-decline="${req.id}" title="Отклонить">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // === Список друзей ===
    const listEl = document.getElementById('friendsList');

    if (listEl) {
        if (FRIENDS.length === 0) {
            listEl.innerHTML = `
                <div class="friends-empty">
                    <p style="margin-bottom: 12px;">Пока нет друзей</p>
                    <p style="font-size: 12px; opacity: 0.7; margin-bottom: 14px;">Найди игроков через поиск выше</p>
                </div>
            `;
        } else {
            listEl.innerHTML = FRIENDS.map(f => {
                const cityName = f.current_city && CITIES[f.current_city]
                    ? CITIES[f.current_city].name
                    : '';

                return `
                    <div class="friend-item">
                        <div class="friend-item__avatar" data-player-profile="${f.id}">${renderAvatarHtml(f.avatar)}</div>
                        <div class="friend-item__info">
                            <div class="friend-item__name" data-player-profile="${f.id}">${escapeHtml(f.name)}</div>
                            <div class="friend-item__sub">Уровень ${f.level}${cityName ? ` · ${cityName}` : ''}</div>
                        </div>
                        <div class="friend-item__actions">
                            <button class="friend-action-btn friend-action-btn--secondary" data-remove-friend="${f.friendsRowId}">
                                Удалить
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// === Поиск игроков ===
async function searchPlayersAndRender(query) {
    if (!PLAYER || !PLAYER.playerId) return;

    const resultsEl = document.getElementById('friendSearchResults');
    if (!resultsEl) return;

    if (!query || query.length < 2) {
        resultsEl.innerHTML = '';
        return;
    }

    const results = await searchPlayers(query, PLAYER.playerId);
    const outgoing = await loadOutgoingRequests(PLAYER.playerId);
    const outgoingIds = new Set(outgoing.map(r => r.to_player_id));
    const friendIds = new Set(FRIENDS.map(f => f.id));

    if (results.length === 0) {
        resultsEl.innerHTML = '<div class="friends-empty">Никого не найдено</div>';
        return;
    }

    resultsEl.innerHTML = results.map(p => {
        const isFriend = friendIds.has(p.id);
        const isPending = outgoingIds.has(p.id);
        const cityName = p.current_city && CITIES[p.current_city]
            ? CITIES[p.current_city].name
            : '';

        let action = '';
        if (isFriend) {
            action = `<span class="friend-item__sub friend-item__sub--status"><i data-lucide="check"></i> Друг</span>`;
        } else if (isPending) {
            action = `<span class="friend-item__sub friend-item__sub--status"><i data-lucide="clock"></i> Заявка</span>`;
        } else {
            action = `<button class="friend-action-btn" data-add-friend="${p.id}"><i data-lucide="user-plus"></i> Добавить</button>`;
        }

        return `
            <div class="friend-item">
                <div class="friend-item__avatar" data-player-profile="${p.id}">${renderAvatarHtml(p.avatar)}</div>
                <div class="friend-item__info">
                    <div class="friend-item__name" data-player-profile="${p.id}">${escapeHtml(p.name)}</div>
                    <div class="friend-item__sub">Уровень ${p.level}${cityName ? ` · ${cityName}` : ''}</div>
                </div>
                <div class="friend-item__actions">${action}</div>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// ХЕЛПЕРЫ
// ============================================
function renderAvatarHtml(avatar) {
    if (!avatar) return '🧑‍💼';
    if (typeof avatar === 'string' && avatar.startsWith('http')) {
        return `<img src="${avatar}" alt="" loading="lazy">`;
    }
    return avatar;
}

if (typeof escapeHtml === 'undefined') {
    window.escapeHtml = function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
}