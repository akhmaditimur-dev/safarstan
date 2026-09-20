// ============ APP: СОБЫТИЯ ============

// Хелпер: безопасно навесить обработчик
function on(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
}

// ============================================
// ТРАНСПОРТ
// ============================================
on('transportTabs', 'click', (e) => {
    if (!e.target.classList.contains('tab')) return;
    currentTransportType = e.target.dataset.type;
    renderTabs();
    renderTransport();
    saveState();
});

// ============================================
// РЕЙТИНГ / КВЕСТЫ
// ============================================
// Табы метрик
on('ratingTabs', 'click', (e) => {
    if (!e.target.classList.contains('tab')) return;
    currentRatingType = e.target.dataset.rating;
    renderRatingTabs();
    renderRatings();
});

// Периоды рейтинга
on('ratingPeriods', 'click', (e) => {
    const btn = e.target.closest('.rating-period');
    if (!btn) return;
    currentRatingPeriod = btn.dataset.period;
    renderRatingTabs();
    renderRatings();
});

on('questTabs', 'click', (e) => {
    if (!e.target.classList.contains('tab')) return;
    currentQuestTab = e.target.dataset.quest;
    _questsExpanded = false;   // ← сбрасываем при смене таба
    renderQuestTabs();
    renderQuests();
});

// ============================================
// ЛЕНТА — ФИЛЬТРЫ
// ============================================
on('feedFilters', 'click', (e) => {
    if (!e.target.classList.contains('feed-filter')) return;
    currentFeedFilter = e.target.dataset.feed;

    document.querySelectorAll('.feed-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.feed === currentFeedFilter);
    });

    renderFeed();
});

// ============================================
// ЧЕК-ИН
// ============================================
document.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('checkin-btn')) return;
    await checkIn(e.target.dataset.key);
});

// ============================================
// ЛЕНДИНГ
// ============================================
on('landingStartBtn', 'click', () => {
    showAuthModal('signin');
});

// ============================================
// РЕДАКТИРОВАНИЕ ИМЕНИ
// ============================================
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#editNameBtnDash, #editNameBtnProfile');
    if (!btn) return;
    if (typeof enableNameEdit === 'function') enableNameEdit();
});

// ============================================
// ПЛАНЫ
// ============================================
on('planCityBtn', 'click', () => {
    openPlanModal(currentCity);
});

on('dashAddPlanBtn', 'click', () => {
    openPlanModal(PLAYER ? PLAYER.currentCity : 'tashkent');
});

on('planClose', 'click', () => {
    const modal = document.getElementById('planModal');
    if (modal) modal.style.display = 'none';
});

on('planModal', 'click', (e) => {
    if (e.target.id === 'planModal') e.target.style.display = 'none';
});

on('planSubmit', 'click', async () => {
    if (!PLAYER || !PLAYER.playerId) {
        showWarningToast('Сначала войди в аккаунт');
        return;
    }

    const cityKey = document.getElementById('planCity').value;
    const placeTitle = document.getElementById('planPlace').value.trim();
    const visitDate = document.getElementById('planDate').value;
    const note = document.getElementById('planNote').value.trim();

    if (!visitDate) {
        showWarningToast('Выбери дату 🙏');
        return;
    }

    await savePlan(PLAYER.playerId, {
        cityKey,
        placeTitle: placeTitle || null,
        visitDate,
        note: note || null,
    });

    await saveFeedEvent(PLAYER.playerId, 'plan', {
        placeTitle: placeTitle || null,
    }, cityKey);

    document.getElementById('planModal').style.display = 'none';
    await renderPlans();
});

// Планы: выполнить / удалить
document.addEventListener('click', async (e) => {
    if (e.target.dataset.planComplete) {
        await completePlan(e.target.dataset.planComplete);
        await renderPlans();
        return;
    }
    if (e.target.dataset.planDelete) {
        const ok = await showConfirm('Удалить план?', { okText: 'Удалить' });
        if (!ok) return;
        await deletePlan(e.target.dataset.planDelete);
        await renderPlans();
        return;
    }
});

