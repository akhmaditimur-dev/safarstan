// ============ FIX: принудительный рендер аватара и иконок ============

window.addEventListener('load', () => {
    // Ждём, пока PLAYER загрузится
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;

        if (typeof PLAYER !== 'undefined' && PLAYER && PLAYER.avatar) {
            // Рендер аватаров
            const dashAvatar = document.getElementById('dashAvatar');
            const profileAvatar = document.getElementById('profileAvatar');

            if (dashAvatar) {
                if (PLAYER.avatar.startsWith('http')) {
                    dashAvatar.innerHTML = `<img src="${PLAYER.avatar}" alt="avatar">`;
                } else {
                    dashAvatar.textContent = PLAYER.avatar;
                }
            }
            if (profileAvatar) {
                if (PLAYER.avatar.startsWith('http')) {
                    profileAvatar.innerHTML = `<img src="${PLAYER.avatar}" alt="avatar">`;
                } else {
                    profileAvatar.textContent = PLAYER.avatar;
                }
            }

            console.log('✅ Аватары отрендерены');
        }

        // Рендер Lucide-иконок
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Останавливаем через 10 попыток (10 секунд)
        if (attempts >= 10) {
            clearInterval(interval);
            console.log('🛑 FIX: интервал остановлен');
        }
    }, 1000);
});