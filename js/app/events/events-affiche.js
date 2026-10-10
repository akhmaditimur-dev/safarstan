// ============ APP: СОБЫТИЯ АФИШИ ============

// Кнопки прокрутки карусели
document.addEventListener('click', (e) => {
    const track = document.getElementById('afficheTrack');
    if (!track) return;

    if (e.target.closest('#affichePrev')) {
        track.scrollBy({ left: -320, behavior: 'smooth' });
        return;
    }
    if (e.target.closest('#afficheNext')) {
        track.scrollBy({ left: 320, behavior: 'smooth' });
        return;
    }
});

// «Пойду»
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-affiche-going]');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const eventId = btn.dataset.afficheGoing;
    btn.disabled = true;

    const result = await toggleAfficheAttend(eventId);
    btn.disabled = false;

    if (result.error) {
        if (typeof showWarningToast === 'function') showWarningToast('Не удалось');
        return;
    }

    // Обновляем локальное состояние
    if (!AFFICHE_ATTENDEES[eventId]) AFFICHE_ATTENDEES[eventId] = { count: 0, players: [] };

    if (result.going) {
        AFFICHE_ATTENDEES[eventId].count += 1;
        AFFICHE_ATTENDEES[eventId].players.push(PLAYER.playerId);

        // Добавляем в календарь (через план)
        const event = AFFICHE_EVENTS.find(x => x.id === eventId);
        if (event && typeof savePlan === 'function') {
            await savePlan(PLAYER.playerId, {
                cityKey: event.city_key,
                placeTitle: event.title,
                visitDate: event.date_start,
                note: 'Афиша',
            });
            if (typeof renderCalendar === 'function') renderCalendar();
        }

        if (typeof showWarningToast === 'function') showWarningToast('✅ Добавлено в календарь');
    } else {
        AFFICHE_ATTENDEES[eventId].count = Math.max(0, AFFICHE_ATTENDEES[eventId].count - 1);
        AFFICHE_ATTENDEES[eventId].players = AFFICHE_ATTENDEES[eventId].players.filter(p => p !== PLAYER.playerId);
    }

    // Перерисовываем карточку
    const card = btn.closest('.affiche-card');
    if (card) {
        const event = AFFICHE_EVENTS.find(x => x.id === eventId);
        if (event) {
            card.outerHTML = renderAfficheCard(event);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
});

// Обновить стрелки при ресайзе
window.addEventListener('resize', () => {
    if (typeof updateAfficheArrows === 'function') updateAfficheArrows();
});