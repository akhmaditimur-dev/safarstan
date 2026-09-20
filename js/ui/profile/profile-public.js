// ============ UI: PROFILE — ПУБЛИЧНЫЙ ПРОФИЛЬ (?p=) ============

async function openPublicProfile(playerId) {
    if (!playerId) return;

    const landing = document.getElementById('landing');
    if (landing) landing.style.display = 'none';

    const player = await loadPlayerById(playerId);

    if (!player) {
        if (typeof showWarningToast === 'function') showWarningToast('Профиль не найден');
        if (landing) landing.style.display = 'block';
        return;
    }

    renderAvatar(document.getElementById('ppAvatar'), player.avatar);
    document.getElementById('ppName').textContent = player.name || 'Игрок';
    document.getElementById('ppLevel').textContent = player.level || 1;

    // Города
    const citiesEl = document.getElementById('ppCities');
    if (citiesEl) {
        const cities = [];
        const homeCity = CITIES[player.home_city];
        if (homeCity) {
            cities.push(`<span class="city-chip home"><i data-lucide="home"></i> ${homeCity.name}</span>`);
        }
        if (player.current_city && player.current_city !== player.home_city) {
            const cur = CITIES[player.current_city];
            if (cur) {
                cities.push(`<span class="city-chip current"><i data-lucide="map-pin"></i> ${cur.name}</span>`);
            }
        }
        citiesEl.innerHTML = cities.length ? cities.join('') : '<span class="city-chip">—</span>';
    }

    // Статистика
    const statsEl = document.getElementById('ppStats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="profile-stat"><strong>${player.xp || 0}</strong><small>XP</small></div>
            <div class="profile-stat"><strong>${player.level || 1}</strong><small>Уровень</small></div>
        `;
    }

    // Бейджи
    const badgesEl = document.getElementById('ppBadges');
    if (badgesEl) {
        const earned = new Set(player.badges || []);
                if (earned.size === 0) {
            badgesEl.innerHTML = '<div class="dashboard-empty">Достижений пока нет</div>';
        } else {
            badgesEl.innerHTML = BADGES
                .filter(b => earned.has(b.id))
                .map(b => `
                    <div class="profile-badge earned">
                        <div class="badge-icon"><i data-lucide="${b.icon}"></i></div>
                        <div class="badge-name">${b.name}</div>
                    </div>
                `).join('');
        }
    }

    // Кнопка «Войти»
    const actionsSection = document.getElementById('ppActionsSection');
    if (actionsSection) {
        actionsSection.innerHTML = `
            <button id="ppPublicLoginBtn" class="btn btn-primary btn-block">
                <i data-lucide="rocket"></i> Войти в Safarstan
            </button>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('ppPublicLoginBtn').addEventListener('click', () => {
            history.replaceState(null, '', location.pathname);
            document.getElementById('playerProfileModal').style.display = 'none';
            if (landing) landing.style.display = 'block';
            if (typeof showAuthModal === 'function') showAuthModal('signup');
        });
    }

    document.getElementById('playerProfileModal').style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}