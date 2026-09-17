// ============ API: ОЧКИ ГОРОДОВ ============

// Загрузить очки всех городов
async function loadCityScores() {
    const { data, error } = await _supabase
        .from('city_scores')
        .select('*');

    if (error) {
        console.error('Ошибка загрузки очков:', error);
        return {};
    }

    const result = {};
    data.forEach(row => {
        result[row.city_key] = {
            residents: row.residents,
            home: row.home,
            hospitality: row.hospitality,
        };
    });
    return result;
}

// Обновить очко города
async function updateCityScore(cityKey, field, amount) {
    const { data: current } = await _supabase
        .from('city_scores')
        .select(field)
        .eq('city_key', cityKey)
        .single();

    if (!current) return;

    const newValue = (current[field] || 0) + amount;

    const { error } = await _supabase
        .from('city_scores')
        .update({ [field]: newValue, updated_at: new Date().toISOString() })
        .eq('city_key', cityKey);

    if (error) console.error('Ошибка обновления очков города:', error);
}