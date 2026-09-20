// ============ UI: PROFILE — ЗАПРОСЫ НА ПРОСМОТР ============

async function openAccessRequestsModal() {
    if (!PLAYER || !PLAYER.playerId) return;

    const modal = document.getElementById('accessRequestsModal');
    if (!modal) return;

    const list = document.getElementById('accessRequestsList');
    list.innerHTML = '<div class="dashboard-empty">⏳ Загрузка...</div>';

    modal.style.display = 'flex';

    await refreshAccessRequestsList();
}

async function refreshAccessRequestsList() {
    const list = document.getElementById('accessRequestsList');
    if (!list) return;

    const requests = await loadIncomingAccessRequests(PLAYER.playerId);

    if (!requests || requests.length === 0) {
        list.innerHTML = '<div class="dashboard-empty">Пока нет входящих запросов</div>';
        updateAccessRequestsBadge(0);
        return;
    }

    list.innerHTML = requests.map(req => {
        const p = req.from_player || {};
        const avatar = p.avatar || '🧑‍💼';
        const name = p.name || 'Игрок';
        const level = p.level || 1;
        const date = req.created_at ? formatDate(req.created_at) : '';

        const avatarHtml = avatar.startsWith('http')
            ? `<img src="${avatar}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : avatar;

        return `
            <div class="friend-item" data-request-id="${req.id}">
                <div class="friend-item__avatar">${avatarHtml}</div>
                <div class="friend-item__info">
                    <div class="friend-item__name">${escapeHtml(name)}</div>
                    <div class="friend-item__sub">Уровень ${level} · ${date}</div>
                </div>
                <div class="friend-item__actions" style="display:flex;gap:6px;">
                    <button class="btn btn-primary btn-sm" data-accept-access="${req.id}" data-from-player="${p.id || ''}">Принять</button>
                    <button class="btn btn-secondary btn-sm" data-decline-access="${req.id}" data-from-player="${p.id || ''}">Отклонить</button>
                </div>
            </div>
        `;
    }).join('');

    updateAccessRequestsBadge(requests.length);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function updateAccessRequestsBadge(count) {
    const badge = document.getElementById('dashAccessRequestsCount');
    if (badge) badge.textContent = count;

    const btn = document.getElementById('navAccessRequestsBtn');
    if (btn) {
        const isPrivate = PLAYER?.isPrivate === true || PLAYER?.settings?.privacy?.isPrivate === true;
        btn.style.display = isPrivate ? '' : 'none';
    }
}

function closeAccessRequestsModal() {
    const modal = document.getElementById('accessRequestsModal');
    if (modal) modal.style.display = 'none';
}

// === Обработчики кликов в списке запросов ===
document.addEventListener('click', async (e) => {
    if (e.target.closest('#accessRequestsClose')) {
        closeAccessRequestsModal();
        return;
    }
    if (e.target.id === 'accessRequestsModal') {
        closeAccessRequestsModal();
        return;
    }

    const acceptBtn = e.target.closest('[data-accept-access]');
    if (acceptBtn) {
        const id = acceptBtn.dataset.acceptAccess;
        const fromPlayerId = acceptBtn.dataset.fromPlayer;

        acceptBtn.disabled = true;
        acceptBtn.textContent = '⏳';

        const result = await acceptProfileAccess(id);
        if (result.error) {
            if (typeof showWarningToast === 'function') showWarningToast('Не удалось принять запрос');
            acceptBtn.disabled = false;
            acceptBtn.textContent = 'Принять';
            return;
        }

        if (fromPlayerId && typeof createNotification === 'function') {
            await createNotification(fromPlayerId, 'profile_access_accepted', {}, PLAYER.playerId);
        }

        if (typeof showWarningToast === 'function') showWarningToast('✅ Доступ открыт');
        await refreshAccessRequestsList();
        return;
    }

    const declineBtn = e.target.closest('[data-decline-access]');
    if (declineBtn) {
        const id = declineBtn.dataset.declineAccess;
        const fromPlayerId = declineBtn.dataset.fromPlayer;

        declineBtn.disabled = true;
        declineBtn.textContent = '⏳';

        const result = await declineProfileAccess(id);
        if (result.error) {
            if (typeof showWarningToast === 'function') showWarningToast('Не удалось отклонить запрос');
            declineBtn.disabled = false;
            declineBtn.textContent = 'Отклонить';
            return;
        }

        if (fromPlayerId && typeof createNotification === 'function') {
            await createNotification(fromPlayerId, 'profile_access_declined', {}, PLAYER.playerId);
        }

        await refreshAccessRequestsList();
        return;
    }
});