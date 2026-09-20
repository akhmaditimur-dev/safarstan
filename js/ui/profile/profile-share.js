// ============ UI: PROFILE — ПОДЕЛИТЬСЯ ПРОФИЛЕМ ============
// Заготовка под будущий share с ником (safarstan.app/u/ник) и QR-кодом

async function shareProfile(playerId) {
    if (!playerId) return;

    const url = `${location.origin}${location.pathname}?p=${playerId}`;

    try {
        await navigator.clipboard.writeText(url);
        showWarningToast('✅ Ссылка скопирована');
    } catch (err) {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showWarningToast('✅ Ссылка скопирована');
    }
}

// Обработчик кнопки "Поделиться профилем"
document.addEventListener('click', async (e) => {
    if (e.target.closest('#ppShareBtn')) {
        if (!currentViewedPlayerId) return;
        await shareProfile(currentViewedPlayerId);
    }
});