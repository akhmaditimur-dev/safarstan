// ============ UI: КВЕСТЫ ============

let currentQuestTab = 'active';
let _questsExpanded = false;
const QUESTS_LIMIT = 3;

function renderQuests() {
    if (!PLAYER) return;

    const container = document.getElementById('questsList');
    const showMoreBtn = document.getElementById('questsShowMoreBtn');
    if (!container) return;

    if (!PLAYER.completedQuests) PLAYER.completedQuests = [];

    // Фильтрация по табу
    let quests = QUESTS.slice();
    if (currentQuestTab === 'active') {
        quests = quests.filter(q => !PLAYER.completedQuests.includes(q.id));
    } else if (currentQuestTab === 'completed') {
        quests = quests.filter(q => PLAYER.completedQuests.includes(q.id));
    }

    // Пусто
    if (quests.length === 0) {
        const emptyMsg = currentQuestTab === 'completed'
            ? 'Пока нет выполненных квестов.<br>Сделай чек-ин — начнём!'
            : 'Все квесты выполнены! Ты — легенда!';
        container.innerHTML = `<div class="quest-empty">${emptyMsg}</div>`;
        if (showMoreBtn) showMoreBtn.classList.remove('is-visible');
        return;
    }

    // Скрываем лишние
    const showAll = _questsExpanded || quests.length <= QUESTS_LIMIT;
    const visibleQuests = showAll ? quests : quests.slice(0, QUESTS_LIMIT);

    // Рендер карточек
    container.innerHTML = visibleQuests.map(renderQuestCard).join('');

    // Кнопка «Показать все» / «Свернуть»
    if (showMoreBtn) {
        const hiddenCount = quests.length - QUESTS_LIMIT;
        if (hiddenCount > 0) {
            showMoreBtn.classList.add('is-visible');
            showMoreBtn.innerHTML = _questsExpanded
                ? '<i data-lucide="chevron-up"></i> Свернуть'
                : `<i data-lucide="chevron-down"></i> Показать все (${hiddenCount})`;
        } else {
            showMoreBtn.classList.remove('is-visible');
        }
    }

    // Превращаем Lucide-иконки в SVG
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================
// РЕНДЕР ОДНОЙ КАРТОЧКИ
// ============================================
function renderQuestCard(quest) {
    const result = checkQuest(quest);
    const done = PLAYER.completedQuests.includes(quest.id);
    const [current, target] = result.progress;
    const percent = Math.min(100, Math.round((current / target) * 100));

    const progressHtml = !done ? `
        <div class="quest-progress">
            <div class="quest-progress-bar">
                <div class="quest-progress-fill" style="width: ${percent}%"></div>
            </div>
            <div class="quest-progress-text">${current} / ${target}</div>
        </div>
    ` : '';

    return `
        <div class="quest-card ${done ? 'done' : ''}">
            <div class="quest-header">
                <div class="quest-icon"><i data-lucide="${quest.icon}"></i></div>
                <div class="quest-title">
                    <h3>${quest.name}</h3>
                    <p>${quest.desc}</p>
                </div>
                ${done ? '<div class="quest-done-badge"><i data-lucide="check"></i> Готово</div>' : ''}
            </div>
            ${progressHtml}
            <div class="quest-reward">
                <i data-lucide="gift"></i>
                Награда: +${quest.xp} XP ${done ? '· получено' : ''}
            </div>
        </div>
    `;
}

// ============================================
// ТАБЫ
// ============================================
function renderQuestTabs() {
    document.querySelectorAll('#questTabs .tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.quest === currentQuestTab);
    });
}

// ============================================
// КНОПКА «ПОКАЗАТЬ ВСЕ»
// ============================================
document.addEventListener('click', (e) => {
    if (e.target.closest('#questsShowMoreBtn')) {
        _questsExpanded = !_questsExpanded;
        renderQuests();
    }
});