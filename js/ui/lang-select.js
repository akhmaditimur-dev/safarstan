// ============ UI: ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА (сворачиваемый) ============

function renderLangSelect() {
    const listEl = document.getElementById('langList');
    const currentEl = document.getElementById('langCurrentLabel');
    if (!listEl) return;

    // Текущий язык
    const current = AVAILABLE_LANGS.find(l => l.code === currentLang) || AVAILABLE_LANGS[0];
    if (currentEl) currentEl.textContent = current.label;

    // Список
    listEl.innerHTML = AVAILABLE_LANGS.map(lang => {
        const isActive = lang.code === currentLang;
        const isEnabled = lang.enabled === true;

        return `
            <button class="lang-select__item ${isActive ? 'active' : ''} ${!isEnabled ? 'disabled' : ''}"
                    ${isEnabled ? `data-lang-select="${lang.code}"` : 'disabled'}>
                <span class="lang-select__flag">${lang.flag}</span>
                <span class="lang-select__label">${lang.label}</span>
                ${!isEnabled ? '<span class="lang-select__soon">скоро</span>' : ''}
                ${isActive && isEnabled ? '<i data-lucide="check"></i>' : ''}
            </button>
        `;
    }).join('');

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
    if (langBtn && !langBtn.disabled) {
        const code = langBtn.dataset.langSelect;

        // Проверка: включён ли язык
        if (typeof isLangEnabled === 'function' && !isLangEnabled(code)) {
            if (typeof showWarningToast === 'function') {
                showWarningToast('Перевод скоро появится');
            }
            return;
        }

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