// ============ APP: СОБЫТИЯ ДРУЗЕЙ ============

on('friendsClose', 'click', () => {
    const modal = document.getElementById('friendsModal');
    if (modal) modal.style.display = 'none';

    const search = document.getElementById('friendSearch');
    const results = document.getElementById('friendSearchResults');
    if (search) search.value = '';
    if (results) results.innerHTML = '';
});

on('friendsModal', 'click', (e) => {
    if (e.target.id === 'friendsModal') e.target.style.display = 'none';
});

let searchTimeout;
on('friendSearch', 'input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchPlayersAndRender(e.target.value), 300);
});

const friendsModal = document.getElementById('friendsModal');
if (friendsModal) {
    friendsModal.addEventListener('click', async (e) => {
        if (e.target.dataset.addFriend) {
            const toId = e.target.dataset.addFriend;
            const ok = await sendFriendRequest(PLAYER.playerId, toId);
            if (ok) {
                e.target.outerHTML = '<span class="friend-item__sub">⏳ Заявка</span>';
            }
            return;
        }

        if (e.target.dataset.accept) {
            const reqId = e.target.dataset.accept;
            const fromId = e.target.dataset.from;
            const ok = await acceptFriendRequest(reqId, fromId, PLAYER.playerId);
            if (ok) {
                await renderFriends();
                if (typeof resetCityFriendsStatsCache === 'function') {
                    resetCityFriendsStatsCache();
                }
            }
            return;
        }

        if (e.target.dataset.decline) {
            await declineFriendRequest(e.target.dataset.decline);
            await renderFriends();
            return;
        }

        if (e.target.dataset.removeFriend) {
            const ok = await showConfirm('Удалить из друзей?', { okText: 'Удалить' });
            if (!ok) return;
            await removeFriend(e.target.dataset.removeFriend);
            await renderFriends();
            if (typeof resetCityFriendsStatsCache === 'function') {
                resetCityFriendsStatsCache();
            }
            return;
        }
    });
}

// Кнопки на чужом профиле
on('ppAddFriendBtn', 'click', async () => {
    if (!currentViewedPlayerId || !PLAYER) return;

    const ok = await sendFriendRequest(PLAYER.playerId, currentViewedPlayerId);
    if (ok) {
        showWarningToast('✅ Заявка отправлена');
        document.getElementById('ppAddFriendBtn').style.display = 'none';
        document.getElementById('ppPendingBtn').style.display = 'block';
    }
});

on('ppRemoveFriendBtn', 'click', async () => {
    if (!currentViewedPlayerId || !PLAYER) return;
    const ok = await showConfirm('Удалить из друзей?', { okText: 'Удалить' });
    if (!ok) return;

    const friend = (typeof FRIENDS !== 'undefined' ? FRIENDS : []).find(f => f.id === currentViewedPlayerId);
    if (!friend) return;

    await removeFriend(friend.friendsRowId);
    showWarningToast('Удалено из друзей');

    document.getElementById('ppRemoveFriendBtn').style.display = 'none';
    document.getElementById('ppAddFriendBtn').style.display = 'block';

    await renderFriends();

    if (typeof resetCityFriendsStatsCache === 'function') {
        resetCityFriendsStatsCache();
    }
});

// Клик по кнопке "Мои друзья" в сайдбаре
on('navFriendsBtn', 'click', async () => {
    if (!PLAYER) return;
    if (typeof isModuleEnabled === 'function' && !isModuleEnabled('friends')) return;
    await renderFriends();
    const modal = document.getElementById('friendsModal');
    if (modal) modal.style.display = 'flex';
});