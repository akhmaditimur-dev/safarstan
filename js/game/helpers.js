// ============ GAME: ХЕЛПЕРЫ ============

// Уровень из XP (каждые 100 XP)
function getLevelFromXP(xp) {
    return Math.floor(xp / 100) + 1;
}

// Фильтр мата
const BAD_WORDS = [
    // Русские
    'хуй', 'пизд', 'ебан', 'ебал', 'ебат', 'бляд', 'блят', 'мраз', 'сука', 'нах',
    'залуп', 'мудак', 'мудил', 'пидор', 'пидар', 'гандон', 'долбоёб', 'долбоеб',
    // Английские
    'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'cunt',
];

function hasBadWords(text) {
    const lower = text.toLowerCase();
    return BAD_WORDS.some(word => lower.includes(word));
}

function validateReviewText(text) {
    if (!text || text.trim().length < 3) {
        return 'Отзыв слишком короткий (минимум 3 символа)';
    }
    if (text.length > 500) {
        return 'Отзыв слишком длинный (максимум 500 символов)';
    }
    if (hasBadWords(text)) {
        return 'Пожалуйста, без грубых слов 🙏';
    }
    return null;
}

// Универсальная проверка текста (для гапов, UGC, хашаров)
function validateUserText(text, options = {}) {
    const {
        minLength = 2,
        maxLength = 200,
        fieldName = 'Текст',
    } = options;

    if (!text || text.trim().length < minLength) {
        return `${fieldName} слишком короткий (минимум ${minLength} символа)`;
    }
    if (text.length > maxLength) {
        return `${fieldName} слишком длинный (максимум ${maxLength} символов)`;
    }
    if (hasBadWords(text)) {
        return 'Пожалуйста, без грубых слов 🙏';
    }
    return null;
}