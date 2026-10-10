// ============ UI: АФИША ============

let AFFICHE_EVENTS = [];
let AFFICHE_ATTENDEES = {}; // eventId -> { count, players }
let AFFICHE_LOADED = false;

async function renderAffiche() {
    const track = document.getElementById('afficheTrack');
    if (!track || !PLAYER) return;

    track.innerHTML = '<div class="affiche-loading">⏳ Загрузка...</div>';

    const cityKey = PLAYER.currentCity || null;
    AFFICHE_EVENTS = await loadAfficheEvents(cityKey, 90);
    AFFICHE_LOADED = true;

    if (AFFICHE_EVENTS.length === 0) {
        track.innerHTML = `
            <div class="affiche-empty">
                <p>В ${escapeHtml(CITIES[cityKey]?.name || 'городе')} пока нет событий</p>
            </div>
        `;
        return;
    }

    AFFICHE_ATTENDEES = await loadAfficheAttendees(AFFICHE_EVENTS.map(e => e.id));

    track.innerHTML = AFFICHE_EVENTS.map(renderAfficheCard).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Кнопки прокрутки
    updateAfficheArrows();
}

function renderAfficheCard(event) {
    const attendees = AFFICHE_ATTENDEES[event.id] || { count: 0, players: [] };
    const iAmGoing = PLAYER && attendees.players.includes(PLAYER.playerId);

    const photo = event.photo_url || getDefaultAffichePhoto();
    const date = new Date(event.date_start + 'T00:00:00');
    const dateLabel = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    const priceHtml = event.price
        ? `<span class="affiche-card__price">${escapeHtml(event.price)}</span>`
        : '';

    const partnerBadge = event.source_type === 'partner'
        ? '<span class="affiche-card__badge affiche-card__badge--partner">Партнёр</span>'
        : event.source_type === 'paid'
            ? '<span class="affiche-card__badge affiche-card__badge--paid">Реклама</span>'
            : '';

    const buyBtn = event.link
        ? `<a class="affiche-card__buy" href="${escapeHtml(event.link)}" target="_blank" rel="noopener">Купить билет</a>`
        : '';

    return `
        <div class="affiche-card" data-affiche-id="${event.id}">
            <div class="affiche-card__photo">
                <img src="${photo}" alt="${escapeHtml(event.title)}" loading="lazy">
                <span class="affiche-card__date">${dateLabel}</span>
                ${partnerBadge}
            </div>
            <div class="affiche-card__body">
                <h4 class="affiche-card__title">${escapeHtml(event.title)}</h4>
                ${event.venue ? `<div class="affiche-card__venue"><i data-lucide="map-pin"></i> ${escapeHtml(event.venue)}</div>` : ''}
                ${priceHtml}
                <div class="affiche-card__actions">
                    <button class="affiche-card__going ${iAmGoing ? 'active' : ''}"
                            data-affiche-going="${event.id}">
                        <i data-lucide="${iAmGoing ? 'check' : 'plus'}"></i>
                        <span>${iAmGoing ? 'Иду' : 'Пойду'}</span>
                        ${attendees.count > 0 ? `<span class="affiche-card__count">${attendees.count}</span>` : ''}
                    </button>
                    ${buyBtn}
                </div>
            </div>
        </div>
    `;
}

// Стрелки прокрутки (показываем/скрываем по факту)
function updateAfficheArrows() {
    const track = document.getElementById('afficheTrack');
    const prev = document.getElementById('affichePrev');
    const next = document.getElementById('afficheNext');
    if (!track || !prev || !next) return;

    const hasScroll = track.scrollWidth > track.clientWidth + 4;
    prev.style.display = hasScroll ? 'flex' : 'none';
    next.style.display = hasScroll ? 'flex' : 'none';
}