// ============================================
// UGC
// ============================================
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-place-btn')) {
        openAddPlaceModal(e.target.dataset.category);
        return;
    }
    if (e.target.classList.contains('delete-btn')) {
        deleteUserPlace(e.target.dataset.delCity, e.target.dataset.delCat, parseInt(e.target.dataset.delIdx));
        return;
    }
    if (e.target.classList.contains('edit-btn')) {
        editUserPlace(e.target.dataset.editCity, e.target.dataset.editCat, parseInt(e.target.dataset.editIdx));
        return;
    }
});

on('addPlaceSubmit', 'click', submitUserPlace);

on('addPlaceClose', 'click', () => {
    const modal = document.getElementById('addPlaceModal');
    if (modal) modal.style.display = 'none';
});

on('addPlaceModal', 'click', (e) => {
    if (e.target.id === 'addPlaceModal') e.target.style.display = 'none';
});

// ============================================
// ПРОФИЛЬ (модалка)
// ============================================
on('profileClose', 'click', () => {
    const modal = document.getElementById('profileModal');
    if (modal) modal.style.display = 'none';

    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) {
        bottomNav.querySelectorAll('.bottom-nav__item').forEach(el => {
            el.classList.remove('active');
        });
    }
});

on('profileModal', 'click', (e) => {
    if (e.target.id === 'profileModal') e.target.style.display = 'none';
});

// ============================================
// АВТОРИЗАЦИЯ
// ============================================
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        authMode = tab.dataset.mode;
        updateAuthUI();
    });
});

on('authSubmit', 'click', async () => {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const errorEl = document.getElementById('authError');

    if (!email || !password) {
        errorEl.textContent = 'Заполни email и пароль';
        errorEl.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = 'Пароль минимум 6 символов';
        errorEl.style.display = 'block';
        return;
    }

    errorEl.style.display = 'none';

    if (authMode === 'signup') {
        // === РЕГИСТРАЦИЯ ===
        const name = document.getElementById('regName').value.trim();
        const homeCity = document.getElementById('regHomeCity').value;
        const currentCityVal = document.getElementById('regCurrentCity').value;

        if (!name) {
            errorEl.textContent = 'Введи имя';
            errorEl.style.display = 'block';
            return;
        }

        const result = await signUp(email, password, {
            name: name,
            avatar: selectedAvatar || '🧑‍💼',
            home_city: homeCity,
            current_city: currentCityVal,
        });

        if (result.error) {
            errorEl.textContent = result.error;
            errorEl.style.display = 'block';
            return;
        }

        if (!result.session) {
            errorEl.textContent = 'Проверь почту — нужно подтвердить email';
            errorEl.style.display = 'block';
            return;
        }

        const serverPlayer = await loadPlayerFromServer();

        if (!serverPlayer) {
            errorEl.textContent = 'Профиль не найден. Возможно, ты не завершил регистрацию.';
            errorEl.style.display = 'block';
            return;
        }

        // Проверяем, не удалён ли аккаунт
        if (serverPlayer.is_deleted === true) {
            document.getElementById('authModal').style.display = 'none';

            const expired = isRestorePeriodExpired(serverPlayer.deleted_at);

            showRestoreModal(serverPlayer, expired);
            return;
        }

        setPlayerFromServer(serverPlayer);
        await afterAuth();

    } else {
        // === ВХОД ===
        const result = await signIn(email, password);

        if (result.error) {
            errorEl.textContent = result.error;
            errorEl.style.display = 'block';
            return;
        }

        const serverPlayer = await loadPlayerFromServer();

        if (!serverPlayer) {
            errorEl.textContent = 'Профиль не найден. Возможно, ты не завершил регистрацию.';
            errorEl.style.display = 'block';
            return;
        }

        if (serverPlayer.is_deleted === true) {
            document.getElementById('authModal').style.display = 'none';
            const expired = isRestorePeriodExpired(serverPlayer.deleted_at);
            showRestoreModal(serverPlayer, expired);
            return;
        }

        setPlayerFromServer(serverPlayer);
        await afterAuth();
    }
});

// Закрытие модалки авторизации
on('authClose', 'click', () => {
    document.getElementById('authModal').style.display = 'none';
});

