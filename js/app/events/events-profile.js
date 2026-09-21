// ============ APP: СОБЫТИЯ ПРОФИЛЯ ============

// Закрытие модалки своего профиля
on('profileClose', 'click', () => {
    const modal = document.getElementById('profileModal');
    if (modal) modal.style.display = 'none';

    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) {
        bottomNav.querySelectorAll('.bottom-nav__item').forEach(el => {
            el.classList.remove('active');
        });
    }
});

on('profileModal', 'click', (e) => {
    if (e.target.id === 'profileModal') e.target.style.display = 'none';
});

// Редактирование имени
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#editNameBtnDash, #editNameBtnProfile');
    if (!btn) return;
    if (typeof enableNameEdit === 'function') enableNameEdit();
});

// Аватар
on('dashAvatar', 'click', () => {
    if (typeof openAvatarModal === 'function') openAvatarModal();
});

on('profileAvatar', 'click', () => {
    if (typeof openAvatarModal === 'function') openAvatarModal();
});

on('avatarClose', 'click', () => {
    if (typeof closeAvatarModal === 'function') closeAvatarModal();
});

on('avatarModal', 'click', (e) => {
    if (e.target.id === 'avatarModal' && typeof closeAvatarModal === 'function') {
        closeAvatarModal();
    }
});

const profileAvatarPicker = document.getElementById('profileAvatarPicker');
if (profileAvatarPicker) {
    profileAvatarPicker.addEventListener('click', (e) => {
        if (!e.target.classList.contains('avatar-option')) return;
        const emoji = e.target.dataset.avatar;
        if (emoji) saveEmojiAvatar(emoji);
    });
}

on('avatarFileInput', 'change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('avatarPreview');
    const errorEl = document.getElementById('avatarError');
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
        if (preview) preview.innerHTML = '';
        if (errorEl) {
            errorEl.textContent = 'Файл больше 1 МБ';
            errorEl.style.display = 'block';
        }
        return;
    }

    if (errorEl) errorEl.style.display = 'none';

    const reader = new FileReader();
    reader.onload = (ev) => {
        if (preview) {
            preview.innerHTML = `
                <div class="avatar-preview__item">
                    <img src="${ev.target.result}" alt="preview">
                </div>
            `;
        }
    };
    reader.readAsDataURL(file);

    setTimeout(() => saveUploadedAvatar(file), 300);
});

// === Настройки ===
on('navSettingsBtn', 'click', () => {
    if (typeof openSettingsModal === 'function') {
        openSettingsModal();
    } else {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.style.display = 'flex';
    }
    if (typeof renderModulesSettings === 'function') renderModulesSettings();
    if (typeof renderPrivacySettings === 'function') renderPrivacySettings();
});

on('navAccessRequestsBtn', 'click', async () => {
    if (!PLAYER) return;
    await openAccessRequestsModal();
});

on('settingsClose', 'click', () => {
    if (typeof closeSettingsModal === 'function') {
        closeSettingsModal();
    } else {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.style.display = 'none';
    }
});

on('settingsModal', 'click', (e) => {
    if (e.target.id === 'settingsModal') {
        if (typeof closeSettingsModal === 'function') {
            closeSettingsModal();
        } else {
            e.target.style.display = 'none';
        }
    }
});

on('settingsLogout', 'click', async () => {
    const ok = await showConfirm('Выйти из аккаунта?', {
        okText: 'Выйти',
        title: 'Выход',
    });
    if (!ok) return;
    await signOut();
});

// === Тема и язык ===
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#settingsModal [data-lang]');
    if (!btn) return;
    currentLang = btn.dataset.lang;
    applyLang();
    saveState();
    document.querySelectorAll('#settingsModal [data-lang]').forEach(b => {
        b.classList.toggle('active', b === btn);
    });
});

document.addEventListener('click', (e) => {
    const btn = e.target.closest('#settingsModal [data-theme]');
    if (!btn) return;
    if (typeof applyTheme === 'function') applyTheme(btn.dataset.theme);
    document.querySelectorAll('#settingsModal [data-theme]').forEach(b => {
        b.classList.toggle('active', b === btn);
    });
});

