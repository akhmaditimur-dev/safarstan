// ============ API: ОТЗЫВЫ ============

// Сохранить отзыв
async function saveReview(playerId, placeKey, cityKey, rating, text) {
    const { data, error } = await _supabase
        .from('reviews')
        .insert({
            player_id: playerId,
            place_key: placeKey,
            city_key: cityKey,
            rating: rating || null,
            text: text,
        })
        .select()
        .single();

    if (error) {
        console.error('Ошибка сохранения отзыва:', error);
        return { error: error.message };
    }

    // === Уведомление владельцу места (если это UGC-место) ===
    await notifyPlaceOwner(placeKey, playerId, 'review_on_place', text);

    return { data };
}

// Хелпер: уведомить владельца UGC-места
async function notifyPlaceOwner(placeKey, fromPlayerId, type, previewText = '') {
    if (typeof createNotification !== 'function') return;

    // place_key = "tashkent|service|Кафе у Азиза"
    const parts = placeKey.split('|');
    if (parts.length < 3) return;

    const [cityKey, category, title] = parts;

    try {
        const { data: place } = await _supabase
            .from('user_places')
            .select('player_id')
            .eq('city_key', cityKey)
            .eq('category', category)
            .eq('title', title)
            .maybeSingle();

        if (!place || !place.player_id) return;
        if (place.player_id === fromPlayerId) return; // сам себе не шлём

        const payload = { place_title: title };
        if (previewText) payload.preview = previewText.slice(0, 80);

        await createNotification(
            place.player_id,
            type,
            payload,
            fromPlayerId
        );
    } catch (err) {
        console.warn('Не удалось уведомить владельца места:', err);
    }
}

// Загрузить отзывы для одного места
async function loadReviews(placeKey) {
    const { data, error } = await _supabase
        .from('reviews')
        .select(`
            id,
            place_key,
            rating,
            text,
            created_at,
            player_id,
            players:player_id (name, avatar)
        `)
        .eq('place_key', placeKey)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Ошибка загрузки отзывов:', error);
        return [];
    }
    return data || [];
}

// Загрузить агрегированные рейтинги для набора мест
async function loadReviewsForPlaces(placeKeys) {
    if (!placeKeys || placeKeys.length === 0) return {};

    const { data, error } = await _supabase
        .from('reviews')
        .select('place_key, rating')
        .in('place_key', placeKeys)
        .eq('is_deleted', false);

    if (error) {
        console.error('Ошибка загрузки рейтингов:', error);
        return {};
    }

    const result = {};
    data.forEach(r => {
        if (!result[r.place_key]) {
            result[r.place_key] = { sum: 0, count: 0 };
        }
        if (r.rating) {
            result[r.place_key].sum += r.rating;
            result[r.place_key].count += 1;
        }
    });

    const aggregated = {};
    Object.entries(result).forEach(([key, val]) => {
        aggregated[key] = {
            avg: val.count > 0 ? (val.sum / val.count).toFixed(1) : null,
            count: val.count,
        };
    });
    return aggregated;
}

// Удалить отзыв
async function deleteReview(reviewId) {
    const { error } = await _supabase
        .from('reviews')
        .update({ is_deleted: true })
        .eq('id', reviewId);

    if (error) console.error('Ошибка удаления отзыва:', error);
}

// ============ МОИ ОТЗЫВЫ ============

async function loadMyReviews(playerId) {
    const { data, error } = await _supabase
        .from('reviews')
        .select('*')
        .eq('player_id', playerId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Ошибка загрузки отзывов:', error);
        return [];
    }
    return data || [];
}