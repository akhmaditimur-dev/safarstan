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

// Skeleton для рейтинга городов
function renderRatingsSkeleton(containerId = 'ratingList', count = 5) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = Array.from({ length: count }, (_, i) => `
        <div class="skeleton-rating-row">
            <div class="skeleton skeleton-rating-row__rank"></div>
            <div class="skeleton skeleton-rating-row__avatar"></div>
            <div class="skeleton-rating-row__info">
                <div class="skeleton skeleton-rating-row__name"></div>
                <div class="skeleton skeleton-rating-row__sub"></div>
            </div>
            <div class="skeleton skeleton-rating-row__value"></div>
        </div>
    `).join('');

    container.innerHTML = html;
}

// Skeleton для квестов
function renderQuestsSkeleton(containerId = 'questsList', count = 4) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = Array.from({ length: count }, () => `
        <div class="skeleton-quest-card">
            <div class="skeleton skeleton-quest-card__icon"></div>
            <div class="skeleton-quest-card__body">
                <div class="skeleton skeleton-quest-card__title"></div>
                <div class="skeleton skeleton-quest-card__line"></div>
                <div class="skeleton skeleton-quest-card__line skeleton-quest-card__line--short"></div>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

// Skeleton для профиля (свой)
function renderProfileSkeleton() {
    const citiesEl = document.getElementById('profileCities');
    const statsEl = document.getElementById('profileStats');
    const badgesEl = document.getElementById('profileBadges');

    if (citiesEl) {
        citiesEl.innerHTML = Array.from({ length: 5 }, () =>
            `<div class="skeleton skeleton-chip"></div>`
        ).join('');
    }

    if (statsEl) {
        statsEl.innerHTML = Array.from({ length: 3 }, () => `
            <div class="skeleton-stat">
                <div class="skeleton skeleton-stat__value"></div>
                <div class="skeleton skeleton-stat__label"></div>
            </div>
        `).join('');
    }

    if (badgesEl) {
        badgesEl.innerHTML = Array.from({ length: 8 }, () => `
            <div class="skeleton skeleton-badge"></div>
        `).join('');
    }
}

// Skeleton для списка уведомлений
function renderNotificationsSkeleton(containerId, count = 5) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = Array.from({ length: count }, () => `
        <div class="skeleton-feed-item">
            <div class="skeleton skeleton-feed-item__avatar"></div>
            <div class="skeleton-feed-item__body">
                <div class="skeleton skeleton-feed-item__line"></div>
                <div class="skeleton skeleton-feed-item__line skeleton-feed-item__line--short"></div>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}