on('authModal', 'click', (e) => {
    if (e.target.id === 'authModal') {
        e.target.style.display = 'none';
    }
});

// Хелпер: заполнить PLAYER из serverPlayer
function setPlayerFromServer(serverPlayer) {
    PLAYER = {
        name: serverPlayer.name,
        avatar: serverPlayer.avatar,
        homeCity: serverPlayer.home_city,
        currentCity: serverPlayer.current_city,
        xp: serverPlayer.xp,
        level: serverPlayer.level,
        badges: serverPlayer.badges || [],
        completedQuests: serverPlayer.completed_quests || [],
        questsClaimed: serverPlayer.quests_claimed || [],
        userPlacesAdded: serverPlayer.user_places_added || 0,
        visitedCities: {},
        checkins: {},
        playerId: serverPlayer.id,
        checkinCooldowns: serverPlayer.checkin_cooldowns || {},
        todayCheckins: serverPlayer.today_checkins || 0,
        todayDate: serverPlayer.today_date || null,
        avatarPath: serverPlayer.avatar_path || null,
        settings: serverPlayer.settings || {},
        isPrivate: serverPlayer.is_private === true,
    };
}

// Хелпер: после авторизации
async function afterAuth() {
    const checkins = await loadCheckins(PLAYER.playerId);
    PLAYER.checkins = checkins;

    Object.keys(checkins).forEach(key => {
        const cityKey = key.split('|')[0];
        PLAYER.visitedCities[cityKey] = (PLAYER.visitedCities[cityKey] || 0) + checkins[key];
    });

    const authModal = document.getElementById('authModal');
    if (authModal) authModal.style.display = 'none';

    updatePlayerBadge();

    if (typeof refreshAccessRequestsList === 'function' && PLAYER.isPrivate) {
        refreshAccessRequestsList();
    }

    if (typeof applyModuleVisibility === 'function') applyModuleVisibility();

    renderQuests();
    renderMap();
    await renderAll();

    if (typeof isModuleEnabled !== 'function' || isModuleEnabled('gaps')) {
        if (typeof renderGapsDashboard === 'function') await renderGapsDashboard();
        if (typeof renderGapInvites === 'function') await renderGapInvites();
    }
    if (typeof isModuleEnabled !== 'function' || isModuleEnabled('hashars')) {
        if (typeof renderMyHashars === 'function') await renderMyHashars();
        if (typeof renderHasharsList === 'function') await renderHasharsList();
    }

    await showDashboard();
}

// ============================================
// ДРУЗЬЯ
// ============================================
on('friendsClose', 'click', () => {
    const modal = document.getElementById('friendsModal');
    if (modal) modal.style.display = 'none';

    const search = document.getElementById('friendSearch');
    const results = document.getElementById('friendSearchResults');
    if (search) search.value = '';
    if (results) results.innerHTML = '';
});

on('friendsModal', 'click', (e) => {
    if (e.target.id === 'friendsModal') e.target.style.display = 'none';
});

let searchTimeout;
on('friendSearch', 'input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchPlayersAndRender(e.target.value), 300);
});

const friendsModal = document.getElementById('friendsModal');
if (friendsModal) {
    friendsModal.addEventListener('click', async (e) => {
        if (e.target.dataset.addFriend) {
            const toId = e.target.dataset.addFriend;
            const ok = await sendFriendRequest(PLAYER.playerId, toId);
            if (ok) {
                e.target.outerHTML = '<span class="friend-item__sub">⏳ Заявка</span>';
            }
            return;
        }

        if (e.target.dataset.accept) {
            const reqId = e.target.dataset.accept;
            const fromId = e.target.dataset.from;
            const ok = await acceptFriendRequest(reqId, fromId, PLAYER.playerId);
            if (ok) {
                await renderFriends();
                if (typeof resetCityFriendsStatsCache === 'function') {
                    resetCityFriendsStatsCache();
                }
            }
            return;
        }

        if (e.target.dataset.decline) {
            await declineFriendRequest(e.target.dataset.decline);
            await renderFriends();
            return;
        }

        if (e.target.dataset.removeFriend) {
            const ok = await showConfirm('Удалить из друзей?', { okText: 'Удалить' });
            if (!ok) return;
            await removeFriend(e.target.dataset.removeFriend);
            await renderFriends();
            if (typeof resetCityFriendsStatsCache === 'function') {
                resetCityFriendsStatsCache();
            }
            return;
        }
    });
}

