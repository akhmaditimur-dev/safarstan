// ============ API: БЛАГОТВОРИТЕЛЬНОСТЬ ============

async function loadCharityCampaigns(filter = {}) {
    let query = _supabase
        .from('charity_campaigns')
        .select(`
            id, creator_id, type, title, description, city_key,
            goal_amount, collected_amount, requisites, deadline,
            status, report_text, created_at,
            creator:creator_id (id, name, avatar, level)
        `)
        .order('created_at', { ascending: false });

    if (filter.type && filter.type !== 'all') query = query.eq('type', filter.type);
    if (filter.city) query = query.eq('city_key', filter.city);

    const { data, error } = await query;
    if (error) {
        console.warn('loadCharityCampaigns:', error);
        return [];
    }
    return data || [];
}

async function loadCharityById(id) {
    const { data: campaign } = await _supabase
        .from('charity_campaigns')
        .select('*, creator:creator_id (id, name, avatar, level)')
        .eq('id', id)
        .single();
    if (!campaign) return null;

    const { data: donations } = await _supabase
        .from('charity_donations')
        .select('id, player_id, amount, comment, created_at, player:player_id (id, name, avatar)')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false });

    return { ...campaign, donations: donations || [] };
}

async function createCharityCampaign(data) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { data: campaign, error } = await _supabase
        .from('charity_campaigns')
        .insert({
            creator_id: PLAYER.playerId,
            type: data.type || 'money',
            title: data.title,
            description: data.description || null,
            city_key: data.cityKey || PLAYER.currentCity,
            goal_amount: data.goalAmount || null,
            requisites: data.requisites || null,
            deadline: data.deadline || null,
            status: 'pending_moderation',
        })
        .select()
        .single();

    if (error) return { error: error.message };
    return { campaign };
}

async function addCharityDonation(campaignId, amount, comment) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { error } = await _supabase
        .from('charity_donations')
        .insert({
            campaign_id: campaignId,
            player_id: PLAYER.playerId,
            amount: amount || null,
            comment: comment || null,
        });

    if (error) return { error: error.message };
    return { ok: true };
}

async function loadMyCharityCampaigns() {
    if (!PLAYER || !PLAYER.playerId) return [];

    const { data } = await _supabase
        .from('charity_campaigns')
        .select('*')
        .eq('creator_id', PLAYER.playerId)
        .order('created_at', { ascending: false });

    return data || [];
}

// Модерация (для админа)
async function approveCharityCampaign(campaignId) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { error } = await _supabase
        .from('charity_campaigns')
        .update({
            status: 'active',
            moderated_by: PLAYER.playerId,
            moderated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

    if (error) return { error: error.message };
    return { ok: true };
}

async function rejectCharityCampaign(campaignId) {
    const { error } = await _supabase
        .from('charity_campaigns')
        .update({ status: 'rejected' })
        .eq('id', campaignId);

    if (error) return { error: error.message };
    return { ok: true };
}

// Оставить отчёт по сбору
async function submitCharityReport(campaignId, { amount, text, photos }) {
    if (!PLAYER || !PLAYER.playerId) return { error: 'Не авторизован' };

    const { error } = await _supabase
        .from('charity_campaigns')
        .update({
            status: 'reported',
            report_amount: amount || null,
            report_text: text || null,
            report_photos: photos || [],
        })
        .eq('id', campaignId)
        .eq('creator_id', PLAYER.playerId);

    if (error) {
        console.warn('submitCharityReport:', error);
        return { error: error.message };
    }
    return { ok: true };
}