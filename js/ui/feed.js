// ============ UI: ЛЕНТА ============

let FEED = [];
let currentFeedFilter = 'all';

// ============================================
// ХЕЛПЕР: АВАТАР (URL → img, эмодзи → текст)
// ============================================
if (typeof renderAvatarHtml === 'undefined') {
    window.renderAvatarHtml = function(avatar) {
        if (!avatar) return '🧑‍💼';
        if (typeof avatar === 'string' && avatar.startsWith('http')) {
            return `<img src="${avatar}" alt="" loading="lazy">`;
        }
        return avatar;
    };
}

// ============================================
// РЕНДЕР ЛЕНТЫ
// ============================================
async function renderFeed() {
    if (!PLAYER) return;

    const container = document.getElementById('dashFeed');
    if (!container) return;

    if (currentFeedFilter === 'all' && typeof renderFeedSkeleton === 'function') {
        renderFeedSkeleton('dashFeed', 4);
    }

    FEED = await loadFeed(10, currentFeedFilter);

    let feedLikes = {};
    let feedTags = {};
    if (FEED.length > 0) {
        feedLikes = await loadFeedLikes(FEED.map(f => f.id));

        // Загружаем отметки друзей для чек-инов
        const checkinEvents = FEED.filter(f => f.event_type === 'checkin' && f.id);
        if (checkinEvents.length > 0 && typeof loadCheckinTagsForFeed === 'function') {
            feedTags = await loadCheckinTagsForFeed(checkinEvents);
        }
    }

    let items = FEED;

    if (currentFeedFilter === 'city') {
        // Уже отфильтровано на сервере в loadFeed
        items = FEED;

    } else if (currentFeedFilter === 'mine') {
        items = FEED.filter(item => item.player_id === PLAYER.playerId);

    } else if (currentFeedFilter === 'friends') {
        const friendIds = (typeof FRIENDS !== 'undefined' ? FRIENDS : []).map(f => f.id);

        if (friendIds.length === 0) {
            container.innerHTML = `
                <div class="feed-empty">
                    <p style="margin-bottom: 14px;">Добавь друзей, чтобы видеть их события</p>
                    <button class="btn btn-primary btn-sm" data-open-modal="friendsModal">
                        <i data-lucide="users"></i> Найти друзей
                    </button>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }
        items = await loadFriendsFeed(friendIds, 10);

    } else if (currentFeedFilter === 'recommend') {
        container.innerHTML = renderRecommendations();
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    if (items.length === 0) {
        renderFeedEmpty(container);
        return;
    }

    // Группируем подряд идущие чек-ины одного игрока + дробим по друзьям
    const grouped = groupFeedItems(items, feedTags);

    container.innerHTML = grouped
        .map(item => renderFeedItem(
            item,
            feedLikes[item.id] || { count: 0, myLike: false },
            item._friends || feedTags[item.id] || [],
            feedTags
        ))
        .join('');

    fillFeedAvatars();

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Группировка чек-инов одного игрока за короткое время,
// потом внутри — дробление по составу друзей.
function groupFeedItems(items, allTags = {}) {
    const MAX_CHAIN = 6;              // максимум мест в одном «походе»
    const MAX_GAP_MS = 60 * 60 * 1000; // 1 час между соседними

    const out = [];
    let i = 0;

    while (i < items.length) {
        const cur = items[i];

        if (cur.event_type !== 'checkin') {
            out.push(cur);
            i++;
            continue;
        }

        const chain = [cur];
        let j = i + 1;
        let prevTime = new Date(cur.created_at).getTime();
        const city = cur.city_key;

        while (j < items.length && chain.length < MAX_CHAIN) {
            const next = items[j];
            if (next.event_type !== 'checkin') break;
            if (next.player_id !== cur.player_id) break;
            if (next.city_key !== city) break;

            const t = new Date(next.created_at).getTime();
            if (t - prevTime > MAX_GAP_MS) break;

            chain.push(next);
            prevTime = t;
            j++;
        }

        if (chain.length === 1) {
            out.push(cur);
            i++;
            continue;
        }

        // Разбиваем цепочку на группы по составу друзей
        const groups = new Map(); // ключ: sorted friend ids joined, значение: массив элементов

        chain.forEach(item => {
            const tags = allTags[item.id] || [];
            const friendIds = tags.map(t => t.id).sort();
            const key = friendIds.length === 0 ? '__alone__' : friendIds.join(',');
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push({ item, tags });
        });

        // Превращаем группы в feed-элементы
        groups.forEach((groupItems, key) => {
            const first = groupItems[0].item;

            if (groupItems.length === 1 && key === '__alone__') {
                // Один чек-ин без друзей — как есть
                out.push(first);
                return;
            }

            if (groupItems.length === 1) {
                // Один чек-ин с друзьями — тоже как есть (с тегами)
                out.push(first);
                return;
            }

            // Несколько чек-инов в одной группе — объединяем
            const friendsForGroup = groupItems[0].tags;
            const merged = {
                ...first,
                _merged: true,
                _friends: friendsForGroup,
                _places: groupItems.map(({ item }) => ({
                    place: item.event_data?.place || 'место',
                    checkinId: item.event_data?.checkinId || null,
                    feedId: item.id,
                })),
            };
            out.push(merged);
        });

        i = j;
    }

    // Пересортировка: свежие события первой
    out.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return out;
}
function renderFeedEmpty(container) {
    const cityName = PLAYER && PLAYER.currentCity && CITIES[PLAYER.currentCity]
        ? CITIES[PLAYER.currentCity].name
        : 'твоём городе';

    let ctaHtml = '';

    if (currentFeedFilter === 'mine') {
        ctaHtml = `
            <p style="margin-bottom: 14px;">У тебя пока нет событий</p>
            <button class="btn btn-primary btn-sm" data-scroll="map">
                <i data-lucide="map"></i> Открыть карту
            </button>
        `;
    } else if (currentFeedFilter === 'city') {
        ctaHtml = `
            <p style="margin-bottom: 14px;">В <strong>${escapeHtml(cityName)}</strong> пока тихо</p>
            <button class="btn btn-primary btn-sm" data-scroll="map">
                <i data-lucide="map"></i> Отметиться первым
            </button>
        `;
    } else {
        ctaHtml = `
            <p style="margin-bottom: 14px;">Пока пусто. Сделай чек-ин или добавь место!</p>
            <button class="btn btn-primary btn-sm" data-scroll="map">
                <i data-lucide="map"></i> К карте
            </button>
        `;
    }

    container.innerHTML = `<div class="feed-empty">${ctaHtml}</div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// ОДНО СОБЫТИЕ
// ============================================
function renderFeedItem(item, likeInfo, taggedFriends, allTags = {}) {
    const player = item.players || {};
    const name = player.name || 'Игрок';
    const avatar = player.avatar || '🧑‍💼';
    const data = item.event_data || {};
    const cityName = item.city_key && CITIES[item.city_key] ? CITIES[item.city_key].name : '';
    const pid = item.player_id || '';

    const nameHtml = `<strong class="feed-player-link" data-player-profile="${pid}" style="cursor:pointer;">${escapeHtml(name)}</strong>`;

    let text = '';

    switch (item.event_type) {
        case 'checkin': {
            // Строим список отмеченных друзей (для одиночного события)
            let withHtml = '';
            if (taggedFriends && taggedFriends.length > 0) {
                const friendNames = taggedFriends.map(f => escapeHtml(f.name)).join(', ');
                withHtml = ` <span class="feed-with">с ${friendNames}</span>`;
            }

            if (item._merged && item._places && item._places.length > 1) {
                // Объединённый чек-ин с общей компанией
                const placesHtml = item._places
                    .map(p => `<strong>${escapeHtml(p.place)}</strong>`)
                    .join(' · ');

                const friendsNames = (item._friends || [])
                    .map(f => escapeHtml(f.name))
                    .join(', ');

                const withFriendsAll = friendsNames
                    ? ` <span class="feed-with">с ${friendsNames}</span>`
                    : '';

                text = `${nameHtml} был в ${item._places.length} местах: ${placesHtml}${withFriendsAll}${cityName ? ` (${escapeHtml(cityName)})` : ''}`;
            } else {
                text = `${nameHtml} был в <strong>${escapeHtml(data.place || 'месте')}</strong>${cityName ? ` (${escapeHtml(cityName)})` : ''}${withHtml}`;
            }
            break;
        }
        case 'ugc':
            text = `${nameHtml} добавил место <strong>${escapeHtml(data.title || '')}</strong>${cityName ? ` в ${escapeHtml(cityName)}` : ''}`;
            break;
        case 'quest':
            text = `${nameHtml} выполнил квест <strong>${escapeHtml(data.questName || '')}</strong>`;
            break;
        case 'badge':
            text = `${nameHtml} получил бейдж <strong>${escapeHtml(data.badgeName || '')}</strong>`;
            break;
        case 'plan':
            text = `${nameHtml} запланировал визит${cityName ? ` в <strong>${escapeHtml(cityName)}</strong>` : ''}`;
            break;
        case 'level':
            text = `${nameHtml} достиг <strong>уровня ${data.level || ''}</strong>`;
            break;
        default:
            text = `${nameHtml} что-то сделал`;
    }

    const avatarHtml = renderAvatarHtml(avatar);

    const likeData = likeInfo || { count: 0, myLike: false };
    const likeClass = likeData.myLike ? 'feed-like feed-like--active' : 'feed-like';

    return `
        <div class="feed-item ${item._merged ? 'feed-item--merged' : ''}" data-player-id="${pid}">
            <div class="feed-item__avatar" data-player-profile="${pid}" style="cursor:pointer;">${avatarHtml}</div>
            <div class="feed-item__body">
                <div class="feed-item__text">${text}</div>
                <div class="feed-item__footer">
                    <div class="feed-item__time">
                        ${item._merged ? `<span class="feed-merged-badge">${item._places.length} мест</span>` : ''}
                        ${timeAgo(item.created_at)}
                    </div>
                    <button class="${likeClass}" data-feed-like="${item.id}">
                        <i data-lucide="heart"></i>
                        <span class="feed-like__count">${likeData.count || ''}</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// ДОЗАГРУЗКА АВАТАРОВ
// ============================================
async function fillFeedAvatars() {
    const items = document.querySelectorAll('.feed-item[data-player-id]');
    const idsToLoad = new Set();

    items.forEach(el => {
        const avatarEl = el.querySelector('.feed-item__avatar');
        if (!avatarEl) return;
        if (avatarEl.querySelector('img')) return;

        const text = avatarEl.textContent.trim();
        if (text && !text.startsWith('http')) return;

        const pid = el.dataset.playerId;
        if (pid) idsToLoad.add(pid);
    });

    if (idsToLoad.size === 0) return;

    const { data, error } = await _supabase
        .from('players')
        .select('id, avatar')
        .in('id', [...idsToLoad]);

    if (error || !data) return;

    const map = {};
    data.forEach(p => { map[p.id] = p.avatar || '🧑‍💼'; });

    items.forEach(el => {
        const pid = el.dataset.playerId;
        const avatarEl = el.querySelector('.feed-item__avatar');
        if (!avatarEl || !pid || !map[pid]) return;

        avatarEl.innerHTML = renderAvatarHtml(map[pid]);
    });
}

// ============================================
// РЕКОМЕНДАЦИИ
// ============================================
function renderRecommendations() {
    if (!PLAYER) return '';

    const recommendations = [];

    // 1. Новые UGC-места в моих городах
    const visitedCities = Object.keys(PLAYER.visitedCities || {});
    const myCities = [PLAYER.homeCity, PLAYER.currentCity, ...visitedCities]
        .filter((v, i, a) => v && a.indexOf(v) === i);

    const allPlaces = [];
    Object.entries(USER_PLACES || {}).forEach(([city, cats]) => {
        if (!myCities.includes(city)) return;
        Object.entries(cats).forEach(([cat, places]) => {
            places.forEach(place => {
                if (place.playerId !== PLAYER.playerId) {
                    allPlaces.push({ city, cat, place });
                }
            });
        });
    });

    allPlaces.slice(0, 3).forEach(({ city, place }) => {
        recommendations.push({
            icon: 'building-2',
            text: `Новое место в <strong>${escapeHtml(CITIES[city].name)}</strong>: <strong>${escapeHtml(place.title)}</strong>`,
        });
    });

    // 2. Ближайший план
    if (typeof PLANS !== 'undefined' && PLANS.length > 0) {
        const next = PLANS[0];
        const cityName = CITIES[next.city_key] ? CITIES[next.city_key].name : '';
        recommendations.push({
            icon: 'calendar-plus',
            text: `Не забудь: <strong>${escapeHtml(cityName)}</strong> ${next.place_title ? `— ${escapeHtml(next.place_title)}` : ''} (${formatDate(next.visit_date)})`,
        });
    }

    // 3. Непосещённые места
    if (myCities.length > 0) {
        const cityName = CITIES[PLAYER.currentCity]?.name || '';
        recommendations.push({
            icon: 'target',
            text: `В <strong>${cityName}</strong> есть непосещённые места — загляни!`,
        });
    }

    // 4. Квесты близко к выполнению
    const nearQuests = QUESTS
        .filter(q => !PLAYER.completedQuests.includes(q.id))
        .map(q => ({ q, r: checkQuest(q) }))
        .filter(({ r }) => r.progress[0] / r.progress[1] >= 0.6)
        .slice(0, 2);

    nearQuests.forEach(({ q, r }) => {
        recommendations.push({
            icon: q.icon || 'target',
            text: `Квест <strong>${escapeHtml(q.name)}</strong> почти готов: ${r.progress[0]} / ${r.progress[1]}`,
        });
    });

    if (recommendations.length === 0) {
        return `
            <div class="feed-empty">
                Пока нет рекомендаций. Исследуй города!
            </div>
        `;
    }

    return recommendations.map(r => `
        <div class="feed-item feed-item--recommend">
            <div class="feed-item__avatar">
                <i data-lucide="${r.icon}"></i>
            </div>
            <div class="feed-item__body">
                <div class="feed-item__text">${r.text}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// ВРЕМЯ
// ============================================
function timeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);

    if (isNaN(then.getTime())) return '';

    const diffSec = Math.floor((now - then) / 1000);

    if (diffSec < 60) return 'только что';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} мин назад`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ч назад`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} дн назад`;

    return formatDate(timestamp);
}

// ============================================
// ЛАЙКИ — ОБРАБОТЧИК
// ============================================
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-feed-like]');
    if (!btn || !PLAYER) return;

    const feedId = btn.dataset.feedLike;
    if (!feedId) return;

    if (btn.dataset.loading === '1') return;
    btn.dataset.loading = '1';

    const result = await toggleFeedLike(feedId);
    btn.dataset.loading = '';

    if (result.error) {
        if (typeof showWarningToast === 'function') showWarningToast('Не удалось поставить лайк');
        return;
    }

    const countEl = btn.querySelector('.feed-like__count');
    let currentCount = parseInt(countEl?.textContent) || 0;

    if (result.liked) {
        btn.classList.add('feed-like--active');
        currentCount += 1;
    } else {
        btn.classList.remove('feed-like--active');
        currentCount = Math.max(0, currentCount - 1);
    }

    if (countEl) {
        countEl.textContent = currentCount > 0 ? currentCount : '';
    }
});