// ============ APP: ПРОЧИЕ СОБЫТИЯ ============

// === Модули, карта, приватность (тумблеры) ===
document.addEventListener('change', (e) => {
    const modToggle = e.target.closest('[data-module-toggle]');
    if (modToggle) {
        if (typeof saveModuleSetting === 'function') {
            saveModuleSetting(modToggle.dataset.moduleToggle, modToggle.checked);
        }
        return;
    }

    const mapToggle = e.target.closest('[data-map-toggle]');
    if (mapToggle) {
        if (typeof saveMapSetting === 'function') {
            saveMapSetting(mapToggle.dataset.mapToggle, mapToggle.checked);
        }
        return;
    }

    const privToggle = e.target.closest('[data-privacy-toggle]');
    if (privToggle) {
        if (typeof savePrivacySetting === 'function') {
            savePrivacySetting(privToggle.dataset.privacyToggle, privToggle.checked);
        }
        return;
    }
});

// ============================================
// НАСТРОЙКИ КАРТЫ
// ============================================

// Открытие модалки настроек карты
on('mapSettingsBtn', 'click', () => {
    if (typeof renderMapSettings === 'function') renderMapSettings();
    const modal = document.getElementById('mapSettingsModal');
    if (modal) modal.style.display = 'flex';
});

on('mapSettingsClose', 'click', () => {
    const modal = document.getElementById('mapSettingsModal');
    if (modal) modal.style.display = 'none';
});

on('mapSettingsModal', 'click', (e) => {
    if (e.target.id === 'mapSettingsModal') e.target.style.display = 'none';
});

// Выбор стиля карты в модалке
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-map-style-option]');
    if (!btn) return;

    const style = btn.dataset.mapStyleOption;
    await setMapStyle(style);
    renderMapStyleSelection();
});

// Дропдаун стиля на самой карте
document.addEventListener('click', (e) => {
    // Открыть / закрыть список
    if (e.target.closest('#mapStyleBtn')) {
        e.stopPropagation();
        const list = document.getElementById('mapStyleList');
        if (!list) return;
        const isHidden = list.style.display === 'none';
        list.style.display = isHidden ? 'block' : 'none';
        if (isHidden) updateMapStyleDropdown();
        return;
    }

    // Клик по стилю в списке
    const styleItem = e.target.closest('[data-map-style]');
    if (styleItem) {
        const style = styleItem.dataset.mapStyle;
        setMapStyle(style);
        const list = document.getElementById('mapStyleList');
        if (list) list.style.display = 'none';
        return;
    }

    // Клик вне — закрыть
    const list = document.getElementById('mapStyleList');
    if (list && list.style.display === 'block') {
        if (!e.target.closest('#mapStyleSelect')) {
            list.style.display = 'none';
        }
    }
});

// === Профиль другого игрока ===
document.addEventListener('click', (e) => {
    const playerEl = e.target.closest('[data-player-profile]');
    if (!playerEl) return;

    const playerId = playerEl.dataset.playerProfile;
    if (!playerId) return;

    openPlayerProfile(playerId);
});

on('playerProfileClose', 'click', closePlayerProfile);
on('playerProfileModal', 'click', (e) => {
    if (e.target.id === 'playerProfileModal') closePlayerProfile();
});

// === Нижнее меню ===
const bottomNav = document.getElementById('bottomNav');

function setActiveBottomNav(target) {
    if (!bottomNav) return;
    bottomNav.querySelectorAll('.bottom-nav__item').forEach(el => {
        el.classList.toggle('active', el === target);
    });
}

if (bottomNav) {
    bottomNav.addEventListener('click', (e) => {
        const item = e.target.closest('.bottom-nav__item');
        if (!item) return;

        if (item.id === 'bottomProfileBtn') {
            e.preventDefault();
            if (PLAYER) {
                renderProfile();
                document.getElementById('profileModal').style.display = 'flex';
                setActiveBottomNav(item);
            } else {
                showAuthModal('signup');
            }
            return;
        }

        setActiveBottomNav(item);
    });
}

let scrollTicking = false;

window.addEventListener('scroll', () => {
    if (!bottomNav) return;
    if (window.innerWidth > 768) return;
    if (scrollTicking) return;

    scrollTicking = true;

    requestAnimationFrame(() => {
        const sections = ['dashboard', 'map', 'ratings', 'quests'];
        const scrollPos = window.scrollY + 200;

        let activeId = null;

        sections.forEach(id => {
            const section = document.getElementById(id);
            if (!section) return;

            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;

            if (scrollPos >= top && scrollPos < bottom) {
                activeId = id;
            }
        });

        if (activeId) {
            bottomNav.querySelectorAll('.bottom-nav__item').forEach(el => {
                el.classList.toggle('active', el.dataset.nav === activeId);
            });
        }

        scrollTicking = false;
    });
});

// === Клик по чипу города — переход к городу ===
document.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-goto-city]');
    if (!chip) return;

    const cityKey = chip.dataset.gotoCity;
    if (!cityKey) return;

    // Закрываем модалки, если открыты
    document.querySelectorAll('.modal-overlay').forEach(m => {
        if (m.style.display === 'flex') m.style.display = 'none';
    });

    // Выбираем город
    if (typeof selectCity === 'function') {
        selectCity(cityKey);
    }

    // Скроллим к секции «О городе»
    setTimeout(() => {
        const infoSection = document.getElementById('info');
        if (infoSection) {
            infoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
});