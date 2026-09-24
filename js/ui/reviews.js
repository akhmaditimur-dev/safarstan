// ============ UI: ОТЗЫВЫ ============

async function loadVisibleReviews() {
    const blocks = document.querySelectorAll('.reviews-block[data-reviews-for]');

    for (const block of blocks) {
        const placeKey = block.dataset.reviewsFor;
        const listEl = block.querySelector(`[data-reviews-list="${placeKey}"]`);
        if (!listEl) continue;

        try {
            const reviews = await loadReviews(placeKey);

            if (reviews.length === 0) {
                listEl.innerHTML = `
                    <div class="reviews-empty">
                        Отзывов пока нет. Будь первым!
                    </div>
                `;
                continue;
            }

            listEl.innerHTML = reviews.slice(0, 3).map(rev => renderReviewItem(rev)).join('');
        } catch (e) {
            console.warn('Ошибка загрузки отзывов для', placeKey, e);
            listEl.innerHTML = '<div class="reviews-empty">Ошибка загрузки</div>';
        }
    }

    // Рисуем иконки после отрисовки DOM
    if (typeof lucide !== 'undefined') {
        requestAnimationFrame(() => {
            lucide.createIcons();
        });
    }
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