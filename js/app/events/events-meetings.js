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