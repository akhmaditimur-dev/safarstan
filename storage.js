// ============ СОСТОЯНИЕ ИГРОКА И ГОРОДОВ ============

// Очки городов
let CITY_SCORES = JSON.parse(localStorage.getItem('safarstan_scores') || '{}');

// Пользовательские места
let USER_PLACES = JSON.parse(localStorage.getItem('safarstan_user_places') || '{}');

function saveUserPlaces() {
    localStorage.setItem('safarstan_user_places', JSON.stringify(USER_PLACES));
}

// Сколько мест добавлено сегодня (для лимита)
let todayAddedCount = parseInt(localStorage.getItem('safarstan_today_added') || '0');
let todayAddedDate = localStorage.getItem('safarstan_today_date') || '';

// Сброс счётчика в новый день
const todayStr = new Date().toISOString().slice(0, 10);
if (todayAddedDate !== todayStr) {
    todayAddedCount = 0;
    todayAddedDate = todayStr;
    localStorage.setItem('safarstan_today_added', '0');
    localStorage.setItem('safarstan_today_date', todayStr);
}

function incrementTodayAdded() {
    todayAddedCount++;
    localStorage.setItem('safarstan_today_added', String(todayAddedCount));
}

// Игрок
let PLAYER = null;

// Текущее состояние UI
let currentCity = localStorage.getItem('shahr_city') || 'tashkent';
let currentTransportType = localStorage.getItem('shahr_transport') || 'train';
let currentLang = localStorage.getItem('shahr_lang') || 'ru';
let currentRatingType = 'residents';

// Проверка сохранённого города
if (typeof CITIES !== 'undefined' && !CITIES[currentCity]) {
    currentCity = 'tashkent';
}

// ============ ФУНКЦИИ СОХРАНЕНИЯ ============

function saveState() {
    localStorage.setItem('shahr_city', currentCity);
    localStorage.setItem('shahr_transport', currentTransportType);
    localStorage.setItem('shahr_lang', currentLang);
}

function savePlayer() {
    if (PLAYER) {
        localStorage.setItem('safarstan_player', JSON.stringify(PLAYER));
    }
}

function loadPlayer() {
    const saved = localStorage.getItem('safarstan_player');
    if (saved) {
        try {
            PLAYER = JSON.parse(saved);
            // Миграция старых профилей
            if (!PLAYER.visitedCities) PLAYER.visitedCities = {};
            if (!PLAYER.checkins) PLAYER.checkins = {};
            if (typeof PLAYER.xp !== 'number') PLAYER.xp = 0;
            if (typeof PLAYER.level !== 'number') PLAYER.level = 1;
            if (!PLAYER.avatar) PLAYER.avatar = '🧑‍💼';
            if (!PLAYER.badges) PLAYER.badges = [];
            if (!PLAYER.completedQuests) PLAYER.completedQuests = [];
            if (!PLAYER.questsClaimed) PLAYER.questsClaimed = [];
            if (!PLAYER.userPlacesAdded) PLAYER.userPlacesAdded = 0;
            if (!PLAYER.checkinCooldowns) PLAYER.checkinCooldowns = {};
            if (typeof PLAYER.todayCheckins !== 'number') PLAYER.todayCheckins = 0;
            if (!PLAYER.todayDate) PLAYER.todayDate = null;
        } catch (e) {
            PLAYER = null;
        }
    }
}

function saveScores() {
    localStorage.setItem('safarstan_scores', JSON.stringify(CITY_SCORES));
}

function ensureCityScores() {
    if (typeof CITIES === 'undefined') return;
    Object.keys(CITIES).forEach(key => {
        if (!CITY_SCORES[key]) {
            CITY_SCORES[key] = { residents: 0, home: 0, hospitality: 0 };
        }
    });
}

function getLevelFromXP(xp) {
    return Math.floor(xp / 100) + 1;
}