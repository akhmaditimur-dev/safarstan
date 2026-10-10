// ============ UI: ПОПУТЧИКИ ============

let TRIPS = [];
let TRIPS_FILTER_CITY = 'current'; // 'current' | 'all'

async function renderTrips() {
    const list = document.getElementById('tripsList');
    if (!list || !PLAYER) return;

    list.innerHTML = '<div class="trips-empty">⏳ Загрузка...</div>';

    const cityKey = TRIPS_FILTER_CITY === 'current' ? PLAYER.currentCity : null;
    TRIPS = await loadTrips(cityKey, 30);

    // Сортируем по дате (ближайшие сначала)
    TRIPS.sort((a, b) => new Date(a.depart_at) - new Date(b.depart_at));

    if (TRIPS.length === 0) {
        list.innerHTML = `
            <div class="trips-empty">
                <p>Пока нет поездок</p>
                <button class="btn btn-primary btn-sm" id="tripCreateBtnEmpty">
                    <i data-lucide="plus"></i> Создать поездку
                </button>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    const myTripIds = await loadMyTripIds();
    const myTripSet = new Set(myTripIds);

    list.innerHTML = TRIPS.map(t => renderTripCard(t, myTripSet)).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderTripCard(trip, myTripSet) {
    const driver = trip.driver || {};
    const driverName = driver.name || 'Игрок';
    const driverAvatar = driver.avatar || '🧑‍💼';
    const avatarHtml = renderAvatarHtml(driverAvatar);

    const fromName = CITIES[trip.city_from]?.name || trip.city_from;
    const toName = CITIES[trip.city_to]?.name || trip.city_to;

    const date = new Date(trip.depart_at);
    const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    const seatsLeft = trip.seats_total - trip.seats_taken;
    const isFull = seatsLeft <= 0;
    const isMine = trip.driver_id === PLAYER.playerId;
    const iAmIn = myTripSet.has(trip.id);

    const transportIcon = {
        car: 'car',
        taxi: 'car-taxi-front',
        train: 'train-front',
        bus: 'bus',
    }[trip.transport] || 'car';

    let actionBtn = '';
    if (isMine) {
        actionBtn = `<button class="trip-card__btn trip-card__btn--cancel" data-trip-cancel="${trip.id}">
            <i data-lucide="x"></i> Отменить
        </button>`;
    } else if (iAmIn) {
        actionBtn = `<button class="trip-card__btn trip-card__btn--leave" data-trip-leave="${trip.id}">
            <i data-lucide="log-out"></i> Отписаться
        </button>`;
    } else if (!isFull) {
        actionBtn = `<button class="trip-card__btn trip-card__btn--join" data-trip-join="${trip.id}">
            <i data-lucide="user-plus"></i> Присоединиться
        </button>`;
    } else {
        actionBtn = `<button class="trip-card__btn trip-card__btn--full" disabled>Мест нет</button>`;
    }

    return `
        <div class="trip-card" data-trip-id="${trip.id}">
            <div class="trip-card__route">
                <span class="trip-card__city">${escapeHtml(fromName)}</span>
                <i data-lucide="arrow-right" class="trip-card__arrow"></i>
                <span class="trip-card__city">${escapeHtml(toName)}</span>
            </div>

            <div class="trip-card__meta">
                <span><i data-lucide="calendar"></i> ${dateStr}, ${timeStr}</span>
                <span><i data-lucide="${transportIcon}"></i> ${seatsLeft}/${trip.seats_total} мест</span>
                ${trip.price ? `<span class="trip-card__price"><i data-lucide="wallet"></i> ${escapeHtml(trip.price)}</span>` : ''}
            </div>

            ${trip.description ? `<div class="trip-card__desc">${escapeHtml(trip.description)}</div>` : ''}

            <div class="trip-card__driver">
                <div class="trip-card__avatar">${avatarHtml}</div>
                <span class="trip-card__driver-name" data-player-profile="${trip.driver_id}">${escapeHtml(driverName)}</span>
                <span class="trip-card__level">ур. ${driver.level || 1}</span>
            </div>

            <div class="trip-card__actions">
                ${actionBtn}
                ${trip.contact ? `<span class="trip-card__contact" title="Контакт"><i data-lucide="phone"></i> ${escapeHtml(trip.contact)}</span>` : ''}
            </div>
        </div>
    `;
}

// === Модалка создания ===
function openTripCreateModal() {
    const modal = document.getElementById('tripCreateModal');
    if (!modal || !PLAYER) return;

    // Сброс
    document.getElementById('tripFrom').value = PLAYER.currentCity || 'tashkent';
    document.getElementById('tripTo').value = '';
    document.getElementById('tripDate').value = '';
    document.getElementById('tripTime').value = '09:00';
    document.getElementById('tripTransport').value = 'car';
    document.getElementById('tripSeats').value = '3';
    document.getElementById('tripPrice').value = '';
    document.getElementById('tripContact').value = '';
    document.getElementById('tripDescription').value = '';
    document.getElementById('tripCreateError').style.display = 'none';

    // Поиск городов
    if (typeof initCitySelect === 'function') {
        initCitySelect('tripFromInput', 'tripFrom', 'tripFromDropdown');
        initCitySelect('tripToInput', 'tripTo', 'tripToDropdown');
        setCitySelect('tripFromInput', 'tripFrom', PLAYER.currentCity || 'tashkent');
        setCitySelect('tripToInput', 'tripTo', '');
    }

    modal.style.display = 'flex';
}

function closeTripCreateModal() {
    const modal = document.getElementById('tripCreateModal');
    if (modal) modal.style.display = 'none';
}

async function submitTripCreate() {
    const errorEl = document.getElementById('tripCreateError');
    errorEl.style.display = 'none';

    const cityFrom = document.getElementById('tripFrom').value;
    const cityTo = document.getElementById('tripTo').value;
    const date = document.getElementById('tripDate').value;
    const time = document.getElementById('tripTime').value || '09:00';
    const transport = document.getElementById('tripTransport').value;
    const seatsTotal = parseInt(document.getElementById('tripSeats').value) || 1;
    const price = document.getElementById('tripPrice').value.trim();
    const contact = document.getElementById('tripContact').value.trim();
    const description = document.getElementById('tripDescription').value.trim();

    if (!cityFrom || !cityTo) {
        errorEl.textContent = 'Выбери откуда и куда';
        errorEl.style.display = 'block';
        return;
    }
    if (cityFrom === cityTo) {
        errorEl.textContent = 'Откуда и куда не могут совпадать';
        errorEl.style.display = 'block';
        return;
    }
    if (!date) {
        errorEl.textContent = 'Выбери дату';
        errorEl.style.display = 'block';
        return;
    }

    const departAt = new Date(`${date}T${time}:00`).toISOString();

    const result = await createTrip({
        cityFrom, cityTo, departAt, transport,
        seatsTotal, price, contact, description,
    });

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }

    closeTripCreateModal();
    await renderTrips();
}