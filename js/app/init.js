// ============ APP: ИНИЦИАЛИЗАЦИЯ И МОДАЛКИ ============

let authMode = 'signup';

// ============================================
// ГЛАВНАЯ ФУНКЦИЯ ЗАПУСКА
// ============================================
async function initApp() {
    // Отключаем авто-восстановление скролла браузером
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    const session = await getCurrentSession();

    // ─── Всегда инициализируем базовые вещи ───
    initCitySearch();
    renderCitySelector();
    renderMap();

    // Применяем язык (заголовки секций, hero)
    applyLang();

    // ─── Если НЕ залогинен ───
    if (!session) {
        showLanding();
        await renderAll();
        renderTabs();
        if (typeof lucide !== 'undefined') lucide.createIcons();
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
    }

    const serverPlayer = await loadPlayerFromServer();

    if (!serverPlayer) {
        showLanding();
        await renderAll();
        renderTabs();
        if (typeof lucide !== 'undefined') lucide.createIcons();
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
    }

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
        onboardingCompleted: serverPlayer.onboarding_completed === true,
        username: serverPlayer.username || null,
    };

    // === Автогенерация ника (если нет) ===
    if (!serverPlayer.username) {
        const generated = await generateUsernameForPlayer(serverPlayer.id, serverPlayer.name);
        if (generated) {
            PLAYER.username = generated;
            console.log('✅ Ник сгенерирован:', generated);
        }
    } else {
        PLAYER.username = serverPlayer.username;
    }

    // Загрузка чек-инов
    const checkins = await loadCheckins(serverPlayer.id);
    PLAYER.checkins = checkins;
    Object.keys(checkins).forEach(key => {
        const cityKey = key.split('|')[0];
        PLAYER.visitedCities[cityKey] = (PLAYER.visitedCities[cityKey] || 0) + checkins[key];
    });

    // Пользовательские места
    if (typeof loadUserPlaces === 'function') {
        const places = await loadUserPlaces();
        if (typeof USER_PLACES !== 'undefined') {
            Object.assign(USER_PLACES, places);
        }
    }

    // Профиль и навигация
    updatePlayerBadge();
    if (typeof initNotificationsBell === 'function') {
    initNotificationsBell();
    }
    if (typeof maybeShowOnboarding === 'function') {
    maybeShowOnboarding();
    }
    if (typeof refreshAccessRequestsList === 'function' && PLAYER.isPrivate) {
    refreshAccessRequestsList();
    }
    if (typeof applyModuleVisibility === 'function') applyModuleVisibility();

    // Табы
    if (typeof renderRatingTabs === 'function') renderRatingTabs();
    if (typeof renderQuestTabs === 'function') renderQuestTabs();

    // Квесты и рейтинги
    renderQuests();
    renderRatings();

    // Гапы и хашары
    if (typeof isModuleEnabled !== 'function' || isModuleEnabled('gaps')) {
        if (typeof renderGapsDashboard === 'function') await renderGapsDashboard();
        if (typeof renderGapInvites === 'function') await renderGapInvites();
    }
    if (typeof isModuleEnabled !== 'function' || isModuleEnabled('hashars')) {
        if (typeof renderMyHashars === 'function') await renderMyHashars();
        if (typeof renderHasharsList === 'function') await renderHasharsList();
    }

        // Карта и всё остальное
    renderMap();
    await renderAll();

    if (typeof saveState === 'function') saveState();
    await showDashboard();
    if (typeof initHeaderSearch === 'function') initHeaderSearch();
    if (typeof initBackToDashboardButton === 'function') initBackToDashboardButton();
    // Возвращаемся в начало страницы после загрузки
    window.scrollTo({ top: 0, behavior: 'instant' });
}

// ============================================
// АВТОРИЗАЦИЯ
// ============================================
function showAuthModal(mode) {
    authMode = mode;
    fillCitySelects();
    initAvatarPicker();
    updateAuthUI();
    document.getElementById('authModal').style.display = 'flex';
}

