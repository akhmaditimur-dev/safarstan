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

// ============================================
// РЕЙТИНГИ ГОРОДОВ (RPC)
// ============================================

// Загрузить рейтинг городов
// metric: 'residents' | 'home' | 'hospitality' | 'tourists' | 'content'
// period: 'all' | 'month' | 'week'
async function loadCityRankings(metric, period) {
    try {
        const { data, error } = await _supabase
            .rpc('get_city_rankings', {
                p_metric: metric,
                p_period: period || 'all',
            });

        if (error) throw error;

        const map = {};
        (data || []).forEach(row => {
            map[row.city_key] = Number(row.score);
        });
        return map;
    } catch (err) {
        console.warn('Ошибка загрузки рейтингов:', err);
        return {};
    }
}