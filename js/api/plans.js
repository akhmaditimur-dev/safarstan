// ============ API: ПЛАНЫ ВИЗИТОВ ============

// Сохранить план
async function savePlan(playerId, plan) {
    const { data, error } = await _supabase
        .from('plans')
        .insert({
            player_id: playerId,
            city_key: plan.cityKey,
            place_title: plan.placeTitle || null,
            visit_date: plan.visitDate,
            note: plan.note || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Ошибка сохранения плана:', error);
        return null;
    }
    return data;
}

// Загрузить все планы игрока (невыполненные)
async function loadPlans(playerId) {
    const { data, error } = await _supabase
        .from('plans')
        .select('*')
        .eq('player_id', playerId)
        .eq('completed', false)
        .eq('is_deleted', false)
        .order('visit_date', { ascending: true });

    if (error) {
        console.error('Ошибка загрузки планов:', error);
        return [];
    }
    return data || [];
}

// Удалить план
async function deletePlan(planId) {
    const { error } = await _supabase
        .from('plans')
        .update({ is_deleted: true })
        .eq('id', planId);

    if (error) console.error('Ошибка удаления плана:', error);
}

// Отметить план как выполненный
async function completePlan(planId) {
    const { error } = await _supabase
        .from('plans')
        .update({ completed: true })
        .eq('id', planId);

    if (error) console.error('Ошибка завершения плана:', error);
}