// ============================================
// ОТЗЫВЫ
// ============================================
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

// Аккордеон отзывов в карточках
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

// ============================================
// ФОТО
// ============================================
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

// ============================================
// ЛАЙТБОКС С КАРУСЕЛЬЮ
// ============================================
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

// ============================================
// СМЕНА АВАТАРА
// ============================================
on('dashAvatar', 'click', () => {
    if (typeof openAvatarModal === 'function') openAvatarModal();
});

on('profileAvatar', 'click', () => {
    if (typeof openAvatarModal === 'function') openAvatarModal();
});

on('avatarClose', 'click', () => {
    if (typeof closeAvatarModal === 'function') closeAvatarModal();
});

on('avatarModal', 'click', (e) => {
    if (e.target.id === 'avatarModal' && typeof closeAvatarModal === 'function') {
        closeAvatarModal();
    }
});

const profileAvatarPicker = document.getElementById('profileAvatarPicker');
if (profileAvatarPicker) {
    profileAvatarPicker.addEventListener('click', (e) => {
        if (!e.target.classList.contains('avatar-option')) return;
        const emoji = e.target.dataset.avatar;
        if (emoji) saveEmojiAvatar(emoji);
    });
}

on('avatarFileInput', 'change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('avatarPreview');
    const errorEl = document.getElementById('avatarError');
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
        if (preview) preview.innerHTML = '';
        if (errorEl) {
            errorEl.textContent = 'Файл больше 1 МБ';
            errorEl.style.display = 'block';
        }
        return;
    }

    if (errorEl) errorEl.style.display = 'none';

    const reader = new FileReader();
    reader.onload = (ev) => {
        if (preview) {
            preview.innerHTML = `
                <div class="avatar-preview__item">
                    <img src="${ev.target.result}" alt="preview">
                </div>
            `;
        }
    };
    reader.readAsDataURL(file);

    setTimeout(() => saveUploadedAvatar(file), 300);
});

// ============================================
// НАВИГАЦИЯ В КАРТОЧКЕ
// ============================================

