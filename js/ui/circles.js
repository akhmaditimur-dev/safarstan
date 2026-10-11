// ============ UI: КРУГИ ============

let CIRCLES_CACHE = [];

const CIRCLE_TYPE_LABELS = {
    gap: 'Гап',
    family: 'Семья',
    work: 'Коллеги',
    earth: 'Землячество',
};

const CIRCLE_SCHEDULE_LABELS = {
    weekly: 'Каждую неделю',
    biweekly: 'Раз в 2 недели',
    monthly: 'Раз в месяц',
    quarterly: 'Раз в квартал',
    once: 'Один раз',
    manual: 'По договорённости',
};

// ============================================
// РЕНДЕР: карточка в дашборде
// ============================================
async function renderCirclesDashboard() {
    const container = document.getElementById('dashCircles');
    if (!container || !PLAYER) return;

    container.innerHTML = '<div class="dashboard-empty">Загрузка...</div>';

    const circles = await loadMyCircles();
    CIRCLES_CACHE = circles;

    if (circles.length === 0) {
        container.innerHTML = `
            <div class="dashboard-empty">
                Пока нет кругов. Создай первый.
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    // Первые 5
    container.innerHTML = circles.slice(0, 5).map(c => {
        const typeLabel = CIRCLE_TYPE_LABELS[c.type] || 'Круг';
        const emoji = c.avatar_emoji || '☕';

        return `
            <div class="dashboard-row" data-circle-id="${c.id}">
                <div class="dashboard-row__icon">${emoji}</div>
                <div class="dashboard-row__info">
                    <div class="dashboard-row__name">${escapeHtml(c.name)}</div>
                    <div class="dashboard-row__meta">
                        ${typeLabel}
                        ${c.city_key ? ' · ' + cityName(c.city_key) : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// МОДАЛКА СОЗДАНИЯ
// ============================================
function openCircleCreateModal() {
    const modal = document.getElementById('circleCreateModal');
    if (!modal || !PLAYER) return;

    document.getElementById('circleType').value = 'gap';
    document.getElementById('circleName').value = '';
    document.getElementById('circleDescription').value = '';
    document.getElementById('circleSchedule').value = 'monthly';
    document.getElementById('circleMeetPoint').value = '';
    document.getElementById('circleCreateError').style.display = 'none';

    // Эмодзи — сброс на ☕
    document.querySelectorAll('#circleEmojiPicker .circle-emoji-option').forEach((btn, i) => {
        btn.classList.toggle('active', i === 0);
    });

    // Город
    if (typeof initCitySelect === 'function') {
        initCitySelect('circleCityInput', 'circleCity', 'circleCityDropdown');
        setCitySelect('circleCityInput', 'circleCity', PLAYER.currentCity || 'tashkent');
    }

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeCircleCreateModal() {
    const modal = document.getElementById('circleCreateModal');
    if (modal) modal.style.display = 'none';
}

async function submitCircleCreate() {
    const errorEl = document.getElementById('circleCreateError');
    errorEl.style.display = 'none';

    const type = document.getElementById('circleType').value;
    const name = document.getElementById('circleName').value.trim();
    const description = document.getElementById('circleDescription').value.trim();
    const cityKey = document.getElementById('circleCity').value;
    const scheduleType = document.getElementById('circleSchedule').value;
    const meetPoint = document.getElementById('circleMeetPoint').value.trim();
    const emojiBtn = document.querySelector('#circleEmojiPicker .circle-emoji-option.active');
    const emoji = emojiBtn ? emojiBtn.dataset.emoji : '☕';

    if (!name || name.length < 3) {
        errorEl.textContent = 'Название слишком короткое (минимум 3 символа)';
        errorEl.style.display = 'block';
        return;
    }

    if (typeof hasBadWords === 'function' && hasBadWords(name)) {
        errorEl.textContent = 'Пожалуйста, без грубых слов';
        errorEl.style.display = 'block';
        return;
    }

    if (!cityKey) {
        errorEl.textContent = 'Выбери город';
        errorEl.style.display = 'block';
        return;
    }

    const result = await createCircle({
        type,
        name,
        description,
        cityKey,
        schedule: { type: scheduleType },
        meetPoint,
        avatarEmoji: emoji,
    });

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    closeCircleCreateModal();
    await renderCirclesDashboard();

    if (typeof showWarningToast === 'function') {
        showWarningToast('✅ Круг создан');
    }
}