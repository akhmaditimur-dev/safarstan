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

// Выбор эмодзи
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#circleEmojiPicker .circle-emoji-option');
    if (!btn) return;
    document.querySelectorAll('#circleEmojiPicker .circle-emoji-option').forEach(b => {
        b.classList.remove('active');
    });
    btn.classList.add('active');
});