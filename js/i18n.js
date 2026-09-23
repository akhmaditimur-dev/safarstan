// ============ I18N — ПЕРЕВОДЫ ИНТЕРФЕЙСА ============
//
// Структура:
//   I18N[langCode] = { section: { key: 'текст', ... }, ... }
//
// Доступ: t('section.key')
// Fallback: если перевода нет в текущем языке — берётся из LANG_FALLBACK (ru)
//
// ⚠️ EN, UZ, KZ, TJ, KG, TM — заглушки (null).
// Когда появятся переводы — заменишь null на объект с переводами.

const I18N = {
    ru: {
        // === Меню / Сайдбар ===
        sidebar: {
            groupPersonal: 'Личное',
            groupSocial: 'Общение',
            groupActivities: 'Активности',
            groupInfo: 'Инфо',

            profile: 'Профиль',
            friends: 'Друзья',
            accessRequests: 'Запросы на профиль',
            gallery: 'Моя галерея',
            reviews: 'Мои отзывы',
            settings: 'Настройки',
            faq: 'FAQ',

            messages: 'Сообщения',
            groupChats: 'Групповые чаты',
            notifications: 'Уведомления',

            map: 'Карта',
            ratings: 'Рейтинг',
            quests: 'Квесты',
            plans: 'Мои планы',
            gaps: 'Мои гапы',
            hashars: 'Хашары',

            cityInfo: 'О городе',
            transport: 'Транспорт',
            hotels: 'Отели',
            services: 'Сервисы',
        },

        // === Hero ===
        hero: {
            title: 'Куда отправимся?',
            subtitle: 'Safarstan — исследуй города Центральной Азии, зарабатывай очки, открывай новое',
        },

        // === Секции ===
        sections: {
            transport: 'Транспорт',
            hotels: 'Где остановиться',
            services: 'Сервисы',
            quests: 'Квесты',
            ratings: 'Рейтинг городов',
            map: 'Карта Центральной Азии',
        },

        // === Транспорт ===
        transport: {
            train: 'Поезда',
            bus: 'Автобусы',
            taxi: 'Такси',
        },

        // === Настройки ===
        settings: {
            title: 'Настройки',
            subtitle: 'Язык, тема, аккаунт',
            language: 'Язык',
            theme: 'Тема',
            modulesLabel: 'Показать в дашборде и меню',
            privacyLabel: 'Приватность',
            dataLabel: 'Данные',
            accountLabel: 'Аккаунт',

            exportData: 'Скачать мои данные',
            blockedList: 'Список заблокированных',
            resetProgress: 'Сбросить прогресс',
            changeEmail: 'Сменить email',
            changePassword: 'Сменить пароль',
            logout: 'Выйти из аккаунта',
            deleteAccount: 'Удалить аккаунт',

            themeLight: 'Светлая',
            themeDark: 'Тёмная',
            themeSky: 'Небесная',
            themeNature: 'Природная',
            themeSpace: 'Космос',
            themeOrient: 'Восточная',
        },

        // === Общие кнопки ===
        common: {
            save: 'Сохранить',
            cancel: 'Отмена',
            close: 'Закрыть',
            delete: 'Удалить',
            edit: 'Редактировать',
            add: 'Добавить',
            yes: 'Да',
            no: 'Нет',
            loading: 'Загрузка...',
        },
    },

    // === Заглушки — пока переводов нет ===
    en: null,
    uz: null,
    kz: null,
    tj: null,
    kg: null,
    tm: null,
};

// Язык по умолчанию (fallback) — если перевода нет
const LANG_FALLBACK = 'ru';

// Список языков для переключателя
// enabled: true → можно выбрать; false → серый (нет перевода)
const AVAILABLE_LANGS = [
    { code: 'ru', label: 'Русский',    flag: '🇷🇺', enabled: true },
    { code: 'en', label: 'English',    flag: '🇬🇧', enabled: false },
    { code: 'uz', label: "O'zbek",     flag: '🇺🇿', enabled: false },
    { code: 'kz', label: 'Қазақша',    flag: '🇰🇿', enabled: false },
    { code: 'tj', label: 'Тоҷикӣ',     flag: '🇹🇯', enabled: false },
    { code: 'kg', label: 'Кыргызча',   flag: '🇰🇬', enabled: false },
    { code: 'tm', label: 'Türkmençe',  flag: '🇹🇲', enabled: false },
];

// ============================================
// ДОСТУП К ПЕРЕВОДАМ
// ============================================

// Получить перевод по ключу
// (например, 'sidebar.profile')
function t(key, lang = null) {
    if (!key) return '';

    const useLang = lang || (typeof currentLang !== 'undefined' ? currentLang : LANG_FALLBACK);
    const parts = key.split('.');

    // 1. Пробуем нужный язык
    let value = getNestedValue(I18N[useLang], parts);

    // 2. Fallback на русский
    if (value === undefined) {
        value = getNestedValue(I18N[LANG_FALLBACK], parts);
    }

    // 3. Если совсем нет — возвращаем ключ (для отладки)
    return value !== undefined ? value : `[${key}]`;
}

// Вспомогательная функция — достать значение по пути
function getNestedValue(obj, parts) {
    if (!obj) return undefined;
    let cur = obj;
    for (const part of parts) {
        if (cur === null || typeof cur !== 'object') return undefined;
        cur = cur[part];
    }
    return cur;
}

// Проверка: есть ли перевод для языка
function hasTranslation(langCode) {
    return I18N[langCode] !== null && I18N[langCode] !== undefined;
}

// Проверка: включён ли язык (можно ли его выбрать)
function isLangEnabled(langCode) {
    const lang = AVAILABLE_LANGS.find(l => l.code === langCode);
    return lang ? lang.enabled === true : false;
}