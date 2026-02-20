import { supabase } from '../lib/supabase';

/**
 * Fetch daily leaderboard via RPC
 */
export async function fetchLeaderboard(date) {
    const { data, error } = await supabase.rpc('get_daily_leaderboard', {
        p_date: date,
    });

    if (error) throw error;
    return data || [];
}

/**
 * Client-side filter helpers
 */
export function filterLeaderboard(entries, filters = {}) {
    let filtered = [...entries];

    if (filters.gender) {
        filtered = filtered.filter(e => e.gender === filters.gender);
    }

    if (filters.stream) {
        filtered = filtered.filter(e => e.stream === filters.stream);
    }

    if (filters.year) {
        filtered = filtered.filter(e => e.year === filters.year);
    }

    if (filters.section) {
        filtered = filtered.filter(e => e.section === filters.section);
    }

    return filtered;
}
