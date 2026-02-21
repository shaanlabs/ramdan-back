import { supabase } from '../lib/supabase';

/**
 * Get or create today's daily record using a direct upsert.
 * This is MORE RELIABLE than the RPC — works even before Ramadan starts
 * and never returns undefined.
 *
 * @param {string} trackDate - YYYY-MM-DD string
 * @param {number} ramadanDay - Ramadan day number (1-30)
 * @returns {object|null} The daily record row, or null on failure
 */
export async function getOrCreateDailyRecord(trackDate, ramadanDay) {
    try {
        // Step 1: Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('[daily] getOrCreateDailyRecord: no user', userError);
            return null;
        }

        // Step 2: Upsert the daily record (never fails due to duplicate key)
        const { data, error } = await supabase
            .from('daily_ramadan_tracker')
            .upsert(
                {
                    user_id: user.id,
                    track_date: trackDate,
                    ramadan_day: ramadanDay,
                },
                { onConflict: 'user_id,track_date' }
            )
            .select()
            .single();

        if (error) {
            console.error('[daily] upsert error:', error.message);
            // Fallback: try to just select the existing row
            const { data: existing } = await supabase
                .from('daily_ramadan_tracker')
                .select('*')
                .eq('user_id', user.id)
                .eq('track_date', trackDate)
                .single();
            return existing || null;
        }

        return data;
    } catch (err) {
        console.error('[daily] getOrCreateDailyRecord unexpected error:', err);
        return null;
    }
}

/**
 * Get today's daily record ID directly from the DB (fresh fetch, no state dependency)
 * Use this as a fallback when state-based dailyId might be stale
 */
export async function getTodayDailyId(trackDate) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('daily_ramadan_tracker')
        .select('id')
        .eq('user_id', user.id)
        .eq('track_date', trackDate)
        .maybeSingle();

    if (error) {
        console.error('[daily] getTodayDailyId error:', error);
        return null;
    }
    return data?.id || null;
}

/**
 * Fetch a daily record by ID
 */
export async function fetchDailyRecord(dailyId) {
    const { data, error } = await supabase
        .from('daily_ramadan_tracker')
        .select('*')
        .eq('id', dailyId)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Fetch daily record for a specific date
 */
export async function fetchDailyRecordByDate(trackDate) {
    const { data, error } = await supabase
        .from('daily_ramadan_tracker')
        .select('*')
        .eq('track_date', trackDate)
        .maybeSingle();

    if (error) throw error;
    return data;
}

