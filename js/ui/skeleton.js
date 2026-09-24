// ============ UI: SKELETON — ЗАГРУЗКА ============

// Skeleton карточки места (для Отели/Транспорт/Сервисы)
function renderCardsSkeleton(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = Array.from({ length: count }, () => `
        <div class="skeleton-card">
            <div class="skeleton skeleton-card__title"></div>
            <div class="skeleton skeleton-card__line"></div>
            <div class="skeleton skeleton-card__line skeleton-card__line--short"></div>
            <div class="skeleton-card__meta">
                <div class="skeleton skeleton-card__meta-item"></div>
                <div class="skeleton skeleton-card__meta-item"></div>
            </div>
            <div class="skeleton-card__actions">
                <div class="skeleton skeleton-card__btn"></div>
                <div class="skeleton skeleton-card__btn skeleton-card__btn--small"></div>
                <div class="skeleton skeleton-card__btn skeleton-card__btn--small"></div>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

// Skeleton ленты
function renderFeedSkeleton(containerId = 'dashFeed', count = 4) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = Array.from({ length: count }, () => `
        <div class="skeleton-feed-item">
            <div class="skeleton skeleton-feed-item__avatar"></div>
            <div class="skeleton-feed-item__body">
                <div class="skeleton skeleton-feed-item__line"></div>
                <div class="skeleton skeleton-feed-item__line skeleton-feed-item__line--short"></div>
                <div class="skeleton skeleton-feed-item__time"></div>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

// Skeleton списка друзей / уведомлений / запросов
function renderFriendsSkeleton(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = Array.from({ length: count }, () => `
        <div class="skeleton-friend-item">
            <div class="skeleton skeleton-friend-item__avatar"></div>
            <div class="skeleton-friend-item__info">
                <div class="skeleton skeleton-friend-item__name"></div>
                <div class="skeleton skeleton-friend-item__sub"></div>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

// Skeleton отзывов (в карточке места)
function renderReviewsSkeleton(containerId, count = 2) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = Array.from({ length: count }, () => `
        <div class="skeleton-feed-item">
            <div class="skeleton skeleton-feed-item__avatar"></div>
            <div class="skeleton-feed-item__body">
                <div class="skeleton skeleton-feed-item__line skeleton-feed-item__line--short"></div>
                <div class="skeleton skeleton-feed-item__line"></div>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}