// ============ APP: СОБЫТИЯ КОНТЕНТА (отзывы, фото, лайтбокс) ============

// === Отзывы ===
const ratingPicker = document.getElementById('ratingPicker');
if (ratingPicker) {
    ratingPicker.addEventListener('click', (e) => {
        if (!e.target.classList.contains('rating-star')) return;
        const rating = parseInt(e.target.dataset.rating);
        currentReviewRating = rating;

        document.querySelectorAll('.rating-star').forEach(s => {
            const r = parseInt(s.dataset.rating);
            s.classList.toggle('active', r <= rating);
        });
    });
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add-review]');
    if (!btn) return;
    openReviewModal(btn.dataset.addReview, btn.dataset.placeName);
});

on('reviewClose', 'click', () => {
    const modal = document.getElementById('reviewModal');
    if (modal) modal.style.display = 'none';
});

on('reviewModal', 'click', (e) => {
    if (e.target.id === 'reviewModal') e.target.style.display = 'none';
});

on('reviewSubmit', 'click', async () => {
    const text = document.getElementById('reviewText').value.trim();
    const errorEl = document.getElementById('reviewError');

    const validationError = validateReviewText(text);
    if (validationError) {
        errorEl.textContent = validationError;
        errorEl.style.display = 'block';
        return;
    }

    errorEl.style.display = 'none';

    const cityKey = currentReviewPlaceKey.split('|')[0];

    const result = await saveReview(
        PLAYER.playerId,
        currentReviewPlaceKey,
        cityKey,
        currentReviewRating || null,
        text
    );

    if (result.error) {
        errorEl.textContent = result.error.includes('duplicate')
            ? 'Ты уже оставил отзыв об этом месте'
            : result.error;
        errorEl.style.display = 'block';
        return;
    }

    PLAYER.xp += 10;
    const oldLevel = PLAYER.level;
    PLAYER.level = getLevelFromXP(PLAYER.xp);
    await savePlayerToServer(PLAYER);
    updatePlayerBadge();
    showXPToast(10, 'Отзыв');

    if (PLAYER.level > oldLevel) {
        setTimeout(() => showLevelUp(PLAYER.level), 400);
    }

    document.getElementById('reviewModal').style.display = 'none';

    await loadVisibleReviews();
    renderDashboard();
});

document.addEventListener('click', async (e) => {
    if (!e.target.dataset.deleteReview) return;
    const ok = await showConfirm('Удалить отзыв?', { okText: 'Удалить' });
    if (!ok) return;

    await deleteReview(e.target.dataset.deleteReview);
    await loadVisibleReviews();
});

document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-toggle-reviews]');
    if (!btn) return;

    const key = btn.dataset.toggleReviews;
    const block = document.querySelector(`.reviews-block[data-reviews-for="${key}"]`);
    if (!block) return;

    if (block.style.display === 'none' || !block.style.display) {
        block.style.display = 'block';
        const listEl = block.querySelector(`[data-reviews-list="${key}"]`);
        if (listEl && !listEl.dataset.loaded) {
            await loadReviewsForOne(key, listEl);
            listEl.dataset.loaded = '1';
        }
    } else {
        block.style.display = 'none';
    }
});

async function loadReviewsForOne(placeKey, listEl) {
    listEl.innerHTML = '<div class="reviews-empty">⏳ Загрузка...</div>';

    try {
        const reviews = await loadReviews(placeKey);

        if (reviews.length === 0) {
            listEl.innerHTML = '<div class="reviews-empty">Отзывов пока нет. Будь первым! 💬</div>';
            return;
        }

        listEl.innerHTML = reviews.map(rev => renderReviewItem(rev)).join('');
    } catch (err) {
        console.warn('Ошибка загрузки отзывов:', err);
        listEl.innerHTML = '<div class="reviews-empty">Ошибка загрузки</div>';
    }
}

// === Мои отзывы (модалка) ===
on('navReviewsBtn', 'click', () => {
    openMyReviewsModal();
});
on('myReviewsClose', 'click', closeMyReviewsModal);
on('myReviewsModal', 'click', (e) => {
    if (e.target.id === 'myReviewsModal') closeMyReviewsModal();
});

document.addEventListener('click', async (e) => {
    if (!e.target.dataset.deleteMyReview) return;
    const ok = await showConfirm('Удалить отзыв?', { okText: 'Удалить' });
    if (!ok) return;
    await deleteReview(e.target.dataset.deleteMyReview);
    openMyReviewsModal();
});

// === Моя галерея ===
on('navGalleryBtn', 'click', () => {
    openGalleryModal();
});
on('galleryClose', 'click', closeGalleryModal);
on('galleryModal', 'click', (e) => {
    if (e.target.id === 'galleryModal') closeGalleryModal();
});

// === Фото ===
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add-photo]');
    if (!btn) return;
    openPhotoModal(btn.dataset.addPhoto, btn.dataset.placeName);
});

