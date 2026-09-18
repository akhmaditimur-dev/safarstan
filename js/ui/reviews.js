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

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderReviewItem(review) {
    const player = review.players || {};
    const name = player.name || 'Игрок';
    const avatar = player.avatar || '🧑‍💼';
    const isMine = PLAYER && review.player_id === PLAYER.playerId;

    // Звёзды — через Lucide
    let stars = '';
    if (review.rating) {
        const filled = '<i data-lucide="star"></i>'.repeat(review.rating);
        const empty = '<i data-lucide="star-off"></i>'.repeat(5 - review.rating);
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
                    <button class="review-item__delete" data-delete-review="${review.id}" title="Удалить">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================
// ХЕЛПЕР: АВАТАР (URL → img, эмодзи → текст)
// ============================================
function renderAvatarHtml(avatar) {
    if (!avatar) return '🧑‍💼';
    if (typeof avatar === 'string' && avatar.startsWith('http')) {
        return `<img src="${avatar}" alt="" loading="lazy">`;
    }
    return avatar;
}

// ============================================
// ХЕЛПЕР: ЭКРАНИРОВАНИЕ HTML
// ============================================
// ⚠️ Если escapeHtml уже объявлен в другом файле — не переобъявляем
if (typeof escapeHtml === 'undefined') {
    window.escapeHtml = function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
}