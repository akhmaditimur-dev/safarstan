// ============ API: ФОТО МЕСТ ============

// Загрузить фото в Storage + сохранить в базу
async function uploadPlacePhoto(file, playerId, placeKey, cityKey) {
    // Проверка размера (3 MB)
    if (file.size > 3 * 1024 * 1024) {
        return { error: 'Файл больше 3 МБ' };
    }

    // Проверка типа
    if (!file.type.startsWith('image/')) {
        return { error: 'Это не изображение' };
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const safeKey = placeKey.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    const fileName = `${playerId}/${safeKey}_${Date.now()}.${ext}`;

    // Загружаем в Storage
    const { data: uploadData, error: uploadError } = await _supabase.storage
        .from('place-photos')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (uploadError) {
        console.error('Ошибка загрузки:', uploadError);
        return { error: 'Не удалось загрузить фото' };
    }

    // Публичный URL
    const { data: urlData } = _supabase.storage
        .from('place-photos')
        .getPublicUrl(fileName);

    const photoUrl = urlData.publicUrl;

    // Сохраняем в базу
    const { data: dbData, error: dbError } = await _supabase
        .from('place_photos')
        .insert({
            player_id: playerId,
            place_key: placeKey,
            city_key: cityKey,
            photo_url: photoUrl,
            storage_path: fileName,
        })
        .select()
        .single();

    if (dbError) {
        console.error('Ошибка записи в базу:', dbError);
        // Откат: удаляем из Storage
        await _supabase.storage.from('place-photos').remove([fileName]);
        return { error: 'Не удалось сохранить фото' };
    }

    // === Уведомление владельцу места ===
    if (typeof notifyPlaceOwner === 'function') {
        await notifyPlaceOwner(placeKey, playerId, 'photo_on_place');
    }

    return { data: dbData };
}

// Загрузить фото для набора мест
async function loadPhotosForPlaces(placeKeys) {
    if (!placeKeys || placeKeys.length === 0) return {};

    const { data, error } = await _supabase
        .from('place_photos')
        .select(`
            id, place_key, photo_url, storage_path, player_id, created_at,
            players:player_id (name, avatar)
        `)
        .in('place_key', placeKeys)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Ошибка загрузки фото:', error);
        return {};
    }

    const result = {};
    data.forEach(p => {
        if (!result[p.place_key]) result[p.place_key] = [];
        result[p.place_key].push(p);
    });
    return result;
}

// Удалить фото
async function deletePlacePhoto(photoId, storagePath) {
    const { error: storageError } = await _supabase.storage
        .from('place-photos')
        .remove([storagePath]);

    if (storageError) {
        console.error('Ошибка удаления из Storage:', storageError);
    }

    const { error } = await _supabase
        .from('place_photos')
        .delete()
        .eq('id', photoId);

    if (error) console.error('Ошибка удаления из базы:', error);
}

// ============ API: АВАТАР ============

async function uploadAvatar(file, playerId) {
    // Проверка размера (1 MB)
    if (file.size > 1 * 1024 * 1024) {
        return { error: 'Файл больше 1 МБ' };
    }

    // Проверка типа
    if (!file.type.startsWith('image/')) {
        return { error: 'Это не изображение' };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        return { error: 'Только JPG, PNG или WEBP' };
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `avatars/${playerId}/avatar_${Date.now()}.${ext}`;

    // Загрузка в Storage
    const { error: uploadError } = await _supabase.storage
        .from('place-photos')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (uploadError) {
        console.error('Ошибка загрузки аватара:', uploadError);
        return { error: 'Не удалось загрузить' };
    }

    // Публичный URL
    const { data: urlData } = _supabase.storage
        .from('place-photos')
        .getPublicUrl(fileName);

    return { url: urlData.publicUrl, path: fileName };
}

async function deleteOldAvatar(storagePath) {
    if (!storagePath) return;
    await _supabase.storage.from('place-photos').remove([storagePath]);
}

// ============ МОИ ФОТО ============

async function loadMyPhotos(playerId) {
    const { data, error } = await _supabase
        .from('place_photos')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Ошибка загрузки фото:', error);
        return [];
    }
    return data || [];
}