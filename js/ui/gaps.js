// ============ UI: ГАПЫ ============

// Глобальное состояние
let CURRENT_GAPS = [];
let CURRENT_GAP_INVITES = [];
let CURRENT_OPEN_GAP = null;

// ============================================
// РЕНДЕР: список моих гапов (в дашборде)
// ============================================
async function renderGapsDashboard() {
    const container = document.getElementById('dashGaps');
    if (!container) return;

    container.innerHTML = '<div class="dash-empty">⏳ Загрузка...</div>';

    CURRENT_GAPS = await loadMyGaps();

    if (CURRENT_GAPS.length === 0) {
        container.innerHTML = `
            <div class="dash-empty">
                <p>У тебя пока нет гапов</p>
                <button class="btn btn-primary btn-sm" onclick="openGapModal()">☕ Создать гап</button>
            </div>
        `;
        return;
    }

    container.innerHTML = CURRENT_GAPS.map(gap => `
        <div class="gap-card" data-gap-id="${gap.id}">
            <div class="gap-card__emoji">${gap.avatar_emoji || '☕'}</div>
            <div class="gap-card__info">
                <div class="gap-card__name">${escapeHtml(gap.name)}</div>
                <div class="gap-card__meta">
                    ${gap.myRole === 'host' ? '👑 Организатор' : '👤 Участник'}
                    ${gap.city_key ? ' · ' + cityName(gap.city_key) : ''}
                </div>
            </div>
            <div class="gap-card__arrow">→</div>
        </div>
    `).join('');
}

