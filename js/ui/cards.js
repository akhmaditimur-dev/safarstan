// ============ UI: КАРТОЧКИ МЕСТ ============

async function renderCards(containerId, items, category) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const officialKeys = items.map(item => `${currentCity}|${category}|${item.title}`);
    const userPlaces = (USER_PLACES[currentCity] && USER_PLACES[currentCity][category]) || [];
    const userKeys = userPlaces.map(item => `${currentCity}|${category}|${item.title}`);
    const allKeys = [...officialKeys, ...userKeys];

    // Рейтинги
    let ratings = {};
    try {
        ratings = await loadReviewsForPlaces(allKeys);
    } catch (e) {
        console.warn('Отзывы не загружены:', e);
    }

    // Фото
    let photos = {};
    try {
        photos = await loadPhotosForPlaces(allKeys);
    } catch (e) {
        console.warn('Фото не загружены:', e);
    }

    // Официальные места
    const officialHtml = items.map((item) => {
        const checkinKey = `${currentCity}|${category}|${item.title}`;
        const count = (PLAYER && PLAYER.checkins && PLAYER.checkins[checkinKey]) || 0;
        const visited = count > 0;
        const rating = ratings[checkinKey];
        const placePhotos = photos[checkinKey] || [];
        const coverPhoto = placePhotos[0];

        return `
            <div class="card" data-place-key="${checkinKey}">
                ${coverPhoto ? `
                    <div class="place-photo"
                         data-lightbox="${coverPhoto.photo_url}"
                         data-photos='${JSON.stringify(placePhotos.map(p => p.photo_url))}'
                         data-index="0">
                        <img src="${coverPhoto.photo_url}" alt="${item.title}" loading="lazy">
                        ${placePhotos.length > 1 ? `<span class="place-photo__badge">+${placePhotos.length - 1} фото</span>` : ''}
                    </div>
                ` : ''}
                <h3>${item.title}</h3>
                <p>${item.desc}</p>
                <div class="meta"><span>${item.meta[0]}</span><span>${item.meta[1]}</span></div>
                ${rating ? `
                    <div class="reviews-block__rating">
                        <strong>⭐ ${rating.avg}</strong>
                        <span>· ${rating.count} отзыв${rating.count === 1 ? '' : rating.count < 5 ? 'а' : 'ов'}</span>
                    </div>
                ` : ''}
                <div class="card-actions">
                    <button class="checkin-btn" data-key="${checkinKey}">
                        ${visited ? `✓ Был${count > 1 ? ' ×' + count : ''}` : '✅ Я здесь'}
                    </button>
                    <button class="photo-btn" data-add-photo="${checkinKey}" data-place-name="${item.title}" title="Добавить фото">
                        📸${placePhotos.length > 0 ? `<span class="btn-badge">${placePhotos.length}</span>` : ''}
                    </button>
                    <button class="reviews-toggle-btn" data-toggle-reviews="${checkinKey}" title="Отзывы">
                        💬${rating && rating.count > 0 ? `<span class="btn-badge">${rating.count}</span>` : ''}
                    </button>
                </div>
                <div class="reviews-block" data-reviews-for="${checkinKey}" style="display:none;">
                    <div class="reviews-block__header">
                        <div class="reviews-block__rating">
                            ${rating 
                                ? `<strong>⭐ ${rating.avg}</strong><span>· ${rating.count}</span>` 
                                : `<span>Нет отзывов</span>`
                            }
                        </div>
                        <button class="reviews-block__btn" data-add-review="${checkinKey}" data-place-name="${item.title}">
                            💬 Написать отзыв
                        </button>
                    </div>
                    <div class="reviews-list" data-reviews-list="${checkinKey}"></div>
                </div>
                <div class="reviews-block" data-reviews-for="${checkinKey}">
                    <div class="reviews-block__header">
                        <div class="reviews-block__rating">
                            ${rating 
                                ? `<strong>⭐ ${rating.avg}</strong><span>· ${rating.count}</span>` 
                                : `<span>Нет отзывов</span>`
                            }
                        </div>
                        <button class="reviews-block__btn" data-add-review="${checkinKey}" data-place-name="${item.title}">
                            💬 Отзыв
                        </button>
                    </div>
                    <div class="reviews-list" data-reviews-list="${checkinKey}"></div>
                </div>
            </div>
        `;
    }).join('');

    // UGC
    const userHtml = userPlaces.map((item, idx) => {
        const checkinKey = `${currentCity}|${category}|${item.title}`;
        const count = (PLAYER && PLAYER.checkins && PLAYER.checkins[checkinKey]) || 0;
        const visited = count > 0;
        const isMine = PLAYER && item.playerId === PLAYER.playerId;
        const rating = ratings[checkinKey];
        const placePhotos = photos[checkinKey] || [];
        const coverPhoto = placePhotos[0];

        return `
            <div class="card user-place" data-place-key="${checkinKey}">
                ${coverPhoto ? `
                    <div class="place-photo"
                         data-lightbox="${coverPhoto.photo_url}"
                         data-photos='${JSON.stringify(placePhotos.map(p => p.photo_url))}'
                         data-index="0">
                        <img src="${coverPhoto.photo_url}" alt="${item.title}" loading="lazy">
                        ${placePhotos.length > 1 ? `<span class="place-photo__badge">+${placePhotos.length - 1} фото</span>` : ''}
                    </div>
                ` : ''}
                <div class="card-author" data-player-profile="${item.playerId || ''}" style="cursor:pointer;">
                    <span class="avatar">${item.authorAvatar || '🧑‍💼'}</span>
                    Добавлено ${item.author}
                </div>
                <h3>${item.title}</h3>
                <p>${item.desc}</p>
                <div class="meta"><span>${item.meta[0]}</span><span>${item.meta[1]}</span></div>
                ${rating ? `
                    <div class="reviews-block__rating">
                        <strong>⭐ ${rating.avg}</strong>
                        <span>· ${rating.count} отзыв${rating.count === 1 ? '' : rating.count < 5 ? 'а' : 'ов'}</span>
                    </div>
                ` : ''}
                <div class="card-actions">
                    <button class="checkin-btn" data-key="${checkinKey}">
                        ${visited ? `✓ Был${count > 1 ? ' ×' + count : ''}` : '✅ Я здесь'}
                    </button>
                    <button class="photo-btn" data-add-photo="${checkinKey}" data-place-name="${item.title}" title="Добавить фото">
                        📸${placePhotos.length > 0 ? `<span class="btn-badge">${placePhotos.length}</span>` : ''}
                    </button>
                    <button class="reviews-toggle-btn" data-toggle-reviews="${checkinKey}" title="Отзывы">
                        💬${rating && rating.count > 0 ? `<span class="btn-badge">${rating.count}</span>` : ''}
                    </button>
                </div>
                <div class="reviews-block" data-reviews-for="${checkinKey}" style="display:none;">
                    <div class="reviews-block__header">
                        <div class="reviews-block__rating">
                            ${rating 
                                ? `<strong>⭐ ${rating.avg}</strong><span>· ${rating.count}</span>` 
                                : `<span>Нет отзывов</span>`
                            }
                        </div>
                        <button class="reviews-block__btn" data-add-review="${checkinKey}" data-place-name="${item.title}">
                            💬 Написать отзыв
                        </button>
                    </div>
                    <div class="reviews-list" data-reviews-list="${checkinKey}"></div>
                </div>
                ${isMine ? `
                    <div class="card-actions" style="border-top:none;padding-top:8px;">
                        <button class="edit-btn" data-edit-city="${currentCity}" data-edit-cat="${category}" data-edit-idx="${idx}">✏️ Редактировать</button>
                        <button class="delete-btn" data-del-city="${currentCity}" data-del-cat="${category}" data-del-idx="${idx}">🗑 Удалить</button>
                    </div>
                ` : ''}
                <div class="reviews-block" data-reviews-for="${checkinKey}">
                    <div class="reviews-block__header">
                        <div class="reviews-block__rating">
                            ${rating 
                                ? `<strong>⭐ ${rating.avg}</strong><span>· ${rating.count}</span>` 
                                : `<span>Нет отзывов</span>`
                            }
                        </div>
                        <button class="reviews-block__btn" data-add-review="${checkinKey}" data-place-name="${item.title}">
                            💬 Отзыв
                        </button>
                    </div>
                    <div class="reviews-list" data-reviews-list="${checkinKey}"></div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = officialHtml + userHtml;

    setTimeout(() => loadVisibleReviews(), 100);
}

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