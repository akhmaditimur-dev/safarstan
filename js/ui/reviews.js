// ============ UI: ОТЗЫВЫ ============

// Кэш отзывов по местам + состояние сортировки и раскрытия
const REVIEWS_CACHE = {};       // placeKey -> массив отзывов
const REVIEWS_SORT = {};        // placeKey -> 'new' | 'high' | 'low'
const REVIEWS_EXPANDED = {};    // placeKey -> true/false

async function loadVisibleReviews() {
    const blocks = document.querySelectorAll('.reviews-block[data-reviews-for]');

    for (const block of blocks) {
        const placeKey = block.dataset.reviewsFor;
        const listEl = block.querySelector(`[data-reviews-list="${placeKey}"]`);
        if (!listEl) continue;

        try {
            // Если уже загружали — берём из кэша
            let reviews = REVIEWS_CACHE[placeKey];
            if (!reviews) {
                reviews = await loadReviews(placeKey);
                REVIEWS_CACHE[placeKey] = reviews;
            }

            if (reviews.length === 0) {
                listEl.innerHTML = `
                    <div class="reviews-empty">
                        Отзывов пока нет. Будь первым!
                    </div>
                `;
                // Скрываем тулбар/футер, если их добавили
                const toolbar = block.querySelector('.reviews-sort');
                if (toolbar) toolbar.style.display = 'none';
                const footer = block.querySelector('.reviews-footer');
                if (footer) footer.style.display = 'none';
                continue;
            }

            renderReviewsForBlock(placeKey, listEl);
        } catch (e) {
            console.warn('Ошибка загрузки отзывов для', placeKey, e);
            listEl.innerHTML = '<div class="reviews-empty">Ошибка загрузки</div>';
        }
    }

    if (typeof lucide !== 'undefined') {
        requestAnimationFrame(() => lucide.createIcons());
    }
}