// ============================================
// РЕНДЕР: входящие приглашения
// ============================================
async function renderGapInvites() {
    const container = document.getElementById('gapInvitesBlock');
    if (!container) return;

    CURRENT_GAP_INVITES = await loadMyGapInvites();

    if (CURRENT_GAP_INVITES.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    container.innerHTML = `
        <h3>📨 Приглашения в гапы (${CURRENT_GAP_INVITES.length})</h3>
        ${CURRENT_GAP_INVITES.map(inv => `
            <div class="gap-invite">
                <div class="gap-invite__emoji">${inv.gapEmoji}</div>
                <div class="gap-invite__info">
                    <div><strong>${escapeHtml(inv.gapName)}</strong></div>
                    <div class="gap-invite__from">
                        ${inv.fromAvatar} ${escapeHtml(inv.fromName)} приглашает
                    </div>
                </div>
                <div class="gap-invite__actions">
                    <button class="btn btn-primary btn-sm" data-gap-invite-accept="${inv.id}">Принять</button>
                    <button class="btn btn-ghost btn-sm" data-gap-invite-decline="${inv.id}">✕</button>
                </div>
            </div>
        `).join('')}
    `;
}

// ============================================
// МОДАЛКА: создать / открыть гап
// ============================================
async function openGapModal(gapId) {
    const modal = document.getElementById('gapModal');
    if (!modal) return;

    if (gapId) {
        // Открываем существующий
        const gap = await loadGapById(gapId);
        if (!gap) {
            showWarningToast('Не удалось загрузить гап');
            return;
        }
        CURRENT_OPEN_GAP = gap;
        renderGapView(gap);
    } else {
        // Создаём новый
        CURRENT_OPEN_GAP = null;
        renderGapCreateForm();
    }

    modal.style.display = 'flex';
}

function renderGapCreateForm() {
    const body = document.getElementById('gapModalBody');
    if (!body) return;

    const citiesOptions = Object.entries(CITIES).map(([key, c]) =>
        `<option value="${key}" ${key === (PLAYER?.currentCity || '') ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    body.innerHTML = `
        <h2>Создать гап</h2>
        <p class="modal-subtitle">Тайный круг друзей. Приглашать — только сам.</p>

        <label class="modal-label">Название</label>
        <input type="text" id="gapNameInput" class="modal-input" placeholder="Например, Чорсу-пятница" maxlength="50">

        <label class="modal-label">Эмодзи</label>
        <div class="gap-emoji-picker" id="gapEmojiPicker">
            ${['☕','🍵','🫖','🍽','🎲','📚','🎵','⚽','🌙','🔥'].map(e =>
                `<button type="button" class="gap-emoji-option${e === '☕' ? ' active' : ''}" data-emoji="${e}">${e}</button>`
            ).join('')}
        </div>

        <label class="modal-label">Описание</label>
        <textarea id="gapDescInput" class="modal-input" rows="2" placeholder="О чём ваш круг?"></textarea>

        <label class="modal-label">Город</label>
        <select id="gapCityInput" class="modal-input">${citiesOptions}</select>

        <label class="modal-label">Где собираетесь</label>
        <input type="text" id="gapMeetInput" class="modal-input" placeholder="Например, у входа в Чорсу">

        <label class="modal-label">Когда собираетесь</label>
        <select id="gapScheduleInput" class="modal-input">
            <option value="weekly">Каждую неделю</option>
            <option value="biweekly">Раз в две недели</option>
            <option value="monthly">Раз в месяц</option>
            <option value="once">Один раз</option>
        </select>

        <button id="gapCreateSubmit" class="modal-btn">Создать гап</button>
    `;

    // Обработчик эмодзи
    const picker = document.getElementById('gapEmojiPicker');
    if (picker) {
        picker.onclick = (e) => {
            const btn = e.target.closest('.gap-emoji-option');
            if (!btn) return;
            picker.querySelectorAll('.gap-emoji-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
    }
}

function renderGapView(gap) {
    const body = document.getElementById('gapModalBody');
    if (!body) return;

    const membersHtml = (gap.members || []).map(m => `
        <div class="gap-member" data-player-profile="${m.player_id}">
            <div class="gap-member__avatar">${m.avatar}</div>
            <div class="gap-member__name">${escapeHtml(m.name)}</div>
            ${m.role === 'host' ? '<div class="gap-member__role">👑</div>' : ''}
        </div>
    `).join('');

    const isHost = gap.myRole === 'host' || (gap.members || []).some(m => m.player_id === PLAYER?.playerId && m.role === 'host');

    body.innerHTML = `
        <div class="gap-view__header">
            <div class="gap-view__emoji">${gap.avatar_emoji || '☕'}</div>
            <h2>${escapeHtml(gap.name)}</h2>
            <div class="gap-view__city">${cityName(gap.city_key)}</div>
        </div>

        ${gap.description ? `<p class="gap-view__desc">${escapeHtml(gap.description)}</p>` : ''}

        ${gap.meet_point ? `<div class="gap-view__row">📍 ${escapeHtml(gap.meet_point)}</div>` : ''}
        ${gap.schedule ? `<div class="gap-view__row">🕐 ${formatSchedule(gap.schedule)}</div>` : ''}

        <div class="gap-view__section">
            <h3>Участники (${(gap.members || []).length})</h3>
            <div class="gap-members-grid">${membersHtml}</div>
        </div>

        ${isHost ? `
            <button class="btn btn-primary btn-block" id="gapInviteBtn" data-gap-id="${gap.id}">
                ✉️ Пригласить в гап
            </button>
        ` : `
            <button class="btn btn-secondary btn-block" id="gapLeaveBtn" data-gap-id="${gap.id}">
                Выйти из гапа
            </button>
        `}
    `;
}

function formatSchedule(schedule) {
    if (!schedule) return 'Расписание не задано';
    const map = {
        weekly: 'Каждую неделю',
        biweekly: 'Раз в две недели',
        monthly: 'Раз в месяц',
        once: 'Один раз',
    };
    return map[schedule.type] || 'По договорённости';
}

// ============================================
// МОДАЛКА: приглашение игрока
// ============================================
function openGapInviteModal(gapId) {
    const modal = document.getElementById('gapInviteModal');
    if (!modal) return;

    document.getElementById('gapInviteSearch').value = '';
    document.getElementById('gapInviteResults').innerHTML = '';
    document.getElementById('gapInviteSearch').dataset.gapId = gapId;

    modal.style.display = 'flex';
}

async function searchPlayersForGap(query) {
    const container = document.getElementById('gapInviteResults');
    const gapId = document.getElementById('gapInviteSearch').dataset.gapId;
    if (!container) return;

    if (!query || query.length < 2) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = '<div class="dash-empty">⏳ Поиск...</div>';

    const { data, error } = await supabaseClient
        .from('players')
        .select('id, name, avatar, level, current_city')
        .ilike('name', `%${query}%`)
        .neq('id', PLAYER?.playerId)
        .limit(10);

    if (error || !data || data.length === 0) {
        container.innerHTML = '<div class="dash-empty">Никого не нашли</div>';
        return;
    }

    container.innerHTML = data.map(p => `
        <div class="gap-invite-result">
            <div class="gap-invite-result__avatar">${p.avatar || '🧑‍💼'}</div>
            <div class="gap-invite-result__info">
                <div><strong>${escapeHtml(p.name)}</strong></div>
                <div class="gap-invite-result__meta">⭐ ${p.level || 1} · ${p.current_city ? cityName(p.current_city) : '—'}</div>
            </div>
            <button class="btn btn-primary btn-sm" data-gap-invite-send="${p.id}" data-gap-id="${gapId}">
                Пригласить
            </button>
        </div>
    `).join('');
}

// ============================================
// ХЕЛПЕРЫ
// ============================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function cityName(cityKey) {
    if (!cityKey) return '';
    return CITIES[cityKey]?.name || cityKey;
}

// ============================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================
document.addEventListener('click', async (e) => {
    // Открыть карточку гапа
    const gapCard = e.target.closest('.gap-card');
    if (gapCard) {
        openGapModal(gapCard.dataset.gapId);
        return;
    }

    // Кнопка "Создать гап"
    if (e.target.id === 'gapCreateBtn') {
        openGapModal();
        return;
    }

    // Создать гап — submit
    if (e.target.id === 'gapCreateSubmit') {
        const name = document.getElementById('gapNameInput').value.trim();
        if (!name) {
            showWarningToast('Введи название гапа');
            return;
        }
        const emojiBtn = document.querySelector('#gapEmojiPicker .gap-emoji-option.active');
        const emoji = emojiBtn ? emojiBtn.dataset.emoji : '☕';
        const scheduleType = document.getElementById('gapScheduleInput').value;

        const result = await createGap({
            name,
            description: document.getElementById('gapDescInput').value.trim(),
            cityKey: document.getElementById('gapCityInput').value,
            meetPoint: document.getElementById('gapMeetInput').value.trim(),
            avatarEmoji: emoji,
            schedule: { type: scheduleType },
        });

        if (result.error) {
            showWarningToast(result.error);
            return;
        }

        showXPToast(30, 'Новый гап!');
        PLAYER.xp += 30;
        PLAYER.level = getLevelFromXP(PLAYER.xp);
        await savePlayerToServer(PLAYER);
        updatePlayerBadge();

        document.getElementById('gapModal').style.display = 'none';
        if (typeof resetCityStatsCache === 'function') resetCityStatsCache();
        if (typeof renderGapBadges === 'function') renderGapBadges();
        await renderGapsDashboard();
        return;
    }

    // Открыть модалку приглашения
    if (e.target.id === 'gapInviteBtn') {
        openGapInviteModal(e.target.dataset.gapId);
        return;
    }

    // Отправить приглашение
    const inviteSend = e.target.closest('[data-gap-invite-send]');
    if (inviteSend) {
        const toPlayerId = inviteSend.dataset.gapInviteSend;
        const gapId = inviteSend.dataset.gapId;
        const result = await inviteToGap(gapId, toPlayerId);
        if (result.error) {
            showWarningToast(result.error);
            return;
        }
        inviteSend.outerHTML = '<span class="gap-invite-result__sent">✅ Отправлено</span>';
        return;
    }

    // Принять приглашение
    const acceptBtn = e.target.closest('[data-gap-invite-accept]');
    if (acceptBtn) {
        const result = await acceptGapInvite(acceptBtn.dataset.gapInviteAccept);
        if (result.error) {
            showWarningToast(result.error);
            return;
        }
        showWarningToast('✅ Ты в гапе!');
        await renderGapInvites();
        await renderGapsDashboard();
        return;
    }

    // Отклонить приглашение
    const declineBtn = e.target.closest('[data-gap-invite-decline]');
    if (declineBtn) {
        await declineGapInvite(declineBtn.dataset.gapInviteDecline);
        await renderGapInvites();
        return;
    }

    // Выйти из гапа
    if (e.target.id === 'gapLeaveBtn') {
        if (!confirm('Выйти из гапа?')) return;
        await leaveGap(e.target.dataset.gapId);
        document.getElementById('gapModal').style.display = 'none';
        await renderGapsDashboard();
        return;
    }

    // Закрыть модалки
    if (e.target.id === 'gapModal' || e.target.id === 'gapClose') {
        document.getElementById('gapModal').style.display = 'none';
    }
    if (e.target.id === 'gapInviteModal' || e.target.id === 'gapInviteClose') {
        document.getElementById('gapInviteModal').style.display = 'none';
    }
});

// Поиск игроков в модалке приглашения
document.addEventListener('input', (e) => {
    if (e.target.id === 'gapInviteSearch') {
        clearTimeout(window._gapSearchTimeout);
        window._gapSearchTimeout = setTimeout(() => {
            searchPlayersForGap(e.target.value.trim());
        }, 300);
    }
});

// ============================================
// СТАТИСТИКА ГОРОДА: ГАПЫ И ХАШАРЫ
// ============================================
async function renderCityGapHasharStats() {
    if (typeof currentCity === 'undefined' || !currentCity) return;

    // Счётчик гапов
    const gapEl = document.getElementById('cityGapsCount');
    const hasharEl = document.getElementById('cityHasharsCount');
    if (!gapEl && !hasharEl) return;

    try {
        // Гапы — через RPC (там только цифра, без деталей — приватность!)
        if (gapEl) {
            const gapStats = await loadCityGapStats();
            gapEl.textContent = gapStats[currentCity] || 0;
        }

        // Хашары — через RPC
        if (hasharEl) {
            const hasharStats = await loadCityHasharStats();
            hasharEl.textContent = hasharStats[currentCity] || 0;
        }
    } catch (err) {
        console.warn('Ошибка статистики города:', err);
    }
}