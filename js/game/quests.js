// ============ GAME: КВЕСТЫ ============

// Проверка одного квеста
function checkQuest(quest) {
    if (!PLAYER) return { done: false, progress: [0, 1] };

    const visited = PLAYER.visitedCities || {};
    const checkins = PLAYER.checkins || {};

    switch (quest.type) {
        case 'cities_count': {
            const count = Object.values(visited).filter(n => n > 0).length;
            return { done: count >= quest.target, progress: [count, quest.target] };
        }

        case 'current_city': {
            const count = visited[PLAYER.currentCity] || 0;
            return { done: count >= quest.target, progress: [count, quest.target] };
        }

        case 'specific_cities': {
            const have = quest.cities.filter(c => (visited[c] || 0) > 0);
            return {
                done: have.length === quest.cities.length,
                progress: [have.length, quest.cities.length],
            };
        }

        case 'category': {
            let count = 0;
            Object.keys(checkins).forEach(key => {
                const parts = key.split('|');
                if (parts[1] === quest.category) count++;
            });
            return { done: count >= quest.target, progress: [count, quest.target] };
        }

        case 'specific_places': {
            const have = quest.places.filter(p => (checkins[p] || 0) > 0);
            return {
                done: have.length === quest.places.length,
                progress: [have.length, quest.places.length],
            };
        }

        case 'user_places_count': {
            const count = PLAYER.userPlacesAdded || 0;
            return { done: count >= quest.target, progress: [count, quest.target] };
        }

        default:
            return { done: false, progress: [0, 1] };
    }
}

// Проверка всех квестов
function checkQuests() {
    if (!PLAYER) return [];

    if (!PLAYER.completedQuests) PLAYER.completedQuests = [];
    if (!PLAYER.questsClaimed) PLAYER.questsClaimed = [];

    const newlyCompleted = [];

    QUESTS.forEach(quest => {
        const result = checkQuest(quest);
        if (result.done && !PLAYER.completedQuests.includes(quest.id)) {
            PLAYER.completedQuests.push(quest.id);
            newlyCompleted.push(quest);
        }
    });

    newlyCompleted.forEach(quest => {
        if (!PLAYER.questsClaimed.includes(quest.id)) {
            PLAYER.xp += quest.xp;
            PLAYER.questsClaimed.push(quest.id);
        }
    });

    if (newlyCompleted.length > 0) {
        const oldLevel = PLAYER.level;
        PLAYER.level = getLevelFromXP(PLAYER.xp);
        if (PLAYER.level > oldLevel) {
            setTimeout(() => showLevelUp(PLAYER.level), 1000);
        }
    }

    return newlyCompleted;
}

// Тост о выполненном квесте
function showQuestToast(quest) {
    const toast = document.createElement('div');
    toast.className = 'xp-toast';
    toast.style.background = 'linear-gradient(135deg, #16a34a, #22c55e)';
    toast.innerHTML = `${quest.icon} Квест выполнен!<br><strong>${quest.name}</strong> · +${quest.xp} XP`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('fade-out'), 3200);
    setTimeout(() => toast.remove(), 3600);
}