// Применить сортировку к массиву
function sortReviews(reviews, sortKey) {
    const arr = reviews.slice();
    if (sortKey === 'high') {
        arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortKey === 'low') {
        arr.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else {
        // 'new' — по умолчанию новые сверху (сервер уже отдал так, но пересортируем на всякий)
        arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return arr;
}

// Отрисовать список отзывов конкретного места
function renderReviewsForBlock(placeKey, listEl) {
    const all = REVIEWS_CACHE[placeKey] || [];
    const sortKey = REVIEWS_SORT[placeKey] || 'new';
    const expanded = REVIEWS_EXPANDED[placeKey] === true;

    const sorted = sortReviews(all, sortKey);
    const visible = expanded ? sorted : sorted.slice(0, 3);

    listEl.innerHTML = visible.map(rev => renderReviewItem(rev)).join('');

    // Селект сортировки
    const block = listEl.closest('.reviews-block');
    const sortEl = block ? block.querySelector('.reviews-sort select') : null;
    if (sortEl && sortEl.value !== sortKey) {
        sortEl.value = sortKey;
    }

    // Футер «Показано X из N / Показать все»
    const footer = block ? block.querySelector('.reviews-footer') : null;
    if (footer) {
        if (all.length <= 3) {
            footer.style.display = 'none';
        } else {
            footer.style.display = '';
            const label = expanded
                ? `Показано ${all.length} из ${all.length}`
                : `Показано 3 из ${all.length}`;
            const btnHtml = expanded
                ? `<button type="button" class="reviews-footer__btn" data-reviews-collapse="${placeKey}">Свернуть</button>`
                : `<button type="button" class="reviews-footer__btn" data-reviews-expand="${placeKey}">Показать все</button>`;
            footer.innerHTML = `<span class="reviews-footer__label">${label}</span>${btnHtml}`;
        }
    }
}

function renderReviewItem(review) {
    const player = review.players || {};
    const name = player.name || 'Игрок';
    const avatar = player.avatar || '🧑‍💼';
    const isMine = PLAYER && review.player_id === PLAYER.playerId;
    const canReport = PLAYER && review.player_id !== PLAYER.playerId;

    const iconStar = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    const iconPencil = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>';
    const iconTrash = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    const iconFlag = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>';

    let stars = '';
    if (review.rating) {
        const filled = `<span class="star-filled">${iconStar}</span>`.repeat(review.rating);
        const empty = `<span class="star-empty">${iconStar}</span>`.repeat(5 - review.rating);
        stars = filled + empty;
    }

    const avatarHtml = renderAvatarHtml(avatar);

    return `
        <div class="review-item">
            <div class="review-item__avatar" data-player-profile="${review.player_id || ''}" style="cursor:pointer;">${avatarHtml}</div>
            <div class="review-item__body">
                <div class="review-item__header">
                    <span class="review-item__name" data-player-profile="${review.player_id || ''}" style="cursor:pointer;">${escapeHtml(name)}</span>
                    ${stars ? `<span class="review-item__rating">${stars}</span>` : ''}
                </div>
                <div class="review-item__text">${escapeHtml(review.text)}</div>
                <div class="review-item__time">${timeAgo(review.created_at)}</div>
            </div>
            ${isMine ? `
                <div class="review-item__actions">
                    <button class="review-item__edit" data-edit-review="${review.id}" title="Редактировать">
                        ${iconPencil}
                    </button>
                    <button class="review-item__delete" data-delete-review="${review.id}" title="Удалить">
                        ${iconTrash}
                    </button>
                </div>
            ` : ''}
            ${canReport ? `
                <div class="review-item__actions">
                    <button class="review-item__report" data-report="${review.id}" data-report-type="review" data-report-label="Отзыв: ${escapeHtml(name)}" title="Пожаловаться">
                        ${iconFlag}
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

function renderAvatarHtml(avatar) {
    if (!avatar) return '🧑‍💼';
    if (typeof avatar === 'string' && avatar.startsWith('http')) {
        return `<img src="${avatar}" alt="" loading="lazy">`;
    }
    return avatar;
}

if (typeof escapeHtml === 'undefined') {
    window.escapeHtml = function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
}

function renderReviewItem(review) {
    const player = review.players || {};
    const name = player.name || 'Игрок';
    const avatar = player.avatar || '🧑‍💼';
    const isMine = PLAYER && review.player_id === PLAYER.playerId;
    const canReport = PLAYER && review.player_id !== PLAYER.playerId;

    // Готовые SVG-иконки (без lucide)
    const iconStar = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    const iconPencil = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>';
    const iconTrash = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    const iconFlag = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>';

    let stars = '';
    if (review.rating) {
        const filled = `<span class="star-filled">${iconStar}</span>`.repeat(review.rating);
        const empty = `<span class="star-empty">${iconStar}</span>`.repeat(5 - review.rating);
        stars = filled + empty;
    }

    const avatarHtml = renderAvatarHtml(avatar);

    return `
        <div class="review-item">
            <div class="review-item__avatar" data-player-profile="${review.player_id || ''}" style="cursor:pointer;">${avatarHtml}</div>
            <div class="review-item__body">
                <div class="review-item__header">
                    <span class="review-item__name" data-player-profile="${review.player_id || ''}" style="cursor:pointer;">${escapeHtml(name)}</span>
                    ${stars ? `<span class="review-item__rating">${stars}</span>` : ''}
                </div>
                <div class="review-item__text">${escapeHtml(review.text)}</div>
                <div class="review-item__time">${timeAgo(review.created_at)}</div>
            </div>
            ${isMine ? `
                <div class="review-item__actions">
                    <button class="review-item__edit" data-edit-review="${review.id}" title="Редактировать">
                        ${iconPencil}
                    </button>
                    <button class="review-item__delete" data-delete-review="${review.id}" title="Удалить">
                        ${iconTrash}
                    </button>
                </div>
            ` : ''}
            ${canReport ? `
                <div class="review-item__actions">
                    <button class="review-item__report" data-report="${review.id}" data-report-type="review" data-report-label="Отзыв: ${escapeHtml(name)}" title="Пожаловаться">
                        ${iconFlag}
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

function renderAvatarHtml(avatar) {
    if (!avatar) return '🧑‍💼';
    if (typeof avatar === 'string' && avatar.startsWith('http')) {
        return `<img src="${avatar}" alt="" loading="lazy">`;
    }
    return avatar;
}

if (typeof escapeHtml === 'undefined') {
    window.escapeHtml = function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
}