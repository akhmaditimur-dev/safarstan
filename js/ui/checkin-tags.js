// ============ UI: МОДАЛКА «С КЕМ БЫЛ?» ============

let _tagCtx = null;      // { checkinId, checkinKey, placeTitle }
let _tagSelected = new Set();

// ============================================
// ОТКРЫТИЕ МОДАЛКИ
// ============================================
async function openTagFriendsModal(checkinId, checkinKey, placeTitle) {
    const modal = document.getElementById('tagFriendsModal');
    if (!modal) return;

    _tagCtx = { checkinId, checkinKey, placeTitle };
    _tagSelected = new Set();

    const subtitle = document.getElementById('tagFriendsSubtitle');
    if (subtitle) subtitle.textContent = `Место: ${placeTitle}`;

    const listEl = document.getElementById('tagFriendsList');
    listEl.innerHTML = '<div class="tag-friends-empty">⏳ Загрузка...</div>';

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Загружаем друзей
    const friends = await loadFriendsForTagging();

    if (!friends || friends.length === 0) {
        listEl.innerHTML = `
            <div class="tag-friends-empty">
                У тебя пока нет друзей.<br>
                <span style="font-size: 12px;">Найди друзей в разделе «Друзья»</span>
            </div>
        `;
        return;
    }

    listEl.innerHTML = friends.map(f => `
        <button class="tag-friend-item" data-tag-friend="${f.id}">
            <span class="tag-friend-item__avatar">${renderAvatarHtml(f.avatar || '🧑‍💼')}</span>
            <span class="tag-friend-item__info">
                <span class="tag-friend-item__name">${escapeHtml(f.name)}</span>
                <span class="tag-friend-item__level">Уровень ${f.level || 1}</span>
            </span>
            <span class="tag-friend-item__check"><i data-lucide="check"></i></span>
        </button>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// ЗАКРЫТИЕ
// ============================================
function closeTagFriendsModal() {
    const modal = document.getElementById('tagFriendsModal');
    if (modal) modal.style.display = 'none';
    _tagCtx = null;
    _tagSelected = new Set();
}

// ============================================
// ОБРАБОТЧИКИ
// ============================================
document.addEventListener('click', (e) => {
    // Клик по другу
    const friendBtn = e.target.closest('[data-tag-friend]');
    if (friendBtn) {
        const friendId = friendBtn.dataset.tagFriend;

        if (_tagSelected.has(friendId)) {
            _tagSelected.delete(friendId);
            friendBtn.classList.remove('active');
        } else {
            if (_tagSelected.size >= 5) {
                if (typeof showWarningToast === 'function') {
                    showWarningToast('Максимум 5 друзей');
                }
                return;
            }
            _tagSelected.add(friendId);
            friendBtn.classList.add('active');
        }
        return;
    }

    // Кнопка «Отметить»
    if (e.target.closest('#tagFriendsSubmit')) {
        submitTagFriends();
        return;
    }

    // Пропустить или закрыть
    if (e.target.closest('#tagFriendsSkip') ||
        e.target.closest('#tagFriendsClose') ||
        e.target.id === 'tagFriendsModal') {
        closeTagFriendsModal();
        return;
    }
});

// ============================================
// СОХРАНЕНИЕ ОТМЕТОК
// ============================================
async function submitTagFriends() {
    if (!_tagCtx || !PLAYER) return;

    if (_tagSelected.size === 0) {
        closeTagFriendsModal();
        return;
    }

    const btn = document.getElementById('tagFriendsSubmit');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Отправка...'; }

    const taggedIds = [..._tagSelected];

    // Сохраняем
    const result = await saveCheckinTags(
        _tagCtx.checkinId,
        PLAYER.playerId,
        _tagCtx.checkinKey,
        taggedIds
    );

    // Отправляем уведомления
    if (!result.error) {
        for (const id of taggedIds) {
            if (typeof createNotification === 'function') {
                await createNotification(id, 'checkin_tag', {
                    place: _tagCtx.placeTitle,
                }, PLAYER.playerId);
            }
        }
    }

    if (btn) { btn.disabled = false; btn.textContent = 'Отметить'; }

    if (result.error) {
        if (typeof showWarningToast === 'function') {
            showWarningToast('Не удалось сохранить');
        }
        return;
    }

    closeTagFriendsModal();

    if (typeof showWarningToast === 'function') {
        showWarningToast(`✅ Отмечено: ${taggedIds.length}`);
    }
}