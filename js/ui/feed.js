// ============ UI: ЛЕНТА ============

let FEED = [];
let currentFeedFilter = 'all';

async function renderFeed() {
    if (!PLAYER) return;

    FEED = await loadFeed(10);

    const container = document.getElementById('dashFeed');
    if (!container) return;

    let items = FEED;

    if (currentFeedFilter === 'mine') {
        items = FEED.filter(item => item.player_id === PLAYER.playerId);
    } else if (currentFeedFilter === 'friends') {
        const friendIds = (typeof FRIENDS !== 'undefined' ? FRIENDS : []).map(f => f.id);
        if (friendIds.length === 0) {
            container.innerHTML = '<div class="feed-empty">Добавь друзей, чтобы видеть их события 👥</div>';
            return;
        }
        items = await loadFriendsFeed(friendIds, 10);
    } else if (currentFeedFilter === 'recommend') {
        container.innerHTML = renderRecommendations();
        return;
    }

    if (items.length === 0) {
        container.innerHTML = `
            <div class="feed-empty">
                Пока пусто. Сделай чек-ин или добавь место! 🎯
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(item => renderFeedItem(item)).join('');

    // Дозагрузка аватаров (если ссылка на игрока не пришла с бэка)
    fillFeedAvatars();
}

// ============================================
// ОТРИСОВКА ОДНОГО СОБЫТИЯ
// ============================================
function renderFeedItem(item) {
    const player = item.players || {};
    const name = player.name || 'Игрок';
    const avatar = player.avatar || '🧑‍💼';
    const data = item.event_data || {};
    const cityName = item.city_key && CITIES[item.city_key] ? CITIES[item.city_key].name : '';

    let text = '';

    switch (item.event_type) {
        case 'checkin':
            text = `<strong>${name}</strong> был в <strong>${data.place || 'месте'}</strong>${cityName ? ` (${cityName})` : ''}`;
            break;
        case 'ugc':
            text = `<strong>${name}</strong> добавил место <strong>${data.title || ''}</strong>${cityName ? ` в ${cityName}` : ''}`;
            break;
        case 'quest':
            text = `<strong>${name}</strong> выполнил квест <strong>${data.questName || ''}</strong> 🎯`;
            break;
        case 'badge':
            text = `<strong>${name}</strong> получил бейдж <strong>${data.badgeName || ''}</strong> ${data.badgeIcon || ''}`;
            break;
        case 'plan':
            text = `<strong>${name}</strong> запланировал визит${cityName ? ` в <strong>${cityName}</strong>` : ''}`;
            break;
        case 'level':
            text = `<strong>${name}</strong> достиг <strong>уровня ${data.level || ''}</strong> ⭐`;
            break;
        default:
            text = `<strong>${name}</strong> что-то сделал`;
    }

    // Аватар: эмодзи или <img>
    const avatarHtml = avatar.startsWith('http')
        ? `<img src="${avatar}" alt="avatar" loading="lazy">`
        : avatar;

    return `
        <div class="feed-item" data-player-id="${item.player_id || ''}">
            <div class="feed-item__avatar" data-player-profile="${item.player_id || ''}" style="cursor:pointer;">${avatarHtml}</div>
            <div class="feed-item__body">
                <div class="feed-item__text">${text}</div>
                <div class="feed-item__time">${timeAgo(item.created_at)}</div>
            </div>
        </div>
    `;
}

// ============================================
// ДОЗАГРУЗКА АВАТАРОВ (если бэк вернул без players)
// ============================================
async function fillFeedAvatars() {
    const items = document.querySelectorAll('.feed-item[data-player-id]');
    const idsToLoad = new Set();

    items.forEach(el => {
        const avatarEl = el.querySelector('.feed-item__avatar');
        const img = avatarEl?.querySelector('img');
        // Нужно дозагрузить, если аватар — не img и не эмодзи
        if (!img && avatarEl && !avatarEl.textContent.match(/\p{Emoji}/u)) {
            const pid = el.dataset.playerId;
            if (pid) idsToLoad.add(pid);
        }
    });

    if (idsToLoad.size === 0) return;

    // Загружаем всех игроков одним запросом
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

        const av = map[pid];
        if (av.startsWith('http')) {
            avatarEl.innerHTML = `<img src="${av}" alt="avatar" loading="lazy">`;
        } else {
            avatarEl.textContent = av;
        }
    });
}

// ============================================
// РЕКОМЕНДАЦИИ
// ============================================
function renderRecommendations() {
    if (!PLAYER) return '';

    const recommendations = [];

    // 1. Новые места в моих городах (UGC)
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
            icon: '🏙',
            text: `Новое место в <strong>${CITIES[city].name}</strong>: <strong>${place.title}</strong>`,
        });
    });

    // 2. Ближайший план
    if (typeof PLANS !== 'undefined' && PLANS.length > 0) {
        const next = PLANS[0];
        const cityName = CITIES[next.city_key] ? CITIES[next.city_key].name : '';
        recommendations.push({
            icon: '📌',
            text: `Не забудь: <strong>${cityName}</strong> ${next.place_title ? `— ${next.place_title}` : ''} (${formatDate(next.visit_date)})`,
        });
    }

    // 3. Что можно сделать
    if (myCities.length > 0) {
        const cityName = CITIES[PLAYER.currentCity]?.name || '';
        recommendations.push({
            icon: '🎯',
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
            icon: q.icon,
            text: `Квест <strong>${q.name}</strong> почти готов: ${r.progress[0]} / ${r.progress[1]}`,
        });
    });

    if (recommendations.length === 0) {
        return `<div class="feed-empty">Пока нет рекомендаций. Исследуй города! 🗺</div>`;
    }

    return recommendations.map(r => `
        <div class="feed-item feed-item--recommend">
            <div class="feed-item__avatar">${r.icon}</div>
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