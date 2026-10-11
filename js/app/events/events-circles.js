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