function updateAuthUI() {
    const isSignup = authMode === 'signup';
    document.getElementById('authTitle').innerHTML = isSignup
        ? '<i data-lucide="building-2"></i> Добро пожаловать в Safarstan!'
        : '<i data-lucide="hand"></i> С возвращением!';
    document.getElementById('authSubtitle').textContent = isSignup
        ? 'Создай аккаунт — и в путь'
        : 'Войди, чтобы продолжить путешествие';
    document.getElementById('authSubmit').innerHTML = isSignup
        ? '<i data-lucide="rocket"></i> Создать аккаунт'
        : '<i data-lucide="key"></i> Войти';
    document.getElementById('signupFields').style.display = isSignup ? 'block' : 'none';

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === authMode);
    });

    const errEl = document.getElementById('authError');
    if (errEl) errEl.style.display = 'none';

    // Сброс галочки согласия при переключении режимов
    const agreement = document.getElementById('regAgreement');
    if (agreement) agreement.checked = false;

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// ТЕМА
// ============================================
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('safarstan_theme', theme);

    // Обновляем тайлы карты, если она уже создана
    if (typeof updateMapTiles === 'function') {
        updateMapTiles(theme);
    }
}

function initTheme() {
    const saved = localStorage.getItem('safarstan_theme') || 'light';
    applyTheme(saved);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
}

// ============================================
// ПЛАНЫ
// ============================================
function openPlanModal(cityKey) {
    if (!PLAYER) return;

    fillPlanCitySelect(cityKey || currentCity);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('planDate').value = tomorrow.toISOString().split('T')[0];

    document.getElementById('planPlace').value = '';
    document.getElementById('planNote').value = '';

    document.getElementById('planModal').style.display = 'flex';
}

// ============================================
// ОТЗЫВЫ
// ============================================
let currentReviewPlaceKey = null;
let currentReviewRating = 0;

function openReviewModal(placeKey, placeName) {
    if (!PLAYER) {
        if (typeof showWarningToast === 'function') {
            showWarningToast('Сначала войди в аккаунт');
        }
        return;
    }

    currentReviewPlaceKey = placeKey;
    currentReviewRating = 0;

    document.getElementById('reviewPlaceName').textContent = placeName;
    document.getElementById('reviewText').value = '';

    const errEl = document.getElementById('reviewError');
    if (errEl) errEl.style.display = 'none';

    document.querySelectorAll('.rating-star').forEach(s => s.classList.remove('active'));

    document.getElementById('reviewModal').style.display = 'flex';
}

// ============================================
// ФОТО
// ============================================
let currentPhotoPlaceKey = null;
let currentPhotoPlaceName = null;

function openPhotoModal(placeKey, placeName) {
    if (!PLAYER) {
        if (typeof showWarningToast === 'function') {
            showWarningToast('Сначала войди в аккаунт');
        }
        return;
    }

    currentPhotoPlaceKey = placeKey;
    currentPhotoPlaceName = placeName;

    document.getElementById('photoPlaceName').textContent = placeName;
    document.getElementById('photoInput').value = '';
    document.getElementById('photoPreview').innerHTML = '';

    const errEl = document.getElementById('photoError');
    if (errEl) errEl.style.display = 'none';

    document.getElementById('photoModal').style.display = 'flex';
}

// ============================================
// PWA: УСТАНОВКА ПРИЛОЖЕНИЯ
// ============================================
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
});

function showInstallButton() {
    const container = document.getElementById('headerActions');
    if (!container || document.getElementById('installBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'installBtn';
    btn.className = 'theme-btn';
    btn.title = 'Установить приложение';
    btn.innerHTML = '<i data-lucide="download"></i>';
    btn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            btn.remove();
        }
        deferredPrompt = null;
    });

    container.appendChild(btn);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}