// ============ APP: ИНИЦИАЛИЗАЦИЯ И МОДАЛКИ ============

let authMode = 'signup';

// ============================================
// ГЛАВНАЯ ФУНКЦИЯ ЗАПУСКА
// ============================================
async function initApp() {
    const session = await getCurrentSession();

    if (!session) {
        showLanding();
        return;
    }

    const serverPlayer = await loadPlayerFromServer();

    if (!serverPlayer) {
        showLanding();
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
    };

    // Инициализация поиска и выбора города
    initCitySearch();
    renderCitySelector();

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

    // Применяем видимость модулей
    if (typeof applyModuleVisibility === 'function') applyModuleVisibility();

    // Табы (активные состояния)
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

    // Сохранение состояния
    if (typeof saveState === 'function') saveState();

    // Показ дашборда
    await showDashboard();

    // Инициализация поиска в шапке
    if (typeof initHeaderSearch === 'function') initHeaderSearch();
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
    document.getElementById('authTitle').textContent = isSignup
        ? '🏙 Добро пожаловать в Safarstan!'
        : '👋 С возвращением!';
    document.getElementById('authSubtitle').textContent = isSignup
        ? 'Создай аккаунт — и в путь'
        : 'Войди, чтобы продолжить путешествие';
    document.getElementById('authSubmit').textContent = isSignup
        ? 'Создать аккаунт 🚀'
        : 'Войти 🔑';
    document.getElementById('signupFields').style.display = isSignup ? 'block' : 'none';

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === authMode);
    });

    const errEl = document.getElementById('authError');
    if (errEl) errEl.style.display = 'none';
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
// ТЕМА
// ============================================
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('safarstan_theme', theme);
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
// PWA: УСТАНОВКА ПРИЛОЖЕНИЯ
// ============================================
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
});

function showInstallButton() {
    const header = document.querySelector('.header__inner');
    if (!header || document.getElementById('installBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'installBtn';
    btn.className = 'theme-btn';
    btn.title = 'Установить приложение';
    btn.textContent = '📲';
    btn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            btn.remove();
        }
        deferredPrompt = null;
    });

    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn && themeBtn.parentNode) {
        themeBtn.parentNode.insertBefore(btn, themeBtn);
    } else {
        header.appendChild(btn);
    }
}