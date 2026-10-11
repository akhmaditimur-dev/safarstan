// ============ APP: СОБЫТИЯ КРУГОВ ============

// Открытие создания
document.addEventListener('click', (e) => {
    if (e.target.closest('#circleCreateBtn')) {
        openCircleCreateModal();
    }
});

// Закрытие
document.addEventListener('click', (e) => {
    if (e.target.id === 'circleCreateModal' || e.target.closest('#circleCreateClose')) {
        closeCircleCreateModal();
    }
});

// Submit
document.addEventListener('click', async (e) => {
    if (!e.target.closest('#circleCreateSubmit')) return;
    await submitCircleCreate();
});

// Выбор иконки
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#circleIconPicker .circle-icon-option');
    if (!btn) return;
    document.querySelectorAll('#circleIconPicker .circle-icon-option').forEach(b => {
        b.classList.remove('active');
    });
    btn.classList.add('active');
});

// ============================================
// ПРОСМОТР КРУГА
// ============================================

// Клик по кругу в дашборде
document.addEventListener('click', (e) => {
    const row = e.target.closest('[data-circle-id]');
    if (!row) return;
    if (e.target.closest('[data-circle-approve]')) return;
    if (e.target.closest('[data-circle-decline]')) return;
    if (e.target.closest('[data-circle-invite-send]')) return;

    openCircleView(row.dataset.circleId);
});

// Закрытие просмотра
document.addEventListener('click', (e) => {
    if (e.target.id === 'circleViewModal' || e.target.closest('#circleViewClose')) {
        closeCircleView();
    }
});

// ============================================
// ПРИГЛАШЕНИЕ
// ============================================

// Открыть модалку приглашения
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#circleInviteBtn');
    if (!btn) return;
    e.stopPropagation();
    openCircleInviteModal(btn.dataset.circleId);
});

// Закрытие приглашения
document.addEventListener('click', (e) => {
    if (e.target.id === 'circleInviteModal' || e.target.closest('#circleInviteClose')) {
        closeCircleInviteModal();
    }
});

// Поиск друзей (debounce)
let _circleInviteSearchTimer = null;
document.addEventListener('input', (e) => {
    if (e.target.id !== 'circleInviteSearch') return;
    clearTimeout(_circleInviteSearchTimer);
    _circleInviteSearchTimer = setTimeout(() => {
        searchFriendsForCircle(e.target.value.trim());
    }, 300);
});

// Отправить приглашение
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-circle-invite-send]');
    if (!btn) return;
    e.stopPropagation();

    const toPlayerId = btn.dataset.circleInviteSend;
    const circleId = btn.dataset.circleId;

    const result = await inviteToCircle(circleId, toPlayerId);
    if (result.error) {
        if (typeof showWarningToast === 'function') showWarningToast(result.error);
        return;
    }

    btn.outerHTML = '<span class="circle-invite-result__sent"><i data-lucide="check"></i> Отправлено</span>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

// Одобрить приглашение (админ)
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-circle-approve]');
    if (!btn) return;
    e.stopPropagation();

    const result = await approveCircleInvite(btn.dataset.circleApprove);
    if (result.error) {
        if (typeof showWarningToast === 'function') showWarningToast(result.error);
        return;
    }

    if (typeof showWarningToast === 'function') showWarningToast('✅ Принят');
    if (typeof updateNotificationsBadge === 'function') await updateNotificationsBadge();
    if (CURRENT_OPEN_CIRCLE) {
        await openCircleView(CURRENT_OPEN_CIRCLE.id);
    }
});

// Отклонить приглашение
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-circle-decline]');
    if (!btn) return;
    e.stopPropagation();

    const result = await declineCircleInvite(btn.dataset.circleDecline);
    if (result.error) {
        if (typeof showWarningToast === 'function') showWarningToast(result.error);
        return;
    }

    if (typeof updateNotificationsBadge === 'function') await updateNotificationsBadge();
    if (CURRENT_OPEN_CIRCLE) {
        await openCircleView(CURRENT_OPEN_CIRCLE.id);
    }
});

// Выйти из круга
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('#circleLeaveBtn');
    if (!btn) return;
    e.stopPropagation();

    const ok = await showConfirm('Выйти из круга?', { okText: 'Выйти' });
    if (!ok) return;

    const result = await leaveCircle(btn.dataset.circleId);
    if (result.error) {
        if (typeof showWarningToast === 'function') showWarningToast(result.error);
        return;
    }

    closeCircleView();
    await renderCirclesDashboard();
});

// ============================================
// ВСТРЕЧИ КРУГА
// ============================================

// Открыть модалку создания
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#circleMeetingCreateBtn');
    if (!btn) return;
    e.stopPropagation();
    openCircleMeetingModal(btn.dataset.circleId);
});

// Закрытие
document.addEventListener('click', (e) => {
    if (e.target.id === 'circleMeetingModal' || e.target.closest('#circleMeetingClose')) {
        closeCircleMeetingModal();
    }
});

// Submit
document.addEventListener('click', async (e) => {
    if (!e.target.closest('#circleMeetingSubmit')) return;
    e.stopPropagation();
    await submitCircleMeeting();
});

// Отметить проведённой
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-circle-meeting-done]');
    if (!btn) return;
    e.stopPropagation();

    const result = await markCircleMeetingDone(btn.dataset.circleMeetingDone);
    if (result.error) {
        if (typeof showWarningToast === 'function') showWarningToast(result.error);
        return;
    }

    if (CURRENT_OPEN_CIRCLE) {
        await openCircleView(CURRENT_OPEN_CIRCLE.id);
    }
});