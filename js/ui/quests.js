// ============ UI: КВЕСТЫ ============

var currentQuestTab = 'active'; // active | completed | all

function renderQuests() {
    if (!PLAYER) return;

    const container = document.getElementById('questsList');
    if (!container) return;

    if (!PLAYER.completedQuests) PLAYER.completedQuests = [];

    let quests = QUESTS.slice();
    if (currentQuestTab === 'active') {
        quests = quests.filter(q => !PLAYER.completedQuests.includes(q.id));
    } else if (currentQuestTab === 'completed') {
        quests = quests.filter(q => PLAYER.completedQuests.includes(q.id));
    }

    if (quests.length === 0) {
        const emptyMsg = currentQuestTab === 'completed'
            ? 'Пока нет выполненных квестов.<br>Сделай чек-ин — начнём! ✅'
            : '🎉 Все квесты выполнены! Ты — легенда!';
        container.innerHTML = `<div class="quest-empty">${emptyMsg}</div>`;
        return;
    }

    container.innerHTML = quests.map(quest => {
        const result = checkQuest(quest);
        const done = PLAYER.completedQuests.includes(quest.id);
        const [current, target] = result.progress;
        const percent = Math.min(100, Math.round((current / target) * 100));

        return `
            <div class="quest-card ${done ? 'done' : ''}">
                <div class="quest-header">
                    <div class="quest-icon">${quest.icon}</div>
                    <div class="quest-title">
                        <h3>${quest.name}</h3>
                        <p>${quest.desc}</p>
                    </div>
                    ${done ? '<div class="quest-done-badge">✅ Готово</div>' : ''}
                </div>
                
                ${!done ? `
                    <div class="quest-progress">
                        <div class="quest-progress-bar">
                            <div class="quest-progress-fill" style="width: ${percent}%"></div>
                        </div>
                        <div class="quest-progress-text">${current} / ${target}</div>
                    </div>
                ` : ''}
                
                <div class="quest-reward">🎁 Награда: +${quest.xp} XP ${done ? '· получено' : ''}</div>
            </div>
        `;
    }).join('');
}

function renderQuestTabs() {
    document.querySelectorAll('#questTabs .tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.quest === currentQuestTab);
    });
}