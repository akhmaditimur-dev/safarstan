// ============ UI: PROFILE — БЛОКИРОВКИ ============

async function openBlockedListModal() {
    if (!PLAYER || !PLAYER.playerId) return;

    const modal = document.getElementById('blockedListModal');
    if (!modal) return;

    const list = document.getElementById('blockedList');
    list.innerHTML = '<div class="dashboard-empty">⏳ Загрузка...</div>';

    modal.style.display = 'flex';

    await refreshBlockedList();
}

async function refreshBlockedList() {
    const list = document.getElementById('blockedList');
    if (!list) return;

    const blocks = await loadMyBlocks(PLAYER.playerId);

    if (!blocks || blocks.length === 0) {
        list.innerHTML = '<div class="dashboard-empty">Ты никого не заблокировал</div>';
        return;
    }

    list.innerHTML = blocks.map(b => {
        const p = b.blocked || {};
        const avatar = p.avatar || '🧑‍💼';
        const name = p.name || 'Игрок';
        const level = p.level || 1;

        const avatarHtml = avatar.startsWith('http')
            ? `<img src="${avatar}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : avatar;

        return `
            <div class="friend-item">
                <div class="friend-item__avatar">${avatarHtml}</div>
                <div class="friend-item__info">
                    <div class="friend-item__name">${escapeHtml(name)}</div>
                    <div class="friend-item__sub">Уровень ${level}</div>
                </div>
                <div class="friend-item__actions">
                    <button class="btn btn-secondary btn-sm" data-unblock="${p.id}">Разблокировать</button>
                </div>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeBlockedListModal() {
    const modal = document.getElementById('blockedListModal');
    if (modal) modal.style.display = 'none';
}

// === Обработчики ===
document.addEventListener('click', async (e) => {
    if (e.target.closest('#blockedListClose')) {
        closeBlockedListModal();
        return;
    }
    if (e.target.id === 'blockedListModal') {
        closeBlockedListModal();
        return;
    }

    if (e.target.closest('#settingsBlockedListBtn')) {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) settingsModal.style.display = 'none';
        await openBlockedListModal();
        return;
    }

    const unblockBtn = e.target.closest('[data-unblock]');
    if (unblockBtn) {
        const blockedId = unblockBtn.dataset.unblock;
        unblockBtn.disabled = true;
        unblockBtn.textContent = '⏳';

        const result = await unblockPlayer(PLAYER.playerId, blockedId);
        if (result.error) {
            if (typeof showWarningToast === 'function') showWarningToast('Не удалось разблокировать');
            unblockBtn.disabled = false;
            unblockBtn.textContent = 'Разблокировать';
            return;
        }

        if (typeof showWarningToast === 'function') showWarningToast('✅ Разблокирован');
        await refreshBlockedList();
        return;
    }

    // Заблокировать
    const blockBtn = e.target.closest('#ppBlockBtn');
    if (blockBtn) {
        if (!currentViewedPlayerId) return;

        const ok = await showConfirm('Заблокировать игрока?', {
            okText: 'Заблокировать',
            title: 'Блокировка',
        });
        if (!ok) return;

        blockBtn.disabled = true;
        blockBtn.innerHTML = '<i data-lucide="loader"></i> Блокируем...';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const result = await blockPlayer(PLAYER.playerId, currentViewedPlayerId);

        if (result.error) {
            if (typeof showWarningToast === 'function') showWarningToast('Не удалось заблокировать');
            blockBtn.disabled = false;
            blockBtn.innerHTML = '<i data-lucide="ban"></i> Заблокировать';
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        if (typeof showWarningToast === 'function') showWarningToast('🚫 Игрок заблокирован');
        closePlayerProfile();
        return;
    }
});