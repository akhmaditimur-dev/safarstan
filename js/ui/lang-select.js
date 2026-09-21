// ============ UI: ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА (сворачиваемый) ============

// Список доступных языков. При добавлении нового — автоматически
// попадёт в список. translations должны быть в I18N (data.js)
const AVAILABLE_LANGS = [
    { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
    { code: 'en', label: 'English',    flag: '🇬🇧' },
    // Добавим позже:
    // { code: 'uz', label: "O'zbek",     flag: '🇺🇿' },
    // { code: 'kz', label: 'Қазақша',    flag: '🇰🇿' },
    // { code: 'tj', label: 'Тоҷикӣ',     flag: '🇹🇯' },
    // { code: 'kg', label: 'Кыргызча',   flag: '🇰🇬' },
    // { code: 'tm', label: 'Türkmençe',  flag: '🇹🇲' },
];

function renderLangSelect() {
    const listEl = document.getElementById('langList');
    const currentEl = document.getElementById('langCurrentLabel');
    if (!listEl) return;

    // Текущий язык
    const current = AVAILABLE_LANGS.find(l => l.code === currentLang) || AVAILABLE_LANGS[0];
    if (currentEl) currentEl.textContent = current.label;

    // Список
    listEl.innerHTML = AVAILABLE_LANGS.map(lang => `
        <button class="lang-select__item ${lang.code === currentLang ? 'active' : ''}"
                data-lang-select="${lang.code}">
            <span class="lang-select__flag">${lang.flag}</span>
            <span>${lang.label}</span>
            ${lang.code === currentLang ? '<i data-lucide="check"></i>' : ''}
        </button>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// === Обработчики ===
document.addEventListener('click', (e) => {
    // Открыть/закрыть список
    if (e.target.closest('[data-lang-toggle]')) {
        e.stopPropagation();
        const list = document.getElementById('langList');
        if (!list) return;
        const isHidden = list.style.display === 'none';
        list.style.display = isHidden ? 'block' : 'none';
        return;
    }

    // Клик по языку
    const langBtn = e.target.closest('[data-lang-select]');
    if (langBtn) {
        const code = langBtn.dataset.langSelect;
        currentLang = code;
        if (typeof applyLang === 'function') applyLang();
        if (typeof saveState === 'function') saveState();
        renderLangSelect();
        document.getElementById('langList').style.display = 'none';
        return;
    }

    // Закрыть при клике вне
    const list = document.getElementById('langList');
    if (list && list.style.display === 'block') {
        if (!e.target.closest('#langSelect')) {
            list.style.display = 'none';
        }
    }
});