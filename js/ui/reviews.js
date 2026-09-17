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
                listEl.innerHTML = '<div class="reviews-empty">Отзывов пока нет. Будь первым! 💬</div>';
                continue;
            }

            listEl.innerHTML = reviews.slice(0, 3).map(rev => renderReviewItem(rev)).join('');
        } catch (e) {
            console.warn('Ошибка загрузки отзывов для', placeKey, e);
            listEl.innerHTML = '<div class="reviews-empty">Ошибка загрузки</div>';
        }
    }
}

function renderReviewItem(review) {
    const player = review.players || {};
    const name = player.name || 'Игрок';
    const avatar = player.avatar || '🧑‍💼';
    const isMine = PLAYER && review.player_id === PLAYER.playerId;

    const stars = review.rating 
        ? '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating) 
        : '';

    return `
        <div class="review-item">
            <div class="review-item__avatar" data-player-profile="${review.player_id || ''}" style="cursor:pointer;">${avatar}</div>
            <div class="review-item__body">
                <div class="review-item__header">
                    <span class="review-item__name" data-player-profile="${review.player_id || ''}" style="cursor:pointer;">${name}</span>
                    ${stars ? `<span class="review-item__rating">${stars}</span>` : ''}
                </div>
                <div class="review-item__text">${escapeHtml(review.text)}</div>
                <div class="review-item__time">${timeAgo(review.created_at)}</div>
            </div>
            ${isMine ? `
                <div class="review-item__actions">
                    <button class="review-item__delete" data-delete-review="${review.id}">🗑</button>
                </div>
            ` : ''}
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}