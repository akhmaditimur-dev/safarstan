// ============ UI: УВЕДОМЛЕНИЯ ============

function initNotificationsBell() {
    if (!PLAYER) return;

    const container = document.getElementById('headerActions');
    if (!container) return;

    if (!document.getElementById('notifBell')) {
        const bell = document.createElement('div');
        bell.id = 'notifBell';
        bell.className = 'theme-btn';
        bell.style.position = 'relative';
        bell.style.cursor = 'pointer';
        bell.title = 'Уведомления';
        bell.innerHTML = `
            <i data-lucide="bell"></i>
            <span id="notifBadge" class="notif-badge" style="display:none;">0</span>
        `;
        container.appendChild(bell);
    }

    if (!document.getElementById('notifDropdown')) {
        const dd = document.createElement('div');
        dd.id = 'notifDropdown';
        dd.className = 'notif-dropdown';
        dd.style.display = 'none';
        dd.innerHTML = `
            <div class="notif-dropdown__header">
                <span>Уведомления</span>
                <button id="notifMarkAllRead" class="notif-dropdown__mark">Прочитать все</button>
            </div>
            <div id="notifDropdownList" class="notif-dropdown__list"></div>
            <button id="notifOpenAll" class="notif-dropdown__all">Все уведомления</button>
        `;
        document.body.appendChild(dd);
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
    updateNotificationsBadge();
}

async function updateNotificationsBadge() {
    if (!PLAYER || !PLAYER.playerId) return;

    const count = await getUnreadCount(PLAYER.playerId);
    const badge = document.getElementById('notifBadge');
    if (!badge) return;

    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

async function toggleNotificationsDropdown() {
    const dropdown = document.getElementById('notifDropdown');
    if (!dropdown) return;

    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
        return;
    }

    dropdown.style.display = 'block';
    await renderNotificationsList('notifDropdownList', 10);
}

async function renderNotificationsList(containerId, limit = 50) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Skeleton
    if (typeof renderNotificationsSkeleton === 'function') {
        renderNotificationsSkeleton(containerId, 5);
    }

    // ...дальше идёт текущий код

    container.innerHTML = '<div class="notif-empty">⏳ Загрузка...</div>';

    const items = await loadMyNotifications(PLAYER.playerId, limit);

    if (!items || items.length === 0) {
        container.innerHTML = '<div class="notif-empty">Пока нет уведомлений</div>';
        return;
    }

    container.innerHTML = items.map(n => renderNotificationItem(n)).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderNotificationItem(n) {
    const from = n.from_player || {};
    const avatar = from.avatar || '🧑‍💼';
    const avatarHtml = avatar.startsWith('http')
        ? `<img src="${avatar}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : avatar;

    const text = buildNotificationText(n);
    const date = n.created_at ? formatDate(n.created_at) : '';
    const unreadClass = n.is_read ? '' : ' notif-item--unread';

    return `
        <div class="notif-item${unreadClass}" data-notif-id="${n.id}" data-notif-type="${n.type}">
            <div class="notif-item__avatar">${avatarHtml}</div>
            <div class="notif-item__body">
                <div class="notif-item__text">${text}</div>
                <div class="notif-item__date">${date}</div>
            </div>
        </div>
    `;
}

function buildNotificationText(n) {
    const from = n.from_player || {};
    const name = escapeHtml(from.name || 'Игрок');
    const p = n.payload || {};

    switch (n.type) {
        case 'friend_request':
            return `<strong>${name}</strong> хочет добавить тебя в друзья`;
        case 'friend_accepted':
            return `<strong>${name}</strong> принял твою заявку в друзья`;
        case 'profile_access_request':
            return `<strong>${name}</strong> запросил доступ к твоему профилю`;
        case 'profile_access_accepted':
            return `<strong>${name}</strong> открыл тебе доступ к профилю`;
        case 'profile_access_declined':
            return `<strong>${name}</strong> отклонил запрос на профиль`;
        case 'gap_invite':
            return `<strong>${name}</strong> приглашает тебя в гап${p.gap_title ? ` «${escapeHtml(p.gap_title)}»` : ''}`;
        case 'review_on_place':
            return `<strong>${name}</strong> оставил отзыв${p.place_title ? ` на «${escapeHtml(p.place_title)}»` : ''}`;
        case 'photo_on_place':
            return `<strong>${name}</strong> добавил фото${p.place_title ? ` к «${escapeHtml(p.place_title)}»` : ''}`;
        default:
            return `<strong>${name}</strong> — новое событие`;
    }
}

async function openAllNotificationsModal() {
    const modal = document.getElementById('notificationsModal');
    if (!modal) return;

    modal.style.display = 'flex';
    await renderNotificationsList('notificationsModalList', 100);
    await updateNotificationsBadge();
}

function closeAllNotificationsModal() {
    const modal = document.getElementById('notificationsModal');
    if (modal) modal.style.display = 'none';
}

document.addEventListener('click', async (e) => {
    if (e.target.closest('#notifBell')) {
        e.stopPropagation();
        await toggleNotificationsDropdown();
        return;
    }

    const dropdown = document.getElementById('notifDropdown');
    if (dropdown && dropdown.style.display === 'block') {
        if (!e.target.closest('#notifDropdown') && !e.target.closest('#notifBell')) {
            dropdown.style.display = 'none';
        }
    }

    if (e.target.closest('#notifMarkAllRead')) {
        await markAllNotificationsRead(PLAYER.playerId);
        await updateNotificationsBadge();
        await renderNotificationsList('notifDropdownList', 10);
        if (typeof showWarningToast === 'function') showWarningToast('✅ Все прочитаны');
        return;
    }

    if (e.target.closest('#notifOpenAll')) {
        if (dropdown) dropdown.style.display = 'none';
        await openAllNotificationsModal();
        return;
    }

    if (e.target.closest('#notificationsClose')) {
        closeAllNotificationsModal();
        return;
    }
    if (e.target.id === 'notificationsModal') {
        closeAllNotificationsModal();
        return;
    }

    const notifItem = e.target.closest('[data-notif-id]');
    if (notifItem) {
        const id = notifItem.dataset.notifId;
        const type = notifItem.dataset.notifType;

        await markNotificationRead(id);
        notifItem.classList.remove('notif-item--unread');
        await updateNotificationsBadge();

        if (dropdown) dropdown.style.display = 'none';
        closeAllNotificationsModal();

        handleNotificationClick(type);
        return;
    }
});

function handleNotificationClick(type) {
    switch (type) {
        case 'friend_request':
        case 'friend_accepted':
            if (typeof renderFriends === 'function') {
                renderFriends().then(() => {
                    const modal = document.getElementById('friendsModal');
                    if (modal) modal.style.display = 'flex';
                });
            }
            break;
        case 'profile_access_request':
            if (typeof openAccessRequestsModal === 'function') {
                openAccessRequestsModal();
            }
            break;
        case 'gap_invite':
            const gapsCard = document.getElementById('dashGapsCard');
            if (gapsCard) gapsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            break;
        default:
            break;
    }
}