// === ГАПЫ ===
on('navGapsBtn', 'click', async () => {
    if (!PLAYER) return;
    if (typeof isModuleEnabled === 'function' && !isModuleEnabled('gaps')) return;
    await renderGapsDashboard();
    await renderGapInvites();
    const block = document.getElementById('dashGaps');
    if (block) block.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// === ХАШАРЫ ===
on('navHasharsBtn', 'click', async () => {
    if (!PLAYER) return;
    if (typeof isModuleEnabled === 'function' && !isModuleEnabled('hashars')) return;
    const section = document.getElementById('hashars');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    await renderHasharsList();
});

// === ДРУЗЬЯ ===
on('navFriendsBtn', 'click', async () => {
    if (!PLAYER) return;
    if (typeof isModuleEnabled === 'function' && !isModuleEnabled('friends')) return;
    await renderFriends();
    const modal = document.getElementById('friendsModal');
    if (modal) modal.style.display = 'flex';
});

on('navGalleryBtn', 'click', () => {
    openGalleryModal();
});
on('galleryClose', 'click', closeGalleryModal);
on('galleryModal', 'click', (e) => {
    if (e.target.id === 'galleryModal') closeGalleryModal();
});

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

// === НАСТРОЙКИ ===
on('navSettingsBtn', 'click', () => {
    if (typeof openSettingsModal === 'function') {
        openSettingsModal();
    } else {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.style.display = 'flex';
    }
    if (typeof renderModulesSettings === 'function') renderModulesSettings();
    if (typeof renderPrivacySettings === 'function') renderPrivacySettings();
});

on('navAccessRequestsBtn', 'click', async () => {
    if (!PLAYER) return;
    await openAccessRequestsModal();
});

on('settingsClose', 'click', () => {
    if (typeof closeSettingsModal === 'function') {
        closeSettingsModal();
    } else {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.style.display = 'none';
    }
});

on('settingsModal', 'click', (e) => {
    if (e.target.id === 'settingsModal') {
        if (typeof closeSettingsModal === 'function') {
            closeSettingsModal();
        } else {
            e.target.style.display = 'none';
        }
    }
});

on('settingsLogout', 'click', async () => {
    const ok = await showConfirm('Выйти из аккаунта?', {
        okText: 'Выйти',
        title: 'Выход',
    });
    if (!ok) return;
    await signOut();
});

// ============================================
// НАСТРОЙКИ КАРТЫ
// ============================================
on('mapSettingsBtn', 'click', () => {
    if (typeof renderMapSettings === 'function') renderMapSettings();
    const modal = document.getElementById('mapSettingsModal');
    if (modal) modal.style.display = 'flex';
});

on('mapSettingsClose', 'click', () => {
    const modal = document.getElementById('mapSettingsModal');
    if (modal) modal.style.display = 'none';
});

on('mapSettingsModal', 'click', (e) => {
    if (e.target.id === 'mapSettingsModal') e.target.style.display = 'none';
});

// ============================================
// ЕДИНЫЙ ОБРАБОТЧИК ПЕРЕКЛЮЧАТЕЛЕЙ (modules + map)
// ============================================
document.addEventListener('change', (e) => {
    // Тумблеры модулей (в настройках профиля)
    const modToggle = e.target.closest('[data-module-toggle]');
    if (modToggle) {
        if (typeof saveModuleSetting === 'function') {
            saveModuleSetting(modToggle.dataset.moduleToggle, modToggle.checked);
        }
        return;
    }

    // Тумблеры карты (в настройках карты)
    const mapToggle = e.target.closest('[data-map-toggle]');
    if (mapToggle) {
        if (typeof saveMapSetting === 'function') {
            saveMapSetting(mapToggle.dataset.mapToggle, mapToggle.checked);
        }
        return;
    }

    // Тумблеры приватности
    const privToggle = e.target.closest('[data-privacy-toggle]');
    if (privToggle) {
        if (typeof savePrivacySetting === 'function') {
            savePrivacySetting(privToggle.dataset.privacyToggle, privToggle.checked);
        }
        return;
    }
});

// ============================================
// ЯЗЫК / ТЕМА В НАСТРОЙКАХ
// ============================================
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#settingsModal [data-lang]');
    if (!btn) return;
    currentLang = btn.dataset.lang;
    applyLang();
    saveState();
    document.querySelectorAll('#settingsModal [data-lang]').forEach(b => {
        b.classList.toggle('active', b === btn);
    });
});

document.addEventListener('click', (e) => {
    const btn = e.target.closest('#settingsModal [data-theme]');
    if (!btn) return;
    if (typeof applyTheme === 'function') applyTheme(btn.dataset.theme);
    document.querySelectorAll('#settingsModal [data-theme]').forEach(b => {
        b.classList.toggle('active', b === btn);
    });
});