// === Смена email ===
on('settingsChangeEmailBtn', 'click', async () => {
    const modal = document.getElementById('changeEmailModal');
    const currentInput = document.getElementById('changeEmailCurrent');
    if (!modal) return;

    if (currentInput) {
        const email = await getCurrentUserEmail();
        currentInput.value = email || '—';
    }

    document.getElementById('changeEmailNew').value = '';
    document.getElementById('changeEmailError').style.display = 'none';
    document.getElementById('changeEmailSuccess').style.display = 'none';

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

on('changeEmailClose', 'click', () => {
    const modal = document.getElementById('changeEmailModal');
    if (modal) modal.style.display = 'none';
});

on('changeEmailModal', 'click', (e) => {
    if (e.target.id === 'changeEmailModal') e.target.style.display = 'none';
});

on('changeEmailSubmit', 'click', async () => {
    const newEmail = document.getElementById('changeEmailNew').value.trim();
    const errorEl = document.getElementById('changeEmailError');
    const successEl = document.getElementById('changeEmailSuccess');
    const btn = document.getElementById('changeEmailSubmit');

    if (!newEmail || !newEmail.includes('@')) {
        errorEl.textContent = 'Введи корректный email';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Отправка...';
    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    const result = await changeEmail(newEmail);

    btn.disabled = false;
    btn.textContent = 'Отправить письмо';

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    successEl.textContent = '✅ Письмо отправлено. Проверь новый email и подтверди.';
    successEl.style.display = 'block';
});

// === Смена пароля ===
on('settingsChangePasswordBtn', 'click', () => {
    const modal = document.getElementById('changePasswordModal');
    if (!modal) return;

    document.getElementById('changePasswordNew').value = '';
    document.getElementById('changePasswordRepeat').value = '';
    document.getElementById('changePasswordError').style.display = 'none';
    document.getElementById('changePasswordSuccess').style.display = 'none';

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

on('changePasswordClose', 'click', () => {
    const modal = document.getElementById('changePasswordModal');
    if (modal) modal.style.display = 'none';
});

on('changePasswordModal', 'click', (e) => {
    if (e.target.id === 'changePasswordModal') e.target.style.display = 'none';
});

on('changePasswordSubmit', 'click', async () => {
    const newPass = document.getElementById('changePasswordNew').value;
    const repeat = document.getElementById('changePasswordRepeat').value;
    const errorEl = document.getElementById('changePasswordError');
    const successEl = document.getElementById('changePasswordSuccess');
    const btn = document.getElementById('changePasswordSubmit');

    if (newPass.length < 6) {
        errorEl.textContent = 'Пароль минимум 6 символов';
        errorEl.style.display = 'block';
        return;
    }

    if (newPass !== repeat) {
        errorEl.textContent = 'Пароли не совпадают';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Сохранение...';
    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    const result = await changePassword(newPass);

    btn.disabled = false;
    btn.textContent = 'Сменить пароль';

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    successEl.textContent = '✅ Пароль изменён';
    successEl.style.display = 'block';

    setTimeout(() => {
        document.getElementById('changePasswordModal').style.display = 'none';
    }, 1500);
});

// === Экспорт данных ===
on('settingsExportBtn', 'click', async () => {
    if (!PLAYER || !PLAYER.playerId) return;

    const btn = document.getElementById('settingsExportBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader"></i> Собираем...';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const data = await collectMyData();
        downloadJSON(data, `safarstan-${PLAYER.name}-${new Date().toISOString().slice(0, 10)}.json`);
        showWarningToast('✅ Данные скачаны');
    } catch (err) {
        console.error('Ошибка экспорта:', err);
        showWarningToast('Не удалось собрать данные');
    }

    btn.disabled = false;
    btn.innerHTML = originalText;
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

async function collectMyData() {
    const playerId = PLAYER.playerId;

    const profile = {
        id: playerId,
        name: PLAYER.name,
        avatar: PLAYER.avatar,
        homeCity: PLAYER.homeCity,
        currentCity: PLAYER.currentCity,
        xp: PLAYER.xp,
        level: PLAYER.level,
        badges: PLAYER.badges || [],
        completedQuests: PLAYER.completedQuests || [],
        settings: PLAYER.settings || {},
        exportedAt: new Date().toISOString(),
    };

    let checkins = [];
    try { checkins = await loadCheckins(playerId); } catch (e) { console.warn('checkins:', e); }

    let reviews = [];
    try { reviews = await loadMyReviews(playerId); } catch (e) { console.warn('reviews:', e); }

    let photos = [];
    try { photos = await loadMyPhotos(playerId); } catch (e) { console.warn('photos:', e); }

    let gaps = [];
    try { gaps = await loadMyGaps(); } catch (e) { console.warn('gaps:', e); }

    let hashars = [];
    try { hashars = await loadMyHashars(); } catch (e) { console.warn('hashars:', e); }

    let plans = [];
    try { plans = await loadPlans(playerId); } catch (e) { console.warn('plans:', e); }

    return { profile, checkins, reviews, photos, gaps, hashars, plans };
}

function downloadJSON(obj, filename) {
    const json = JSON.stringify(obj, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// === Удаление аккаунта ===
on('settingsDeleteAccountBtn', 'click', () => {
    const modal = document.getElementById('deleteAccountModal');
    if (!modal) return;

    document.getElementById('deleteAccountConfirm').value = '';
    document.getElementById('deleteAccountError').style.display = 'none';

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

on('deleteAccountClose', 'click', () => {
    const modal = document.getElementById('deleteAccountModal');
    if (modal) modal.style.display = 'none';
});

on('deleteAccountModal', 'click', (e) => {
    if (e.target.id === 'deleteAccountModal') e.target.style.display = 'none';
});

on('deleteAccountSubmit', 'click', async () => {
    const confirm = document.getElementById('deleteAccountConfirm').value.trim();
    const errorEl = document.getElementById('deleteAccountError');
    const btn = document.getElementById('deleteAccountSubmit');

    if (confirm !== 'УДАЛИТЬ') {
        errorEl.textContent = 'Введи точно "УДАЛИТЬ"';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Удаляем...';

    const result = await softDeletePlayer(PLAYER.playerId);

    btn.disabled = false;
    btn.textContent = 'Удалить аккаунт';

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    document.getElementById('deleteAccountModal').style.display = 'none';
    showWarningToast('Аккаунт удалён. Данные хранятся 30 дней.');

    setTimeout(async () => {
        await signOut();
    }, 1500);
});

// Раскрытие городов в профиле
document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-toggle-cities]');
    if (!toggle) return;

    const type = toggle.dataset.toggleCities;
    const section = document.getElementById(`cityExtra${type === 'visited' ? 'Visited' : 'Unvisited'}`);
    if (!section) return;

    const isHidden = section.style.display === 'none';
    section.style.display = isHidden ? 'flex' : 'none';
    toggle.classList.toggle('active', isHidden);
});