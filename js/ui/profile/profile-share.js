// ============ UI: PROFILE — ПОДЕЛИТЬСЯ ПРОФИЛЕМ + QR ============

// === Построить URL для share/QR ===
// Если у игрока есть username — используем #u/ник
// Иначе — fallback на ?p=playerId
function buildProfileShareUrl(playerId, username = null) {
    const base = `${location.origin}${location.pathname}`;

    if (username) {
        return `${base}#u/${username}`;
    }
    return `${base}?p=${playerId}`;
}

// Получить username игрока (из уже загруженных данных или из БД)
async function getUsernameForPlayer(playerId) {
    // Если это я — из PLAYER
    if (PLAYER && playerId === PLAYER.playerId && PLAYER.username) {
        return PLAYER.username;
    }

    // Иначе — из БД
    try {
        const { data } = await _supabase
            .from('players')
            .select('username')
            .eq('id', playerId)
            .maybeSingle();

        return data?.username || null;
    } catch (e) {
        return null;
    }
}

// === Поделиться ссылкой (копирование в буфер) ===
async function shareProfile(playerId) {
    if (!playerId) return;

    const username = await getUsernameForPlayer(playerId);
    const url = buildProfileShareUrl(playerId, username);

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

// === Открыть модалку с QR-кодом ===
async function openQrModal(playerId) {
    if (!playerId) return;

    const modal = document.getElementById('qrModal');
    const container = document.getElementById('qrContainer');
    const linkEl = document.getElementById('qrLink');
    if (!modal || !container) return;

    const username = await getUsernameForPlayer(playerId);
    const url = buildProfileShareUrl(playerId, username);

    // Очищаем и генерируем QR
    container.innerHTML = '';

    if (typeof QRCode !== 'undefined') {
        new QRCode(container, {
            text: url,
            width: 240,
            height: 240,
            colorDark: '#0a0a0a',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M,
        });
    } else {
        container.innerHTML = '<p style="color:#888;">Библиотека QR не загружена</p>';
    }

    if (linkEl) linkEl.textContent = url;

    modal.dataset.playerId = playerId;

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeQrModal() {
    const modal = document.getElementById('qrModal');
    if (modal) {
        modal.style.display = 'none';
        modal.dataset.playerId = '';
    }
}

// === Скачать QR как PNG ===
function downloadQrImage() {
    const container = document.getElementById('qrContainer');
    if (!container) return;

    const canvas = container.querySelector('canvas');
    const img = container.querySelector('img');

    let dataUrl = null;

    if (canvas) {
        dataUrl = canvas.toDataURL('image/png');
    } else if (img && img.src) {
        dataUrl = img.src;
    }

    if (!dataUrl) {
        showWarningToast('QR не готов');
        return;
    }

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `safarstan-qr-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showWarningToast('✅ QR скачан');
}

// === Обработчики ===
document.addEventListener('click', async (e) => {
    // === Чужой профиль: share ===
    if (e.target.closest('#ppShareBtn')) {
        if (!currentViewedPlayerId) return;
        await shareProfile(currentViewedPlayerId);
        return;
    }

    // === Чужой профиль: QR ===
    if (e.target.closest('#ppShowQrBtn')) {
        if (!currentViewedPlayerId) return;
        await openQrModal(currentViewedPlayerId);
        return;
    }

    // === Свой профиль: share ===
    if (e.target.closest('#myProfileShareBtn')) {
        if (!PLAYER || !PLAYER.playerId) return;
        await shareProfile(PLAYER.playerId);
        return;
    }

    // === Свой профиль: QR ===
    if (e.target.closest('#myProfileShowQrBtn')) {
        if (!PLAYER || !PLAYER.playerId) return;
        await openQrModal(PLAYER.playerId);
        return;
    }

    // === Закрыть модалку QR ===
    if (e.target.closest('#qrClose')) {
        closeQrModal();
        return;
    }
    if (e.target.id === 'qrModal') {
        closeQrModal();
        return;
    }

    // === Скопировать ссылку из модалки QR ===
    if (e.target.closest('#qrCopyBtn')) {
        const modal = document.getElementById('qrModal');
        const playerId = modal?.dataset?.playerId;
        if (!playerId) return;
        await shareProfile(playerId);
        return;
    }

    // === Скачать QR как PNG ===
    if (e.target.closest('#qrDownloadBtn')) {
        downloadQrImage();
        return;
    }
});