// ============================================
// СКРОЛЛ К СЕКЦИЯМ
// ============================================
document.addEventListener('click', (e) => {
    const item = e.target.closest('[data-scroll]');
    if (!item) return;
    const targetId = item.dataset.scroll;
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ============================================
// ПРОФИЛЬ ДРУГОГО ИГРОКА
// ============================================
document.addEventListener('click', (e) => {
    const playerEl = e.target.closest('[data-player-profile]');
    if (!playerEl) return;

    const playerId = playerEl.dataset.playerProfile;
    if (!playerId) return;

    openPlayerProfile(playerId);
});

on('playerProfileClose', 'click', closePlayerProfile);
on('playerProfileModal', 'click', (e) => {
    if (e.target.id === 'playerProfileModal') closePlayerProfile();
});

on('ppShareBtn', 'click', async () => {
    if (!currentViewedPlayerId) return;

    const url = `${location.origin}${location.pathname}?p=${currentViewedPlayerId}`;

    try {
        await navigator.clipboard.writeText(url);
        showWarningToast('✅ Ссылка скопирована');
    } catch (err) {
        // Fallback для старых браузеров
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showWarningToast('✅ Ссылка скопирована');
    }
});

on('ppAddFriendBtn', 'click', async () => {
    if (!currentViewedPlayerId || !PLAYER) return;

    const ok = await sendFriendRequest(PLAYER.playerId, currentViewedPlayerId);
    if (ok) {
        showWarningToast('✅ Заявка отправлена');
        document.getElementById('ppAddFriendBtn').style.display = 'none';
        document.getElementById('ppPendingBtn').style.display = 'block';
    }
});

on('ppRemoveFriendBtn', 'click', async () => {
    if (!currentViewedPlayerId || !PLAYER) return;
    const ok = await showConfirm('Удалить из друзей?', { okText: 'Удалить' });
    if (!ok) return;

    const friend = (typeof FRIENDS !== 'undefined' ? FRIENDS : []).find(f => f.id === currentViewedPlayerId);
    if (!friend) return;

    await removeFriend(friend.friendsRowId);
    showWarningToast('Удалено из друзей');

    document.getElementById('ppRemoveFriendBtn').style.display = 'none';
    document.getElementById('ppAddFriendBtn').style.display = 'block';

    await renderFriends();

    if (typeof resetCityFriendsStatsCache === 'function') {
        resetCityFriendsStatsCache();
    }
});

// ============================================
// НИЖНЕЕ МЕНЮ
// ============================================
const bottomNav = document.getElementById('bottomNav');

function setActiveBottomNav(target) {
    if (!bottomNav) return;
    bottomNav.querySelectorAll('.bottom-nav__item').forEach(el => {
        el.classList.toggle('active', el === target);
    });
}

if (bottomNav) {
    bottomNav.addEventListener('click', (e) => {
        const item = e.target.closest('.bottom-nav__item');
        if (!item) return;

        if (item.id === 'bottomProfileBtn') {
            e.preventDefault();
            if (PLAYER) {
                renderProfile();
                document.getElementById('profileModal').style.display = 'flex';
                setActiveBottomNav(item);
            } else {
                showAuthModal('signup');
            }
            return;
        }

        setActiveBottomNav(item);
    });
}

let scrollTicking = false;

window.addEventListener('scroll', () => {
    if (!bottomNav) return;
    if (window.innerWidth > 768) return;
    if (scrollTicking) return;

    scrollTicking = true;

    requestAnimationFrame(() => {
        const sections = ['dashboard', 'map', 'ratings', 'quests'];
        const scrollPos = window.scrollY + 200;

        let activeId = null;

        sections.forEach(id => {
            const section = document.getElementById(id);
            if (!section) return;

            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;

            if (scrollPos >= top && scrollPos < bottom) {
                activeId = id;
            }
        });

        if (activeId) {
            bottomNav.querySelectorAll('.bottom-nav__item').forEach(el => {
                el.classList.toggle('active', el.dataset.nav === activeId);
            });
        }

        scrollTicking = false;
    });
});

// ============================================
// КЛИКИ ПО СТРОКАМ ДАШБОРДА (Гапы / Хашары)
// ============================================
document.addEventListener('click', (e) => {
    const gapRow = e.target.closest('[data-gap-id]');
    if (gapRow) {
        if (typeof openGapModal === 'function') {
            openGapModal(gapRow.dataset.gapId);
        }
        return;
    }

    const hasharRow = e.target.closest('[data-hashar-id]');
    if (hasharRow) {
        if (typeof openHasharModal === 'function') {
            openHasharModal(hasharRow.dataset.hasharId);
        }
        return;
    }
});

// ============================================
// СМЕНА EMAIL
// ============================================
on('settingsChangeEmailBtn', 'click', async () => {
    const modal = document.getElementById('changeEmailModal');
    const currentInput = document.getElementById('changeEmailCurrent');
    if (!modal) return;

    // Показываем текущий email
    if (currentInput) {
        const email = await getCurrentUserEmail();
        currentInput.value = email || '—';
    }

    // Сброс полей
    document.getElementById('changeEmailNew').value = '';
    document.getElementById('changeEmailError').style.display = 'none';
    document.getElementById('changeEmailSuccess').style.display = 'none';

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

on('changeEmailClose', 'click', () => {
    const modal = document.getElementById('changeEmailModal');
    if (modal) modal.style.display = 'none';
});

on('changeEmailModal', 'click', (e) => {
    if (e.target.id === 'changeEmailModal') e.target.style.display = 'none';
});

on('changeEmailSubmit', 'click', async () => {
    const newEmail = document.getElementById('changeEmailNew').value.trim();
    const errorEl = document.getElementById('changeEmailError');
    const successEl = document.getElementById('changeEmailSuccess');
    const btn = document.getElementById('changeEmailSubmit');

    if (!newEmail || !newEmail.includes('@')) {
        errorEl.textContent = 'Введи корректный email';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Отправка...';
    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    const result = await changeEmail(newEmail);

    btn.disabled = false;
    btn.textContent = 'Отправить письмо';

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    successEl.textContent = '✅ Письмо отправлено. Проверь новый email и подтверди.';
    successEl.style.display = 'block';
});

// ============================================
// СМЕНА ПАРОЛЯ
// ============================================
on('settingsChangePasswordBtn', 'click', () => {
    const modal = document.getElementById('changePasswordModal');
    if (!modal) return;

    document.getElementById('changePasswordNew').value = '';
    document.getElementById('changePasswordRepeat').value = '';
    document.getElementById('changePasswordError').style.display = 'none';
    document.getElementById('changePasswordSuccess').style.display = 'none';

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

on('changePasswordClose', 'click', () => {
    const modal = document.getElementById('changePasswordModal');
    if (modal) modal.style.display = 'none';
});

on('changePasswordModal', 'click', (e) => {
    if (e.target.id === 'changePasswordModal') e.target.style.display = 'none';
});

on('changePasswordSubmit', 'click', async () => {
    const newPass = document.getElementById('changePasswordNew').value;
    const repeat = document.getElementById('changePasswordRepeat').value;
    const errorEl = document.getElementById('changePasswordError');
    const successEl = document.getElementById('changePasswordSuccess');
    const btn = document.getElementById('changePasswordSubmit');

    if (newPass.length < 6) {
        errorEl.textContent = 'Пароль минимум 6 символов';
        errorEl.style.display = 'block';
        return;
    }

    if (newPass !== repeat) {
        errorEl.textContent = 'Пароли не совпадают';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Сохранение...';
    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    const result = await changePassword(newPass);

    btn.disabled = false;
    btn.textContent = 'Сменить пароль';

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    successEl.textContent = '✅ Пароль изменён';
    successEl.style.display = 'block';

    setTimeout(() => {
        document.getElementById('changePasswordModal').style.display = 'none';
    }, 1500);
});

// ============================================
// ЭКСПОРТ ДАННЫХ
// ============================================
on('settingsExportBtn', 'click', async () => {
    if (!PLAYER || !PLAYER.playerId) return;

    const btn = document.getElementById('settingsExportBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader"></i> Собираем...';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const data = await collectMyData();
        downloadJSON(data, `safarstan-${PLAYER.name}-${new Date().toISOString().slice(0, 10)}.json`);
        showWarningToast('✅ Данные скачаны');
    } catch (err) {
        console.error('Ошибка экспорта:', err);
        showWarningToast('Не удалось собрать данные');
    }

    btn.disabled = false;
    btn.innerHTML = originalText;
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

// Собирает все данные игрока
async function collectMyData() {
    const playerId = PLAYER.playerId;

    // --- Профиль ---
    const profile = {
        id: playerId,
        name: PLAYER.name,
        avatar: PLAYER.avatar,
        homeCity: PLAYER.homeCity,
        currentCity: PLAYER.currentCity,
        xp: PLAYER.xp,
        level: PLAYER.level,
        badges: PLAYER.badges || [],
        completedQuests: PLAYER.completedQuests || [],
        settings: PLAYER.settings || {},
        exportedAt: new Date().toISOString(),
    };

    // --- Чек-ины ---
    let checkins = [];
    try {
        checkins = await loadCheckins(playerId);
    } catch (e) { console.warn('checkins:', e); }

    // --- Отзывы ---
    let reviews = [];
    try {
        reviews = await loadMyReviews(playerId);
    } catch (e) { console.warn('reviews:', e); }

    // --- Фото ---
    let photos = [];
    try {
        photos = await loadMyPhotos(playerId);
    } catch (e) { console.warn('photos:', e); }

    // --- Гапы ---
    let gaps = [];
    try {
        gaps = await loadMyGaps();
    } catch (e) { console.warn('gaps:', e); }

    // --- Хашары ---
    let hashars = [];
    try {
        hashars = await loadMyHashars();
    } catch (e) { console.warn('hashars:', e); }

    // --- Планы ---
    let plans = [];
    try {
        plans = await loadPlans(playerId);
    } catch (e) { console.warn('plans:', e); }

    return {
        profile,
        checkins,
        reviews,
        photos,
        gaps,
        hashars,
        plans,
    };
}

// Скачивает объект как JSON-файл
function downloadJSON(obj, filename) {
    const json = JSON.stringify(obj, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================
// УДАЛЕНИЕ АККАУНТА (мягкое)
// ============================================
on('settingsDeleteAccountBtn', 'click', () => {
    const modal = document.getElementById('deleteAccountModal');
    if (!modal) return;

    document.getElementById('deleteAccountConfirm').value = '';
    document.getElementById('deleteAccountError').style.display = 'none';

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

on('deleteAccountClose', 'click', () => {
    const modal = document.getElementById('deleteAccountModal');
    if (modal) modal.style.display = 'none';
});

on('deleteAccountModal', 'click', (e) => {
    if (e.target.id === 'deleteAccountModal') e.target.style.display = 'none';
});

on('deleteAccountSubmit', 'click', async () => {
    const confirm = document.getElementById('deleteAccountConfirm').value.trim();
    const errorEl = document.getElementById('deleteAccountError');
    const btn = document.getElementById('deleteAccountSubmit');

    if (confirm !== 'УДАЛИТЬ') {
        errorEl.textContent = 'Введи точно "УДАЛИТЬ"';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Удаляем...';

    const result = await softDeletePlayer(PLAYER.playerId);

    btn.disabled = false;
    btn.textContent = 'Удалить аккаунт';

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    document.getElementById('deleteAccountModal').style.display = 'none';
    showWarningToast('Аккаунт удалён. Данные хранятся 30 дней.');

    setTimeout(async () => {
        await signOut();
    }, 1500);
});

// ============================================
// ВОССТАНОВЛЕНИЕ АККАУНТА
// ============================================
let _pendingRestorePlayer = null;

function showRestoreModal(player, isExpired) {
    _pendingRestorePlayer = player;

    const modal = document.getElementById('restoreAccountModal');
    const subtitle = document.getElementById('restoreAccountSubtitle');
    const submitBtn = document.getElementById('restoreAccountSubmit');
    if (!modal) return;

    if (isExpired) {
        subtitle.textContent = 'Срок хранения истёк (больше 30 дней). Данные будут удалены безвозвратно.';
        submitBtn.style.display = 'none';
    } else {
        const deletedDate = new Date(player.deleted_at);
        const daysLeft = 30 - Math.floor((new Date() - deletedDate) / (1000 * 60 * 60 * 24));
        subtitle.textContent = `Твой аккаунт удалён. Осталось ${daysLeft} дн. до окончательного удаления. Восстановить?`;
        submitBtn.style.display = 'block';
    }

    modal.style.display = 'flex';
}

on('restoreAccountSubmit', 'click', async () => {
    if (!_pendingRestorePlayer) return;

    const btn = document.getElementById('restoreAccountSubmit');
    const errorEl = document.getElementById('restoreAccountError');

    btn.disabled = true;
    btn.textContent = '⏳ Восстанавливаем...';

    const result = await restorePlayer(_pendingRestorePlayer.id);

    btn.disabled = false;
    btn.textContent = 'Восстановить аккаунт';

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    document.getElementById('restoreAccountModal').style.display = 'none';
    showWarningToast('✅ Аккаунт восстановлен!');

    // Перезагружаем приложение
    setTimeout(() => location.reload(), 1000);
});

on('restoreAccountCancel', 'click', async () => {
    document.getElementById('restoreAccountModal').style.display = 'none';
    _pendingRestorePlayer = null;
    await signOut();
});