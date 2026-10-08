// ============ UI: КАРТОЧКИ МЕСТ ============

// ============================================
// ТЕГИ МЕСТА
// ============================================
const PLACE_TAGS = {
    food:     '<i data-lucide="utensils"></i> Еда',
    history:  '<i data-lucide="landmark"></i> История',
    night:    '<i data-lucide="moon"></i> Ночное',
    quiet:    '<i data-lucide="volume-off"></i> Тихо',
    family:   '<i data-lucide="users"></i> Семейное',
    shopping: '<i data-lucide="shopping-bag"></i> Шоппинг',
    photo:    '<i data-lucide="camera"></i> Фото',
};

function getTagLabel(tag) {
    return PLACE_TAGS[tag] || tag;
}

// ============================================
// РЕНДЕР СЕКЦИЙ
// ============================================
async function renderTransport() {
    const list = CITIES[currentCity].transport[currentTransportType] || [];
    await renderCards('transportList', list, currentTransportType);
}

async function renderHotels() {
    await renderCards('hotelsList', CITIES[currentCity].hotels, 'hotel');
}

async function renderServices() {
    await renderCards('servicesList', CITIES[currentCity].services, 'service');
}

// ============================================
// РЕНДЕР СПИСКА КАРТОЧЕК
// ============================================
async function renderCards(containerId, items, category) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (typeof renderCardsSkeleton === 'function') {
        renderCardsSkeleton(containerId, 3);
    }

    const officialKeys = items.map(item => `${currentCity}|${category}|${item.title}`);
    const userPlaces = (USER_PLACES[currentCity] && USER_PLACES[currentCity][category]) || [];
    const userKeys = userPlaces.map(item => `${currentCity}|${category}|${item.title}`);
    const allKeys = [...officialKeys, ...userKeys];

    let ratings = {};
    try {
        ratings = await loadReviewsForPlaces(allKeys);
    } catch (e) {
        console.warn('Отзывы не загружены:', e);
    }

    let photos = {};
    try {
        photos = await loadPhotosForPlaces(allKeys);
    } catch (e) {
        console.warn('Фото не загружены:', e);
    }

    const officialHtml = items.map(item =>
        buildCardHtml(item, category, { isUserPlace: false, idx: null, ratings, photos })
    ).join('');

    const userHtml = userPlaces.map((item, idx) =>
        buildCardHtml(item, category, { isUserPlace: true, idx, ratings, photos })
    ).join('');

    container.innerHTML = officialHtml + userHtml;

    if (typeof lucide !== 'undefined') {
        requestAnimationFrame(() => lucide.createIcons());
    }

    await loadVisibleReviews();
}

// ============================================
// ШАБЛОН ОДНОЙ КАРТОЧКИ
// ============================================
function buildCardHtml(item, category, options) {
    const { isUserPlace, idx, ratings, photos } = options;

    const checkinKey = `${currentCity}|${category}|${item.title}`;
    const count = (PLAYER && PLAYER.checkins && PLAYER.checkins[checkinKey]) || 0;
    const visited = count > 0;
    const rating = ratings[checkinKey];
    const placePhotos = photos[checkinKey] || [];
    const coverPhoto = placePhotos[0];
    const isMine = isUserPlace && PLAYER && item.playerId === PLAYER.playerId;

    // --- Плашка рейтинга ---
    const ratingBlock = (rating && rating.avg !== null && rating.count > 0) ? `
        <button class="reviews-block__rating reviews-block__rating--clickable"
                data-toggle-reviews="${checkinKey}"
                title="Показать отзывы">
            <strong><i data-lucide="star"></i> ${rating.avg}</strong>
            <span>· ${rating.count} отзыв${rating.count === 1 ? '' : rating.count < 5 ? 'а' : 'ов'}</span>
        </button>
    ` : '';

    // --- Фото-обложка ---
    const photoBlock = coverPhoto ? `
        <div class="place-photo"
             data-lightbox="${coverPhoto.photo_url}"
             data-photos='${JSON.stringify(placePhotos.map(p => p.photo_url))}'
             data-index="0">
            <img src="${coverPhoto.photo_url}" alt="${item.title}" loading="lazy">
            ${placePhotos.length > 1 ? `<span class="place-photo__badge">+${placePhotos.length - 1} фото</span>` : ''}
        </div>
    ` : '';

    // --- Автор (UGC) ---
    const authorAvatarHtml = renderAvatarHtml(item.authorAvatar || '🧑‍💼');
    const authorBlock = isUserPlace ? `
        <div class="card-author" data-player-profile="${item.playerId || ''}" style="cursor:pointer;">
            <span class="avatar">${authorAvatarHtml}</span>
            Добавлено ${escapeHtml(item.author || 'Игрок')}
        </div>
    ` : '';

    // --- Теги ---
    const tagsBlock = (item.tags && item.tags.length > 0) ? `
        <div class="place-tags">
            ${item.tags.map(tag => `<span class="place-tag place-tag--${tag}">${getTagLabel(tag)}</span>`).join('')}
        </div>
    ` : '';

    // --- Кнопки владельца ---
    const ownerBlock = isMine ? `
        <div class="card-actions" style="border-top:none;padding-top:8px;">
            <button class="edit-btn"
                    data-edit-city="${currentCity}"
                    data-edit-cat="${category}"
                    data-edit-idx="${idx}">
                <i data-lucide="pencil"></i> Редактировать
            </button>
            <button class="delete-btn"
                    data-del-city="${currentCity}"
                    data-del-cat="${category}"
                    data-del-idx="${idx}">
                <i data-lucide="trash-2"></i> Удалить
            </button>
        </div>
    ` : '';

    // --- Раскрывающийся блок отзывов ---
    const reviewsBlock = `
        <div class="reviews-block" data-reviews-for="${checkinKey}" style="display:none;">
            <div class="reviews-block__header">
                <button class="reviews-block__rating reviews-block__rating--clickable"
                        data-toggle-reviews="${checkinKey}"
                        title="Показать отзывы">
                    ${rating
                        ? `<strong><i data-lucide="star"></i> ${rating.avg}</strong><span>· ${rating.count}</span>`
                        : `<span>Нет отзывов</span>`}
                </button>
            </div>
            <div class="reviews-list" data-reviews-list="${checkinKey}"></div>
        </div>
    `;

    return `
        <div class="card ${isUserPlace ? 'user-place' : ''}" data-place-key="${checkinKey}">
            ${photoBlock}
            ${authorBlock}
            <h3>${item.title}</h3>
            <p>${item.desc}</p>
            ${tagsBlock}
            <div class="meta"><span>${item.meta[0]}</span><span>${item.meta[1]}</span></div>
            ${ratingBlock}
            <div class="card-actions">
                <button class="checkin-btn" data-key="${checkinKey}">
                    <i data-lucide="check"></i>
                    ${visited ? `Был${count > 1 ? ' ×' + count : ''}` : 'Я здесь'}
                </button>
                <button class="photo-btn"
                        data-add-photo="${checkinKey}"
                        data-place-name="${item.title}"
                        title="Добавить фото">
                    <i data-lucide="camera"></i>${placePhotos.length > 0 ? `<span class="btn-badge">${placePhotos.length}</span>` : ''}
                </button>
                <button class="reviews-toggle-btn"
                        data-add-review="${checkinKey}"
                        data-place-name="${item.title}"
                        title="Написать отзыв">
                    <i data-lucide="message-circle"></i>
                </button>
            </div>
            ${reviewsBlock}
            ${ownerBlock}
        </div>
    `;
}