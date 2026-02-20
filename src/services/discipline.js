import { supabase } from '../lib/supabase';

/**
 * Fetch discipline scores for a daily record
 */
export async function fetchDiscipline(dailyId) {
    const { data, error } = await supabase
        .from('discipline_scores')
        .select('*')
        .eq('daily_id', dailyId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Upsert discipline score for a daily record
 */
export async function upsertDiscipline(dailyId, screenTimeHours) {
    if (!dailyId) {
        console.error('[discipline] upsertDiscipline called with no dailyId — skipping');
        return null;
    }
    const payload = {
        daily_id: dailyId,
        screen_time_hours: screenTimeHours || 0,
    };

    const { data, error } = await supabase
        .from('discipline_scores')
        .upsert(payload, { onConflict: 'daily_id' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Convert DB discipline record to frontend state
 */
export function dbToFrontendDiscipline(dbRecord) {
    if (!dbRecord) return { screenTime: 0 };
    return {
        screenTime: dbRecord.screen_time_hours || 0,
    };
}
