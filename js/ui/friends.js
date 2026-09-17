// ============ UI: ДРУЗЬЯ ============

let FRIENDS = [];
let INCOMING_REQUESTS = [];

async function renderFriends() {
    if (!PLAYER || !PLAYER.playerId) return;

    FRIENDS = await loadFriends(PLAYER.playerId);
    INCOMING_REQUESTS = await loadIncomingRequests(PLAYER.playerId);

    // Счётчик в модалке
    const countEl = document.getElementById('friendsCount');
    if (countEl) countEl.textContent = FRIENDS.length;

    // Счётчик в дашборде
    const dashCountEl = document.getElementById('dashFriendsCount');
    if (dashCountEl) dashCountEl.textContent = FRIENDS.length;

    // Входящие заявки
    const incomingSection = document.getElementById('friendsIncomingSection');
    const incomingEl = document.getElementById('friendsIncoming');

    if (incomingSection && incomingEl) {
        if (INCOMING_REQUESTS.length === 0) {
            incomingSection.style.display = 'none';
        } else {
            incomingSection.style.display = 'block';
            incomingEl.innerHTML = INCOMING_REQUESTS.map(req => {
                const p = req.from_player || {};
                return `
                    <div class="friend-item">
                        <div class="friend-item__avatar">${p.avatar || '🧑‍💼'}</div>
                        <div class="friend-item__info">
                            <div class="friend-item__name">${p.name || 'Игрок'}</div>
                            <div class="friend-item__sub">Уровень ${p.level || 1}</div>
                        </div>
                        <div class="friend-item__actions">
                            <button class="friend-action-btn" data-accept="${req.id}" data-from="${req.from_player_id}">Принять</button>
                            <button class="friend-action-btn friend-action-btn--secondary" data-decline="${req.id}">✕</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Список друзей
    const listEl = document.getElementById('friendsList');

    if (listEl) {
        if (FRIENDS.length === 0) {
            listEl.innerHTML = '<div class="friends-empty">Пока нет друзей. Найди кого-нибудь!</div>';
        } else {
            listEl.innerHTML = FRIENDS.map(f => `
                <div class="friend-item">
                    <div class="friend-item__avatar">${f.avatar || '🧑‍💼'}</div>
                    <div class="friend-item__info">
                        <div class="friend-item__name">${f.name}</div>
                        <div class="friend-item__sub">Уровень ${f.level} · ${CITIES[f.current_city]?.name || ''}</div>
                    </div>
                    <div class="friend-item__actions">
                        <button class="friend-action-btn friend-action-btn--secondary" data-remove-friend="${f.friendsRowId}">Удалить</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

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

        let action = '';
        if (isFriend) {
            action = '<span class="friend-item__sub">✅ Друг</span>';
        } else if (isPending) {
            action = '<span class="friend-item__sub">⏳ Заявка</span>';
        } else {
            action = `<button class="friend-action-btn" data-add-friend="${p.id}">+ Добавить</button>`;
        }

        return `
            <div class="friend-item">
                <div class="friend-item__avatar">${p.avatar || '🧑‍💼'}</div>
                <div class="friend-item__info">
                    <div class="friend-item__name">${p.name}</div>
                    <div class="friend-item__sub">Уровень ${p.level} · ${CITIES[p.current_city]?.name || ''}</div>
                </div>
                <div class="friend-item__actions">${action}</div>
            </div>
        `;
    }).join('');
}