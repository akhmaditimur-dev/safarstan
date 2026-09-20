// ============ APP: СОБЫТИЯ АВТОРИЗАЦИИ ============

// Табы Вход / Регистрация
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        authMode = tab.dataset.mode;
        updateAuthUI();
    });
});

// Кнопка Submit
on('authSubmit', 'click', async () => {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const errorEl = document.getElementById('authError');

    if (!email || !password) {
        errorEl.textContent = 'Заполни email и пароль';
        errorEl.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = 'Пароль минимум 6 символов';
        errorEl.style.display = 'block';
        return;
    }

    errorEl.style.display = 'none';

    if (authMode === 'signup') {
        const name = document.getElementById('regName').value.trim();
        const homeCity = document.getElementById('regHomeCity').value;
        const currentCityVal = document.getElementById('regCurrentCity').value;

        if (!name) {
            errorEl.textContent = 'Введи имя';
            errorEl.style.display = 'block';
            return;
        }

        const result = await signUp(email, password, {
            name: name,
            avatar: selectedAvatar || '🧑‍💼',
            home_city: homeCity,
            current_city: currentCityVal,
        });

        if (result.error) {
            errorEl.textContent = result.error;
            errorEl.style.display = 'block';
            return;
        }

        if (!result.session) {
            errorEl.textContent = 'Проверь почту — нужно подтвердить email';
            errorEl.style.display = 'block';
            return;
        }

        const serverPlayer = await loadPlayerFromServer();

        if (!serverPlayer) {
            errorEl.textContent = 'Профиль не найден. Возможно, ты не завершил регистрацию.';
            errorEl.style.display = 'block';
            return;
        }

        if (serverPlayer.is_deleted === true) {
            document.getElementById('authModal').style.display = 'none';
            const expired = isRestorePeriodExpired(serverPlayer.deleted_at);
            showRestoreModal(serverPlayer, expired);
            return;
        }

        setPlayerFromServer(serverPlayer);
        await afterAuth();

    } else {
        const result = await signIn(email, password);

        if (result.error) {
            errorEl.textContent = result.error;
            errorEl.style.display = 'block';
            return;
        }

        const serverPlayer = await loadPlayerFromServer();

        if (!serverPlayer) {
            errorEl.textContent = 'Профиль не найден. Возможно, ты не завершил регистрацию.';
            errorEl.style.display = 'block';
            return;
        }

        if (serverPlayer.is_deleted === true) {
            document.getElementById('authModal').style.display = 'none';
            const expired = isRestorePeriodExpired(serverPlayer.deleted_at);
            showRestoreModal(serverPlayer, expired);
            return;
        }

        setPlayerFromServer(serverPlayer);
        await afterAuth();
    }
});

// Закрытие модалки
on('authClose', 'click', () => {
    document.getElementById('authModal').style.display = 'none';
});

on('authModal', 'click', (e) => {
    if (e.target.id === 'authModal') {
        e.target.style.display = 'none';
    }
});

// Лендинг → открыть модалку
on('landingStartBtn', 'click', () => {
    showAuthModal('signin');
});

// Восстановление аккаунта
on('restoreAccountSubmit', 'click', async () => {
    if (!_pendingRestorePlayer) return;

    const btn = document.getElementById('restoreAccountSubmit');
    const errorEl = document.getElementById('restoreAccountError');

    btn.disabled = true;
    btn.textContent = '⏳ Восстанавливаем...';

    const result = await restorePlayer(_pendingRestorePlayer.id);

    btn.disabled = false;
    btn.textContent = 'Восстановить аккаунт';

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    document.getElementById('restoreAccountModal').style.display = 'none';
    showWarningToast('✅ Аккаунт восстановлен!');

    setTimeout(() => location.reload(), 1000);
});

on('restoreAccountCancel', 'click', async () => {
    document.getElementById('restoreAccountModal').style.display = 'none';
    _pendingRestorePlayer = null;
    await signOut();
});