on('photoClose', 'click', () => {
    const modal = document.getElementById('photoModal');
    if (modal) modal.style.display = 'none';
});

on('photoModal', 'click', (e) => {
    if (e.target.id === 'photoModal') e.target.style.display = 'none';
});

on('photoInput', 'change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('photoPreview');

    if (!file) {
        preview.innerHTML = '';
        return;
    }

    if (file.size > 3 * 1024 * 1024) {
        preview.innerHTML = '';
        const errorEl = document.getElementById('photoError');
        errorEl.textContent = 'Файл больше 3 МБ';
        errorEl.style.display = 'block';
        return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
        preview.innerHTML = `
            <div class="photo-preview__item">
                <img src="${ev.target.result}" alt="preview">
            </div>
        `;
    };
    reader.readAsDataURL(file);

    document.getElementById('photoError').style.display = 'none';
});

on('photoSubmit', 'click', async () => {
    const file = document.getElementById('photoInput').files[0];
    const errorEl = document.getElementById('photoError');
    const btn = document.getElementById('photoSubmit');

    if (!file) {
        errorEl.textContent = 'Выбери файл';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Загрузка...';
    errorEl.style.display = 'none';

    const cityKey = currentPhotoPlaceKey.split('|')[0];

    const result = await uploadPlacePhoto(
        file,
        PLAYER.playerId,
        currentPhotoPlaceKey,
        cityKey
    );

    btn.disabled = false;
    btn.textContent = 'Загрузить фото 📸';

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    PLAYER.xp += 15;
    const oldLevel = PLAYER.level;
    PLAYER.level = getLevelFromXP(PLAYER.xp);
    await savePlayerToServer(PLAYER);
    updatePlayerBadge();
    showXPToast(15, 'Новое фото!');

    if (PLAYER.level > oldLevel) {
        setTimeout(() => showLevelUp(PLAYER.level), 400);
    }

    document.getElementById('photoModal').style.display = 'none';
    renderAll();
});

// === Лайтбокс ===
let lightboxPhotos = [];
let lightboxIndex = 0;

document.addEventListener('click', (e) => {
    const photoEl = e.target.closest('[data-lightbox]');
    if (!photoEl) return;

    let photos = [];
    try {
        photos = JSON.parse(photoEl.dataset.photos || '[]');
    } catch (err) {
        photos = [photoEl.dataset.lightbox];
    }

    if (photos.length === 0) {
        photos = [photoEl.dataset.lightbox];
    }

    lightboxPhotos = photos;
    lightboxIndex = parseInt(photoEl.dataset.index || '0') || 0;

    openLightbox();
});

function openLightbox() {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    const counter = document.getElementById('lightboxCounter');
    const prev = document.getElementById('lightboxPrev');
    const next = document.getElementById('lightboxNext');

    if (!lightbox || !img) return;

    img.src = lightboxPhotos[lightboxIndex];

    if (counter) {
        if (lightboxPhotos.length > 1) {
            counter.textContent = `${lightboxIndex + 1} / ${lightboxPhotos.length}`;
            counter.style.display = 'block';
        } else {
            counter.style.display = 'none';
        }
    }

    if (lightboxPhotos.length > 1) {
        if (prev) prev.style.display = 'flex';
        if (next) next.style.display = 'flex';
    } else {
        if (prev) prev.style.display = 'none';
        if (next) next.style.display = 'none';
    }

    lightbox.style.display = 'flex';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) lightbox.style.display = 'none';
    lightboxPhotos = [];
    lightboxIndex = 0;
}

function lightboxNextPhoto() {
    if (lightboxPhotos.length <= 1) return;
    lightboxIndex = (lightboxIndex + 1) % lightboxPhotos.length;
    openLightbox();
}

function lightboxPrevPhoto() {
    if (lightboxPhotos.length <= 1) return;
    lightboxIndex = (lightboxIndex - 1 + lightboxPhotos.length) % lightboxPhotos.length;
    openLightbox();
}

on('lightboxClose', 'click', closeLightbox);
on('lightboxPrev', 'click', (e) => {
    e.stopPropagation();
    lightboxPrevPhoto();
});
on('lightboxNext', 'click', (e) => {
    e.stopPropagation();
    lightboxNextPhoto();
});

const lightbox = document.getElementById('lightbox');
if (lightbox) {
    lightbox.addEventListener('click', (e) => {
        if (e.target.id === 'lightbox') closeLightbox();
    });
}

document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb || lb.style.display === 'none') return;

    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') lightboxNextPhoto();
    if (e.key === 'ArrowLeft') lightboxPrevPhoto();
});

let touchStartX = 0;
document.addEventListener('touchstart', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb || lb.style.display === 'none') return;
    touchStartX = e.touches[0].clientX;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb || lb.style.display === 'none') return;

    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 50) return;

    if (dx < 0) lightboxNextPhoto();
    else lightboxPrevPhoto();
}, { passive: true });