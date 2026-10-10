// ============ APP: СОБЫТИЯ ВСТРЕЧ ============

// Открыть модалку создания
document.addEventListener('click', (e) => {
    if (e.target.closest('#meetingCreateBtn')) {
        openMeetingCreateModal();
    }
});

// Закрыть
document.addEventListener('click', (e) => {
    if (e.target.id === 'meetingCreateModal' || e.target.closest('#meetingCreateClose')) {
        closeMeetingCreateModal();
    }
});

// Выбор типа
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-meeting-type]');
    if (!btn) return;
    selectMeetingType(btn.dataset.meetingType);
});

// Назад к шагу 1
document.addEventListener('click', (e) => {
    if (!e.target.closest('#meetingBackBtn')) return;
    const modal = document.getElementById('meetingCreateModal');
    modal.querySelectorAll('[data-meeting-step]').forEach(s => {
        s.style.display = s.dataset.meetingStep === '1' ? '' : 'none';
    });
});

// Submit
document.addEventListener('click', async (e) => {
    if (!e.target.closest('#meetingCreateSubmit')) return;
    await submitMeetingCreate();
});

// ============================================
// «ВСЕ ВСТРЕЧИ» И ДЕТАЛИ
// ============================================

// Открыть все встречи
document.addEventListener('click', (e) => {
    if (e.target.closest('#meetingsShowAllBtn')) {
        openMeetingsAllModal();
    }
});

// Кнопка «Создать» из пустого состояния
document.addEventListener('click', (e) => {
    if (e.target.closest('#meetingsAllCreateBtn')) {
        closeMeetingsAllModal();
        openMeetingCreateModal();
    }
});

// Закрыть все встречи
document.addEventListener('click', (e) => {
    if (e.target.id === 'meetingsAllModal' || e.target.closest('#meetingsAllClose')) {
        closeMeetingsAllModal();
    }
});

// Фильтр по типу
document.addEventListener('change', async (e) => {
    if (e.target.id !== 'meetingsFilterType') return;
    MEETINGS_ALL_FILTER = e.target.value;
    await renderMeetingsAllList();
});

// Открыть детали встречи
document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-meeting-detail]');
    if (!card) return;
    openMeetingDetail(card.dataset.meetingDetail);
});

// Закрыть детали
document.addEventListener('click', (e) => {
    if (e.target.id === 'meetingDetailModal' || e.target.closest('#meetingDetailClose')) {
        closeMeetingDetailModal();
    }
});

// Отменить встречу (создатель)
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('#meetingDetailCancelBtn');
    if (!btn) return;

    const ok = await showConfirm('Отменить встречу?', { okText: 'Отменить' });
    if (!ok) return;

    const result = await cancelMeeting(btn.dataset.meetingId);
    if (result.error) {
        if (typeof showWarningToast === 'function') showWarningToast(result.error);
        return;
    }

    closeMeetingDetailModal();
    await renderMeetingsDashboard();
    if (document.getElementById('meetingsAllModal').style.display === 'flex') {
        await renderMeetingsAllList();
    }
    if (typeof showWarningToast === 'function') showWarningToast('Встреча отменена');
});